import { describe, expect, it } from "vitest";
import { parseSourceFile } from "../../src/source/parse";
import { findCssModuleClassUsages, findRawClassNameUsages } from "../../src/source/class-usages";
import type { CssModuleImport } from "../../src/types";

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

  it("ignores default import member access when the local name is shadowed", () => {
    const source = `
      import styles from "./button.module.css";

      function helper(styles: { ghost: string }) {
        return styles.ghost;
      }

      styles.real;
    `;
    const program = parseProgram(source);
    const usages = findCssModuleClassUsages(source, program, [cssImport]);

    expect(resolvedClassNames(usages)).toEqual(["real"]);
  });

  it("ignores named import identifiers when the local name is shadowed", () => {
    const source = `
      import { primary } from "./button.module.css";

      [1].map((primary) => primary);
    `;
    const program = parseProgram(source);
    const usages = findCssModuleClassUsages(source, program, [
      {
        localName: undefined,
        namedImports: [{ importedName: "primary", localName: "primary", index: 0 }],
        importPath: "./button.module.css",
        cssModulePath: "/project/button.module.css",
        index: 0
      }
    ]);

    expect(resolvedClassNames(usages)).toEqual([]);
  });

  it("does not count type literal property keys as named import usages", () => {
    const source = `
      import { primary } from "./button.module.css";

      type Props = {
        primary: string;
      };
    `;
    const program = parseProgram(source);
    const usages = findCssModuleClassUsages(source, program, [
      {
        localName: undefined,
        namedImports: [{ importedName: "primary", localName: "primary", index: 0 }],
        importPath: "./button.module.css",
        cssModulePath: "/project/button.module.css",
        index: 0
      }
    ]);

    expect(resolvedClassNames(usages)).toEqual([]);
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

  it("finds raw class strings in spread and tagged template composition", () => {
    const source = `
      import clsx from "clsx";

      <button className={clsx(...["one"], { ...{ two: active } }, tw\`three\`)} />;
    `;
    const program = parseProgram(source);
    const usages = findRawClassNameUsages(source, program);

    expect(usages.map((usage) => usage.className)).toEqual(["one", "two", "three"]);
  });

  it("finds raw class strings in computed object keys", () => {
    const source = `
      import clsx from "clsx";

      <button className={clsx({ [active ? "one" : "two"]: active })} />;
    `;
    const program = parseProgram(source);
    const usages = findRawClassNameUsages(source, program);

    expect(usages.map((usage) => usage.className)).toEqual(["one", "two"]);
  });

  it("finds raw class strings in class attributes", () => {
    const source = `
      import clsx from "clsx";
      import styles from "./button.module.css";

      <button class="one two" />;
      <button class={clsx("three", { four: active })} />;
    `;
    const program = parseProgram(source);
    const usages = findRawClassNameUsages(source, program);

    expect(usages.map((usage) => usage.className)).toEqual(["one", "two", "three", "four"]);
  });

  it("does not find raw class strings inside computed module class accesses", () => {
    const source = `
      import styles from "./button.module.css";

      <button className={styles[active ? "primary" : "secondary"]} />;
    `;
    const program = parseProgram(source);
    const moduleUsages = findCssModuleClassUsages(source, program, [cssImport]);
    const rawUsages = findRawClassNameUsages(source, program);

    expect(resolvedClassNames(moduleUsages)).toEqual(["primary", "secondary"]);
    expect(rawUsages.map((usage) => usage.className)).toEqual([]);
  });

  it("does not find raw class strings in non-class conditional tests", () => {
    const source = `
      import styles from "./button.module.css";

      <button className={tone === "primary" ? styles.primary : styles.secondary} />;
    `;
    const program = parseProgram(source);
    const rawUsages = findRawClassNameUsages(source, program);

    expect(rawUsages.map((usage) => usage.className)).toEqual([]);
  });

  it("does not find raw class strings in computed object keys backed by CSS Modules", () => {
    const source = `
      import clsx from "clsx";
      import styles from "./button.module.css";

      <button className={clsx({ [styles[active ? "primary" : "secondary"]]: active })} />;
      <button className={clsx({ [tone === "primary" ? styles.primary : styles.secondary]: active })} />;
    `;
    const program = parseProgram(source);
    const rawUsages = findRawClassNameUsages(source, program);

    expect(rawUsages.map((usage) => usage.className)).toEqual([]);
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
