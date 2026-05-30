import styles from "./button.module.css";

const classMap = {
  primary: "primary",
  secondary: "secondary",
} as const;

export function Button() {
  return <button className={styles[classMap.secondary]} />;
}
