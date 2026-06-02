import type { Plugin, Rule } from "@oxlint/plugins";
import type { LocalsConvention } from "css-modules-class-checker-core";
import type { diagnosticCodes, pluginName } from "./constants";

export type PluginDiagnosticCode = (typeof diagnosticCodes)[number];
export type PluginRuleId = `${typeof pluginName}/${PluginDiagnosticCode}`;
export type PluginRules = Record<PluginDiagnosticCode, Rule>;
export type RecommendedRules = Record<PluginRuleId, "error">;

export type PluginRuleOptions = {
  /**
   * CSS class names to ignore when checking missing or unused CSS Module classes.
   */
  ignoreClasses?: string[];
  /**
   * Regular expression patterns for CSS class names to ignore when checking
   * missing or unused CSS Module classes.
   */
  ignoreClassPatterns?: string[];
  /**
   * CSS Modules locals convention used to resolve exported class names.
   */
  localsConvention?: Extract<LocalsConvention, string>;
  /**
   * Import source strings or path suffixes that should be treated as CSS Module files.
   */
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
