import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "public/mockServiceWorker.js"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      // Type-aware rules: catch real Promise bugs (forgotten await, async
      // callbacks where void is expected).
      "@typescript-eslint/no-floating-promises": "error",
      // antd handlers (onFinish/onConfirm/onClick on Buttons) routinely
      // accept async functions — skip JSX attribute checks to avoid
      // wrapping every async handler. Still flags non-attribute misuse
      // (e.g. async functions assigned to void-returning store actions).
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],

      // React rules
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-key": "error",
      "react/no-array-index-key": "warn",
      "react/self-closing-comp": "warn",
      "react/jsx-no-target-blank": "error",
      "react/jsx-curly-brace-presence": [
        "warn",
        { props: "never", children: "never" },
      ],
      "react/jsx-max-depth": ["error", { max: 5 }],

      // Code size & complexity guardrails. New code that exceeds these
      // limits should be refactored or, in rare justified cases, given
      // a per-file override below.
      "max-lines": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "error",
        { max: 80, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ["error", { max: 12 }],
      "max-depth": ["error", 4],
      "max-params": ["error", 4],
    },
  },
  // Zustand stores are flat objects whose `create()` callback is one large
  // arrow by design — `max-lines-per-function` is a false positive there.
  // We still enforce file-level size and complexity caps on individual
  // action methods.
  {
    files: ["src/stores/**/*.{ts,tsx}"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
  prettier,
]);
