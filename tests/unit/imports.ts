import path from "node:path";
import { describe, expect, it } from "vitest";
import { findCssModuleImports } from "../../src/source/imports.js";
import { parseSourceFile } from "../../src/source/parse.js";

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
});
