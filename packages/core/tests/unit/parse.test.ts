import { afterEach, describe, expect, it, vi } from "vitest";

describe("parseSourceFile", () => {
  afterEach(() => {
    vi.doUnmock("oxc-parser");
    vi.resetModules();
  });

  it("returns a source parse error when the parser reports syntax errors", async () => {
    const { parseSourceFile } = await import("../../src/source/parse");

    const result = parseSourceFile(
      "button.tsx",
      [
        'import styles from "./button.module.css";',
        "",
        "export function Button() {",
        "  return <button className={styles.root}>",
        "}"
      ].join("\n")
    );

    expect(result).toMatchObject({
      ok: false,
      location: {
        line: expect.any(Number),
        column: expect.any(Number)
      }
    });
  });

  it("returns a safe error when the parser does not return a program AST", async () => {
    vi.doMock("oxc-parser", () => ({
      parseSync: () => ({
        errors: [],
        program: undefined
      })
    }));

    const { parseSourceFile } = await import("../../src/source/parse");

    expect(parseSourceFile("button.tsx", "export const ok = true;")).toEqual({
      ok: false,
      message: "Parser did not return a valid program AST.",
      location: { index: 0, line: 1, column: 1 }
    });
  });

  it("falls back to the start of the file when parser errors have no labels", async () => {
    vi.doMock("oxc-parser", () => ({
      parseSync: () => ({
        errors: [{ message: "Unexpected token", labels: [] }],
        program: { type: "Program" }
      })
    }));

    const { parseSourceFile } = await import("../../src/source/parse");

    expect(parseSourceFile("button.tsx", "export const ok = true;")).toEqual({
      ok: false,
      message: "Unexpected token",
      location: { index: 0, line: 1, column: 1 }
    });
  });

  it("stringifies non-Error parser throws", async () => {
    vi.doMock("oxc-parser", () => ({
      parseSync: () => {
        throw "native parser unavailable";
      }
    }));

    const { parseSourceFile } = await import("../../src/source/parse");

    expect(parseSourceFile("button.tsx", "export const ok = true;")).toEqual({
      ok: false,
      message: "native parser unavailable",
      location: { index: 0, line: 1, column: 1 }
    });
  });

  it("returns a safe error when the parser throws", async () => {
    vi.doMock("oxc-parser", () => ({
      parseSync: () => {
        throw new Error("native parser unavailable");
      }
    }));

    const { parseSourceFile } = await import("../../src/source/parse");

    expect(parseSourceFile("button.tsx", "export const ok = true;")).toEqual({
      ok: false,
      message: "native parser unavailable",
      location: { index: 0, line: 1, column: 1 }
    });
  });
});
