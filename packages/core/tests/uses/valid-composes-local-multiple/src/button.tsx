import styles from "./button.module.css";

export function Button() {
  return (
    <button className={styles.button}>
      <span className={styles.icon}>Save</span>
    </button>
  );
}
