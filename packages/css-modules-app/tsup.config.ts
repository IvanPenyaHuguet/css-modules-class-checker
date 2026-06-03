import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "./src/index.ts"
  },
  outDir: "dist",
  format: ["esm"],
  dts: true,
  clean: true,
  platform: "node",
  target: "es2022",
  skipNodeModulesBundle: true,
  noExternal: ["@stale-styles/core"],
  tsconfig: "tsconfig.json"
});
