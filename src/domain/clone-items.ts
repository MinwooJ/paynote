export interface CloneSourceItem {
  readonly kind: 'income' | 'expense'
  readonly amount: number
  readonly label: string
  readonly category: string | null
  readonly accountId: number
}

export type ClonedItem = CloneSourceItem

export interface CloneSkipped {
  readonly item: CloneSourceItem
  readonly reason: 'archived-account'
}

export function cloneItems(input: {
  sourceItems: readonly CloneSourceItem[]
  activeAccountIds: ReadonlySet<number>
}): { cloned: ClonedItem[]; skipped: CloneSkipped[] } {
  const cloned: ClonedItem[] = []
  const skipped: CloneSkipped[] = []
  for (const item of input.sourceItems) {
    if (!input.activeAccountIds.has(item.accountId)) {
      skipped.push({ item, reason: 'archived-account' })
      continue
    }
    cloned.push({ ...item })
  }
  return { cloned, skipped }
}
