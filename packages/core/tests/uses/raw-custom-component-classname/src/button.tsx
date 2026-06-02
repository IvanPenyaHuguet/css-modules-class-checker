import styles from "./button.module.css";

type ButtonViewProps = {
  className: string;
};

function ButtonView({ className }: ButtonViewProps) {
  return <button className={className} />;
}

export function Button() {
  return <ButtonView className="primary" data-primary={styles.primary} />;
}
