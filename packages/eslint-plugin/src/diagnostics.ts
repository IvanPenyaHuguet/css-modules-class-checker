import type { Context, VisitorWithHooks } from "@oxlint/plugins";
import { checkCssModuleSourceFileSync, type Diagnostic } from "css-modules-class-checker-core";
import { checkerRulesForPlugin } from "./constants";
import { normalizeOptions } from "./options";

const analysisCache = new Map<string, Diagnostic[]>();

export function getDiagnostics(context: Context): Diagnostic[] {
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
    rules: checkerRulesForPlugin
  });

  analysisCache.set(cacheKey, result.errors);
  return result.errors;
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
  if (diagnostic.code === "css-module-file-not-found") {
    return {
      loc: getMissingImportLocation(diagnostic, context.sourceCode.text)
    };
  }

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

function getMissingImportLocation(
  diagnostic: Diagnostic,
  source: string
): { line: number; column: number } {
  const importPath = /CSS Module file not found: (?<importPath>.+)\./.exec(diagnostic.message)
    ?.groups?.importPath;

  if (!importPath) {
    return { line: diagnostic.line, column: Math.max(0, diagnostic.column - 1) };
  }

  const importIndex = source.indexOf(importPath);

  if (importIndex === -1) {
    return { line: diagnostic.line, column: Math.max(0, diagnostic.column - 1) };
  }

  const beforeImport = source.slice(0, importIndex);
  const lines = beforeImport.split(/\r\n|\r|\n/);

  return {
    line: lines.length,
    column: Math.max(0, lines.at(-1)?.length ?? 0)
  };
}

export function isVirtualFile(filePath: string): boolean {
  return filePath === "<input>" || filePath.startsWith("<") || filePath.includes("node_modules");
}
