import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

type DrizzleDB = ReturnType<typeof createDb>

function createDb() {
  const dbPath = process.env.PAYNOTE_DB_PATH ?? './paynote.db'
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('busy_timeout = 5000')
  return drizzle(sqlite, { schema })
}

/**
 * Next.js dev HMR로 인한 중복 연결 방지를 위해 globalThis에 캐시.
 * 프로덕션에서는 매 프로세스 fresh.
 */
const globalForDb = globalThis as unknown as { __paynoteDb?: DrizzleDB }

export const db: DrizzleDB = globalForDb.__paynoteDb ?? createDb()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__paynoteDb = db
}

export type DB = DrizzleDB
export { schema }
