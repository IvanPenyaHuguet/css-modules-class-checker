import validStyles from "./valid.module.css";
import missingStyles from "./missing.module.css";

export function Button() {
  return (
    <button
      className={validStyles.root}
      data-missing-class={validStyles.ghost}
      data-missing-module={missingStyles.anything}
    />
  );
}
