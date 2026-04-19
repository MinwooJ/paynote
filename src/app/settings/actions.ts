'use server'

import fs from 'node:fs'
import path from 'node:path'
import { db } from '@/db/client'
import { accounts, expenseItems, fixedTemplateItems, fixedTemplates, incomeItems, months } from '@/db/schema'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

const DB_PATH = process.env.PAYNOTE_DB_PATH ?? './paynote.db'

export async function getDbInfoAction(): Promise<
  Result<{ path: string; bytes: number; exists: boolean }>
> {
  const abs = path.resolve(DB_PATH)
  try {
    const stat = fs.statSync(abs)
    return { ok: true, data: { path: abs, bytes: stat.size, exists: true } }
  } catch {
    return { ok: true, data: { path: abs, bytes: 0, exists: false } }
  }
}

export async function backupNowAction(): Promise<Result<{ backupPath: string; bytes: number }>> {
  const abs = path.resolve(DB_PATH)
  if (!fs.existsSync(abs)) return { ok: false, error: 'DB 파일이 없어요' }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = `${abs}.bak-${stamp}`
  fs.copyFileSync(abs, backupPath)
  const stat = fs.statSync(backupPath)
  return { ok: true, data: { backupPath, bytes: stat.size } }
}

export async function exportJsonAction(): Promise<
  Result<{ filename: string; json: string }>
> {
  const [accountRows, monthRows, incomeRows, expenseRows, tmplRows, tmplItemRows] =
    await Promise.all([
      db.select().from(accounts),
      db.select().from(months),
      db.select().from(incomeItems),
      db.select().from(expenseItems),
      db.select().from(fixedTemplates),
      db.select().from(fixedTemplateItems),
    ])

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    accounts: accountRows,
    months: monthRows,
    incomeItems: incomeRows,
    expenseItems: expenseRows,
    fixedTemplates: tmplRows,
    fixedTemplateItems: tmplItemRows,
  }

  const filename = `paynote-export-${new Date().toISOString().slice(0, 10)}.json`
  return { ok: true, data: { filename, json: JSON.stringify(payload, null, 2) } }
}
