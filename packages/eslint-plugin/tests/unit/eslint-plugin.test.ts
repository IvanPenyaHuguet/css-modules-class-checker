import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { Linter } from "eslint";
import type { Plugin, Rule } from "@oxlint/plugins";
import { getDiagnostics } from "../../src/diagnostics";
import { configs, rules } from "../../src/index";
import { normalizeOptions } from "../../src/options";
import { getRuleDescription } from "../../src/rule-descriptions";

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
  report: (descriptor: RuleReport) => void;
};

type RuleReport = { message: string; loc?: unknown; node?: unknown };

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

  it("fails explicitly for unknown rule descriptions", () => {
    expect(() => getRuleDescription("unknown-rule" as never)).toThrow("Unknown rule code.");
  });

  it("ignores non-object rule options", () => {
    expect(normalizeOptions("invalid")).toEqual({});
  });

  it("skips virtual files before running checker analysis", () => {
    expect(
      getDiagnostics({
        filename: "<input>",
        options: [],
        sourceCode: { text: 'import styles from "./missing.module.css"; styles.root;' }
      } as never)
    ).toEqual([]);
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

  it("reports missing CSS Module files at the import declaration", () => {
    const reports = runRuleReports("css-module-file-not-found", "css-module-file-not-found-offset");

    expect(reports).toHaveLength(1);
    expect(reports[0]?.loc).toEqual({ line: 3, column: 4 });
  });

  it("reports every matching diagnostic for a rule in one source file", () => {
    const reports = runRule("missing-css-module-class", "locals-default-no-transform");

    expect(reports).toEqual([
      expect.stringContaining('Class "primaryButton" is not defined in button.module.css.'),
      expect.stringContaining('Class "isActive" is not defined in button.module.css.')
    ]);
  });

  it("reports unused classes even when unresolved dynamic diagnostics are not requested", () => {
    const reports = runRule("unused-css-module-class", "unresolved-dynamic-keeps-explicit-used");

    expect(reports).toEqual([
      expect.stringContaining('Class "orphan" is defined in button.module.css but is never used.'),
      expect.stringContaining(
        'Class "secondary" is defined in button.module.css but is never used.'
      )
    ]);
  });

  it("reports every unresolved dynamic class access in one source file", () => {
    const reports = runRule("unresolved-dynamic-class", "multiple-unresolved-dynamic-classes");

    expect(reports).toEqual([
      expect.stringContaining("Cannot statically resolve dynamic class access on styles."),
      expect.stringContaining("Cannot statically resolve dynamic class access on styles.")
    ]);
    expect(reports[0]).toContain("at 6:");
    expect(reports[1]).toContain("at 7:");
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

  it("reports invalid ignoreClassPatterns options instead of throwing", () => {
    const reports = runRule("missing-css-module-class", "missing-dot-notation", undefined, {
      ignoreClassPatterns: ["["]
    });

    expect(reports).toEqual([expect.stringContaining('Invalid ignoreClassPatterns pattern "["')]);
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
      Object.fromEntries(ruleCodes.map((code) => [`@stale-styles/${code}`, "error"]))
    );
  });

  it("keeps TypeScript types for rules and configs", () => {
    expectTypeOf(rules["missing-css-module-class"]).toEqualTypeOf<Rule>();
    expectTypeOf(configs.recommended.rules).toMatchTypeOf<
      Record<`@stale-styles/${(typeof ruleCodes)[number]}`, "error">
    >();
    expectTypeOf(configs.recommended.plugins["@stale-styles"]).toMatchTypeOf<Plugin>();
    expectTypeOf(configs.recommended.plugins).toMatchTypeOf<Linter.Config["plugins"]>();
  });
});

function runRule(
  code: (typeof ruleCodes)[number],
  fixture: string,
  fileName = "button.tsx",
  options?: unknown
): string[] {
  return runRuleReports(code, fixture, fileName, options).map((report) => report.message);
}

function runRuleReports(
  code: (typeof ruleCodes)[number],
  fixture: string,
  fileName = "button.tsx",
  options?: unknown
): RuleReport[] {
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
): { reports: RuleReport[]; visitor: RuleVisitor | undefined } {
  const filePath = path.resolve(coreUseCasesRoot, fixture, "src", fileName);
  const rule = rules[code];

  if (!isRuleModule(rule)) {
    throw new Error(`Rule ${code} does not expose a create API.`);
  }

  const reports: RuleReport[] = [];
  const context: RuleContext = {
    filename: filePath,
    options: options === undefined ? [] : [options],
    sourceCode: {
      text: readFileSync(filePath, "utf8")
    },
    report(descriptor) {
      reports.push(descriptor);
    }
  };

  const visitor = (rule.createOnce ?? rule.create)?.(context);
  return { reports, visitor };
}

function isRuleModule(rule: Rule): rule is Rule & RuleModule {
  return "createOnce" in rule || "create" in rule;
}
