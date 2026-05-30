import styles from "./button.module.css";

export function Button() {
  return <button className={styles.button} data-responsive={styles.responsive} />;
}
