import styles from "./profile.module.css";

const tone = getTone();

export function Profile() {
  return (
    <article className={`${styles.card} ${styles.ghost} ${styles[tone]}`}>
      <span className={styles.avatar} />
    </article>
  );
}

function getTone() {
  return Math.random() > 0.5 ? "quiet" : "loud";
}
