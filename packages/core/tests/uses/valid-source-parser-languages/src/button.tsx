import styles from "./button.module.css";

type ButtonProps = {
  label: string;
};

export function TsxButton(props: ButtonProps) {
  return <button className={styles.root}>{props.label}</button>;
}
