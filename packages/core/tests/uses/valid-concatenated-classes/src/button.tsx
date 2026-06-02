import clsx from "clsx";
import styles from "./button.module.css";

export function Button() {
  return <button className={clsx(styles.button, styles.active, styles.primary)} />;
}
