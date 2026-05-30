#!/usr/bin/env node
import path from "node:path";
import { Command, InvalidArgumentError } from "commander";
import { checkCssModules } from "./checker.js";
import { renderTextReport } from "./reporters/text.js";
import type { DiagnosticCode, LocalsConvention, RuleLevel, RulesConfig } from "./types.js";

type CliLocalsConvention = Extract<LocalsConvention, string>;

const validRuleLevels = new Set<string>(["off", "warning", "error"]);
const validLocalsConventions = new Set<string>([
  "camelCase",
  "camelCaseOnly",
  "dashes",
  "dashesOnly"
]);
const validRuleCodes = new Set<string>([
  "missing-css-module-class",
  "unused-css-module-class",
  "raw-css-module-class",
  "empty-css-module-selector",
  "unresolved-dynamic-class",
  "css-module-file-not-found",
  "css-parse-error",
  "source-parse-error"
]);

type CliOptions = {
  ignore?: string[];
  ignoreClass?: string[];
  localsConvention?: string;
  rule?: string[];
};

const program = new Command()
  .name("css-modules-class-checker")
  .description("Checks CSS Modules class usages in JavaScript and TypeScript projects.")
  .argument("[target]", "target directory", ".")
  .option("--ignore <pattern...>", "ignore files or directories")
  .option("--ignore-class <name...>", "ignore specific class names")
  .option(
    "--locals-convention <convention>",
    "CSS Modules locals convention: camelCase, camelCaseOnly, dashes, or dashesOnly"
  )
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
    localsConvention: parseLocalsConvention(cliOptions.localsConvention),
    rules
  });

  console.log(renderTextReport(result, path.resolve(target)));
  process.exitCode = result.status === "FAIL" ? 1 : 0;
} catch (error) {
  const exitCode =
    typeof error === "object" && error !== null && "exitCode" in error ? Number(error.exitCode) : 2;

  if (exitCode !== 0) {
    console.error(error instanceof Error ? error.message : String(error));
  }

  process.exitCode = exitCode === 0 ? 0 : 2;
}

function parseRules(values: string[]): RulesConfig {
  const rules: RulesConfig = {};

  for (const value of values) {
    const [code, level] = value.split("=");

    if (!isDiagnosticCode(code) || !isRuleLevel(level)) {
      throw new InvalidArgumentError(`Invalid rule "${value}". Expected rule=off|warning|error.`);
    }

    rules[code] = level;
  }

  return rules;
}

function isDiagnosticCode(value: string | undefined): value is DiagnosticCode {
  return typeof value === "string" && validRuleCodes.has(value);
}

function isRuleLevel(value: string | undefined): value is RuleLevel {
  return typeof value === "string" && validRuleLevels.has(value);
}

function parseLocalsConvention(value: string | undefined): CliLocalsConvention | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isCliLocalsConvention(value)) {
    throw new InvalidArgumentError(
      `Invalid locals convention "${value}". Expected camelCase, camelCaseOnly, dashes, or dashesOnly.`
    );
  }

  return value;
}

function isCliLocalsConvention(value: string): value is CliLocalsConvention {
  return validLocalsConventions.has(value);
}
