# @stale-styles/css-modules

Public Node.js API for checking CSS Modules class usage in JavaScript and
TypeScript projects.

Use this package when you want to run Stale Styles from a script, build tool,
custom reporter, editor integration, or any other Node.js workflow where a CLI
process is not the best fit.

## Installation

```bash
npm install --save-dev @stale-styles/css-modules
```

## API

```ts
import { checkCssModules } from "@stale-styles/css-modules";

const result = await checkCssModules({
  target: "src",
  ignore: ["generated"],
  matchFiles: [".module.css", ".icss.css", /\.m\.css$/],
  ignoreClasses: ["legacy-global", /^external-/],
  localsConvention: "camelCase",
  rules: {
    "unresolved-dynamic-class": "warning",
    "empty-css-module-selector": "off"
  }
});

console.log(result.status);
console.log(result.errors);
```

### `checkCssModules(options)`

Checks a target directory or source file and returns a `Promise<CheckResult>`.

```ts
type CheckOptions = {
  target?: string;
  ignore?: string[];
  matchFiles?: Array<string | RegExp>;
  ignoreClasses?: Array<string | RegExp>;
  localsConvention?:
    | "camelCase"
    | "camelCaseOnly"
    | "dashes"
    | "dashesOnly"
    | ((originalClassName: string, generatedClassName: string, inputFile: string) => string);
  rules?: Partial<Record<DiagnosticCode, "off" | "warning" | "error">>;
};
```

## Options

### `target`

Directory or source file to check. Defaults to the current working directory.

### `ignore`

File or directory patterns to skip while walking source files. These are merged
with the default ignored paths: `dist` and `node_modules`.

### `matchFiles`

String or RegExp matchers used to decide which imports are treated as CSS
Modules. The default is:

```ts
[".module.css"];
```

String matchers are suffix matches, so `.module.css` matches
`./button.module.css`. RegExp matchers are tested against both the import path
and the resolved file path.

### `ignoreClasses`

Class names or regular expressions that should not emit diagnostics. This
applies to missing, unused, raw string, and empty selector diagnostics.

### `localsConvention`

Maps CSS selector names to the names exposed by a CSS Modules implementation.
Supported string values are `camelCase`, `camelCaseOnly`, `dashes`, and
`dashesOnly`. A custom function can be used for project-specific transforms.

### `rules`

Per-rule severity overrides. Each rule accepts `off`, `warning`, or `error`.

## Result Shape

```ts
type CheckResult = {
  status: "SUCCESS" | "FAIL";
  errors: Diagnostic[];
  filesChecked: number;
  cssModulesChecked: number;
};
```

`errors` includes both warnings and errors. `status` is `FAIL` only when at
least one emitted diagnostic has `error` severity.

```ts
type Diagnostic = {
  code: DiagnosticCode;
  severity: "error" | "warning";
  message: string;
  filePath: string;
  line: number;
  column: number;
  cssModulePath?: string;
  className?: string;
};
```

## Rules

| Rule                        | Default | Meaning                                                                |
| --------------------------- | ------- | ---------------------------------------------------------------------- |
| `missing-css-module-class`  | `error` | A class is used from a CSS Module but is not defined in that CSS file. |
| `unused-css-module-class`   | `error` | A class is defined in a CSS Module but is never used.                  |
| `raw-css-module-class`      | `error` | A CSS Module class is used as a raw `className` or `class` string.     |
| `empty-css-module-selector` | `error` | A CSS Module class is defined by a selector with no declarations.      |
| `unresolved-dynamic-class`  | `error` | A dynamic `styles[...]` access cannot be resolved statically.          |
| `css-module-file-not-found` | `error` | A matched CSS Module import points to a missing file.                  |
| `css-parse-error`           | `error` | A CSS Module file cannot be parsed.                                    |
| `source-parse-error`        | `error` | A source file cannot be parsed.                                        |

## Package Commands

From this workspace:

```bash
npm run build --workspace @stale-styles/css-modules
npm run test --workspace @stale-styles/css-modules
npm run typecheck --workspace @stale-styles/css-modules
npm run lint --workspace @stale-styles/css-modules
npm run format:check --workspace @stale-styles/css-modules
```

## Related Packages

- [`@stale-styles/cli`](../cli/README.md) provides the executable command.
- [`@stale-styles/eslint-plugin`](../eslint-plugin/README.md) provides
  lint-rule integration.
