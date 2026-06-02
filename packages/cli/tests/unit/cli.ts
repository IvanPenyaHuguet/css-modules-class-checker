import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../../src/cli";

const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => {
  logSpy.mockClear();
  errorSpy.mockClear();
});

describe("runCli", () => {
  it("returns success for a valid target", async () => {
    const target = await createFixture();

    await expect(runCli(["node", "css-modules-class-checker-cli", target])).resolves.toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("CSS Modules check passed."));
  });

  it("returns configuration error for an invalid rule", async () => {
    const exitCode = await runCli([
      "node",
      "css-modules-class-checker-cli",
      ".",
      "--rule",
      "not-a-rule=error"
    ]);

    expect(exitCode).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid rule "not-a-rule=error"')
    );
  });
});

async function createFixture(): Promise<string> {
  const target = await mkdtemp(path.join(os.tmpdir(), "css-modules-class-checker-cli-"));

  await writeFile(
    path.join(target, "button.tsx"),
    [
      'import styles from "./button.module.css";',
      "",
      "export function Button() {",
      '  return <button className={styles.root}>Save</button>;',
      "}"
    ].join("\n")
  );
  await writeFile(path.join(target, "button.module.css"), ".root { display: inline-flex; }\n");

  return target;
}
