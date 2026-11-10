import { defineConfig } from 'vitest/config'

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: ['tests/components/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['tests/components/setup.ts'],
    maxWorkers: 2,
    restoreMocks: true,
    clearMocks: true,
  },
})
