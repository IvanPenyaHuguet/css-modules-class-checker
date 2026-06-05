import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@stale-styles/core": fileURLToPath(
        new URL("./packages/core/src/index.ts", import.meta.url),
      ),
      "@stale-styles/css-modules": fileURLToPath(
        new URL("./packages/css-modules-app/src/index.ts", import.meta.url),
      ),
      "@stale-styles/eslint-plugin": fileURLToPath(
        new URL("./packages/eslint-plugin/src/index.ts", import.meta.url),
      ),
      "@stale-styles/eslint-plugin/css-modules": fileURLToPath(
        new URL("./packages/eslint-plugin/src/css-modules.ts", import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "core",
          include: ["packages/core/tests/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "css-modules-app",
          include: ["packages/css-modules-app/tests/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "cli",
          include: ["packages/cli/tests/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "eslint-plugin",
          globalSetup: ["packages/eslint-plugin/tests/global-setup.ts"],
          include: ["packages/eslint-plugin/tests/**/*.test.ts"],
        },
      },
    ],
    exclude: ["**/*.d.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.d.ts", "**/dist/**", "**/*.config.ts"],
      reportsDirectory: "coverage",
      reporter: ["text", "json", "lcovonly", "html"],
    },
  },
});
