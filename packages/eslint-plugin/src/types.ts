import type { Plugin, Rule } from "@oxlint/plugins";
import type { LocalsConvention } from "css-modules-class-checker-core";
import type { diagnosticCodes, pluginName } from "./constants";

export type PluginDiagnosticCode = (typeof diagnosticCodes)[number];
export type PluginRuleId = `${typeof pluginName}/${PluginDiagnosticCode}`;
export type PluginRules = Record<PluginDiagnosticCode, Rule>;
export type RecommendedRules = Record<PluginRuleId, "error">;

export type PluginRuleOptions = {
  ignoreClasses?: string[];
  ignoreClassPatterns?: string[];
  localsConvention?: Extract<LocalsConvention, string>;
  matchFiles?: string[];
};

export type RecommendedConfig = {
  plugins: {
    [pluginName]: Plugin;
  };
  rules: RecommendedRules;
};

export type PluginConfigs = {
  recommended: RecommendedConfig;
};

export type PluginWithConfigs = Plugin & {
  rules: PluginRules;
  configs: PluginConfigs;
};
