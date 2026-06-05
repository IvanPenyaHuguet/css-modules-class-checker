import classNames from "classnames";
import styles from "./button.module.css";

export function Button() {
  return <button className={classNames(styles.primary)} />;
}
