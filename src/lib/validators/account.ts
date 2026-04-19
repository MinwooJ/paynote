import { z } from 'zod'
import { monthKeySchema } from './month'

export const accountRoleSchema = z.enum(['spending', 'savings'])

export const accountCreateSchema = z.object({
  name: z.string().trim().min(1, '통장 이름을 입력해주세요').max(50, '통장 이름은 50자 이하로'),
  role: accountRoleSchema,
  openingBalance: z
    .number({ message: '금액을 숫자로 입력해주세요' })
    .int('금액은 정수여야 합니다')
    .nonnegative('음수는 입력할 수 없어요'),
  openingBalanceAsOfMonth: monthKeySchema,
})

export const accountUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(50).optional(),
  openingBalance: z.number().int().nonnegative().optional(),
  openingBalanceAsOfMonth: monthKeySchema.optional(),
})

export const accountArchiveSchema = z.object({
  id: z.number().int().positive(),
  archive: z.boolean(),
})

export const switchSavingsSchema = z.object({
  newSavingsAccountId: z.number().int().positive(),
})

export type AccountCreate = z.infer<typeof accountCreateSchema>
export type AccountUpdate = z.infer<typeof accountUpdateSchema>
