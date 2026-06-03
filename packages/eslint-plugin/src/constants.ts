import type { DiagnosticCode, RulesConfig } from "@stale-styles/core";

export const pluginName = "@stale-styles";

export const diagnosticCodes = [
  "missing-css-module-class",
  "unused-css-module-class",
  "raw-css-module-class",
  "empty-css-module-selector",
  "unresolved-dynamic-class",
  "css-module-file-not-found"
] as const satisfies readonly DiagnosticCode[];

export const checkerRulesForPlugin = {
  "missing-css-module-class": "error",
  "unused-css-module-class": "error",
  "raw-css-module-class": "error",
  "empty-css-module-selector": "error",
  "unresolved-dynamic-class": "error",
  "css-module-file-not-found": "error",
  "css-parse-error": "off",
  "source-parse-error": "off"
} satisfies RulesConfig;
