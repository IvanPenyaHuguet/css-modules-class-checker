import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "css-modules-class-checker-core": fileURLToPath(
        new URL("./packages/core/src/index.ts", import.meta.url)
      ),
      "css-modules-class-checker": fileURLToPath(
        new URL("./packages/app/src/index.ts", import.meta.url)
      ),
      "eslint-plugin-css-modules-class-checker": fileURLToPath(
        new URL("./packages/eslint-plugin/src/index.ts", import.meta.url)
      )
    }
  },
  test: {
    include: ["packages/*/tests/**/*.ts"],
    exclude: ["**/*.d.ts", "**/fixtures/**"]
  }
});
