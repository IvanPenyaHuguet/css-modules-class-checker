import { primary } from "./button.module.css";

type Props = {
  primary: string;
};

export function Button({ primary }: Props) {
  return <div className={primary} />;
}
