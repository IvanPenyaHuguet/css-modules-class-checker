import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const fixtureRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(fixtureRoot, "../../..");

describe("oxlint plugin fixture", () => {
  it("honors eslint-disable-next-line without hiding later diagnostics", () => {
    const output = runOxlintExpectingFailure([
      "-c",
      path.join(fixtureRoot, "oxlint.config.ts"),
      path.join(fixtureRoot, "mixed-errors")
    ]);

    expect(output).toContain('Class "reportedMissing" is not defined');
    expect(output).not.toContain('Class "disabledMissing" is not defined');
    expect(output).toContain('CSS Module class "reportedRaw" is used as a raw class string');
    expect(output).not.toContain('CSS Module class "disabledRaw" is used as a raw class string');
    expect(output).toContain("Cannot statically resolve dynamic class access on styles");
    expect(output).toContain("CSS Module file not found: ./reported-missing.module.css.");
    expect(output).not.toContain("CSS Module file not found: ./disabled-missing.module.css.");
  });
});

function runOxlintExpectingFailure(args: string[]): string {
  const result = spawnSync(process.execPath, [getOxlintBinPath(), ...args], {
    cwd: packageRoot,
    encoding: "utf8"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    return `${result.stdout ?? ""}${result.stderr ?? ""}`;
  }

  throw new Error("Expected oxlint to report diagnostics.");
}

function getOxlintBinPath(): string {
  return path.resolve(packageRoot, "../../node_modules/oxlint/bin/oxlint");
}
