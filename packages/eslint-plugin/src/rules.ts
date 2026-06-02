import { diagnosticCodes } from "./constants";
import { createRule } from "./rule";
import type { PluginRules } from "./types";

export const rules = Object.fromEntries(
  diagnosticCodes.map((code) => [code, createRule(code)])
) as PluginRules;
