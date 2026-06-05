import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkCssModules } from "../../src/index";

describe("target files", () => {
  it("checks a single source file target", async () => {
    const targetRoot = await mkdtemp(path.join(os.tmpdir(), "stale-styles-target-file-"));
    const sourceFile = path.join(targetRoot, "button.tsx");

    await writeFile(
      sourceFile,
      [
        'import styles from "./button.module.css";',
        "",
        "export function Button() {",
        "  return <button className={styles.root} />;",
        "}",
        ""
      ].join("\n")
    );
    await writeFile(
      path.join(targetRoot, "button.module.css"),
      ".root { display: inline-flex; }\n"
    );
    await writeFile(
      path.join(targetRoot, "other.tsx"),
      'import styles from "./other.module.css"; styles.missing;\n'
    );
    await writeFile(path.join(targetRoot, "other.module.css"), ".root { color: red; }\n");

    const result = await checkCssModules({ target: sourceFile });

    expect(result).toMatchObject({
      status: "SUCCESS",
      filesChecked: 1,
      cssModulesChecked: 1,
      errors: []
    });
  });
});
