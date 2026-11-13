// ESLint flat config. Forbidden dependencies: docs/architecture.md (rules added in plan 0001/2).
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "dist/",
      "coverage/",
      "adapters/",
      "docs/",
      "prompts/",
      "specs/",
      "workflows/",
      "scripts/",
      ".anew-dev/",
      ".claude/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ["*.config.{js,ts}", "tools/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
);
