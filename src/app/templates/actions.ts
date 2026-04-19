'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import * as templatesQ from '@/db/queries/templates'
import * as itemsQ from '@/db/queries/items'
import * as monthsQ from '@/db/queries/months'
import * as accountsQ from '@/db/queries/accounts'
import {
  templateApplySchema,
  templateCreateSchema,
  templateItemSchema,
  templateUpdateSchema,
} from '@/lib/validators/fixed-template'
import { cloneItems } from '@/domain/clone-items'
import { normalizeCategory } from '@/lib/normalize'
import type { FixedTemplate, FixedTemplateItem } from '@/db/schema'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? '입력을 확인해주세요'
}

export async function createTemplateAction(input: unknown): Promise<Result<FixedTemplate>> {
  const parsed = templateCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const tmpl = await templatesQ.createTemplate(parsed.data.name)
  revalidatePath('/templates')
  return { ok: true, data: tmpl }
}

export async function renameTemplateAction(input: unknown): Promise<Result<void>> {
  const parsed = templateUpdateSchema.safeParse(input)
  if (!parsed.success || !parsed.data.name) return { ok: false, error: '이름을 입력해주세요' }
  await templatesQ.updateTemplateName(parsed.data.id, parsed.data.name)
  revalidatePath('/templates')
  return { ok: true, data: undefined }
}

export async function deleteTemplateAction(id: number): Promise<Result<void>> {
  await templatesQ.deleteTemplate(id)
  revalidatePath('/templates')
  return { ok: true, data: undefined }
}

const addItemSchema = templateItemSchema.extend({ templateId: z.number().int().positive() })

export async function addTemplateItemAction(
  input: unknown,
): Promise<Result<FixedTemplateItem>> {
  const parsed = addItemSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const { templateId, ...rest } = parsed.data
  const category = normalizeCategory(rest.category ?? null)
  const row = await templatesQ.addTemplateItem({ ...rest, category, templateId })
  revalidatePath('/templates')
  return { ok: true, data: row }
}

export async function deleteTemplateItemAction(id: number): Promise<Result<void>> {
  await templatesQ.deleteTemplateItem(id)
  revalidatePath('/templates')
  return { ok: true, data: undefined }
}

export async function applyTemplateAction(
  input: unknown,
): Promise<Result<{ cloned: number; skipped: number }>> {
  const parsed = templateApplySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const [tmpl, activeAccounts] = await Promise.all([
    templatesQ.getTemplateWithItems(parsed.data.templateId),
    accountsQ.listActiveAccounts(),
  ])
  if (!tmpl) return { ok: false, error: '템플릿을 찾을 수 없어요' }

  await monthsQ.ensureMonth(parsed.data.monthId)

  const activeIds = new Set(activeAccounts.map((a) => a.id))
  const sourceItems = tmpl.items.map((it) => ({
    kind: it.kind,
    amount: it.amount,
    label: it.label,
    category: it.category,
    accountId: it.accountId,
  }))
  const { cloned, skipped } = cloneItems({ sourceItems, activeAccountIds: activeIds })

  const incomes = cloned
    .filter((c) => c.kind === 'income')
    .map((c) => ({
      monthId: parsed.data.monthId,
      amount: c.amount,
      label: c.label,
      destinationAccountId: c.accountId,
    }))
  const expenses = cloned
    .filter((c) => c.kind === 'expense')
    .map((c) => ({
      monthId: parsed.data.monthId,
      amount: c.amount,
      label: c.label,
      category: c.category,
      sourceAccountId: c.accountId,
    }))

  if (incomes.length > 0) await itemsQ.bulkCreateIncomes(incomes)
  if (expenses.length > 0) await itemsQ.bulkCreateExpenses(expenses)

  revalidatePath(`/months/${parsed.data.monthId}`)
  revalidatePath('/templates')
  return { ok: true, data: { cloned: cloned.length, skipped: skipped.length } }
}
