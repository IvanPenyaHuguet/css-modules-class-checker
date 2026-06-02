import styles from "./next-line-unresolved-dynamic-class.module.css";

export function NextLineUnresolvedDynamicClass({ variant }: { variant: string }) {
  // eslint-disable-next-line css-modules-class-checker/unresolved-dynamic-class
  return <button className={styles[variant]}>Save</button>;
}
