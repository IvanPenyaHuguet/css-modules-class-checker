import { defineRule } from "@oxlint/plugins";
import type { Context, Rule, RuleOptionsSchema, VisitorWithHooks } from "@oxlint/plugins";
import { defaultMatchFiles } from "@stale-styles/core";
import {
  formatDiagnosticMessage,
  getDiagnostics,
  getReportLocation,
  isVirtualFile
} from "./diagnostics";
import { validateOptions } from "./options";
import { getRuleDescription } from "./rule-descriptions";
import type { PluginDiagnosticCode } from "./types";

const ruleOptionsSchema: RuleOptionsSchema = [
  {
    type: "object",
    description: "Options shared by @stale-styles rules.",
    properties: {
      ignoreClasses: {
        type: "array",
        description:
          "CSS class names to ignore when checking missing or unused CSS Module classes.",
        items: {
          type: "string",
          description: "A CSS class name to ignore."
        }
      },
      ignoreClassPatterns: {
        type: "array",
        description:
          "Regular expression patterns for CSS class names to ignore when checking missing or unused CSS Module classes.",
        items: {
          type: "string",
          description: "A JavaScript regular expression pattern string."
        }
      },
      localsConvention: {
        description: "CSS Modules locals convention used to resolve exported class names.",
        enum: ["camelCase", "camelCaseOnly", "dashes", "dashesOnly"]
      },
      matchFiles: {
        type: "array",
        description:
          "Import source strings or path suffixes that should be treated as CSS Module files.",
        items: {
          type: "string",
          description: "A CSS Module import matcher."
        }
      }
    },
    additionalProperties: false
  }
];

export function createRule(code: PluginDiagnosticCode): Rule {
  return defineRule({
    meta: {
      docs: {
        description: getRuleDescription(code)
      },
      schema: ruleOptionsSchema,
      type: "problem" as const
    },
    createOnce(context: Context): VisitorWithHooks {
      return {
        before() {
          return shouldCheckFile(context);
        },
        Program(node) {
          const optionErrors = validateOptions(context.options?.[0]);

          for (const error of optionErrors) {
            context.report({
              message: error.message,
              node
            });
          }

          if (optionErrors.length > 0) {
            return;
          }

          for (const diagnostic of getDiagnostics(context)) {
            if (diagnostic.code !== code) {
              continue;
            }

            context.report({
              message: formatDiagnosticMessage(diagnostic),
              ...getReportLocation(diagnostic, context, node)
            });
          }
        }
      };
    }
  });
}

function shouldCheckFile(context: Context): boolean {
  const source = context.sourceCode.text;
  const filePath = context.filename;

  if (!source || !filePath || isVirtualFile(filePath) || !source.includes("import")) {
    return false;
  }

  return mightContainCssModuleImport(source, context.options?.[0]);
}

function mightContainCssModuleImport(source: string, rawOptions: unknown): boolean {
  const matchFiles = getMatchFiles(rawOptions);

  return matchFiles.some((matcher) => {
    if (source.includes(matcher)) {
      return true;
    }

    return !canMatchImportSourceTextOnly(matcher);
  });
}

function getMatchFiles(rawOptions: unknown): readonly string[] {
  if (!isPlainObject(rawOptions) || !Array.isArray(rawOptions.matchFiles)) {
    return defaultMatchFiles;
  }

  const matchFiles = rawOptions.matchFiles.filter(
    (matcher): matcher is string => typeof matcher === "string"
  );

  return matchFiles.length > 0 ? matchFiles : defaultMatchFiles;
}

function canMatchImportSourceTextOnly(matcher: string): boolean {
  return matcher.length > 0 && !matcher.includes("/") && !matcher.includes("\\");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
