import type { DiagnosticCode, RuleLevel, RulesConfig } from "./types.js";

export const defaultIgnores = ["dist", "node_modules"];

export const defaultRules: Record<DiagnosticCode, RuleLevel> = {
  "missing-css-module-class": "error",
  "unused-css-module-class": "error",
  "raw-css-module-class": "error",
  "unresolved-dynamic-class": "error",
  "css-module-file-not-found": "error",
  "css-parse-error": "error",
  "source-parse-error": "error"
};

export function mergeRules(rules: RulesConfig | undefined): Record<DiagnosticCode, RuleLevel> {
  return { ...defaultRules, ...rules };
}
