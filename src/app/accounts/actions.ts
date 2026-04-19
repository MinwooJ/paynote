'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import * as accountsQ from '@/db/queries/accounts'
import {
  accountArchiveSchema,
  accountCreateSchema,
  accountUpdateSchema,
  switchSavingsSchema,
} from '@/lib/validators/account'
import type { Account } from '@/db/schema'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? '입력을 확인해주세요'
}

function revalidate() {
  revalidatePath('/accounts')
  revalidatePath('/', 'layout')
}

export async function createAccountAction(input: unknown): Promise<Result<Account>> {
  const parsed = accountCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  try {
    // 저축 통장이 이미 존재하면 spending으로 생성
    if (parsed.data.role === 'savings') {
      const existing = await accountsQ.getSavingsAccount()
      if (existing) {
        return { ok: false, error: '저축 통장이 이미 지정되어 있어요. 전환은 "저축으로 설정" 버튼으로.' }
      }
    }
    const row = await accountsQ.createAccount(parsed.data)
    revalidate()
    return { ok: true, data: row }
  } catch {
    return { ok: false, error: '추가에 실패했어요' }
  }
}

export async function updateAccountAction(input: unknown): Promise<Result<Account>> {
  const parsed = accountUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }
  const { id, ...patch } = parsed.data
  const row = await accountsQ.updateAccount(id, patch)
  if (!row) return { ok: false, error: '통장을 찾을 수 없어요' }
  revalidate()
  return { ok: true, data: row }
}

export async function archiveAccountAction(input: unknown): Promise<Result<Account>> {
  const parsed = accountArchiveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const target = await accountsQ.getAccount(parsed.data.id)
  if (!target) return { ok: false, error: '통장을 찾을 수 없어요' }

  if (parsed.data.archive) {
    // 마지막 spending 통장 보호
    const actives = await accountsQ.listActiveAccounts()
    if (target.archivedAt === null) {
      const othersSpending = actives.filter(
        (a) => a.id !== target.id && a.role === 'spending',
      )
      if (target.role === 'spending' && othersSpending.length === 0) {
        return { ok: false, error: '최소 1개의 일상 통장이 필요해요' }
      }
      if (target.role === 'savings') {
        return {
          ok: false,
          error: '저축 통장은 바로 보관할 수 없어요. 먼저 다른 통장을 저축으로 전환하세요.',
        }
      }
    }
    const row = await accountsQ.archiveAccount(target.id)
    revalidate()
    return row ? { ok: true, data: row } : { ok: false, error: '보관에 실패했어요' }
  } else {
    const row = await accountsQ.restoreAccount(target.id)
    revalidate()
    return row ? { ok: true, data: row } : { ok: false, error: '복구에 실패했어요' }
  }
}

export async function switchSavingsAction(input: unknown): Promise<Result<void>> {
  const parsed = switchSavingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) }

  const target = await accountsQ.getAccount(parsed.data.newSavingsAccountId)
  if (!target || target.archivedAt !== null) {
    return { ok: false, error: '활성 상태인 통장만 저축으로 지정할 수 있어요' }
  }
  await accountsQ.switchSavingsAccount(target.id)
  revalidate()
  return { ok: true, data: undefined }
}
