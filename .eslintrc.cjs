module.exports = {
    root: true,
    reportUnusedDisableDirectives: true,
    env: {
        node: true,
    },
    ignorePatterns: [
        'lib/**',
        'node_modules/**',
    ],
    settings: {
        'import/resolver': {
            'typescript': {},
        },
    },
    overrides: [
        {
            files: [
                '*.ts',
            ],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/strict-type-checked',
                'plugin:@typescript-eslint/stylistic-type-checked',
                'plugin:deprecation/recommended',
                'plugin:import/recommended',
                'plugin:import/typescript',
                'plugin:n/recommended',
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: [
                    "./tsconfig.json",
                ],
            },
            rules: {
                // general linting
                'complexity': [
                    'warn',
                    15,
                ],
                'curly': [
                    'error',
                    'all',
                ],
                'no-param-reassign': 'error',

                // general formatting
                'arrow-spacing': 'warn',
                'comma-dangle': [
                    'warn',
                    'always-multiline',
                ],
                'indent': [
                    'error',
                    4,
                    {
                        'SwitchCase': 1,
                    },
                ],
                'keyword-spacing': 'warn',
                'linebreak-style': [
                    'error',
                    'unix',
                ],
                'object-property-newline': [
                    'warn',
                    {
                        'allowAllPropertiesOnSameLine': true,
                    },
                ],
                'quotes': [
                    'error',
                    'single',
                ],
                'semi': [
                    'error',
                    'always',
                ],

                // import
                'sort-imports': [ // For sorting members.
                    'warn',
                    {
                        'ignoreCase': true,
                        'ignoreDeclarationSort': true, // Handled by import/order.
                    },
                ],
                'import/order': [ // For sorting declarations.
                    'warn',
                    {
                        'alphabetize': {
                            'order': 'asc',
                            'orderImportKind': 'asc',
                            'caseInsensitive': true,
                        },
                    },
                ],

                // n
                'n/handle-callback-err': 'error',

                // typescript
                '@typescript-eslint/array-type': [
                    'warn',
                    {
                        'default': 'array-simple',
                    },
                ],
                '@typescript-eslint/naming-convention': 'error',
                '@typescript-eslint/prefer-readonly': 'warn',
                '@typescript-eslint/promise-function-async': 'error',
                '@typescript-eslint/unbound-method': [
                    'error',
                    {
                        'ignoreStatic': true,
                    },
                ],
            },
        }
    ],
};
