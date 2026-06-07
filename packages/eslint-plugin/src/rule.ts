import { defineRule } from "@oxlint/plugins";
import type { Context, Rule, RuleOptionsSchema, VisitorWithHooks } from "@oxlint/plugins";
import { sourceMayImportCssModule } from "@stale-styles/core";
import {
  formatDiagnosticMessage,
  getDiagnostics,
  getReportLocation,
  isVirtualFile
} from "./diagnostics";
import { normalizeOptions, validateOptions } from "./options";
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

  return sourceMayImportCssModule(
    source,
    filePath,
    normalizeOptions(context.options?.[0]).matchFiles
  );
}
