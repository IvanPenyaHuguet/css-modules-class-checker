import { Buffer } from "node:buffer";
import { Features, transform, type Selector } from "lightningcss";
import { getLocation } from "../locations.js";
import type { SourceLocation } from "../types.js";

export type CssClassExtraction =
  | { ok: true; classes: Set<string>; locations: Map<string, SourceLocation> }
  | { ok: false; message: string; line: number; column: number };

export function extractCssClasses(
  source: string,
  filename = "input.module.css"
): CssClassExtraction {
  try {
    const transformed = transform({
      filename,
      code: Buffer.from(source),
      cssModules: { pattern: "[local]" },
      include: Features.Nesting
    });
    const exportedClasses = new Set(Object.keys(transformed.exports ?? {}));
    const classes = getStandaloneClasses(transformed.code, filename, exportedClasses);
    const locations = getClassLocations(source);

    return { ok: true, classes, locations };
  } catch (error) {
    const loc = getErrorLocation(error);

    return {
      ok: false,
      message: getErrorMessage(error),
      line: loc.line,
      column: loc.column
    };
  }
}

function getStandaloneClasses(
  code: Uint8Array,
  filename: string,
  exportedClasses: Set<string>
): Set<string> {
  const classes = new Set<string>();

  transform({
    filename,
    code,
    visitor: {
      Rule: {
        style(rule) {
          collectStandaloneClasses(rule.value.selectors, exportedClasses, classes);
        }
      }
    }
  });

  return classes;
}

function collectStandaloneClasses(
  selectorList: Selector[],
  exportedClasses: Set<string>,
  classes: Set<string>
): void {
  for (const selector of selectorList) {
    let compoundClasses: string[] = [];

    for (const component of selector) {
      if (component.type === "combinator") {
        addStandaloneCompoundClasses(compoundClasses, classes);
        compoundClasses = [];
        continue;
      }

      if (component.type === "class" && exportedClasses.has(component.name)) {
        compoundClasses.push(component.name);
      }
    }

    addStandaloneCompoundClasses(compoundClasses, classes);
  }
}

function addStandaloneCompoundClasses(compoundClasses: string[], classes: Set<string>): void {
  if (compoundClasses.length === 1) {
    classes.add(compoundClasses[0]);
  }
}

function getClassLocations(source: string): Map<string, SourceLocation> {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    " ".repeat(comment.length)
  );
  const locations = new Map<string, SourceLocation>();
  const classPattern = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g;

  for (const match of withoutComments.matchAll(classPattern)) {
    const className = match[1];

    if (!locations.has(className)) {
      locations.set(className, getLocation(source, match.index + 1));
    }
  }

  return locations;
}

function getErrorLocation(error: unknown): { line: number; column: number } {
  if (
    typeof error === "object" &&
    error !== null &&
    "loc" in error &&
    typeof error.loc === "object" &&
    error.loc !== null &&
    "line" in error.loc &&
    "column" in error.loc &&
    typeof error.loc.line === "number" &&
    typeof error.loc.column === "number"
  ) {
    return { line: error.loc.line, column: error.loc.column };
  }

  return { line: 1, column: 1 };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `CSS parse error: ${error.message}`;
  }

  return "CSS parse error.";
}
