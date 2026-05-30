import { describe, expect, it } from "vitest";
import { parseSourceFile } from "../../src/source/parse.js";
import { findCssModuleClassUsages, findRawClassNameUsages } from "../../src/source/class-usages.js";
import type { CssModuleImport } from "../../src/types.js";

const cssImport: CssModuleImport = {
  localName: "styles",
  namedImports: [],
  importPath: "./button.module.css",
  cssModulePath: "/project/button.module.css",
  index: 0
};

describe("class usage extraction", () => {
  it("finds module class usages in clsx arrays, objects, and multiple arguments", () => {
    const source = `
      import clsx from "clsx";
      import styles from "./button.module.css";

      <button className={clsx(styles.one, [styles.two], { [styles.three]: true })} />;
    `;
    const program = parseProgram(source);
    const usages = findCssModuleClassUsages(source, program, [cssImport]);

    expect(resolvedClassNames(usages)).toEqual(["one", "two", "three"]);
  });

  it("finds module class usages in manual concatenation and template literals", () => {
    const source = `
      import styles from "./button.module.css";

      <button className={styles.one + " " + styles.two} />;
      <button className={\`\${styles.three} \${styles.four}\`} />;
    `;
    const program = parseProgram(source);
    const usages = findCssModuleClassUsages(source, program, [cssImport]);

    expect(resolvedClassNames(usages)).toEqual(["one", "two", "three", "four"]);
  });

  it("finds named CSS Module import usages and aliases", () => {
    const source = `
      import { one, two as second } from "./button.module.css";

      <button className={one + " " + second} />;
    `;
    const program = parseProgram(source);
    const usages = findCssModuleClassUsages(source, program, [
      {
        localName: undefined,
        namedImports: [
          { importedName: "one", localName: "one", index: 0 },
          { importedName: "two", localName: "second", index: 0 }
        ],
        importPath: "./button.module.css",
        cssModulePath: "/project/button.module.css",
        index: 0
      }
    ]);

    expect(resolvedClassNames(usages)).toEqual(["one", "two"]);
  });

  it("finds raw class strings in clsx/classnames/manual/template composition", () => {
    const source = `
      import clsx from "clsx";
      import classNames from "classnames";
      import styles from "./button.module.css";

      <button className={clsx("one", ["two"], { three: true })} />;
      <button className={classNames({ "four-five": true })} />;
      <button className={styles.safe + " six"} />;
      <button className={\`\${styles.safe} \${true ? "seven" : ""}\`} />;
    `;
    const program = parseProgram(source);
    const usages = findRawClassNameUsages(source, program);

    expect(usages.map((usage) => usage.className)).toEqual([
      "one",
      "two",
      "three",
      "four-five",
      "six",
      "seven"
    ]);
  });
});

function parseProgram(source: string) {
  const parsed = parseSourceFile("fixture.tsx", source);

  if (!parsed.ok) {
    throw new Error(parsed.message);
  }

  return parsed.program;
}

function resolvedClassNames(usages: ReturnType<typeof findCssModuleClassUsages>): string[] {
  return usages.flatMap((usage) => (usage.kind === "resolved" ? [usage.className] : []));
}
