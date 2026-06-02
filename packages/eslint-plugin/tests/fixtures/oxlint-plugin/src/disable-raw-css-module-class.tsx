/* eslint-disable css-modules-class-checker/raw-css-module-class */
import styles from "./disable-raw-css-module-class.module.css";

export function DisabledRawCssModuleClass() {
  return <button className={`${styles.root} root`}>Save</button>;
}
