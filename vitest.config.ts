import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      root: fileURLToPath(new URL('./', import.meta.url)),
      include: ['src/**/*.spec.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      setupFiles: ['src/test/setup.ts'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/*.spec.ts', 'src/test/**', 'src/main.ts', 'src/mocks/browser.ts'],
        reporter: ['text-summary', 'html', 'lcov'],
        // Enforced on logic-heavy code; pages are covered by behavior tests rather than a number.
        thresholds: {
          lines: 85,
          'src/shared/**': { lines: 90 },
          'src/mocks/db/**': { lines: 90 },
          'src/modules/**/{api,queries,schemas,list-params}.ts': { lines: 80 },
        },
      },
    },
  }),
)
