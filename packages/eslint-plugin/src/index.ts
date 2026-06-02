import { eslintCompatPlugin } from "@oxlint/plugins";
import { createConfigs } from "./configs";
import { pluginName } from "./constants";
import { rules } from "./rules";
import type { PluginWithConfigs } from "./types";

const basePlugin = eslintCompatPlugin({
  meta: {
    name: pluginName
  },
  rules
});

export const configs = createConfigs({ ...basePlugin, rules });
export const plugin: PluginWithConfigs = { ...basePlugin, rules, configs };

export { rules };
export default plugin;
