# css-modules-class-checker

Checks that class names used from CSS Modules are defined in their matching
`*.module.css` files, and reports CSS Module classes used incorrectly as raw
`className` strings.

The checker is built for JavaScript and TypeScript React projects, especially
`.tsx` files using CSS Modules. It supports direct `className` expressions as
well as composition through `clsx` and `classnames`.

## Installation And Usage

Run without installing:

```bash
npx css-modules-class-checker src
pnpm dlx css-modules-class-checker src
```

Run a local binary:

```bash
npm install --save-dev css-modules-class-checker
npx css-modules-class-checker src
```

The target argument is optional. When omitted, the current directory is checked.

```bash
css-modules-class-checker [target]
```

## CLI Options

```bash
--ignore <pattern...>       Ignore files or directories
--ignore-class <name...>    Ignore specific class names
--rule <rule=level...>      Configure rules: off, warning, or error
```

Default ignored paths are always merged in:

```text
dist
node_modules
```

Examples:

```bash
css-modules-class-checker src --ignore generated
css-modules-class-checker src --ignore-class legacy-global external
css-modules-class-checker src --rule unresolved-dynamic-class=warning
```

Exit codes:

| Code | Meaning                            |
| ---- | ---------------------------------- |
| `0`  | No error diagnostics were found    |
| `1`  | Error diagnostics were found       |
| `2`  | CLI configuration or runtime error |

## API Usage

```ts
import { checkCssModules } from "css-modules-class-checker";

const result = await checkCssModules({
  target: "src",
  ignore: ["dist", "node_modules"],
  ignoreClasses: ["legacy-global", /^external-/],
  rules: {
    "unresolved-dynamic-class": "warning"
  }
});

console.log(result.status);
console.log(result.errors);
```

## Result Shape

```ts
type CheckResult = {
  status: "SUCCESS" | "FAIL";
  errors: Diagnostic[];
  filesChecked: number;
  cssModulesChecked: number;
};
```

`errors` may include warning diagnostics. `status` is `"FAIL"` only when at
least one emitted diagnostic has severity `"error"`.

## Rules

Each rule accepts `off`, `warning`, or `error`.

| Rule                        | Default | Meaning                                                               |
| --------------------------- | ------- | --------------------------------------------------------------------- |
| `missing-css-module-class`  | `error` | A class is used from a CSS Module but is not defined in that CSS file |
| `raw-css-module-class`      | `error` | A CSS Module class is used as a raw `className` string                |
| `unresolved-dynamic-class`  | `error` | A dynamic `styles[...]` access cannot be resolved statically          |
| `css-module-file-not-found` | `error` | A `*.module.css` import points to a missing file                      |
| `css-parse-error`           | `error` | A CSS Module file cannot be parsed                                    |
| `source-parse-error`        | `error` | A source file cannot be parsed                                        |

## Diagnostics

| Code                        | Example                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `missing-css-module-class`  | `styles.secondary` while only `.primary` exists                         |
| `raw-css-module-class`      | `className="primary"` when `.primary` belongs to an imported CSS Module |
| `unresolved-dynamic-class`  | `styles[getClassName()]`                                                |
| `css-module-file-not-found` | `import styles from "./missing.module.css"`                             |
| `css-parse-error`           | Unmatched braces in a CSS Module                                        |
| `source-parse-error`        | Reserved for source parser failures                                     |

## Supported Patterns

```tsx
import styles from "./button.module.css";

styles.primary;
styles["primary"];
styles[`primary`];

const variant = "primary";
styles[variant];

const kind = active ? "primary" : "secondary";
styles[kind];

type Variant = "primary" | "secondary";
styles[variant];

const classMap = { primary: "primary" } as const;
styles[classMap.primary];

enum VariantClass {
  Primary = "primary"
}
styles[VariantClass.Primary];

const tone: "Primary" | "Secondary" = "Primary";
const state: "Active" | "Disabled" = "Active";
styles[`button${tone}${state}`];
```

`clsx` and `classnames` are supported, including common conditional patterns:

```tsx
className={clsx(styles.primary, active && styles.active)}
className={classNames(styles.primary)}
className={clsx({ primary: active })}
```

Raw class strings matching an imported CSS Module class are reported:

```tsx
import styles from "./button.module.css";

className="primary";
className={clsx("primary")}
className={clsx({ primary: active })}
```

## Known Limitations

- Only `*.module.css` files are supported. SCSS, SASS, LESS, Stylus, and other
  preprocessors are out of scope.
- Non-resolvable dynamic classes such as `styles[getClassName()]` are reported
  as `unresolved-dynamic-class` instead of being guessed.
- Raw string detection is scoped to files that import a CSS Module.
