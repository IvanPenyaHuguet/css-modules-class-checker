import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkCssModules } from "../../src/index.js";

describe("ignoreClasses", () => {
  it("supports regular expressions through the API", async () => {
    const target = path.resolve("tests/uses/ignore-class-regexp/src");
    const result = await checkCssModules({
      target,
      ignoreClasses: [/^external-/],
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.errors).toEqual([]);
  });
});
