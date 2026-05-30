import { getLocation } from "../locations.js";
import type { SourceLocation } from "../types.js";

export type CssClassExtraction =
  | { ok: true; classes: Set<string>; locations: Map<string, SourceLocation> }
  | { ok: false; message: string; line: number; column: number };

export function extractCssClasses(source: string): CssClassExtraction {
  const balance = getBraceBalance(source);

  if (balance !== 0) {
    return {
      ok: false,
      message: "CSS parse error: unmatched braces.",
      line: 1,
      column: 1
    };
  }

  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    " ".repeat(comment.length)
  );
  const classes = new Set<string>();
  const locations = new Map<string, SourceLocation>();
  const classPattern = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g;

  for (const match of withoutComments.matchAll(classPattern)) {
    const className = match[1];

    classes.add(className);

    if (!locations.has(className)) {
      locations.set(className, getLocation(source, match.index + 1));
    }
  }

  return { ok: true, classes, locations };
}

function getBraceBalance(source: string): number {
  let balance = 0;

  for (const character of source) {
    if (character === "{") {
      balance += 1;
    }

    if (character === "}") {
      balance -= 1;
    }

    if (balance < 0) {
      return balance;
    }
  }

  return balance;
}
