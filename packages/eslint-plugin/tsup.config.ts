import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "./src/index.ts"
  },
  outDir: "dist",
  format: ["esm"],
  dts: {
    resolve: ["css-modules-class-checker-core"]
  },
  clean: true,
  platform: "node",
  target: "es2022",
  skipNodeModulesBundle: true,
  noExternal: ["css-modules-class-checker-core"],
  tsconfig: "tsconfig.json"
});
