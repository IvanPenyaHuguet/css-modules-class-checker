import styles from "./button.module.css";

const tone: "Primary" | "Secondary" = "Primary";
const state: "Active" | "Disabled" = "Active";

export function Button() {
  return <button className={styles[`button${tone}${state}`]} />;
}
