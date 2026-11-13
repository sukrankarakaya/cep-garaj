import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Test selectors (docs/testing.md, Two speeds rule 4): one filter, inverted.
// unit = every *.test.ts(x) except *.int.test.ts · int = only *.int.test.ts
const INT = "**/*.int.test.ts";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}", "tools/**/*.test.ts"],
          exclude: [INT, "**/node_modules/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "int",
          environment: "node",
          include: [`src/${INT}`],
        },
      },
    ],
  },
});
