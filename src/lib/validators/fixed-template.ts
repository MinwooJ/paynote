import { z } from 'zod'

export const templateKind = z.enum(['income', 'expense'])

export const templateItemSchema = z.object({
  kind: templateKind,
  amount: z.number().int().positive('금액은 1원 이상이어야 합니다'),
  label: z.string().trim().min(1, '항목 이름을 입력해주세요').max(100),
  category: z.string().trim().max(50).nullable().optional(),
  accountId: z.number().int().positive('통장을 선택해주세요'),
})

export const templateCreateSchema = z.object({
  name: z.string().trim().min(1, '템플릿 이름을 입력해주세요').max(50),
  items: z.array(templateItemSchema).default([]),
})

export const templateUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(50).optional(),
})

export const templateApplySchema = z.object({
  templateId: z.number().int().positive(),
  monthId: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, '월 형식은 YYYY-MM 입니다'),
  mode: z.enum(['append', 'overwrite']).default('append'),
})

export type TemplateItem = z.infer<typeof templateItemSchema>
export type TemplateCreate = z.infer<typeof templateCreateSchema>
