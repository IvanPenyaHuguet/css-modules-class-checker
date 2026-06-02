import path from "node:path";
import { describe, expect, it } from "vitest";
import { findCssModuleImports } from "../../src/source/imports";
import { parseSourceFile } from "../../src/source/parse";

describe("CSS Module import extraction", () => {
  it("finds named CSS Module imports and aliases", () => {
    const source = `
      import styles, { primary, secondary as danger } from "./button.module.css";
    `;
    const filePath = path.resolve("/project/button.tsx");
    const parsed = parseSourceFile(filePath, source);

    if (!parsed.ok) {
      throw new Error(parsed.message);
    }

    expect(findCssModuleImports(parsed.program, filePath)).toEqual([
      {
        localName: "styles",
        namedImports: [
          { importedName: "primary", localName: "primary", index: expect.any(Number) },
          { importedName: "secondary", localName: "danger", index: expect.any(Number) }
        ],
        importPath: "./button.module.css",
        cssModulePath: path.resolve("/project/button.module.css"),
        index: expect.any(Number)
      }
    ]);
  });

  it("finds imports matched by custom string suffixes", () => {
    const source = `
      import styles from "./button.icss";
    `;
    const filePath = path.resolve("/project/button.tsx");
    const parsed = parseSourceFile(filePath, source);

    if (!parsed.ok) {
      throw new Error(parsed.message);
    }

    expect(findCssModuleImports(parsed.program, filePath, [".icss"])).toEqual([
      {
        localName: "styles",
        namedImports: [],
        importPath: "./button.icss",
        cssModulePath: path.resolve("/project/button.icss"),
        index: expect.any(Number)
      }
    ]);
  });

  it("finds imports matched by custom regular expressions", () => {
    const source = `
      import styles from "./button.css";
    `;
    const filePath = path.resolve("/project/button.tsx");
    const parsed = parseSourceFile(filePath, source);

    if (!parsed.ok) {
      throw new Error(parsed.message);
    }

    expect(findCssModuleImports(parsed.program, filePath, [/button\.css$/])).toEqual([
      {
        localName: "styles",
        namedImports: [],
        importPath: "./button.css",
        cssModulePath: path.resolve("/project/button.css"),
        index: expect.any(Number)
      }
    ]);
  });
});
