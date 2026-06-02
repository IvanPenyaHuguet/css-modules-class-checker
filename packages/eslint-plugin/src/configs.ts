import type { Plugin } from "@oxlint/plugins";
import { pluginName } from "./constants";
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
  return {
    "css-modules-class-checker/missing-css-module-class": "error",
    "css-modules-class-checker/unused-css-module-class": "error",
    "css-modules-class-checker/raw-css-module-class": "error",
    "css-modules-class-checker/empty-css-module-selector": "error",
    "css-modules-class-checker/unresolved-dynamic-class": "error",
    "css-modules-class-checker/css-module-file-not-found": "error"
  };
}
