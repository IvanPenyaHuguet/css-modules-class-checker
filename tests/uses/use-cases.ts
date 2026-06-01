import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkCssModules, type CheckOptions, type CheckResult } from "../../src/index.js";

const usesRoot = path.resolve("tests/uses");

type ExpectedResult = {
  status: CheckResult["status"];
  errors: Array<{
    code: string;
    severity: string;
    filePath: string;
    cssModulePath?: string;
    className?: string;
  }>;
};

describe("use cases", async () => {
  const entries = await readdir(usesRoot, { withFileTypes: true });
  const cases = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const resolverMode of ["auto", "off"] as const) {
    describe(`TypeScript resolver ${resolverMode}`, () => {
      for (const caseName of cases) {
        it(caseName, async () => {
          const caseRoot = path.join(usesRoot, caseName);
          const target = path.join(caseRoot, "src");
          const expected = JSON.parse(
            await readFile(path.join(caseRoot, "expected.json"), "utf8")
          ) as ExpectedResult;
          const options = await readOptions(caseRoot);
          const result = await checkCssModules({
            ...options,
            target,
            typeScriptResolver: resolverMode
          });

          expect(normalizeResult(result, target)).toEqual(expected);
        });
      }
    });
  }
});

async function readOptions(caseRoot: string): Promise<Omit<CheckOptions, "target">> {
  try {
    return JSON.parse(await readFile(path.join(caseRoot, "options.json"), "utf8")) as Omit<
      CheckOptions,
      "target"
    >;
  } catch {
    return {};
  }
}

function normalizeResult(result: CheckResult, target: string): ExpectedResult {
  return {
    status: result.status,
    errors: result.errors.map((error) => ({
      code: error.code,
      severity: error.severity,
      filePath: toRelative(target, error.filePath),
      ...(error.cssModulePath ? { cssModulePath: toRelative(target, error.cssModulePath) } : {}),
      ...(error.className ? { className: error.className } : {})
    }))
  };
}

function toRelative(target: string, filePath: string): string {
  return path.relative(target, filePath).split(path.sep).join("/");
}
