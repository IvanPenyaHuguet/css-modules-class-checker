import { primary, secondary as danger } from "./button.module.css";

export function Button() {
  return <button className={primary + " " + danger} />;
}
