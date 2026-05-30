import styles from "./button.module.css";

export function Button() {
  return <button className={`${styles.primaryButton} ${styles.primary_button}`} />;
}
