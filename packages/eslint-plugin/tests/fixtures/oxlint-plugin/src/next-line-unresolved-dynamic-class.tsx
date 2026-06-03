import styles from "./next-line-unresolved-dynamic-class.module.css";

export function NextLineUnresolvedDynamicClass({ variant }: { variant: string }) {
  // eslint-disable-next-line @stale-styles/unresolved-dynamic-class
  return <button className={styles[variant]}>Save</button>;
}
