import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/measure/__tests__/**/*.test.ts'],
  },
  css: {
    // Avoid loading project PostCSS/Tailwind config in unit tests
    postcss: { plugins: [] },
  },
})


