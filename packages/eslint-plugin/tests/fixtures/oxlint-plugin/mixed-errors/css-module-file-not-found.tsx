// eslint-disable-next-line @stale-styles/css-module-file-not-found
import disabledStyles from "./disabled-missing.module.css";
import reportedStyles from "./reported-missing.module.css";

void disabledStyles;
void reportedStyles;

export function CssModuleFileNotFoundMixed() {
  return <button>Save</button>;
}
