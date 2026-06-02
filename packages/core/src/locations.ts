import type { SourceLocation } from "./types";

export function getLocation(source: string, index: number): SourceLocation {
  const before = source.slice(0, index);
  const lines = before.split(/\r\n|\n|\r/);

  return {
    index,
    line: lines.length,
    column: lines.at(-1)!.length + 1
  };
}
