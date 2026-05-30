import clsx from "clsx";
import styles from "./button.module.css";

export function Button({ active }: { active: boolean }) {
  return <button className={clsx(styles.primary, active && styles.active)} />;
}
