/* eslint-disable css-modules-class-checker/unresolved-dynamic-class */
import styles from "./disable-unresolved-dynamic-class.module.css";

export function DisabledUnresolvedDynamicClass({ variant }: { variant: string }) {
  return <button className={styles[variant]}>Save</button>;
}
