import styles from "./button.module.css";

const variant = "primary";

function helper() {
  const variant = "ghost";
  return variant;
}

export function Button() {
  return <button className={styles[variant]}>{helper()}</button>;
}
