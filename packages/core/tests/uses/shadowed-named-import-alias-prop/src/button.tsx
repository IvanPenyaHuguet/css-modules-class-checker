import { primary as buttonPrimary } from "./button.module.css";

type Props = {
  buttonPrimary: string;
};

export function Button({ buttonPrimary }: Props) {
  return <div className={buttonPrimary} />;
}
