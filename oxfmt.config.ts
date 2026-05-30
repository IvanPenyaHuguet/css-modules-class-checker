import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: ["dist", "node_modules"],
  printWidth: 100,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "none"
});
