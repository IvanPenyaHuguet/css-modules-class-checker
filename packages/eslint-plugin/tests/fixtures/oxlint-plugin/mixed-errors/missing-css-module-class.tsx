import styles from "./missing-css-module-class.module.css";

export function MissingCssModuleClassMixed() {
  // eslint-disable-next-line css-modules-class-checker/missing-css-module-class
  const disabled = styles.disabledMissing;
  const reported = styles.reportedMissing;

  return <button className={`${styles.root} ${disabled} ${reported}`}>Save</button>;
}
