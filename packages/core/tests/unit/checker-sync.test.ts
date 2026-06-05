import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkCssModuleSourceFileSync } from "../../src/index";

describe("checkCssModuleSourceFileSync", () => {
  it("returns success for source files without CSS Module imports", () => {
    const result = checkCssModuleSourceFileSync({
      filePath: path.resolve("button.ts"),
      source: "export const button = 'plain';\n"
    });

    expect(result).toMatchObject({
      status: "SUCCESS",
      filesChecked: 1,
      cssModulesChecked: 0,
      errors: []
    });
  });

  it("reports source parse errors", () => {
    const result = checkCssModuleSourceFileSync({
      filePath: path.resolve("button.tsx"),
      source: "export function Button("
    });

    expect(result).toMatchObject({
      status: "FAIL",
      errors: [
        expect.objectContaining({
          code: "source-parse-error",
          filePath: path.resolve("button.tsx")
        })
      ]
    });
  });

  it("reports CSS parse errors from imported modules", () => {
    const targetRoot = mkdtempSync(path.join(os.tmpdir(), "stale-styles-sync-"));
    const filePath = path.join(targetRoot, "button.tsx");
    const cssPath = path.join(targetRoot, "button.module.css");

    writeFileSync(cssPath, ".root { color: red; }\n}\n", "utf8");

    const result = checkCssModuleSourceFileSync({
      filePath,
      source: 'import styles from "./button.module.css"; styles.root;\n'
    });

    expect(result).toMatchObject({
      status: "FAIL",
      errors: [
        expect.objectContaining({
          code: "css-parse-error",
          filePath: cssPath,
          cssModulePath: cssPath
        })
      ]
    });
  });

  it("does not report ignored empty selectors", () => {
    const targetRoot = mkdtempSync(path.join(os.tmpdir(), "stale-styles-sync-"));
    const filePath = path.join(targetRoot, "button.tsx");

    writeFileSync(
      path.join(targetRoot, "button.module.css"),
      ".root { color: red; }\n.empty {}\n",
      "utf8"
    );

    const result = checkCssModuleSourceFileSync({
      filePath,
      source: 'import styles from "./button.module.css"; styles.root;\n',
      ignoreClasses: ["empty"]
    });

    expect(result).toMatchObject({
      status: "SUCCESS",
      errors: []
    });
  });
});
