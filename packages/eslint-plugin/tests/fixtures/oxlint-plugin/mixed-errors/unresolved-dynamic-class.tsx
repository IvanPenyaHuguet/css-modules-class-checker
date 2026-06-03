import styles from "./unresolved-dynamic-class.module.css";

export function UnresolvedDynamicClassMixed({
  disabledVariant,
  reportedVariant
}: {
  disabledVariant: string;
  reportedVariant: string;
}) {
  // eslint-disable-next-line @stale-styles/unresolved-dynamic-class
  const disabled = styles[disabledVariant];
  const reported = styles[reportedVariant];

  return <button className={`${disabled} ${reported}`}>Save</button>;
}
