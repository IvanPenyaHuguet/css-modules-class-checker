import clsx from "clsx";
import styles from "./button.module.css";

export function Button({ active }: { active: boolean }) {
  return (
    <button
      className={clsx("primary", active && "active", ["nested"])}
      data-primary={styles.primary}
    />
  );
}
