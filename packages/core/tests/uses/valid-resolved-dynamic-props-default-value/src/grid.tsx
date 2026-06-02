import clsx from "clsx";
import styles from "./grid.module.css";

type Props = {
  children?: string;
  variant?: "primary" | "secondary";
  className?: string;
};

export function Grid({ children, variant = "primary", className }: Props) {
  return <button className={clsx(styles.grid, styles[variant], className)}>{children}</button>;
}
