import { fileURLToPath } from "node:url";
import { defineConfig } from "oxlint";

const ruleCodes = [
  "missing-css-module-class",
  "unused-css-module-class",
  "raw-css-module-class",
  "empty-css-module-selector",
  "unresolved-dynamic-class",
  "css-module-file-not-found"
];

export default defineConfig({
  env: {
    browser: true
  },
  jsPlugins: [fileURLToPath(new URL("../../../dist/index.js", import.meta.url))],
  rules: Object.fromEntries(ruleCodes.map((code) => [`css-modules-class-checker/${code}`, "error"]))
});
