module.exports = {
    root: true,
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
            plugins: [
                'deprecation',
            ],
            rules: {
                'indent': [
                    'error',
                    4,
                    {
                        'SwitchCase': 1,
                    },
                ],
                'linebreak-style': [
                    'error',
                    'unix',
                ],
                'quotes': [
                    'error',
                    'single',
                ],
                'semi': [
                    'error',
                    'always',
                ],
                'comma-dangle': [
                    'warn',
                    'always-multiline',
                ],
                'sort-imports': [ // For sorting members.
                    'warn',
                    {
                        'ignoreCase': true,
                        'ignoreDeclarationSort': true, // Handled by import/order.
                    },
                ],
                
                // import
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

                // deprecation
                'deprecation/deprecation': 'warn',
            },
        }
    ],
};
