import styles from "./button.module.css";

type Variant = "primary" | "secondary";

export function Button({ variant: selected = "primary" }: { variant?: Variant }) {
  return <button className={styles[selected]} />;
}
