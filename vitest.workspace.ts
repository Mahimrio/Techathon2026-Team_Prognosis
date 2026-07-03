import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'backend/vitest.config.ts',
  'dashboard/vitest.config.ts',
  'bot/vitest.config.ts',
])
