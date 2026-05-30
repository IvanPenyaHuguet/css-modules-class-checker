declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "clsx" {
  export default function clsx(...inputs: unknown[]): string;
}

declare module "classnames" {
  export default function classNames(...inputs: unknown[]): string;
}

declare namespace JSX {
  interface IntrinsicElements {
    button: Record<string, unknown>;
  }
}
