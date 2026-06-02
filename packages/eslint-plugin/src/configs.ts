import type { Plugin } from "@oxlint/plugins";
import { diagnosticCodes, pluginName } from "./constants";
import type { PluginConfigs, RecommendedRules } from "./types";

export function createConfigs(plugin: Plugin): PluginConfigs {
  return {
    recommended: {
      plugins: {
        [pluginName]: plugin
      },
      rules: createRecommendedRules()
    }
  };
}

function createRecommendedRules(): RecommendedRules {
  return Object.fromEntries(
    diagnosticCodes.map((code) => [`${pluginName}/${code}`, "error"])
  ) as RecommendedRules;
}
