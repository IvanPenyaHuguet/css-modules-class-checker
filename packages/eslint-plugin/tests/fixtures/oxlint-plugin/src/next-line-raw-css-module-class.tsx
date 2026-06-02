import styles from "./next-line-raw-css-module-class.module.css";

export function NextLineRawCssModuleClass() {
  // eslint-disable-next-line css-modules-class-checker/raw-css-module-class
  return <button className={`${styles.root} root`}>Save</button>;
}
