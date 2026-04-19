import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm'
import { db } from '../client'
import {
  expenseItems,
  incomeItems,
  type ExpenseItem,
  type IncomeItem,
  type NewExpenseItem,
  type NewIncomeItem,
} from '../schema'

// —— Income ——

export async function listIncomesByMonth(monthId: string): Promise<IncomeItem[]> {
  return db
    .select()
    .from(incomeItems)
    .where(eq(incomeItems.monthId, monthId))
    .orderBy(asc(incomeItems.id))
}

export async function createIncome(input: NewIncomeItem): Promise<IncomeItem> {
  const [row] = db.insert(incomeItems).values(input).returning().all()
  if (!row) throw new Error('Failed to create income item')
  return row
}

export async function updateIncome(
  id: number,
  patch: Partial<Omit<NewIncomeItem, 'id'>>,
): Promise<IncomeItem | undefined> {
  const [row] = db
    .update(incomeItems)
    .set(patch)
    .where(eq(incomeItems.id, id))
    .returning()
    .all()
  return row
}

export async function deleteIncome(id: number): Promise<IncomeItem | undefined> {
  const [row] = db.delete(incomeItems).where(eq(incomeItems.id, id)).returning().all()
  return row
}

export async function bulkCreateIncomes(inputs: NewIncomeItem[]): Promise<IncomeItem[]> {
  if (inputs.length === 0) return []
  return db.insert(incomeItems).values(inputs).returning().all()
}

// —— Expense ——

export async function listExpensesByMonth(monthId: string): Promise<ExpenseItem[]> {
  return db
    .select()
    .from(expenseItems)
    .where(eq(expenseItems.monthId, monthId))
    .orderBy(asc(expenseItems.id))
}

export async function createExpense(input: NewExpenseItem): Promise<ExpenseItem> {
  const [row] = db.insert(expenseItems).values(input).returning().all()
  if (!row) throw new Error('Failed to create expense item')
  return row
}

export async function updateExpense(
  id: number,
  patch: Partial<Omit<NewExpenseItem, 'id'>>,
): Promise<ExpenseItem | undefined> {
  const [row] = db
    .update(expenseItems)
    .set(patch)
    .where(eq(expenseItems.id, id))
    .returning()
    .all()
  return row
}

export async function deleteExpense(id: number): Promise<ExpenseItem | undefined> {
  const [row] = db.delete(expenseItems).where(eq(expenseItems.id, id)).returning().all()
  return row
}

export async function bulkCreateExpenses(inputs: NewExpenseItem[]): Promise<ExpenseItem[]> {
  if (inputs.length === 0) return []
  return db.insert(expenseItems).values(inputs).returning().all()
}

// —— Range queries (statistics) ——

export async function listIncomesInRange(from: string, to: string): Promise<IncomeItem[]> {
  return db
    .select()
    .from(incomeItems)
    .where(and(gte(incomeItems.monthId, from), lte(incomeItems.monthId, to)))
    .orderBy(asc(incomeItems.monthId))
}

export async function listExpensesInRange(from: string, to: string): Promise<ExpenseItem[]> {
  return db
    .select()
    .from(expenseItems)
    .where(and(gte(expenseItems.monthId, from), lte(expenseItems.monthId, to)))
    .orderBy(asc(expenseItems.monthId))
}

export async function listIncomesForMonths(monthIds: string[]): Promise<IncomeItem[]> {
  if (monthIds.length === 0) return []
  return db
    .select()
    .from(incomeItems)
    .where(inArray(incomeItems.monthId, monthIds))
    .orderBy(asc(incomeItems.monthId))
}

export async function listExpensesForMonths(monthIds: string[]): Promise<ExpenseItem[]> {
  if (monthIds.length === 0) return []
  return db
    .select()
    .from(expenseItems)
    .where(inArray(expenseItems.monthId, monthIds))
    .orderBy(asc(expenseItems.monthId))
}
