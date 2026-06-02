import type { DiagnosticCode, RulesConfig } from "css-modules-class-checker-core";

export const pluginName = "css-modules-class-checker";

export const diagnosticCodes = [
  "missing-css-module-class",
  "unused-css-module-class",
  "raw-css-module-class",
  "empty-css-module-selector",
  "unresolved-dynamic-class",
  "css-module-file-not-found"
] as const satisfies readonly DiagnosticCode[];

export const checkerRulesForPlugin = Object.fromEntries([
  ...diagnosticCodes.map((code) => [code, "error"] as const),
  ["css-parse-error", "off"] as const,
  ["source-parse-error", "off"] as const
]) as RulesConfig;
