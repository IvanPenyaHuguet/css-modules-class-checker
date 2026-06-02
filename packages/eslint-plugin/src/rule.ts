import type { Context, Rule, VisitorWithHooks } from "@oxlint/plugins";
import { formatDiagnosticMessage, getDiagnostics, getReportLocation } from "./diagnostics";
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
