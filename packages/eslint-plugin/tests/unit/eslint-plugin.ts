import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { Plugin, Rule } from "@oxlint/plugins";
import { configs, rules } from "../../src/index";

type RuleModule = {
  createOnce?: (context: RuleContext) => RuleVisitor;
  create?: (context: RuleContext) => RuleVisitor;
};

type RuleContext = {
  filename: string;
  options: unknown[];
  sourceCode: {
    text: string;
  };
  report: (descriptor: { message: string; loc?: unknown; node?: unknown }) => void;
};

type RuleVisitor = {
  before?: () => boolean | void;
  Program?: (node: unknown) => void;
};

const ruleCodes = [
  "missing-css-module-class",
  "unused-css-module-class",
  "raw-css-module-class",
  "empty-css-module-selector",
  "unresolved-dynamic-class",
  "css-module-file-not-found"
] as const;
const testRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testRoot, "../..");
const oxlintFixtureRoot = path.resolve(testRoot, "../fixtures/oxlint-plugin");
const coreUseCasesRoot = path.resolve(testRoot, "../../../core/tests/uses");

type RuleCase = {
  code: (typeof ruleCodes)[number];
  fixture: string;
  fileName?: string;
  expectedMessage: string;
};

const reportCases: RuleCase[] = [
  {
    code: "missing-css-module-class",
    fixture: "missing-dot-notation",
    expectedMessage: 'Class "secondary" is not defined in button.module.css.'
  },
  {
    code: "unused-css-module-class",
    fixture: "unused-css-module-class",
    expectedMessage: 'Class "orphan" is defined in button.module.css but is never used.'
  },
  {
    code: "raw-css-module-class",
    fixture: "raw-css-module-class",
    expectedMessage: 'CSS Module class "primary" is used as a raw class string.'
  },
  {
    code: "empty-css-module-selector",
    fixture: "empty-css-module-selector",
    expectedMessage: 'Class "marker" is defined by an empty selector in button.module.css.'
  },
  {
    code: "unresolved-dynamic-class",
    fixture: "unresolved-dynamic",
    expectedMessage: "Cannot statically resolve dynamic class access on styles."
  },
  {
    code: "css-module-file-not-found",
    fixture: "css-module-file-not-found",
    expectedMessage: "CSS Module file not found: ./missing.module.css."
  }
];

describe("eslint plugin", () => {
  it("exports every checker diagnostic as a rule", () => {
    expect(Object.keys(rules).sort()).toEqual([...ruleCodes].sort());
  });

  it("documents rule options in the JSON schema", () => {
    const schema = rules["missing-css-module-class"].meta?.schema;

    expect(schema).toEqual([
      expect.objectContaining({
        description: expect.any(String),
        properties: expect.objectContaining({
          ignoreClasses: expect.objectContaining({ description: expect.any(String) }),
          ignoreClassPatterns: expect.objectContaining({ description: expect.any(String) }),
          localsConvention: expect.objectContaining({ description: expect.any(String) }),
          matchFiles: expect.objectContaining({ description: expect.any(String) })
        })
      })
    ]);
  });

  it.each(reportCases)("reports $code diagnostics through the createOnce API", (testCase) => {
    const reports = runRule(testCase.code, testCase.fixture, testCase.fileName);

    expect(reports).toHaveLength(1);
    expect(reports[0]).toContain(testCase.expectedMessage);
    expect(reports[0]).toContain(`[${testCase.code}`);
  });

  it("reports every matching diagnostic for a rule in one source file", () => {
    const reports = runRule("missing-css-module-class", "missing-compound-nested-css-class");

    expect(reports).toEqual([
      expect.stringContaining('Class "one" is not defined in button.module.css.'),
      expect.stringContaining('Class "two" is not defined in button.module.css.')
    ]);
  });

  it("passes rule options through to the checker", () => {
    const withoutOptions = runRule("missing-css-module-class", "valid-camelcase-transform");
    const withOptions = runRule(
      "missing-css-module-class",
      "valid-camelcase-transform",
      undefined,
      {
        localsConvention: "camelCase"
      }
    );

    expect(withoutOptions).toEqual([
      expect.stringContaining('Class "primaryButton" is not defined in button.module.css.'),
      expect.stringContaining('Class "isActive" is not defined in button.module.css.')
    ]);
    expect(withOptions).toEqual([]);
  });

  it("skips files without matching CSS Module imports in the before hook", () => {
    expect(runRuleBefore("missing-css-module-class", "raw-class-without-module-import")).toBe(
      false
    );
    expect(runRuleBefore("missing-css-module-class", "custom-match-files-suffix")).toBe(false);
  });

  it("uses configured matchFiles strings in the before hook", () => {
    expect(
      runRuleBefore("missing-css-module-class", "custom-match-files-suffix", undefined, {
        matchFiles: [".css"]
      })
    ).not.toBe(false);
    expect(
      runRuleBefore("missing-css-module-class", "custom-match-files-suffix", undefined, {
        matchFiles: ["src/button.css"]
      })
    ).not.toBe(false);
  });

  it("exposes the recommended rules config for oxlint/eslint consumers", () => {
    const recommendedRules = configs.recommended.rules;

    expect(recommendedRules).toEqual(
      Object.fromEntries(ruleCodes.map((code) => [`css-modules-class-checker/${code}`, "error"]))
    );
  });

  it("keeps TypeScript types for rules and configs", () => {
    expectTypeOf(rules["missing-css-module-class"]).toEqualTypeOf<Rule>();
    expectTypeOf(configs.recommended.rules).toMatchTypeOf<
      Record<`css-modules-class-checker/${(typeof ruleCodes)[number]}`, "error">
    >();
    expectTypeOf(configs.recommended.plugins["css-modules-class-checker"]).toEqualTypeOf<Plugin>();
  });

  it("honors eslint-disable-next-line without hiding later diagnostics in oxlint", () => {
    const output = runOxlintExpectingFailure([
      "-c",
      path.join(oxlintFixtureRoot, "oxlint.config.ts"),
      path.join(oxlintFixtureRoot, "mixed-errors")
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

function runRule(
  code: (typeof ruleCodes)[number],
  fixture: string,
  fileName = "button.tsx",
  options?: unknown
): string[] {
  const { reports, visitor } = createRuleVisitor(code, fixture, fileName, options);

  if (visitor?.before?.() === false) {
    return reports;
  }

  visitor?.Program?.({ type: "Program" });
  return reports;
}

function runRuleBefore(
  code: (typeof ruleCodes)[number],
  fixture: string,
  fileName = "button.tsx",
  options?: unknown
): boolean | void {
  return createRuleVisitor(code, fixture, fileName, options).visitor?.before?.();
}

function createRuleVisitor(
  code: (typeof ruleCodes)[number],
  fixture: string,
  fileName = "button.tsx",
  options?: unknown
): { reports: string[]; visitor: RuleVisitor | undefined } {
  const filePath = path.resolve(coreUseCasesRoot, fixture, "src", fileName);
  const rule = rules[code];

  if (!isRuleModule(rule)) {
    throw new Error(`Rule ${code} does not expose a create API.`);
  }

  const reports: string[] = [];
  const context: RuleContext = {
    filename: filePath,
    options: options === undefined ? [] : [options],
    sourceCode: {
      text: readFileSync(filePath, "utf8")
    },
    report(descriptor) {
      reports.push(descriptor.message);
    }
  };

  const visitor = (rule.createOnce ?? rule.create)?.(context);
  return { reports, visitor };
}

function isRuleModule(rule: Rule): rule is Rule & RuleModule {
  return "createOnce" in rule || "create" in rule;
}

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
