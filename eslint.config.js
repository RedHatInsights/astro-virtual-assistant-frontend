const redhatCloudServicesConfig = require('@redhat-cloud-services/eslint-config-redhat-cloud-services');

module.exports = [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: ['node_modules/*', 'static/*', 'dist/*'],
  },

  // Base Red Hat Cloud Services config
  ...redhatCloudServicesConfig,

  // Base config with custom globals
  {
    languageOptions: {
      globals: {
        insights: 'readonly',
        shallow: 'readonly',
        render: 'readonly',
        mount: 'readonly',
      },
    },
    rules: {
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
    },
  },

  // TypeScript config for src files
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      ...require('@typescript-eslint/eslint-plugin').configs.recommended.rules,
      'react/prop-types': 'off',
    },
  },

  // Cypress config
  {
    files: ['cypress/**/*.ts', 'cypress/**/*.tsx'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
    },
  },

  // Relaxed rules for test files
  {
    files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Relaxed rules for mock files
  {
    files: ['**/__mocks__/**/*.ts', '**/__mocks__/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
