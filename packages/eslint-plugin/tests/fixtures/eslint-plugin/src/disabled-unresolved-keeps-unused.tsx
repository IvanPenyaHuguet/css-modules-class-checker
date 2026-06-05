import styles from "./disabled-unresolved-keeps-unused.module.css";

export function DisabledUnresolvedKeepsUnused({ variant }) {
  return (
    <>
      <div className={styles.used} />
      {/* eslint-disable-next-line @stale-styles/unresolved-dynamic-class */}
      <div className={styles[variant]} />
    </>
  );
}
