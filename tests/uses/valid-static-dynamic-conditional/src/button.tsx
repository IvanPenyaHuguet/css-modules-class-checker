import styles from "./button.module.css";

export function Button({ active }: { active: boolean }) {
  const variant = active ? "primary" : "secondary";

  return <button className={styles[variant]} />;
}
