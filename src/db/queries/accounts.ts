import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '../client'
import { accounts, type Account, type NewAccount } from '../schema'

export async function listActiveAccounts(): Promise<Account[]> {
  return db.select().from(accounts).where(isNull(accounts.archivedAt)).orderBy(asc(accounts.id))
}

export async function listAllAccounts(): Promise<Account[]> {
  return db.select().from(accounts).orderBy(asc(accounts.id))
}

export async function getAccount(id: number): Promise<Account | undefined> {
  const rows = db.select().from(accounts).where(eq(accounts.id, id)).all()
  return rows[0]
}

export async function getSavingsAccount(): Promise<Account | undefined> {
  const rows = db
    .select()
    .from(accounts)
    .where(and(isNull(accounts.archivedAt), eq(accounts.role, 'savings')))
    .all()
  return rows[0]
}

export async function createAccount(input: NewAccount): Promise<Account> {
  const [row] = db.insert(accounts).values(input).returning().all()
  if (!row) throw new Error('Failed to create account')
  return row
}

export async function updateAccount(
  id: number,
  patch: Partial<Pick<Account, 'name' | 'openingBalance' | 'openingBalanceAsOfMonth'>>,
): Promise<Account | undefined> {
  const [row] = db.update(accounts).set(patch).where(eq(accounts.id, id)).returning().all()
  return row
}

export async function archiveAccount(id: number): Promise<Account | undefined> {
  const [row] = db
    .update(accounts)
    .set({ archivedAt: new Date() })
    .where(eq(accounts.id, id))
    .returning()
    .all()
  return row
}

export async function restoreAccount(id: number): Promise<Account | undefined> {
  const [row] = db
    .update(accounts)
    .set({ archivedAt: null })
    .where(eq(accounts.id, id))
    .returning()
    .all()
  return row
}

/**
 * 저축 통장 전환 — 트랜잭션으로 1개 제약 유지.
 * 기존 savings는 spending으로, 새 대상은 savings로.
 */
export async function switchSavingsAccount(newSavingsId: number): Promise<void> {
  db.transaction((tx) => {
    // 기존 savings 모두 spending으로 (사실상 1개지만 방어적)
    tx.update(accounts)
      .set({ role: 'spending' })
      .where(and(isNull(accounts.archivedAt), eq(accounts.role, 'savings')))
      .run()
    // 새 대상을 savings로
    tx.update(accounts)
      .set({ role: 'savings' })
      .where(and(isNull(accounts.archivedAt), eq(accounts.id, newSavingsId)))
      .run()
  })
}

export async function hasAnyAccount(): Promise<boolean> {
  const rows = db.select({ id: accounts.id }).from(accounts).limit(1).all()
  return rows.length > 0
}
