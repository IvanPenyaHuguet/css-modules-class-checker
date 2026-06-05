import styles from "./button.module.css";

export function Button({ variant }: { variant: string }) {
  return <button className={`${styles.used} ${styles[variant]}`} />;
}
