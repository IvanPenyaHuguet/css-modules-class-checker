import styles from "./next-line-raw-css-module-class.module.css";

export function NextLineRawCssModuleClass() {
  // eslint-disable-next-line @stale-styles/raw-css-module-class
  return <button className={`${styles.root} root`}>Save</button>;
}
