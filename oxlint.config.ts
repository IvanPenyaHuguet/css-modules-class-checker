import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    suspicious: "error"
  },
  env: {
    builtin: true,
    node: true,
    vitest: true
  },
  ignorePatterns: ["dist", "node_modules", "packages/core/tests/uses/**/src/**"],
  options: {
    typeAware: true
  },
  plugins: ["eslint", "typescript", "oxc", "import", "node", "vitest"],
  overrides: [
    {
      files: ["tests/uses/use-cases.ts"],
      rules: {
        "typescript/no-unsafe-type-assertion": "off",
        "vitest/valid-title": "off"
      }
    }
  ]
});
