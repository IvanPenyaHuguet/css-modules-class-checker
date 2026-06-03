# @stale-styles/eslint-plugin

ESLint and Oxlint plugin for checking CSS Modules class usage from lint
workflows.

Use this package when you want CSS Modules diagnostics to appear beside other
lint findings, use lint formatter output, or apply inline rule disables managed
by ESLint/Oxlint.

## Installation

```bash
npm install --save-dev @stale-styles/eslint-plugin
```

Install the lint runner you use as well:

```bash
npm install --save-dev eslint
npm install --save-dev oxlint
```

Both `eslint` and `oxlint` are optional peer dependencies because the package can
be consumed by either ecosystem.

## Usage

The plugin is exported from the package root and from the convenience subpath
`@stale-styles/eslint-plugin/css-modules`.

```ts
import cssModules from "@stale-styles/eslint-plugin/css-modules";

export default [cssModules.configs.recommended];
```

The `recommended` config enables all plugin rules as errors.

## Manual Configuration

```ts
import cssModules from "@stale-styles/eslint-plugin/css-modules";

export default [
  {
    plugins: {
      "@stale-styles": cssModules
    },
    rules: {
      "@stale-styles/missing-css-module-class": "error",
      "@stale-styles/unused-css-module-class": "warn",
      "@stale-styles/raw-css-module-class": "error",
      "@stale-styles/empty-css-module-selector": "off",
      "@stale-styles/unresolved-dynamic-class": "warn",
      "@stale-styles/css-module-file-not-found": "error"
    }
  }
];
```

## Rule Options

Each rule accepts the same options object:

```ts
{
  ignoreClasses?: string[];
  ignoreClassPatterns?: string[];
  localsConvention?: "camelCase" | "camelCaseOnly" | "dashes" | "dashesOnly";
  matchFiles?: string[];
}
```

Example:

```ts
import cssModules from "@stale-styles/eslint-plugin/css-modules";

const options = {
  ignoreClasses: ["legacy-global"],
  ignoreClassPatterns: ["^external-"],
  localsConvention: "camelCase",
  matchFiles: [".module.css", ".icss.css"]
};

export default [
  {
    plugins: {
      "@stale-styles": cssModules
    },
    rules: {
      "@stale-styles/missing-css-module-class": ["error", options],
      "@stale-styles/unused-css-module-class": ["warn", options],
      "@stale-styles/raw-css-module-class": ["error", options],
      "@stale-styles/empty-css-module-selector": ["error", options],
      "@stale-styles/unresolved-dynamic-class": ["warn", options],
      "@stale-styles/css-module-file-not-found": ["error", options]
    }
  }
];
```

## Rules

| Rule                                      | Recommended | Meaning                                                                          |
| ----------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| `@stale-styles/missing-css-module-class`  | `error`     | Disallows CSS Module class usages that are not defined in the imported CSS file. |
| `@stale-styles/unused-css-module-class`   | `error`     | Disallows CSS Module classes that are not used by the source file.               |
| `@stale-styles/raw-css-module-class`      | `error`     | Disallows imported CSS Module classes written as raw class strings.              |
| `@stale-styles/empty-css-module-selector` | `error`     | Disallows CSS Module classes defined by empty selectors.                         |
| `@stale-styles/unresolved-dynamic-class`  | `error`     | Disallows dynamic CSS Module class access that cannot be resolved statically.    |
| `@stale-styles/css-module-file-not-found` | `error`     | Disallows imports of missing CSS Module files.                                   |

`css-parse-error` and `source-parse-error` are handled by the standalone checker
API/CLI and are not exposed as plugin rules.

## Package Commands

From this workspace:

```bash
npm run build --workspace @stale-styles/eslint-plugin
npm run test --workspace @stale-styles/eslint-plugin
npm run typecheck --workspace @stale-styles/eslint-plugin
npm run lint --workspace @stale-styles/eslint-plugin
npm run format:check --workspace @stale-styles/eslint-plugin
```

## Related Packages

- [`@stale-styles/cli`](../cli/README.md) is better when you want a standalone
  project check with CI exit codes.
- [`@stale-styles/css-modules`](../css-modules-app/README.md) is better when
  you want to call the checker directly from Node.js.
