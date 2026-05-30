import type { DiagnosticCode, LocalsConvention, RuleLevel, RulesConfig } from "./types.js";

export const defaultIgnores = ["dist", "node_modules"];

export const defaultRules: Record<DiagnosticCode, RuleLevel> = {
  "missing-css-module-class": "error",
  "unused-css-module-class": "error",
  "raw-css-module-class": "error",
  "empty-css-module-selector": "error",
  "unresolved-dynamic-class": "error",
  "css-module-file-not-found": "error",
  "css-parse-error": "error",
  "source-parse-error": "error"
};

export function mergeRules(rules: RulesConfig | undefined): Record<DiagnosticCode, RuleLevel> {
  return { ...defaultRules, ...rules };
}

export function getLocalClassNames(
  className: string,
  filename: string,
  localsConvention: LocalsConvention | undefined
): string[] {
  if (localsConvention === undefined) {
    return [className];
  }

  if (typeof localsConvention === "function") {
    return [localsConvention(className, className, filename)].filter(Boolean);
  }

  const camelCaseName = toCamelCase(className, /[-_]+([a-zA-Z0-9])/g);
  const dashesName = toCamelCase(className, /-+([a-zA-Z0-9])/g);

  if (localsConvention === "camelCase") {
    return uniqueClassNames([className, camelCaseName]);
  }

  if (localsConvention === "camelCaseOnly") {
    return [camelCaseName].filter(Boolean);
  }

  if (localsConvention === "dashes") {
    return uniqueClassNames([className, dashesName]);
  }

  return [dashesName].filter(Boolean);
}

function uniqueClassNames(classNames: string[]): string[] {
  return [...new Set(classNames.filter(Boolean))];
}

function toCamelCase(className: string, pattern: RegExp): string {
  return className.replace(pattern, (_, char: string) => char.toUpperCase());
}
