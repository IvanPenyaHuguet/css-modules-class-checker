import styles from "./disabled.module.css";

export function Disabled() {
  return (
    <section>
      {/* eslint-disable-next-line @stale-styles/missing-css-module-class */}
      <div className={styles.hiddenMissing} />
      <div className={styles.visibleMissing} />
      {/* eslint-disable-next-line @stale-styles/raw-css-module-class */}
      <div className="hiddenRaw" />
      <div className="visibleRaw" />
    </section>
  );
}
