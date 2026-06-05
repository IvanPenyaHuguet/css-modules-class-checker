import clsx from "clsx";
import styles from "./button.module.css";

const tw = String.raw;

export function Button({ active }: { active: boolean }) {
  return (
    <button
      className={clsx(...["primary"], { ...{ active } }, tw`template`)}
      data-safe={styles.safe}
    />
  );
}
