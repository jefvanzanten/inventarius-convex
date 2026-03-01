import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

export default [
  {
    ignores: [".svelte-kit/**", "build/**", "dist/**", "src-tauri/**"],
  },
  {
    files: ["src/**/*.{js,ts,svelte}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
];
