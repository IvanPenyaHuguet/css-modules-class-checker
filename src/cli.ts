#!/usr/bin/env node
import path from "node:path";
import { Command, InvalidArgumentError } from "commander";
import { checkCssModules } from "./checker.js";
import { renderTextReport } from "./reporters/text.js";
import type { DiagnosticCode, RuleLevel, RulesConfig } from "./types.js";

const validRuleLevels = new Set<RuleLevel>(["off", "warning", "error"]);
const validRuleCodes = new Set<DiagnosticCode>([
  "missing-css-module-class",
  "raw-css-module-class",
  "unresolved-dynamic-class",
  "css-module-file-not-found",
  "css-parse-error",
  "source-parse-error",
]);

type CliOptions = {
  ignore?: string[];
  ignoreClass?: string[];
  rule?: string[];
};

const program = new Command()
  .name("css-modules-class-checker")
  .description("Checks CSS Modules class usages in JavaScript and TypeScript projects.")
  .argument("[target]", "target directory", ".")
  .option("--ignore <pattern...>", "ignore files or directories")
  .option("--ignore-class <name...>", "ignore specific class names")
  .option("--rule <rule=level...>", "configure rules: off, warning, or error")
  .exitOverride();

try {
  program.parse(process.argv);

  const target = program.args[0] ?? ".";
  const cliOptions = program.opts<CliOptions>();
  const rules = parseRules(cliOptions.rule ?? []);
  const result = await checkCssModules({
    target,
    ignore: cliOptions.ignore,
    ignoreClasses: cliOptions.ignoreClass,
    rules,
  });

  console.log(renderTextReport(result, path.resolve(target)));
  process.exitCode = result.status === "FAIL" ? 1 : 0;
} catch (error) {
  const exitCode = typeof error === "object" && error !== null && "exitCode" in error
    ? Number(error.exitCode)
    : 2;

  if (exitCode !== 0) {
    console.error(error instanceof Error ? error.message : String(error));
  }

  process.exitCode = exitCode === 0 ? 0 : 2;
}

function parseRules(values: string[]): RulesConfig {
  const rules: RulesConfig = {};

  for (const value of values) {
    const [code, level] = value.split("=");

    if (!validRuleCodes.has(code as DiagnosticCode) || !validRuleLevels.has(level as RuleLevel)) {
      throw new InvalidArgumentError(`Invalid rule "${value}". Expected rule=off|warning|error.`);
    }

    rules[code as DiagnosticCode] = level as RuleLevel;
  }

  return rules;
}
