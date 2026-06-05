import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@stale-styles/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
      "@stale-styles/css-modules": fileURLToPath(
        new URL("./packages/css-modules-app/src/index.ts", import.meta.url)
      ),
      "@stale-styles/eslint-plugin": fileURLToPath(
        new URL("./packages/eslint-plugin/src/index.ts", import.meta.url)
      ),
      "@stale-styles/eslint-plugin/css-modules": fileURLToPath(
        new URL("./packages/eslint-plugin/src/css-modules.ts", import.meta.url)
      )
    }
  },
  test: {
    include: [
      "packages/*/tests/unit/**/*.test.ts",
      "packages/*/tests/uses/**/*.test.ts",
      "packages/*/tests/fixtures/**/*.test.ts"
    ],
    exclude: ["**/*.d.ts"]
  }
});
