import styles from "./button.module.css";

const variant = "secondary";

export function Button() {
  return <button className={styles[variant]} />;
}
