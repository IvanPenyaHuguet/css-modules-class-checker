import type { CheckSourceFileOptions } from "css-modules-class-checker-core";
import type { PluginRuleOptions } from "./types";

export function normalizeOptions(
  value: unknown
): Omit<CheckSourceFileOptions, "filePath" | "source" | "rules"> {
  if (!isPlainObject(value)) {
    return {};
  }

  const ignoreClasses = [
    ...getStringArray(value.ignoreClasses),
    ...getStringArray(value.ignoreClassPatterns).map((pattern) => new RegExp(pattern))
  ];
  const localsConvention = isLocalsConvention(value.localsConvention)
    ? value.localsConvention
    : undefined;
  const matchFiles = getStringArray(value.matchFiles);

  return {
    ...(ignoreClasses.length > 0 ? { ignoreClasses } : {}),
    ...(localsConvention ? { localsConvention } : {}),
    ...(matchFiles.length > 0 ? { matchFiles } : {})
  };
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isLocalsConvention(value: unknown): value is PluginRuleOptions["localsConvention"] {
  return (
    value === "camelCase" ||
    value === "camelCaseOnly" ||
    value === "dashes" ||
    value === "dashesOnly"
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
