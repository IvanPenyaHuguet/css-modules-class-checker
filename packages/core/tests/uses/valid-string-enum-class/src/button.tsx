import styles from "./button.module.css";

enum Variant {
  Primary = "primary",
  Secondary = "secondary"
}

export function Button() {
  return <button className={styles[Variant.Primary]} data-secondary={styles[Variant.Secondary]} />;
}
