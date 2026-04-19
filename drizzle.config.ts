import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.PAYNOTE_DB_PATH ?? './paynote.db',
  },
  strict: true,
  verbose: true,
})
