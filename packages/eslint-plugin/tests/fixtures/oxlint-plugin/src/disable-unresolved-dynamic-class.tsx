/* eslint-disable @stale-styles/unresolved-dynamic-class */
import styles from "./disable-unresolved-dynamic-class.module.css";

export function DisabledUnresolvedDynamicClass({ variant }: { variant: string }) {
  return <button className={`${styles.root} ${styles[variant]}`}>Save</button>;
}
