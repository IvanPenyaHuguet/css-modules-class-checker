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
  ignorePatterns: [
    "dist",
    "node_modules",
    "packages/core/tests/uses/**/src/**",
    "tests/uses/**/src/**",
    "packages/eslint-plugin/tests/fixtures/oxlint-plugin/mixed-errors/**",
    "packages/eslint-plugin/tests/fixtures/oxlint-plugin/rules-off/**",
    "tests/fixtures/oxlint-plugin/mixed-errors/**",
    "tests/fixtures/oxlint-plugin/rules-off/**",
    "**/tests/fixtures/oxlint-plugin/mixed-errors/**",
    "**/tests/fixtures/oxlint-plugin/rules-off/**"
  ],
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
