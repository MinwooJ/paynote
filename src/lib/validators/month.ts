import { z } from 'zod'
import { MONTH_KEY_REGEX } from '../month-key'

export const monthKeySchema = z
  .string()
  .regex(MONTH_KEY_REGEX, '월 형식은 YYYY-MM 입니다 (예: 2026-04)')

export const monthCreateSchema = z.object({
  id: monthKeySchema,
  note: z.string().max(500).nullable().optional(),
})

export const monthCloseSchema = z.object({
  id: monthKeySchema,
  closed: z.boolean(),
})

export type MonthCreate = z.infer<typeof monthCreateSchema>
export type MonthClose = z.infer<typeof monthCloseSchema>
