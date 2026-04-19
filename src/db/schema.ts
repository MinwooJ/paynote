import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

/**
 * 모든 금액은 원 단위 정수(KRW). ADR-0003.
 * 월 키는 'YYYY-MM' 문자열. ADR-0004.
 * audit timestamps는 unixepoch() 디폴트 + $onUpdate. ADR-0005 관련.
 */

// Accounts — 통장
export const accounts = sqliteTable(
  'accounts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    role: text('role', { enum: ['spending', 'savings'] })
      .notNull()
      .default('spending'),
    openingBalance: integer('opening_balance').notNull().default(0),
    /** 'YYYY-MM' — 이 달의 1일 00시 기준 잔액이 openingBalance */
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
  (t) => [
    // savings 역할은 한 번에 하나만 (active 중에서)
    uniqueIndex('accounts_savings_unique_idx')
      .on(t.role)
      .where(sql`${t.archivedAt} IS NULL AND ${t.role} = 'savings'`),
    index('accounts_archived_idx').on(t.archivedAt),
  ],
)

// Months — 'YYYY-MM' 문자열 PK
export const months = sqliteTable(
  'months',
  {
    id: text('id', { length: 7 }).primaryKey().notNull(),
    note: text('note'),
    /** 사용자 "확인 완료" 소프트 플래그. 편집 막지 않음. */
    closedAt: integer('closed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('months_closed_idx').on(t.closedAt)],
)

// IncomeItems — 수입 항목
export const incomeItems = sqliteTable(
  'income_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    monthId: text('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(), // > 0 (zod에서 강제)
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
  (t) => [
    index('income_month_idx').on(t.monthId),
    index('income_account_idx').on(t.destinationAccountId),
  ],
)

// ExpenseItems — 지출 항목
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
  (t) => [
    index('expense_month_idx').on(t.monthId),
    index('expense_account_idx').on(t.sourceAccountId),
    index('expense_category_idx').on(t.category),
  ],
)

// FixedTemplates — 고정지출 프리셋
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
  (t) => [index('template_items_template_idx').on(t.templateId)],
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
