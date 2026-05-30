# css-modules-class-checker

Checks that class names used from CSS Modules are defined in their matching
`*.module.css` files, reports CSS Module classes that are never used, and
reports CSS Module classes used incorrectly as raw `className` strings.

The checker is built for JavaScript and TypeScript React projects, especially
`.tsx` files using CSS Modules. It supports direct `className` expressions as
well as composition through `clsx` and `classnames`. CSS Modules can be used
through default imports or named exports.

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
--locals-convention <name>  CSS Modules locals convention
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
css-modules-class-checker src --locals-convention camelCase
css-modules-class-checker src --rule unresolved-dynamic-class=warning
css-modules-class-checker src --rule empty-css-module-selector=off
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
  matchFiles: [".module.css", ".icss.css", /\.m\.css$/],
  ignoreClasses: ["legacy-global", /^external-/],
  localsConvention: "camelCase",
  rules: {
    "unresolved-dynamic-class": "warning"
  }
});

console.log(result.status);
console.log(result.errors);
```

### `target`

Directory to check. When omitted, the current working directory is checked.

### `ignore`

Array of file or directory patterns to skip while walking source files. These
patterns are merged with the default ignored paths: `dist` and `node_modules`.

### `matchFiles`

Array of string or RegExp matchers used to decide which imports are treated as
CSS Modules. The default is:

```ts
[".module.css"];
```

String matchers are suffix matches, so `.module.css` matches
`./button.module.css`. RegExp matchers are tested against the import path and the
resolved file path.

```ts
await checkCssModules({
  target: "src",
  matchFiles: [".module.css", ".icss.css", /\.m\.css$/]
});
```

### `ignoreClasses`

Array of class names or RegExp matchers that should not emit diagnostics. This
applies to missing, unused, raw string, and empty selector diagnostics.

```ts
await checkCssModules({
  target: "src",
  ignoreClasses: ["legacy-global", /^external-/]
});
```

### `localsConvention`

Follows the CSS Modules convention used by tools such as Vite. The default is
`undefined`, which means class names are not transformed: `.primary_button` is
available as `styles.primary_button`, and `.is-active` as
`styles["is-active"]`.

Supported values are `"camelCase"`, `"camelCaseOnly"`, `"dashes"`, and
`"dashesOnly"`. The API also accepts a Vite-style function:

```ts
await checkCssModules({
  target: "src",
  localsConvention: (originalClassName, generatedClassName, inputFile) => `$${originalClassName}`
});
```

### `rules`

Object that changes the severity for individual diagnostics. Each rule accepts
`"off"`, `"warning"`, or `"error"`.

```ts
await checkCssModules({
  target: "src",
  rules: {
    "unresolved-dynamic-class": "warning",
    "empty-css-module-selector": "off"
  }
});
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
| `unused-css-module-class`   | `error` | A class is defined in a CSS Module but is never used                  |
| `raw-css-module-class`      | `error` | A CSS Module class is used as a raw `className` string                |
| `empty-css-module-selector` | `error` | A CSS Module class is defined by a selector with no declarations      |
| `unresolved-dynamic-class`  | `error` | A dynamic `styles[...]` access cannot be resolved statically          |
| `css-module-file-not-found` | `error` | A matched CSS Module import points to a missing file                  |
| `css-parse-error`           | `error` | A CSS Module file cannot be parsed                                    |
| `source-parse-error`        | `error` | A source file cannot be parsed                                        |

## Diagnostics

| Code                        | Example                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `missing-css-module-class`  | `styles.secondary` while only `.primary` exists                         |
| `unused-css-module-class`   | `.secondary` exists but no source file uses it                          |
| `raw-css-module-class`      | `className="primary"` when `.primary` belongs to an imported CSS Module |
| `empty-css-module-selector` | `.marker { /* EMPTY */ }`                                               |
| `unresolved-dynamic-class`  | `styles[getClassName()]`                                                |
| `css-module-file-not-found` | `import styles from "./missing.module.css"`                             |
| `css-parse-error`           | Unmatched braces in a CSS Module                                        |
| `source-parse-error`        | Reserved for source parser failures                                     |

## Supported Patterns

See [Supported Patterns](docs/supported-patterns.md) for examples of supported CSS Module access patterns, `clsx`/`classnames` usage, and raw class string detection.

## Known Limitations

- By default, only `*.module.css` files are treated as CSS Modules. Use `matchFiles` to opt into other CSS Module filename conventions.
- Non-resolvable dynamic classes such as `styles[getClassName()]` are reported as `unresolved-dynamic-class` instead of being guessed.
- Raw string detection is scoped to files that import a CSS Module.
- ID selectors and HTML tag selectors are not checked, and the checker cannot reliably know whether nested selectors are satisfied by rendered `children`. Selectors that depend on child ids or HTML tags may be reported as false positives.
- Classes inside CSS Modules `:global(...)` selectors are ignored as local module classes. Mixed local/global compound selectors are not exhaustively modeled.
