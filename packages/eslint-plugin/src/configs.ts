import { pluginName } from "./constants";
import type { EslintCompatiblePlugin, PluginConfigs, RecommendedRules } from "./types";

export function createConfigs(plugin: EslintCompatiblePlugin): PluginConfigs {
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
  return {
    [`${pluginName}/missing-css-module-class`]: "error",
    [`${pluginName}/unused-css-module-class`]: "error",
    [`${pluginName}/raw-css-module-class`]: "error",
    [`${pluginName}/empty-css-module-selector`]: "error",
    [`${pluginName}/unresolved-dynamic-class`]: "error",
    [`${pluginName}/css-module-file-not-found`]: "error"
  };
}
