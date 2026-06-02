import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import plugin from "../../src/index";

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
  report: (descriptor: { message: string; node: unknown }) => void;
};

type RuleVisitor = {
  Program?: (node: unknown) => void;
};

const ruleCodes = [
  "missing-css-module-class",
  "unused-css-module-class",
  "raw-css-module-class",
  "empty-css-module-selector",
  "unresolved-dynamic-class",
  "css-module-file-not-found",
  "css-parse-error",
  "source-parse-error"
];
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
  },
  {
    code: "css-parse-error",
    fixture: "warn-css-parse-error",
    expectedMessage: "Unexpected end of input"
  },
  {
    code: "source-parse-error",
    fixture: "warn-source-parse-error",
    expectedMessage: "Unexpected token"
  }
];

describe("eslint plugin", () => {
  it("exports every checker diagnostic as a rule", () => {
    expect(Object.keys(plugin.rules).sort()).toEqual([...ruleCodes].sort());
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

  it("exposes the recommended rules config for oxlint/eslint consumers", () => {
    const pluginWithConfigs = plugin as typeof plugin & {
      configs: { recommended: { rules: Record<string, string> } };
    };
    const recommendedRules = pluginWithConfigs.configs.recommended.rules;

    expect(recommendedRules).toEqual(
      Object.fromEntries(ruleCodes.map((code) => [`css-modules-class-checker/${code}`, "error"]))
    );
  });
});

function runRule(
  code: (typeof ruleCodes)[number],
  fixture: string,
  fileName = "button.tsx",
  options?: unknown
): string[] {
  const filePath = path.resolve(coreUseCasesRoot, fixture, "src", fileName);
  const rule = plugin.rules[code] as unknown as RuleModule;
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
  visitor?.Program?.({ type: "Program" });
  return reports;
}
