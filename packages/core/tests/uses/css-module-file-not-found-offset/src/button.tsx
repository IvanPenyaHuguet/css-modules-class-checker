// Leading comments and indentation keep the import away from 1:1.

    import styles from "./missing.module.css";

export function Button() {
  return <button className={styles.primary} />;
}
