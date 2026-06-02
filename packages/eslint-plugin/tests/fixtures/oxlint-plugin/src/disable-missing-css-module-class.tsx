/* eslint-disable css-modules-class-checker/missing-css-module-class */
import styles from "./disable-missing-css-module-class.module.css";

export function DisabledMissingCssModuleClass() {
  return <button className={`${styles.root} ${styles.missing}`}>Save</button>;
}
