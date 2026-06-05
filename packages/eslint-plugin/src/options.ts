import type { CheckSourceFileOptions } from "@stale-styles/core";
import type { PluginRuleOptions } from "./types";

export type OptionValidationError = {
  message: string;
};

export function normalizeOptions(
  value: unknown
): Omit<CheckSourceFileOptions, "filePath" | "source" | "rules"> {
  if (!isPlainObject(value)) {
    return {};
  }

  const ignoreClasses = [
    ...getStringArray(value.ignoreClasses),
    ...compileIgnoreClassPatterns(value.ignoreClassPatterns).patterns
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

export function validateOptions(value: unknown): OptionValidationError[] {
  if (!isPlainObject(value)) {
    return [];
  }

  return compileIgnoreClassPatterns(value.ignoreClassPatterns).errors;
}

function compileIgnoreClassPatterns(value: unknown): {
  patterns: RegExp[];
  errors: OptionValidationError[];
} {
  const patterns: RegExp[] = [];
  const errors: OptionValidationError[] = [];

  for (const pattern of getStringArray(value)) {
    try {
      patterns.push(new RegExp(pattern));
    } catch (error) {
      errors.push({
        message: `Invalid ignoreClassPatterns pattern ${JSON.stringify(
          pattern
        )}: ${getErrorMessage(error)}.`
      });
    }
  }

  return { patterns, errors };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
