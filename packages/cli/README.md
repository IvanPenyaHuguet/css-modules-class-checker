# @stale-styles/cli

Executable CLI for checking CSS Modules class usage in JavaScript and
TypeScript projects.

Use this package when you want a command that can run in a terminal, npm script,
pre-commit hook, or CI pipeline. It wraps the public
`@stale-styles/css-modules` API and prints a human-readable text report.

## Installation

Run without installing:

```bash
npx @stale-styles/cli src
pnpm dlx @stale-styles/cli src
```

Install locally:

```bash
npm install --save-dev @stale-styles/cli
npx stale-styles src
```

## Usage

```bash
stale-styles [target]
```

`target` is optional. When omitted, the current directory is checked.

Examples:

```bash
stale-styles
stale-styles src
stale-styles packages/css-modules-app/src
```

## Options

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

`--locals-convention` accepts:

```text
camelCase
camelCaseOnly
dashes
dashesOnly
```

Examples:

```bash
stale-styles src --ignore generated
stale-styles src --ignore-class legacy-global external
stale-styles src --locals-convention camelCase
stale-styles src --rule unresolved-dynamic-class=warning
stale-styles src --rule empty-css-module-selector=off
```

## Rules

Each rule accepts `off`, `warning`, or `error`.

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

## Exit Codes

| Code | Meaning                             |
| ---- | ----------------------------------- |
| `0`  | No error diagnostics were found.    |
| `1`  | Error diagnostics were found.       |
| `2`  | CLI configuration or runtime error. |

Warnings are printed in the report but do not make the result fail unless at
least one diagnostic has `error` severity.

## Package Commands

From this workspace:

```bash
npm run build --workspace @stale-styles/cli
npm run test --workspace @stale-styles/cli
npm run typecheck --workspace @stale-styles/cli
npm run lint --workspace @stale-styles/cli
npm run format:check --workspace @stale-styles/cli
```

## Related Packages

- [`@stale-styles/css-modules`](../css-modules-app/README.md) exposes the same
  checker as a public Node.js API.
- [`@stale-styles/eslint-plugin`](../eslint-plugin/README.md) exposes the
  checks as ESLint/Oxlint rules.
