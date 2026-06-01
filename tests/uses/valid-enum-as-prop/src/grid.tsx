import clsx from "clsx";
import styles from "./grid.module.css";

enum Variant {
  primary = "primary",
  secondary = "secondary"
}

type Props = {
  children?: string;
  variant?: Variant;
  className?: string;
};

export function Grid({ children, variant = Variant.primary, className }: Props) {
  return <button className={clsx(styles.grid, styles[variant], className)}>{children}</button>;
}
