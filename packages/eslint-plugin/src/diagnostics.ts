import type { Context, VisitorWithHooks } from "@oxlint/plugins";
import { checkCssModuleSourceFileSync, type Diagnostic } from "@stale-styles/core";
import { checkerRulesForPlugin } from "./constants";
import { normalizeOptions } from "./options";

type SourceCode = Context["sourceCode"];

const analysisCache = new WeakMap<SourceCode, Map<string, Diagnostic[]>>();

export function getDiagnostics(context: Context): Diagnostic[] {
  const sourceCode = context.sourceCode;
  const source = sourceCode.text;
  const filePath = context.filename;

  if (!source || !filePath || isVirtualFile(filePath)) {
    return [];
  }

  const rawOptions = context.options?.[0] ?? {};
  const cacheKey = JSON.stringify([filePath, rawOptions]);
  const sourceCache = getSourceCache(sourceCode);
  const cached = sourceCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const options = normalizeOptions(rawOptions);
  const result = checkCssModuleSourceFileSync({
    ...options,
    filePath,
    source,
    rules: checkerRulesForPlugin
  });

  sourceCache.set(cacheKey, result.errors);
  return result.errors;
}

function getSourceCache(sourceCode: SourceCode): Map<string, Diagnostic[]> {
  const cached = analysisCache.get(sourceCode);

  if (cached) {
    return cached;
  }

  const sourceCache = new Map<string, Diagnostic[]>();
  analysisCache.set(sourceCode, sourceCache);
  return sourceCache;
}

export function formatDiagnosticMessage(diagnostic: Diagnostic): string {
  const location = `${diagnostic.line}:${diagnostic.column}`;
  const className = diagnostic.className ? ` (${diagnostic.className})` : "";
  return `${diagnostic.message} [${diagnostic.code}${className} at ${location}]`;
}

export function getReportLocation(
  diagnostic: Diagnostic,
  context: Context,
  node: Parameters<NonNullable<VisitorWithHooks["Program"]>>[0]
): { node: typeof node } | { loc: { line: number; column: number } } {
  if (
    diagnostic.code === "unused-css-module-class" ||
    diagnostic.code === "empty-css-module-selector" ||
    diagnostic.filePath !== context.filename
  ) {
    return { node };
  }

  return {
    loc: {
      line: diagnostic.line,
      column: Math.max(0, diagnostic.column - 1)
    }
  };
}

export function isVirtualFile(filePath: string): boolean {
  return filePath === "<input>" || filePath.startsWith("<") || filePath.includes("node_modules");
}
