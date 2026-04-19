'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import * as itemsQ from '@/db/queries/items'
import * as monthsQ from '@/db/queries/months'
import * as accountsQ from '@/db/queries/accounts'
import { incomeItemCreateSchema } from '@/lib/validators/income-item'
import { expenseItemCreateSchema } from '@/lib/validators/expense-item'
import { monthCloseSchema } from '@/lib/validators/month'
import { normalizeCategory } from '@/lib/normalize'
import { cloneItems } from '@/domain/clone-items'
import { prevMonth, isValidMonthKey } from '@/lib/month-key'
import type { ExpenseItem, IncomeItem, NewExpenseItem, NewIncomeItem } from '@/db/schema'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? '입력을 확인해주세요'
}

function revalidate(monthId: string) {
  revalidatePath(`/months/${monthId}`)
}

// —— Income actions ——

export async function addIncomeAction(input: unknown): Promise<Result<IncomeItem>> {
  const parsed = incomeItemCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  try {
    await monthsQ.ensureMonth(parsed.data.monthId)
    const item = await itemsQ.createIncome(parsed.data)
    revalidate(parsed.data.monthId)
    return { ok: true, data: item }
  } catch {
    return { ok: false, error: '추가에 실패했어요. 통장을 다시 선택해주세요.' }
  }
}

const incomeUpdateSchema = incomeItemCreateSchema.partial().extend({
  id: z.number().int().positive(),
})

export async function updateIncomeAction(input: unknown): Promise<Result<IncomeItem>> {
  const parsed = incomeUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  try {
    const { id, ...patch } = parsed.data
    const updated = await itemsQ.updateIncome(id, patch)
    if (!updated) return { ok: false, error: '항목을 찾을 수 없어요' }
    revalidate(updated.monthId)
    return { ok: true, data: updated }
  } catch {
    return { ok: false, error: '수정에 실패했어요' }
  }
}

export async function deleteIncomeAction(id: number): Promise<Result<IncomeItem>> {
  const item = await itemsQ.deleteIncome(id)
  if (!item) return { ok: false, error: '항목을 찾을 수 없어요' }
  revalidate(item.monthId)
  return { ok: true, data: item }
}

export async function restoreIncomeAction(data: NewIncomeItem): Promise<Result<IncomeItem>> {
  try {
    const item = await itemsQ.createIncome(data)
    revalidate(data.monthId)
    return { ok: true, data: item }
  } catch {
    return { ok: false, error: '복구에 실패했어요' }
  }
}

// —— Expense actions ——

export async function addExpenseAction(input: unknown): Promise<Result<ExpenseItem>> {
  const parsed = expenseItemCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  try {
    await monthsQ.ensureMonth(parsed.data.monthId)
    const category = normalizeCategory(parsed.data.category ?? null)
    const item = await itemsQ.createExpense({ ...parsed.data, category })
    revalidate(parsed.data.monthId)
    return { ok: true, data: item }
  } catch {
    return { ok: false, error: '추가에 실패했어요. 통장을 다시 선택해주세요.' }
  }
}

const expenseUpdateSchema = expenseItemCreateSchema.partial().extend({
  id: z.number().int().positive(),
})

export async function updateExpenseAction(input: unknown): Promise<Result<ExpenseItem>> {
  const parsed = expenseUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  try {
    const { id, ...raw } = parsed.data
    const patch = 'category' in raw ? { ...raw, category: normalizeCategory(raw.category) } : raw
    const updated = await itemsQ.updateExpense(id, patch)
    if (!updated) return { ok: false, error: '항목을 찾을 수 없어요' }
    revalidate(updated.monthId)
    return { ok: true, data: updated }
  } catch {
    return { ok: false, error: '수정에 실패했어요' }
  }
}

export async function deleteExpenseAction(id: number): Promise<Result<ExpenseItem>> {
  const item = await itemsQ.deleteExpense(id)
  if (!item) return { ok: false, error: '항목을 찾을 수 없어요' }
  revalidate(item.monthId)
  return { ok: true, data: item }
}

export async function restoreExpenseAction(data: NewExpenseItem): Promise<Result<ExpenseItem>> {
  try {
    const item = await itemsQ.createExpense(data)
    revalidate(data.monthId)
    return { ok: true, data: item }
  } catch {
    return { ok: false, error: '복구에 실패했어요' }
  }
}

// —— Month close toggle ——

export async function toggleMonthClosedAction(input: unknown): Promise<Result<void>> {
  const parsed = monthCloseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  await monthsQ.ensureMonth(parsed.data.id)
  await monthsQ.toggleMonthClosed(parsed.data.id, parsed.data.closed)
  revalidate(parsed.data.id)
  return { ok: true, data: undefined }
}

// —— Clone previous month ——

export async function clonePreviousMonthAction(
  monthId: string,
): Promise<Result<{ cloned: number; skipped: number }>> {
  if (!isValidMonthKey(monthId)) return { ok: false, error: '잘못된 월 키' }
  const prev = prevMonth(monthId)
  const [prevIncomes, prevExpenses, activeAccounts] = await Promise.all([
    itemsQ.listIncomesByMonth(prev),
    itemsQ.listExpensesByMonth(prev),
    accountsQ.listActiveAccounts(),
  ])
  if (prevIncomes.length === 0 && prevExpenses.length === 0) {
    return { ok: false, error: `${prev}에 복제할 항목이 없어요` }
  }

  await monthsQ.ensureMonth(monthId)
  const activeIds = new Set(activeAccounts.map((a) => a.id))

  const sourceItems = [
    ...prevIncomes.map((i) => ({
      kind: 'income' as const,
      amount: i.amount,
      label: i.label,
      category: null,
      accountId: i.destinationAccountId,
    })),
    ...prevExpenses.map((e) => ({
      kind: 'expense' as const,
      amount: e.amount,
      label: e.label,
      category: e.category,
      accountId: e.sourceAccountId,
    })),
  ]

  const { cloned, skipped } = cloneItems({ sourceItems, activeAccountIds: activeIds })

  const incomes = cloned
    .filter((c) => c.kind === 'income')
    .map((c) => ({
      monthId,
      amount: c.amount,
      label: c.label,
      destinationAccountId: c.accountId,
    }))
  const expenses = cloned
    .filter((c) => c.kind === 'expense')
    .map((c) => ({
      monthId,
      amount: c.amount,
      label: c.label,
      category: c.category,
      sourceAccountId: c.accountId,
    }))

  if (incomes.length > 0) await itemsQ.bulkCreateIncomes(incomes)
  if (expenses.length > 0) await itemsQ.bulkCreateExpenses(expenses)

  revalidate(monthId)
  return { ok: true, data: { cloned: cloned.length, skipped: skipped.length } }
}
