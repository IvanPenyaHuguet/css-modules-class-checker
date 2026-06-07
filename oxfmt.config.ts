import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [
    "dist",
    "node_modules",
    "packages/core/tests/uses/css-module-file-not-found-offset/src/button.tsx",
    "packages/core/tests/uses/ignore-source-parse-error-without-css-module-import/src/vite-env.d.ts",
    "packages/core/tests/uses/off-css-parse-error/src/button.module.css",
    "packages/core/tests/uses/off-source-parse-error/src/button.tsx",
    "packages/core/tests/uses/warn-css-parse-error/src/button.module.css",
    "packages/core/tests/uses/warn-source-parse-error/src/broken-css-module-import.tsx",
    "packages/core/tests/uses/warn-source-parse-error/src/button.tsx"
  ],
  printWidth: 100,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "none"
});
