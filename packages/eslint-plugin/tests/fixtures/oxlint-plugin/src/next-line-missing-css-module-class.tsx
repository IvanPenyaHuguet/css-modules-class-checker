import styles from "./next-line-missing-css-module-class.module.css";

export function NextLineMissingCssModuleClass() {
  // eslint-disable-next-line @stale-styles/missing-css-module-class
  return <button className={`${styles.root} ${styles.missing}`}>Save</button>;
}
