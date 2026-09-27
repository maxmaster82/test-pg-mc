import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  globalIgnores([
    '**/dist/**',
    '**/coverage/**',
    'public/mockServiceWorker.js',
    'playwright-report/**',
    'test-results/**',
  ]),
  pluginVue.configs['flat/recommended'],
  pluginVueA11y.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,
  {
    name: 'app/rules',
    files: ['**/*.{ts,vue}'],
    rules: {
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/define-macros-order': 'error',
      'vue/no-unused-refs': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/require-typed-ref': 'error',
      // Optional props are typed as optional; defaults via props destructure only where meaningful.
      'vue/require-default-prop': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Labels are associated through our TextField wrappers (for/id), which this rule cannot follow.
      'vuejs-accessibility/label-has-for': 'off',
    },
  },
  {
    name: 'app/boundaries',
    files: ['src/app/**', 'src/modules/**', 'src/shared/**'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/mocks', '@/mocks/*', '**/mocks/**'],
              message: 'Application code must talk to the API, never to the mock backend.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'app/shared-boundary',
    files: ['src/shared/**'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*', '@/app/*'],
              message: 'shared/ must not depend on modules/ or app/.',
            },
            { group: ['@/mocks', '@/mocks/*'], message: 'Application code must not import mocks.' },
          ],
        },
      ],
    },
  },
  {
    name: 'app/tests',
    files: ['**/*.spec.ts', 'src/test/**', 'e2e/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  skipFormatting,
)
