/* eslint-disable @stale-styles/raw-css-module-class */
import styles from "./disable-raw-css-module-class.module.css";

export function DisabledRawCssModuleClass() {
  return <button className={`${styles.root} root`}>Save</button>;
}
