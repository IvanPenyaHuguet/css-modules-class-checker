import classNames from "classnames";
import styles from "./button.module.css";

export function Button({ active }: { active: boolean }) {
  return <button className={classNames({ primary: active, "is-active": active })} data-primary={styles.primary} />;
}
