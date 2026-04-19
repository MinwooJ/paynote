import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import fs from 'node:fs'
import path from 'node:path'

const DB_PATH = process.env.PAYNOTE_DB_PATH ?? './paynote.db'
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'drizzle')

function backupIfExists() {
  if (!fs.existsSync(DB_PATH)) return
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = `${DB_PATH}.premigrate-${stamp}`
  fs.copyFileSync(DB_PATH, backupPath)
  console.log(`📦 backup: ${backupPath}`)
}

function main() {
  backupIfExists()
  const sqlite = new Database(DB_PATH)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite)
  console.log(`⏳ migrating ${DB_PATH} …`)
  migrate(db, { migrationsFolder: MIGRATIONS_DIR })
  console.log('✅ migrations applied')
  sqlite.close()
}

main()
