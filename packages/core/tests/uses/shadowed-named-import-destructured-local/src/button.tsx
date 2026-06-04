import { primary } from "./button.module.css";

type Props = {
  primary: string;
};

export function Button(props: Props) {
  const { primary } = props;

  return <div className={primary} />;
}
