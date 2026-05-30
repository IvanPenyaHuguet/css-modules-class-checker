import styles from "./button.module.css";

export function Button({ variant }: { variant: "primary" | "secondary" }) {
  return <button className={styles[variant]} />;
}
