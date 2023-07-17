module.exports = {
    env: {
        node: true,
    },
    ignorePatterns: [
        'lib/**',
        'node_modules/**',
    ],
    overrides: [
        {
            files: [
                '*.ts',
            ],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/strict-type-checked',
                'plugin:@typescript-eslint/stylistic-type-checked',
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: [
                    "./tsconfig.json",
                ],
            },
            plugins: [
                '@typescript-eslint',
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
            },
        }
    ],
};
