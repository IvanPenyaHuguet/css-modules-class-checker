import { createRule } from "./rule";
import type { PluginRules } from "./types";

export const rules: PluginRules = {
  "missing-css-module-class": createRule("missing-css-module-class"),
  "unused-css-module-class": createRule("unused-css-module-class"),
  "raw-css-module-class": createRule("raw-css-module-class"),
  "empty-css-module-selector": createRule("empty-css-module-selector"),
  "unresolved-dynamic-class": createRule("unresolved-dynamic-class"),
  "css-module-file-not-found": createRule("css-module-file-not-found")
};
