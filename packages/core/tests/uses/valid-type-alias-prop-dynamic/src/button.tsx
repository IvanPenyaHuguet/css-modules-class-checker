import styles from "./button.module.css";

type Variant = "primary" | "secondary";

export function Button({ variant }: { variant: Variant }) {
  return <button className={styles[variant]} />;
}
