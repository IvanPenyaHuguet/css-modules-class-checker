# Stale Styles

Stale Styles checks the contract between React/JavaScript source files and the
CSS Modules they import. It reports classes used from a module but not defined
there, local module classes that are no longer used, CSS Module classes written
as raw `className` strings, empty module selectors, missing module files, and
dynamic class accesses that cannot be resolved statically.

The project is useful when CSS Modules are already part of a codebase and you
want a CI-friendly way to keep components and stylesheets in sync without
generating `.d.ts` files or relying only on editor feedback.

## Packages

| Package | Use it when | Highlights |
| ------- | ----------- | ---------- |
| [`@stale-styles/cli`](packages/cli/README.md) | You want a command that can run locally, in npm scripts, or in CI. | Project scan, text report, exit codes, rule severity flags, ignore options, locals convention support. |
| [`@stale-styles/css-modules`](packages/css-modules-app/README.md) | You want to call the checker from Node.js code. | Public programmatic API, typed options and diagnostics, custom `matchFiles`, custom `ignoreClasses`, custom `localsConvention`. |
| [`@stale-styles/eslint-plugin`](packages/eslint-plugin/README.md) | You want diagnostics through ESLint or Oxlint. | Flat-config compatible plugin shape, `recommended` config, individual rules, inline disable support from the lint runner. |
| [`@stale-styles/core`](packages/core/README.md) | Internal implementation package. | Private shared analysis engine for the public packages. Not intended for direct use. |

See each package README for installation, API details, commands, and examples.
For examples of supported syntax, see
[Supported Patterns](docs/supported-patterns.md).

## Quick Start

Run the standalone checker without installing it:

```bash
npx @stale-styles/cli src
```

Or add it to a project:

```bash
npm install --save-dev @stale-styles/cli
npx stale-styles src
```

For lint integration:

```bash
npm install --save-dev @stale-styles/eslint-plugin
```

```ts
import cssModules from "@stale-styles/eslint-plugin/css-modules";

export default [cssModules.configs.recommended];
```

For programmatic usage:

```bash
npm install --save-dev @stale-styles/css-modules
```

```ts
import { checkCssModules } from "@stale-styles/css-modules";

const result = await checkCssModules({ target: "src" });

if (result.status === "FAIL") {
  console.log(result.errors);
}
```

## Rules

Stale Styles is organized around rule-style diagnostics. The CLI and public API
support all rules below, including parse-error diagnostics. The ESLint/Oxlint
plugin exposes the source-level CSS Modules rules that fit lint workflows.

Each rule can be configured as `off`, `warning`, or `error` in the CLI and API.
In the lint plugin, the same checks are exposed as individual lint rules with
the `@stale-styles/*` prefix.

| Rule | Applies to | Meaning |
| ---- | ---------- | ------- |
| `missing-css-module-class` | CLI, API, plugin | Reports class names used from a CSS Module import when that class is not defined by the imported CSS file. |
| `unused-css-module-class` | CLI, API, plugin | Reports local CSS Module classes that are defined in a module file but are not used by the source files that import it. |
| `raw-css-module-class` | CLI, API, plugin | Reports CSS Module classes written as raw `className` or `class` strings instead of being read from the module import. |
| `empty-css-module-selector` | CLI, API, plugin | Reports CSS Module classes whose selector has no declarations, which often means a stale or placeholder class remained in the stylesheet. |
| `unresolved-dynamic-class` | CLI, API, plugin | Reports dynamic `styles[...]` access when the possible class names cannot be resolved statically. |
| `css-module-file-not-found` | CLI, API, plugin | Reports imports that match the CSS Module file convention but point to a file that does not exist. |
| `css-parse-error` | CLI, API | Reports CSS Module files that cannot be parsed. |
| `source-parse-error` | CLI, API | Reports source files that cannot be parsed. |

The checker supports common React and TypeScript patterns, including default
CSS Module imports, named exports, dot and bracket access, static constants,
template literal unions, destructured aliases, `clsx`, and `classnames`. For
concrete examples, see [Supported Patterns](docs/supported-patterns.md).

## Why Use It

CSS Modules make class names local, but they do not automatically prove that the
source and stylesheet still agree. TypeScript typings can catch some missing
classes, but they usually do not catch unused module selectors, raw string
misuse, empty selectors, or missing module files.

Stale Styles is designed to be:

- CI-friendly: the CLI returns failing exit codes for error diagnostics.
- Integration-friendly: the same analysis is available as a public Node.js API
  and as an ESLint/Oxlint plugin.
- Scoped to CSS Modules: identical class names can safely exist in different
  module files because checks are tied to real imports.
- Configurable: rules can be turned off, downgraded to warnings, or kept as
  errors depending on migration needs.
- Type-generation-free: no generated declaration files are required.

## Comparison

Several popular tools help with CSS Modules or unused CSS, but they usually
optimize for editor feedback, generated typings, lint integration, or production
CSS pruning. Stale Styles is focused on a narrower contract: checking that
React/TypeScript source files and the CSS Modules they import stay in sync, with
three public entry points depending on how you want to run the check:

- [`@stale-styles/cli`](packages/cli/README.md) for a standalone command and CI
  exit codes.
- [`@stale-styles/css-modules`](packages/css-modules-app/README.md) for a
  programmatic Node.js API.
- [`@stale-styles/eslint-plugin`](packages/eslint-plugin/README.md) for
  ESLint/Oxlint workflows.

| Tool | Main focus | How Stale Styles differs |
| ---- | ---------- | ------------------------ |
| [`typescript-plugin-css-modules`](https://www.npmjs.com/package/typescript-plugin-css-modules) | TypeScript language service plugin for CSS Modules editor completions and type information. | It improves the editor experience, but it is not a project checker you can run as a CLI in CI. Stale Styles can fail a pipeline when a module class is missing, when a CSS class is declared but never used, when a module class is written as a raw `className` string, or when a dynamic access cannot be resolved statically. |
| [`typed-css-modules`](https://github.com/Quramy/typed-css-modules) / [`typed-scss-modules`](https://www.npmjs.com/package/typed-scss-modules) | Generate `.d.ts` files so TypeScript can type CSS/SCSS Module exports. | Generated typings catch some missing class accesses through TypeScript, but they do not detect unused CSS Module classes, raw string misuse, empty selectors, missing CSS Module files, or unresolved dynamic class names. Stale Styles also avoids adding generated declaration files to the repo. |
| [`eslint-plugin-css-modules`](https://www.npmjs.com/package/eslint-plugin-css-modules) | ESLint rules for undefined and unused CSS Module classes. | Stale Styles now has its own lint plugin, but the lint plugin is only one entry point. The same analysis is also available through a standalone CLI and a public API, and it covers additional source patterns such as `clsx`/`classnames`, bracket access, template literals, static constants, named exports, raw module classes in strings, empty CSS Module selectors, missing module files, and unresolved dynamic class accesses. |
| [`eslint-plugin-postcss-modules`](https://www.npmjs.com/package/eslint-plugin-postcss-modules) | ESLint rules that use PostCSS to validate CSS Module exports. | Stale Styles can be used inside lint workflows, but it is not tied to ESLint. It also reports CI-friendly diagnostics through the CLI and includes checks beyond exported class existence: unused local module classes, raw `className` strings, empty selectors, missing imported CSS Module files, CSS/source parse errors, and non-resolvable dynamic accesses. |
| [`stylelint-no-unused-selectors`](https://npm.io/package/stylelint-no-unused-selectors) | Stylelint rule for finding unused selectors by comparing stylesheets with nearby documents such as JSX, TSX, or HTML. | It starts from selectors and nearby content. Stale Styles starts from real CSS Module imports in JS/TS, which keeps classes scoped to the module file that exported them and lets it validate object-based usage like `styles.foo`, `styles["foo"]`, destructured aliases, named exports, and `clsx`/`classnames` compositions. |
| [`PurgeCSS`](https://purgecss.com/) / [`purgecss`](https://www.npmjs.com/package/purgecss) | Remove unused CSS from production output by scanning content and stylesheets. | Purging is a build optimization step, not a source-contract validator. Stale Styles does not mutate CSS output; it reports actionable diagnostics before merge/build when a component and its imported CSS Module drift apart. |
| [`UnCSS`](https://github.com/uncss/uncss) / [`ucss`](https://www.npmjs.com/package/ucss) | Detect or remove unused CSS from HTML or rendered pages. | These tools are better suited to global CSS and page-level analysis. Stale Styles is specialized for static analysis of React/TypeScript components that import CSS Modules, including same class names appearing safely in different module files. |

In short: type-generation and editor plugins help while writing code, ESLint and
Stylelint plugins tie checks to their respective ecosystems, and CSS purgers
optimize final output. Stale Styles is meant to be a dedicated CSS Modules
consistency check that can run locally, in scripts, in CI, through a Node.js API,
or as lint rules.

## Known Limitations

- By default, only imports ending in `.module.css` are treated as CSS Modules.
  The API and plugin support `matchFiles` for other conventions.
- Non-resolvable dynamic classes are reported instead of guessed.
- Raw string detection is scoped to files that import CSS Modules.
- ID selectors and HTML tag selectors are not checked.
- Selectors that depend on rendered children may produce false positives.
- Classes inside `:global(...)` are ignored as local module classes.
- Sass/Less parsing is not a first-class feature unless the compiled or imported
  file is compatible with the supported CSS parser.
