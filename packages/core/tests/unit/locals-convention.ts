import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getLocalClassNames } from "../../src/config";
import { checkCssModules } from "../../src/index";

describe("localsConvention", () => {
  it("keeps original class names when no convention is configured", () => {
    expect(getLocalClassNames("primary_button", "button.module.css", undefined)).toEqual([
      "primary_button"
    ]);
    expect(getLocalClassNames("is-active", "button.module.css", undefined)).toEqual(["is-active"]);
  });

  it("adds camel-cased names for camelCase while preserving originals", () => {
    expect(getLocalClassNames("primary_button", "button.module.css", "camelCase")).toEqual([
      "primary_button",
      "primaryButton"
    ]);
    expect(getLocalClassNames("is-active", "button.module.css", "camelCase")).toEqual([
      "is-active",
      "isActive"
    ]);
  });

  it("uses only camel-cased names for camelCaseOnly", () => {
    expect(getLocalClassNames("primary_button", "button.module.css", "camelCaseOnly")).toEqual([
      "primaryButton"
    ]);
    expect(getLocalClassNames("is-active", "button.module.css", "camelCaseOnly")).toEqual([
      "isActive"
    ]);
  });

  it("camel-cases only dashes for dashes conventions", () => {
    expect(getLocalClassNames("primary_button", "button.module.css", "dashes")).toEqual([
      "primary_button"
    ]);
    expect(getLocalClassNames("is-active", "button.module.css", "dashes")).toEqual([
      "is-active",
      "isActive"
    ]);
    expect(getLocalClassNames("is-active", "button.module.css", "dashesOnly")).toEqual([
      "isActive"
    ]);
  });

  it("supports a custom Vite-style transform function through the API", async () => {
    const target = await mkdtemp(path.join(tmpdir(), "css-modules-class-checker-"));

    await writeFile(
      path.join(target, "button.module.css"),
      `
        .primary_button {
          color: red;
        }
      `
    );
    await writeFile(
      path.join(target, "button.tsx"),
      `
        import styles from "./button.module.css";

        export function Button() {
          return <button className={styles.$primary_button} />;
        }
      `
    );

    const result = await checkCssModules({
      target,
      localsConvention: (originalClassName, generatedClassName, inputFile) => {
        expect(originalClassName).toBe("primary_button");
        expect(generatedClassName).toBe("primary_button");
        expect(inputFile.endsWith("button.module.css")).toBe(true);

        return `$${originalClassName}`;
      }
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.errors).toEqual([]);
  });
});
