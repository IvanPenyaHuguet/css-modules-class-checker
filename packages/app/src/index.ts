/**
 * Check CSS Module imports and class usages under a target directory.
 *
 * This is the public programmatic API for running the same project-level check
 * exposed by the CLI.
 */
export { checkCssModules } from "css-modules-class-checker-core";
export type {
  CheckOptions,
  CheckResult,
  CheckStatus,
  CssModuleFileMatcher,
  Diagnostic,
  DiagnosticCode,
  LocalsConvention,
  RuleLevel,
  RulesConfig
} from "css-modules-class-checker-core";
