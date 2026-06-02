import styles from "./button.module.css";

export function Button({ active }: { active: boolean }) {
  return <button className={`${styles.one} ${active ? "two" : ""}`} />;
}
