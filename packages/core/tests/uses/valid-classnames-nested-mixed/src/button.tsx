import classNames from "classnames";
import styles from "./button.module.css";

export function Button({ active }: { active: boolean }) {
  return (
    <button
      className={classNames(
        styles.primary,
        [styles.active, [styles.nested]],
        active ? styles.enabled : styles.disabled
      )}
    />
  );
}
