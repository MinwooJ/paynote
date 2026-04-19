import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'
import {
  accounts,
  expenseItems,
  incomeItems,
  months,
  type NewExpenseItem,
  type NewIncomeItem,
} from './schema'

/**
 * 사용자의 실제 2025-09 메모를 기반으로 한 개발용 시드.
 * `pnpm db:seed` — 테이블을 비우고 재삽입합니다.
 */

const DB_PATH = process.env.PAYNOTE_DB_PATH ?? './paynote.db'

function main() {
  const sqlite = new Database(DB_PATH)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite)

  console.log('🧹 기존 데이터 비우기…')
  db.run(sql`DELETE FROM income_items`)
  db.run(sql`DELETE FROM expense_items`)
  db.run(sql`DELETE FROM fixed_template_items`)
  db.run(sql`DELETE FROM fixed_templates`)
  db.run(sql`DELETE FROM months`)
  db.run(sql`DELETE FROM accounts`)

  console.log('🏦 통장 3개 생성…')
  const insertedAccounts = db
    .insert(accounts)
    .values([
      {
        name: '우리은행',
        role: 'spending',
        openingBalance: 6_958_000,
        openingBalanceAsOfMonth: '2025-09',
      },
      {
        name: '국민은행',
        role: 'spending',
        openingBalance: 1_803_735,
        openingBalanceAsOfMonth: '2025-09',
      },
      {
        name: '카카오뱅크',
        role: 'savings',
        openingBalance: 0,
        openingBalanceAsOfMonth: '2025-09',
      },
    ])
    .returning()
    .all()

  const woori = insertedAccounts.find((a) => a.name === '우리은행')
  const kookmin = insertedAccounts.find((a) => a.name === '국민은행')
  if (!woori || !kookmin) throw new Error('계좌 생성 실패')

  console.log('📅 2025-09 생성…')
  db.insert(months).values({ id: '2025-09' }).run()

  console.log('💰 수입·지출 삽입…')
  const incomes: NewIncomeItem[] = [
    { monthId: '2025-09', amount: 5_346_000, label: '월급', destinationAccountId: woori.id },
    {
      monthId: '2025-09',
      amount: 70_000,
      label: '통신비 지원',
      destinationAccountId: woori.id,
    },
  ]

  const expenses: NewExpenseItem[] = [
    {
      monthId: '2025-09',
      amount: 800_000,
      label: '월세',
      category: '주거',
      sourceAccountId: woori.id,
    },
    {
      monthId: '2025-09',
      amount: 250_000,
      label: '관리비',
      category: '주거',
      sourceAccountId: woori.id,
    },
    {
      monthId: '2025-09',
      amount: 450_000,
      label: '양평 땅 원금',
      category: '부채',
      sourceAccountId: woori.id,
    },
    {
      monthId: '2025-09',
      amount: 100_000,
      label: '청약',
      category: '저축',
      sourceAccountId: woori.id,
    },
    {
      monthId: '2025-09',
      amount: 100_000,
      label: '부모님 적금',
      category: '가족',
      sourceAccountId: woori.id,
    },
    {
      monthId: '2025-09',
      amount: 90_000,
      label: '통신비+인터넷',
      category: '통신',
      sourceAccountId: woori.id,
    },
    {
      monthId: '2025-09',
      amount: 90_000,
      label: '보험금',
      category: '보험',
      sourceAccountId: woori.id,
    },
    {
      monthId: '2025-09',
      amount: 1_283_000,
      label: '신용카드',
      category: '카드',
      sourceAccountId: kookmin.id,
    },
  ]

  db.insert(incomeItems).values(incomes).run()
  db.insert(expenseItems).values(expenses).run()

  console.log('✅ 시드 완료.')
  console.log(
    '   총 수입 ₩5,416,000 · 총 지출 ₩3,163,000 · 순잔액 ₩2,253,000 (메모의 2,590,000과 ₩337,000 차이)',
  )

  sqlite.close()
}

main()
