import js from "@eslint/js";
import globals from "globals";
import ts from "typescript-eslint";

export default [
  {
    ignores: ["build/**", "dist/**", "src-tauri/**"],
  },
  {
    files: ["src/**/*.{js,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  js.configs.recommended,
  ...ts.configs.recommended,
];
