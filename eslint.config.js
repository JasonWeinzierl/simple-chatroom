// @ts-check
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import n from 'eslint-plugin-n';
import gitignore from 'eslint-config-flat-gitignore';
import gloabls from 'globals';
import tseslint from 'typescript-eslint';

// TODO: re-add these plugins when they support ESLint v9
// - deprecation
// - import-x

export default tseslint.config(gitignore(), {
    files: [
        '**/*.js',
        '**/*.ts',
    ],
    extends: [
        js.configs.recommended,
        stylistic.configs['disable-legacy'],
        stylistic.configs.customize({
            flat: true,
            quotes: 'single',
            semi: true,
            jsx: false,
            braceStyle: '1tbs',
            commaDangle: 'always-multiline',
            indent: 4,
            quoteProps: 'consistent',
            arrowParens: false,
        }),
        n.configs['flat/recommended-module'],
    ],
    languageOptions: {
        globals: {
            ...gloabls.node,
        },
    },
    rules: {
        // General
        'complexity': [
            'warn',
            15,
        ],
        'curly': [
            'error',
            'all',
        ],
        'no-param-reassign': 'error',
        'no-shadow': 'error',
        'default-param-last': 'error',

        // Stylistic
        '@stylistic/arrow-parens': 'off',
        '@stylistic/multiline-ternary': 'off',
        '@stylistic/no-extra-semi': 'error',
        '@stylistic/generator-star-spacing': [
            'error',
            'after',
        ],

        // Imports
        'sort-imports': [
            'warn',
            {
                ignoreCase: true,
                ignoreDeclarationSort: true,
            },
        ],

        // Node.js
        'n/handle-callback-err': 'error',
    },
}, {
    files: [
        '**/*.ts',
    ],
    extends: [
        ...tseslint.configs.strictTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
        parserOptions: {
            projectService: true,
        },
    },
    rules: {
        // TypeScript
        '@typescript-eslint/array-type': [
            'warn',
            {
                default: 'array-simple',
                readonly: 'generic',
            },
        ],
        '@typescript-eslint/explicit-function-return-type': [
            'error',
            {
                allowExpressions: true,
            },
        ],
        '@typescript-eslint/naming-convention': 'error',
        '@typescript-eslint/prefer-readonly': 'warn',
        '@typescript-eslint/promise-function-async': 'error',
        '@typescript-eslint/unbound-method': [
            'error',
            {
                ignoreStatic: true,
            },
        ],

        // ESLint equivalents
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',

        'default-param-last': 'off',
        '@typescript-eslint/default-param-last': 'error',

        // TODO: re-enable, was introduced to recommended config in ts-eslint v7
        '@typescript-eslint/restrict-template-expressions': 'off',
    },
});
