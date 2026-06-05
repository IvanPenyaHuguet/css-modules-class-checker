import styles from "./button.module.css";

export function Button({ size, tone }: { size: string; tone: string }) {
  return (
    <>
      <button className={`${styles.root} ${styles[size]}`} />
      <button className={`${styles.root} ${styles[tone]}`} />
    </>
  );
}
