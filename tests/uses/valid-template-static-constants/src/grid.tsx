import styles from "./grid.module.css";

const prefix = "grid";
const som = "One";

export function Grid() {
  return <button className={styles[`${prefix}${som}`]} />;
}
