import type { Context, Rule, VisitorWithHooks } from "@oxlint/plugins";
import { defaultMatchFiles } from "css-modules-class-checker-core";
import {
  formatDiagnosticMessage,
  getDiagnostics,
  getReportLocation,
  isVirtualFile
} from "./diagnostics";
import { getRuleDescription } from "./rule-descriptions";
import type { PluginDiagnosticCode } from "./types";

export function createRule(code: PluginDiagnosticCode): Rule {
  return {
    meta: {
      docs: {
        description: getRuleDescription(code)
      },
      schema: [
        {
          type: "object",
          properties: {
            ignoreClasses: {
              type: "array",
              items: { type: "string" }
            },
            ignoreClassPatterns: {
              type: "array",
              items: { type: "string" }
            },
            localsConvention: {
              enum: ["camelCase", "camelCaseOnly", "dashes", "dashesOnly"]
            },
            matchFiles: {
              type: "array",
              items: { type: "string" }
            }
          },
          additionalProperties: false
        }
      ],
      type: "problem" as const
    },
    createOnce(context: Context): VisitorWithHooks {
      return {
        before() {
          return shouldCheckFile(context);
        },
        Program(node) {
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
  };
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
