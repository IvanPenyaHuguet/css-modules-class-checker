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

    await expect(runCli(["node", "@stale-styles/cli", target])).resolves.toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("CSS Modules check passed."));
  });

  it("returns configuration error for an invalid rule", async () => {
    const exitCode = await runCli(["node", "@stale-styles/cli", ".", "--rule", "not-a-rule=error"]);

    expect(exitCode).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid rule "not-a-rule=error"')
    );
  });

  it("returns success for help output", async () => {
    const exitCode = await runCli(["node", "@stale-styles/cli", "--help"]);

    expect(exitCode).toBe(0);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("returns configuration error for an invalid rule level", async () => {
    const exitCode = await runCli([
      "node",
      "@stale-styles/cli",
      ".",
      "--rule",
      "missing-css-module-class=bad"
    ]);

    expect(exitCode).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid rule "missing-css-module-class=bad"')
    );
  });

  it("returns configuration error for an invalid locals convention", async () => {
    const exitCode = await runCli([
      "node",
      "@stale-styles/cli",
      ".",
      "--locals-convention",
      "snakeCase"
    ]);

    expect(exitCode).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid locals convention "snakeCase"')
    );
  });

  it("passes CLI options through to the checker", async () => {
    const target = await createFixture({
      css: ".root-primary { display: inline-flex; }\n.unused { color: red; }\n",
      source: [
        'import styles from "./button.module.css";',
        "",
        "export function Button() {",
        "  return <button className={`${styles.rootPrimary} legacy`}>Save</button>;",
        "}"
      ].join("\n")
    });

    const exitCode = await runCli([
      "node",
      "@stale-styles/cli",
      target,
      "--locals-convention",
      "camelCaseOnly",
      "--ignore-class",
      "legacy",
      "unused",
      "--rule",
      "raw-css-module-class=warning"
    ]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("CSS Modules check passed."));
  });

  it("returns failure when real diagnostics contain errors", async () => {
    const target = await createFixture({
      source: [
        'import styles from "./button.module.css";',
        "",
        "export function Button() {",
        "  return <button className={styles.missing}>Save</button>;",
        "}"
      ].join("\n")
    });

    const exitCode = await runCli(["node", "@stale-styles/cli", target]);

    expect(exitCode).toBe(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("missing-css-module-class"));
  });

  it("uses the current directory when no target is provided", async () => {
    const target = await createFixture();
    const originalCwd = process.cwd();

    try {
      process.chdir(target);

      const exitCode = await runCli(["node", "@stale-styles/cli"]);

      expect(exitCode).toBe(0);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("CSS Modules check passed."));
    } finally {
      process.chdir(originalCwd);
    }
  });
});

async function createFixture(
  options: {
    source?: string;
    css?: string;
  } = {}
): Promise<string> {
  const target = await mkdtemp(path.join(os.tmpdir(), "stale-styles-test-"));

  await writeFile(
    path.join(target, "button.tsx"),
    options.source ??
      [
        'import styles from "./button.module.css";',
        "",
        "export function Button() {",
        "  return <button className={styles.root}>Save</button>;",
        "}"
      ].join("\n")
  );
  await writeFile(
    path.join(target, "button.module.css"),
    options.css ?? ".root { display: inline-flex; }\n"
  );

  return target;
}
