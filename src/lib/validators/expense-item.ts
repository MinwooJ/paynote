import { z } from 'zod'
import { monthKeySchema } from './month'

export const expenseItemCreateSchema = z.object({
  monthId: monthKeySchema,
  amount: z
    .number({ message: '금액을 숫자로 입력해주세요' })
    .int('금액은 정수여야 합니다')
    .positive('금액은 1원 이상이어야 합니다'),
  label: z.string().trim().min(1, '항목 이름을 입력해주세요').max(100),
  category: z.string().trim().max(50).nullable().optional(),
  sourceAccountId: z.number().int().positive('통장을 선택해주세요'),
})

export const expenseItemUpdateSchema = expenseItemCreateSchema.partial().extend({
  id: z.number().int().positive(),
})

export const expenseItemDeleteSchema = z.object({
  id: z.number().int().positive(),
})

export type ExpenseItemCreate = z.infer<typeof expenseItemCreateSchema>
export type ExpenseItemUpdate = z.infer<typeof expenseItemUpdateSchema>
