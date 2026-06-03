import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkCssModules } from "../../src/index";

const testRoot = path.dirname(fileURLToPath(import.meta.url));

describe("ignoreClasses", () => {
  it("supports regular expressions through the API", async () => {
    const target = path.resolve(testRoot, "../uses/ignore-class-regexp/src");
    const result = await checkCssModules({
      target,
      ignoreClasses: [/^external-/]
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.errors).toEqual([]);
  });
});
