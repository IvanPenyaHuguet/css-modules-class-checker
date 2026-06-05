import styles from "./button.module.css";

function helper(styles: { ghost: string }) {
  return styles.ghost;
}

export function Button() {
  return <button className={styles.real}>{helper({ ghost: "external" })}</button>;
}
