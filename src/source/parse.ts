import path from "node:path";
import { parseSync } from "oxc-parser";
import type { SourceLocation } from "../types.js";
import { getLocation } from "../locations.js";
import type { AstNode } from "./ast.js";

export type SourceParseResult =
  | { ok: true; program: AstNode }
  | { ok: false; message: string; location: SourceLocation };

export function parseSourceFile(filePath: string, source: string): SourceParseResult {
  try {
    const result = parseSync(filePath, source, {
      lang: getParserLang(filePath),
      sourceType: "module",
      astType: "ts",
    });

    if (result.errors.length > 0) {
      const firstError = result.errors[0];
      const labelStart = firstError.labels[0]?.start ?? 0;

      return {
        ok: false,
        message: firstError.message,
        location: getLocation(source, labelStart),
      };
    }

    return { ok: true, program: result.program as unknown as AstNode };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      location: { index: 0, line: 1, column: 1 },
    };
  }
}

function getParserLang(filePath: string): "js" | "jsx" | "ts" | "tsx" {
  const extension = path.extname(filePath);

  if (extension === ".jsx") {
    return "jsx";
  }

  if (extension === ".ts") {
    return "ts";
  }

  if (extension === ".tsx") {
    return "tsx";
  }

  return "js";
}
