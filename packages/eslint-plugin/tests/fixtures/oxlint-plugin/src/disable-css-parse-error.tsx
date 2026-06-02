/* eslint-disable css-modules-class-checker/css-parse-error */
import styles from "./disable-css-parse-error.module.css";

void styles;

export function DisabledCssParseError() {
  return <button>Save</button>;
}
