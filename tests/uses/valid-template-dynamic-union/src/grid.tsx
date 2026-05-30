import styles from "./grid.module.css";

const som: "One" | "Two" = "One";

export function Grid() {
  return <button className={styles[`grid${som}`]} />;
}
