import styles from "./grid.module.css";

export function Grid({ som }: { som: string }) {
  return <button className={styles[`grid${som}`]} />;
}
