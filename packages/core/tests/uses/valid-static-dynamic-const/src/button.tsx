import styles from "./button.module.css";

const variant = "primary";

export function Button() {
  return <button className={styles[variant]} />;
}
