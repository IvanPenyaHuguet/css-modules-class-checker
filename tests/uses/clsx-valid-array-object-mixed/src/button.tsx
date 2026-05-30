import clsx from "clsx";
import styles from "./button.module.css";

export function Button({ active, disabled }: { active: boolean; disabled: boolean }) {
  return (
    <button
      className={clsx(
        styles.primary,
        [styles.active, active && styles.highlighted],
        {
          [styles.disabled]: disabled,
          [styles.focused]: active
        },
        false,
        null,
        undefined,
        0
      )}
    />
  );
}
