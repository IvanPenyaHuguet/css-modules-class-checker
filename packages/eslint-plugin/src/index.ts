import {
  eslintCompatPlugin,
  type Context,
  type Rule,
  type VisitorWithHooks
} from "@oxlint/plugins";
import {
  checkCssModuleSourceFileSync,
  type CheckSourceFileOptions,
  type Diagnostic,
  type DiagnosticCode,
  type LocalsConvention,
  type RulesConfig
} from "css-modules-class-checker-core";

const diagnosticCodes = [
  "missing-css-module-class",
  "unused-css-module-class",
  "raw-css-module-class",
  "empty-css-module-selector",
  "unresolved-dynamic-class",
  "css-module-file-not-found",
  "css-parse-error",
  "source-parse-error"
] as const satisfies readonly DiagnosticCode[];

const allRulesEnabled = Object.fromEntries(
  diagnosticCodes.map((code) => [code, "error"])
) as RulesConfig;

type PluginRuleOptions = {
  ignoreClasses?: string[];
  ignoreClassPatterns?: string[];
  localsConvention?: Extract<LocalsConvention, string>;
  matchFiles?: string[];
};

const analysisCache = new Map<string, Diagnostic[]>();

const rules = Object.fromEntries(diagnosticCodes.map((code) => [code, createRule(code)])) as Record<
  DiagnosticCode,
  Rule
>;

const plugin = eslintCompatPlugin({
  meta: {
    name: "css-modules-class-checker"
  },
  rules
});

export const configs = {
  recommended: {
    plugins: {
      "css-modules-class-checker": plugin
    },
    rules: Object.fromEntries(
      diagnosticCodes.map((code) => [`css-modules-class-checker/${code}`, "error"])
    )
  }
};

Object.assign(plugin, { configs });

export { rules };
export default plugin;

function createRule(code: DiagnosticCode): Rule {
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
              node
            });
          }
        }
      };
    }
  };
}

function getDiagnostics(context: Context): Diagnostic[] {
  const source = context.sourceCode.text;
  const filePath = context.filename;

  if (!source || !filePath || isVirtualFile(filePath)) {
    return [];
  }

  const rawOptions = context.options?.[0] ?? {};
  const cacheKey = JSON.stringify([filePath, source, rawOptions]);
  const cached = analysisCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const options = normalizeOptions(rawOptions);
  const result = checkCssModuleSourceFileSync({
    ...options,
    filePath,
    source,
    rules: allRulesEnabled
  });

  analysisCache.set(cacheKey, result.errors);
  return result.errors;
}

function normalizeOptions(
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

function formatDiagnosticMessage(diagnostic: Diagnostic): string {
  const location = `${diagnostic.line}:${diagnostic.column}`;
  const className = diagnostic.className ? ` (${diagnostic.className})` : "";
  return `${diagnostic.message} [${diagnostic.code}${className} at ${location}]`;
}

function getRuleDescription(code: DiagnosticCode): string {
  switch (code) {
    case "missing-css-module-class":
      return "disallow CSS Module class usages that are not defined in the imported CSS file";
    case "unused-css-module-class":
      return "disallow CSS Module classes that are not used by the source file";
    case "raw-css-module-class":
      return "disallow using imported CSS Module classes as raw class strings";
    case "empty-css-module-selector":
      return "disallow CSS Module classes defined by empty selectors";
    case "unresolved-dynamic-class":
      return "disallow dynamic CSS Module class accesses that cannot be resolved statically";
    case "css-module-file-not-found":
      return "disallow imports of missing CSS Module files";
    case "css-parse-error":
      return "report CSS Module parse errors";
    case "source-parse-error":
      return "report source parse errors";
  }
}

function isVirtualFile(filePath: string): boolean {
  return filePath === "<input>" || filePath.startsWith("<") || filePath.includes("node_modules");
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
