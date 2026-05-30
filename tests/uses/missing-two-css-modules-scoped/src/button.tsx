import buttonStyles from "./button.module.css";
import layoutStyles from "./layout.module.css";

export function Button() {
  return <button className={buttonStyles.primary} data-grid={layoutStyles.primary} />;
}
