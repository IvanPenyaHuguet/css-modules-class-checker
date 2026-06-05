import cx from "classnames";
import whatever from "clsx";
import styles from "./button.module.css";

export function Button({ active }: { active: boolean }) {
  return (
    <button
      className={whatever(
        "primary",
        active && "active",
        cx({ nested: active, "is-selected": active }),
        styles.safe
      )}
    />
  );
}
