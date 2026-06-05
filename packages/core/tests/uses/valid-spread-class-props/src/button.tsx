import styles from "./button.module.css";

export function Button() {
  const props = {
    className: styles.primary
  };

  return <button {...props} />;
}
