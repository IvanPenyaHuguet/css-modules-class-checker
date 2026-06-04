import styles from "./button.module.css";

export function Button() {
  const styles = { primary: "external" };

  return <div className={styles.primary} />;
}
