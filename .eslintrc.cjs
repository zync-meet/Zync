/**
 * =============================================================================
 * ESLint Configuration — ZYNC Desktop Application
 * =============================================================================
 *
 * This ESLint configuration provides comprehensive linting rules for the ZYNC
 * desktop application. It covers TypeScript, React, Electron main process, and
 * general JavaScript/Node.js code quality standards.
 *
 * The configuration is organized into several layers:
 *
 * 1. **Base Configuration**: Core ESLint rules that apply to all files
 * 2. **TypeScript Rules**: TypeScript-specific rules for type safety
 * 3. **React Rules**: React and JSX-specific rules for the renderer process
 * 4. **Import Rules**: Module import/export organization rules
 * 5. **Accessibility Rules**: JSX accessibility (a11y) rules
 * 6. **Testing Rules**: Testing-specific rules for test files
 *
 * @see https://eslint.org/docs/latest/use/configure/
 * @see https://typescript-eslint.io/getting-started
 * @see https://github.com/jsx-eslint/eslint-plugin-react
 *
 * =============================================================================
 */

 
module.exports = {
    /**
     * ==========================================================================
     * Root Configuration
     * ==========================================================================
     *
     * Setting 'root' to true tells ESLint to stop looking for configuration
     * files in parent directories. This ensures that only this configuration
     * file is used for the entire project, preventing unexpected rule
     * inheritance from global or parent directory configurations.
     */
    root: true,

    /**
     * ==========================================================================
     * Environment Configuration
     * ==========================================================================
     *
     * Environments define global variables that are predefined. These variables
     * are available in the code without triggering "no-undef" errors. We enable
     * multiple environments to support the different execution contexts in the
     * Electron application.
     *
     * - browser: DOM globals (window, document, etc.) for the renderer process
     * - es2021: Modern ECMAScript features (Promise, Symbol, etc.)
     * - node: Node.js globals (process, __dirname, etc.) for the main process
     * - jest: Testing globals (describe, it, expect, etc.) for unit tests
     */
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true,
    },

    /**
     * ==========================================================================
     * Extended Configurations
     * ==========================================================================
     *
     * These are pre-built configurations from popular ESLint plugins that
     * provide a solid foundation of rules. They are listed in order of
     * precedence — later configurations override earlier ones if there are
     * conflicting rules.
     *
     * Configuration breakdown:
     *
     * 1. eslint:recommended
     *    - Core ESLint rules that catch common programming errors
     *    - Includes rules like no-unused-vars, no-undef, etc.
     *    - Reference: https://eslint.org/docs/latest/rules/
     *
     * 2. plugin:@typescript-eslint/recommended
     *    - TypeScript-specific rules that leverage type information
     *    - Includes rules like no-explicit-any, no-unused-vars, etc.
     *    - Reference: https://typescript-eslint.io/rules/
     *
     * 3. plugin:react/recommended
     *    - React-specific rules for best practices
     *    - Includes rules for JSX, hooks, component naming, etc.
     *    - Reference: https://github.com/jsx-eslint/eslint-plugin-react
     *
     * 4. plugin:react-hooks/recommended
     *    - Rules specifically for React Hooks usage
     *    - Enforces the Rules of Hooks (exhaustive deps, etc.)
     *    - Reference: https://www.npmjs.com/package/eslint-plugin-react-hooks
     *
     * 5. plugin:react/jsx-runtime
     *    - Adjusts rules for the new JSX transform (React 17+)
     *    - Disables the requirement to import React in JSX files
     *    - Reference: https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform
     */
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:react/jsx-runtime',
    ],

    /**
     * ==========================================================================
     * Parser Configuration
     * ==========================================================================
     *
     * We use @typescript-eslint/parser instead of the default ESLint parser
     * (espree) because it can parse TypeScript syntax. This parser produces
     * an AST (Abstract Syntax Tree) that is compatible with ESLint while
     * also understanding TypeScript-specific syntax like type annotations,
     * interfaces, enums, and generics.
     *
     * @see https://typescript-eslint.io/architecture/parser/
     */
    parser: '@typescript-eslint/parser',

    /**
     * ==========================================================================
     * Parser Options
     * ==========================================================================
     *
     * These options configure how the TypeScript parser processes source files.
     *
     * Options explained:
     *
     * - ecmaVersion: 'latest'
     *   Allows the parser to handle the latest ECMAScript syntax features.
     *   This includes features like optional chaining, nullish coalescing,
     *   top-level await, and other modern JavaScript features.
     *
     * - sourceType: 'module'
     *   Tells the parser that our source files use ES modules (import/export)
     *   rather than CommonJS (require/module.exports). This is the standard
     *   for modern JavaScript and TypeScript projects using Vite.
     *
     * - ecmaFeatures.jsx: true
     *   Enables JSX parsing, which is required for React component files.
     *   This allows the parser to understand JSX syntax in .tsx files.
     *
     * - project: './tsconfig.json'
     *   Points the parser to the TypeScript configuration file. This enables
     *   type-aware linting rules that can use TypeScript's type checker to
     *   provide more accurate and powerful linting.
     *
     * - tsconfigRootDir: __dirname
     *   Sets the root directory for resolving the tsconfig.json path.
     *   This ensures the parser can find the TypeScript configuration
     *   regardless of the current working directory.
     */
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },

    /**
     * ==========================================================================
     * Plugins
     * ==========================================================================
     *
     * Plugins provide additional rules and processors. Each plugin is an npm
     * package that contains a set of ESLint rules specific to a particular
     * framework or coding pattern.
     *
     * Plugin descriptions:
     *
     * - react
     *   Provides React-specific linting rules including component naming
     *   conventions, prop validation, and JSX formatting rules.
     *
     * - react-hooks
     *   Enforces the Rules of Hooks — ensuring hooks are only called at the
     *   top level of function components and in the correct order.
     *
     * - @typescript-eslint
     *   Provides TypeScript-specific linting rules that can leverage type
     *   information from the TypeScript compiler for more accurate linting.
     *
     * - react-refresh
     *   Ensures components work correctly with Vite's React Fast Refresh
     *   (HMR). It warns about patterns that would break hot module replacement.
     */
    plugins: [
        'react',
        'react-hooks',
        '@typescript-eslint',
        'react-refresh',
    ],

    /**
     * ==========================================================================
     * Settings
     * ==========================================================================
     *
     * Shared settings that are passed to all rules. These settings configure
     * the behavior of specific plugins.
     *
     * - react.version: 'detect'
     *   Automatically detects the installed version of React from package.json.
     *   This is used by the react plugin to apply version-specific rules.
     *   For example, React 17+ doesn't require importing React for JSX,
     *   and this setting ensures the plugin knows which version to target.
     */
    settings: {
        react: {
            version: 'detect',
        },
    },

    /**
     * ==========================================================================
     * Rule Configuration
     * ==========================================================================
     *
     * Individual rule configurations. Rules can be set to:
     * - 'off' or 0:   Disable the rule entirely
     * - 'warn' or 1:  Show a warning (does not affect exit code)
     * - 'error' or 2: Show an error (affects exit code in CI)
     *
     * Each rule is documented with its purpose and rationale for the
     * chosen severity level.
     */
    rules: {
        // ========================================================================
        // React Rules
        // ========================================================================

        /**
         * react/prop-types: OFF
         *
         * PropTypes are not needed when using TypeScript. TypeScript provides
         * static type checking that is more powerful and catches errors at
         * compile time rather than runtime. Using PropTypes with TypeScript
         * would be redundant.
         */
        'react/prop-types': 'off',

        /**
         * react/react-in-jsx-scope: OFF
         *
         * With React 17+ and the new JSX transform, it's no longer necessary
         * to import React in every file that uses JSX. The JSX transform
         * automatically imports the necessary runtime functions.
         *
         * This is configured through tsconfig.json with "jsx": "react-jsx".
         */
        'react/react-in-jsx-scope': 'off',

        /**
         * react/display-name: OFF
         *
         * React display names are useful for debugging in React DevTools but
         * are not required. TypeScript's function names and component names
         * usually provide sufficient identification. Enabling this rule would
         * require adding displayName to every forwardRef and memo call, which
         * adds boilerplate without significant benefit.
         */
        'react/display-name': 'off',

        /**
         * react/no-unescaped-entities: OFF
         *
         * This rule prevents using unescaped HTML entities in JSX text content
         * (e.g., using ' instead of &apos;). While technically correct, this
         * rule can be overly strict and make JSX content harder to read.
         * We prefer readability over strict HTML entity encoding.
         */
        'react/no-unescaped-entities': 'off',

        // ========================================================================
        // React Hooks Rules
        // ========================================================================

        /**
         * react-hooks/rules-of-hooks: ERROR
         *
         * This is a critical rule that enforces the Rules of Hooks:
         * 1. Only call Hooks at the top level of a function component
         * 2. Only call Hooks from React function components or custom Hooks
         * 3. Don't call Hooks inside loops, conditions, or nested functions
         *
         * Violating these rules can cause subtle bugs and unpredictable behavior.
         * This should ALWAYS be an error.
         */
        'react-hooks/rules-of-hooks': 'error',

        /**
         * react-hooks/exhaustive-deps: WARN
         *
         * Warns when the dependency array of useEffect, useCallback, useMemo,
         * etc. is missing dependencies. While important, this is set to 'warn'
         * instead of 'error' because there are legitimate cases where you
         * intentionally want to omit dependencies (though this should be rare
         * and well-documented with ESLint disable comments).
         */
        'react-hooks/exhaustive-deps': 'warn',

        // ========================================================================
        // React Refresh Rules
        // ========================================================================

        /**
         * react-refresh/only-export-components: WARN
         *
         * Warns when a file exports anything other than React components,
         * which can break React Fast Refresh (HMR). When a file exports
         * both components and non-component values, Vite cannot safely
         * hot-reload the file without potential state loss.
         *
         * allowConstantExport: true
         *   Allows exporting constants alongside components. Constants are
         *   safe to export because they don't hold state. This is a common
         *   pattern for exporting configuration objects or enum-like constants
         *   from component files.
         */
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],

        // ========================================================================
        // TypeScript Rules
        // ========================================================================

        /**
         * @typescript-eslint/no-unused-vars: WARN
         *
         * Warns about variables that are declared but never used. This helps
         * keep the codebase clean and prevents potential bugs from leftover
         * variables after refactoring.
         *
         * Configuration:
         * - argsIgnorePattern: '^_'
         *   Variables starting with underscore are ignored. This is a common
         *   convention for intentionally unused parameters (e.g., in callbacks
         *   where you only need the second parameter).
         *
         * - varsIgnorePattern: '^_'
         *   Same pattern for variable declarations. Useful for destructuring
         *   where you need to skip values: const [_, second] = array;
         */
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],

        /**
         * @typescript-eslint/no-explicit-any: WARN
         *
         * Warns when the 'any' type is used explicitly. Using 'any' defeats
         * the purpose of TypeScript by bypassing all type checking. However,
         * there are legitimate cases where 'any' is necessary (e.g., working
         * with untyped third-party libraries), so this is a warning rather
         * than an error.
         *
         * When you must use 'any', prefer using 'unknown' with type guards
         * or adding specific type definitions.
         */
        '@typescript-eslint/no-explicit-any': 'warn',

        /**
         * @typescript-eslint/no-non-null-assertion: WARN
         *
         * Warns when the non-null assertion operator (!) is used. This
         * operator tells TypeScript to ignore the possibility that a value
         * could be null or undefined, which can lead to runtime errors.
         *
         * Prefer using optional chaining (?.) and nullish coalescing (??)
         * operators, or adding proper null checks.
         */
        '@typescript-eslint/no-non-null-assertion': 'warn',

        /**
         * @typescript-eslint/no-empty-function: OFF
         *
         * Allows empty function bodies. Empty functions are commonly used
         * as default callbacks, no-op handlers, and placeholder implementations.
         * Requiring a comment in every empty function would add unnecessary
         * boilerplate.
         */
        '@typescript-eslint/no-empty-function': 'off',

        /**
         * @typescript-eslint/ban-ts-comment: WARN
         *
         * Warns when TypeScript directive comments are used (@ts-ignore,
         * @ts-expect-error, @ts-nocheck). These comments suppress TypeScript
         * errors and should be used sparingly. The warning helps identify
         * places where proper type fixes might be needed.
         */
        '@typescript-eslint/ban-ts-comment': 'warn',

        // ========================================================================
        // General JavaScript Rules
        // ========================================================================

        /**
         * no-console: WARN
         *
         * Warns when console.log is used. In production code, console
         * statements should be replaced with a proper logging utility
         * (electron/utils/logger.ts) that can be configured to different
         * log levels and outputs.
         *
         * Exceptions:
         * - console.warn: Allowed for non-critical warnings
         * - console.error: Allowed for error reporting
         * - console.info: Allowed for informational messages
         *
         * In the Electron main process, console output goes to the terminal
         * where the app was launched, which is useful for debugging but
         * should not be relied upon in production.
         */
        'no-console': [
            'warn',
            {
                allow: ['warn', 'error', 'info'],
            },
        ],

        /**
         * no-debugger: ERROR
         *
         * Prevents debugger statements from being left in production code.
         * Debugger statements pause execution in the browser's DevTools,
         * which would cause the application to appear frozen for end users.
         * This should always be an error to prevent accidental deployment.
         */
        'no-debugger': 'error',

        /**
         * no-duplicate-imports: ERROR
         *
         * Prevents importing from the same module multiple times in a single
         * file. Duplicate imports should be combined into a single import
         * statement for clarity and to reduce the number of import lines.
         *
         * Bad:  import { foo } from 'bar'; import { baz } from 'bar';
         * Good: import { foo, baz } from 'bar';
         */
        'no-duplicate-imports': 'error',

        /**
         * prefer-const: ERROR
         *
         * Requires using 'const' for variables that are never reassigned.
         * This makes the code's intent clearer — readers can immediately
         * know that a 'const' variable will never change, while 'let'
         * signals that the variable will be reassigned.
         */
        'prefer-const': 'error',

        /**
         * no-var: ERROR
         *
         * Prevents using 'var' for variable declarations. 'var' has
         * function-scoping behavior that can lead to subtle bugs (e.g.,
         * variable hoisting, scope leaking). 'let' and 'const' have
         * block-scoping behavior that is more predictable and safer.
         */
        'no-var': 'error',

        /**
         * eqeqeq: ERROR
         *
         * Requires using strict equality operators (=== and !==) instead
         * of abstract equality operators (== and !=). Abstract equality
         * performs type coercion, which can lead to unexpected results:
         *
         * '' == false  → true  (unexpected!)
         * 0 == ''      → true  (unexpected!)
         * null == undefined → true (surprising but sometimes useful)
         *
         * The 'smart' option allows == null checks, which is a common
         * pattern for checking both null and undefined at once.
         */
        eqeqeq: ['error', 'smart'],
    },

    /**
     * ==========================================================================
     * Override Configuration
     * ==========================================================================
     *
     * Overrides allow applying different rules to specific files or patterns.
     * This is necessary because different parts of the codebase have different
     * requirements and conventions.
     */
    overrides: [
        /**
         * Electron Main Process Files
         *
         * Files in the electron/ directory run in Node.js and may use
         * require() and other Node.js-specific patterns. We relax some
         * rules that are designed for browser/React code.
         */
        {
            files: ['electron/**/*.ts'],
            rules: {
                'no-console': 'off',
            },
        },

        /**
         * Test Files
         *
         * Test files have different coding conventions. They commonly use
         * any types for mocking, longer functions for test suites, and
         * console statements for debugging failing tests.
         */
        {
            files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
                'no-console': 'off',
            },
        },

        /**
         * Configuration Files
         *
         * Configuration files like vite.config.ts and eslint.config.js use
         * CommonJS modules and may need Node.js-specific patterns.
         */
        {
            files: ['*.config.ts', '*.config.js', '.eslintrc.cjs'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
    ],

    /**
     * ==========================================================================
     * Ignore Patterns
     * ==========================================================================
     *
     * Files and directories that should be excluded from linting. These are
     * typically generated files, build outputs, and third-party code that
     * we don't control.
     */
    ignorePatterns: [
        // Build output directories
        'dist/',
        'dist_electron/',
        'dist-electron/',
        'build/',

        // Dependency directories
        'node_modules/',

        // Generated files
        '*.min.js',
        '*.bundle.js',
        'package-lock.json',

        // Electron settings (plain JS, not TypeScript)
        'electron/settings/renderer.js',
        'electron/settings/platform-utils.js',
        'electron/settings/about.js',
        'electron/settings/shortcuts.js',

        // Backend directory (has its own lint config)
        'backend/',

        // Test coverage output
        'coverage/',

        // Vite cache
        '.vite/',
    ],
};
