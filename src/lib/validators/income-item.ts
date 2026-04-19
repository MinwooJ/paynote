import { z } from 'zod'
import { monthKeySchema } from './month'

export const incomeItemCreateSchema = z.object({
  monthId: monthKeySchema,
  amount: z
    .number({ message: '금액을 숫자로 입력해주세요' })
    .int('금액은 정수여야 합니다')
    .positive('금액은 1원 이상이어야 합니다'),
  label: z.string().trim().min(1, '항목 이름을 입력해주세요').max(100),
  destinationAccountId: z.number().int().positive('통장을 선택해주세요'),
})

export const incomeItemUpdateSchema = incomeItemCreateSchema.partial().extend({
  id: z.number().int().positive(),
})

export const incomeItemDeleteSchema = z.object({
  id: z.number().int().positive(),
})

export type IncomeItemCreate = z.infer<typeof incomeItemCreateSchema>
export type IncomeItemUpdate = z.infer<typeof incomeItemUpdateSchema>
