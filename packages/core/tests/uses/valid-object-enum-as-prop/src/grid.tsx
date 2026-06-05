import clsx from "clsx";
import styles from "./grid.module.css";

const Variant = {
  primary: "primary",
  secondary: "secondary"
} as const;
type Variant = (typeof Variant)[keyof typeof Variant];

type Props = {
  children?: string;
  variant?: Variant;
  className?: string;
};

export function Grid({ children, variant = Variant.primary, className }: Props) {
  return <button className={clsx(styles.grid, styles[variant], className)}>{children}</button>;
}
