import styles from "./raw-css-module-class.module.css";

export function RawCssModuleClassMixed() {
  return (
    <button className={`${styles.disabledRaw} ${styles.reportedRaw}`}>
      {/* eslint-disable-next-line css-modules-class-checker/raw-css-module-class */}
      <span className="disabledRaw" />
      <span className="reportedRaw" />
      Save
    </button>
  );
}
