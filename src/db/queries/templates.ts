import { asc, eq } from 'drizzle-orm'
import { db } from '../client'
import {
  fixedTemplateItems,
  fixedTemplates,
  type FixedTemplate,
  type FixedTemplateItem,
  type NewFixedTemplateItem,
} from '../schema'

export interface TemplateWithItems extends FixedTemplate {
  items: FixedTemplateItem[]
}

export async function listTemplates(): Promise<FixedTemplate[]> {
  return db.select().from(fixedTemplates).orderBy(asc(fixedTemplates.id))
}

export async function getTemplateWithItems(id: number): Promise<TemplateWithItems | undefined> {
  const [tmpl] = db.select().from(fixedTemplates).where(eq(fixedTemplates.id, id)).all()
  if (!tmpl) return undefined
  const items = db
    .select()
    .from(fixedTemplateItems)
    .where(eq(fixedTemplateItems.templateId, id))
    .orderBy(asc(fixedTemplateItems.id))
    .all()
  return { ...tmpl, items }
}

export async function createTemplate(name: string): Promise<FixedTemplate> {
  const [row] = db.insert(fixedTemplates).values({ name }).returning().all()
  if (!row) throw new Error('Failed to create template')
  return row
}

export async function updateTemplateName(id: number, name: string): Promise<void> {
  db.update(fixedTemplates).set({ name }).where(eq(fixedTemplates.id, id)).run()
}

export async function deleteTemplate(id: number): Promise<void> {
  db.delete(fixedTemplates).where(eq(fixedTemplates.id, id)).run()
}

export async function addTemplateItem(
  input: NewFixedTemplateItem,
): Promise<FixedTemplateItem> {
  const [row] = db.insert(fixedTemplateItems).values(input).returning().all()
  if (!row) throw new Error('Failed to add template item')
  return row
}

export async function deleteTemplateItem(id: number): Promise<void> {
  db.delete(fixedTemplateItems).where(eq(fixedTemplateItems.id, id)).run()
}
