import styles from "./next-line-missing-css-module-class.module.css";

export function NextLineMissingCssModuleClass() {
  // eslint-disable-next-line css-modules-class-checker/missing-css-module-class
  return <button className={`${styles.root} ${styles.missing}`}>Save</button>;
}
