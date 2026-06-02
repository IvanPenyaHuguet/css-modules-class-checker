import styles from "./button.module.css";

export function Button({ active }: { active: boolean }) {
  return <button className={active ? styles.active : styles.root}>Save</button>;
}
