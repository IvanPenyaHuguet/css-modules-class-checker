import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkCssModules } from "../../src/index";

describe("public API", () => {
  it("checks a valid CSS Modules target", async () => {
    const target = await mkdtemp(path.join(os.tmpdir(), "stale-styles-css-modules-app-"));

    await writeFile(
      path.join(target, "button.tsx"),
      [
        'import styles from "./button.module.css";',
        "",
        "export function Button() {",
        "  return <button className={styles.root}>Save</button>;",
        "}"
      ].join("\n")
    );
    await writeFile(path.join(target, "button.module.css"), ".root { display: inline-flex; }\n");

    await expect(checkCssModules({ target })).resolves.toMatchObject({
      status: "SUCCESS",
      errors: []
    });
  });
});
