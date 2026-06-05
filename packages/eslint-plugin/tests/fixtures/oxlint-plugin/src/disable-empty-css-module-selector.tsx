/* eslint-disable @stale-styles/empty-css-module-selector */
import styles from "./disable-empty-css-module-selector.module.css";

export function DisabledEmptyCssModuleSelector() {
  return <button className={styles.empty}>Save</button>;
}
