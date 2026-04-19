import { asc, desc, eq } from 'drizzle-orm'
import { db } from '../client'
import { months, type Month } from '../schema'

export async function getMonth(id: string): Promise<Month | undefined> {
  const rows = db.select().from(months).where(eq(months.id, id)).all()
  return rows[0]
}

export async function ensureMonth(id: string, note: string | null = null): Promise<Month> {
  const existing = await getMonth(id)
  if (existing) return existing
  const [row] = db.insert(months).values({ id, note }).returning().all()
  if (!row) throw new Error('Failed to create month')
  return row
}

export async function updateMonthNote(id: string, note: string | null): Promise<void> {
  db.update(months).set({ note }).where(eq(months.id, id)).run()
}

export async function toggleMonthClosed(id: string, closed: boolean): Promise<Month | undefined> {
  const [row] = db
    .update(months)
    .set({ closedAt: closed ? new Date() : null })
    .where(eq(months.id, id))
    .returning()
    .all()
  return row
}

export async function listMonthsAsc(): Promise<Month[]> {
  return db.select().from(months).orderBy(asc(months.id))
}

export async function listMonthsDesc(): Promise<Month[]> {
  return db.select().from(months).orderBy(desc(months.id))
}

export async function hasPreviousMonth(id: string): Promise<boolean> {
  // 문자열 정렬로 lexicographic 이전 달 존재 여부
  const rows = db
    .select({ id: months.id })
    .from(months)
    .where(eq(months.id, id))
    .limit(1)
    .all()
  if (rows.length === 0) return false
  const earlier = db
    .select({ id: months.id })
    .from(months)
    .orderBy(desc(months.id))
    .all()
  return earlier.some((m) => m.id < id)
}
