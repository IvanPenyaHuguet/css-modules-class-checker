import styles from "./button.module.css";

const variant = "primary";

type Props = {
  variant: string;
};

export function Button({ variant }: Props) {
  return <div className={styles[variant]} />;
}
