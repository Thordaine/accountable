import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{js,ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      jsxA11y.configs.recommended,
    ],
    languageOptions: { globals: globals.browser },
    rules: { complexity: ["error", 15] },
  },
]);
