import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

/**
 * 금액은 원 단위 정수(KRW). ADR-0003.
 * 월 키는 'YYYY-MM' 문자열. ADR-0004.
 * audit timestamps는 unixepoch() 디폴트 + $onUpdate.
 */

// Accounts
export const accounts = sqliteTable(
  'accounts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    role: text('role', { enum: ['spending', 'savings'] })
      .notNull()
      .default('spending'),
    openingBalance: integer('opening_balance').notNull().default(0),
    openingBalanceAsOfMonth: text('opening_balance_as_of_month').notNull(),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    savingsUnique: uniqueIndex('accounts_savings_unique_idx')
      .on(t.role)
      .where(sql`${t.archivedAt} IS NULL AND ${t.role} = 'savings'`),
    archivedIdx: index('accounts_archived_idx').on(t.archivedAt),
  }),
)

// Months — 'YYYY-MM' 문자열 PK
export const months = sqliteTable(
  'months',
  {
    id: text('id', { length: 7 }).primaryKey().notNull(),
    note: text('note'),
    closedAt: integer('closed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    closedIdx: index('months_closed_idx').on(t.closedAt),
  }),
)

// IncomeItems
export const incomeItems = sqliteTable(
  'income_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    monthId: text('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    label: text('label').notNull(),
    destinationAccountId: integer('destination_account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    monthIdx: index('income_month_idx').on(t.monthId),
    accountIdx: index('income_account_idx').on(t.destinationAccountId),
  }),
)

// ExpenseItems
export const expenseItems = sqliteTable(
  'expense_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    monthId: text('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    label: text('label').notNull(),
    category: text('category'),
    sourceAccountId: integer('source_account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    monthIdx: index('expense_month_idx').on(t.monthId),
    accountIdx: index('expense_account_idx').on(t.sourceAccountId),
    categoryIdx: index('expense_category_idx').on(t.category),
  }),
)

// FixedTemplates
export const fixedTemplates = sqliteTable('fixed_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
})

export const fixedTemplateItems = sqliteTable(
  'fixed_template_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    templateId: integer('template_id')
      .notNull()
      .references(() => fixedTemplates.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['income', 'expense'] }).notNull(),
    amount: integer('amount').notNull(),
    label: text('label').notNull(),
    category: text('category'),
    accountId: integer('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
  },
  (t) => ({
    templateIdx: index('template_items_template_idx').on(t.templateId),
  }),
)

// 타입 export
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Month = typeof months.$inferSelect
export type NewMonth = typeof months.$inferInsert
export type IncomeItem = typeof incomeItems.$inferSelect
export type NewIncomeItem = typeof incomeItems.$inferInsert
export type ExpenseItem = typeof expenseItems.$inferSelect
export type NewExpenseItem = typeof expenseItems.$inferInsert
export type FixedTemplate = typeof fixedTemplates.$inferSelect
export type NewFixedTemplate = typeof fixedTemplates.$inferInsert
export type FixedTemplateItem = typeof fixedTemplateItems.$inferSelect
export type NewFixedTemplateItem = typeof fixedTemplateItems.$inferInsert
