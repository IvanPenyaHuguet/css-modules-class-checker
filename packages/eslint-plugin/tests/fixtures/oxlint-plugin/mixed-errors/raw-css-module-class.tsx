import styles from "./raw-css-module-class.module.css";

export function RawCssModuleClassMixed() {
  return (
    <button className={`${styles.disabledRaw} ${styles.reportedRaw}`}>
      {/* eslint-disable-next-line @stale-styles/raw-css-module-class */}
      <span className="disabledRaw" />
      <span className="reportedRaw" />
      Save
    </button>
  );
}
