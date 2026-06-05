import clsx from "clsx";
import styles from "./button.module.css";

type Props = {
  active: boolean;
  tone: "primary" | "secondary";
};

export function Button({ active, tone }: Props) {
  return (
    <>
      <button className={styles[active ? "primary" : "secondary"]} />
      <button className={tone === "primary" ? styles.primary : styles.secondary} />
      <button className={clsx({ [styles[active ? "primary" : "secondary"]]: active })} />
    </>
  );
}
