# Spec Driven Development Plan

Provisional project name: `css-modules-class-checker`

This document turns the user specification into an executable Spec Driven Development and TDD plan. The project rule is: first write the reproducible use case, then write the failing automated test, and only then implement the minimum behavior required to make it pass.

## Goal

Create a Node.js executable tool that detects CSS Modules usage errors in TypeScript React projects, especially `.tsx` files that import `*.module.css`.

The tool must support two usage modes:

- CLI usage: `npx css-modules-class-checker`, `pnpm dlx css-modules-class-checker`, or a local binary.
- Importable API usage from JavaScript/TypeScript for scripts, CI, build processes, and custom tooling.

## File Naming Convention

All project files must use kebab-case names.

Examples:

- `use-cases.ts`
- `something-something-asd.tsx`
- `button.tsx`
- `button.module.css`
- `extract-classes.ts`

This rule applies to source files, test files, fixtures, documentation-adjacent files, and example paths used in this specification.

## Initial Technical Decision

The first implementation will use TypeScript on Node.js.

Proposed stack:

- Runtime: Node.js `>=22` (LTS).
- Language: TypeScript.
- CLI: `commander` or `cac`.
- JS/TS/TSX parser: `@oxc-parser/binding`.
- File discovery: `fast-glob`.
- Ignore pattern matching: `picomatch`.
- CSS parser: `postcss` + `postcss-selector-parser`.
- Tests: `vitest`.
- Real usage fixtures: `tests/uses/<case-name>`.
- Build: `tsup`.
- Recommended package manager: `pnpm`.

Why this choice:

- It remains executable from JavaScript and distributable through npm.
- OXC gives fast TS/TSX parsing without starting with a full Rust codebase.
- TypeScript keeps the initial API, CLI, and test iteration cost low.
- If a real performance bottleneck appears later, the analysis engine can move to Rust while keeping the same public API.

## V1 Scope

V1 will support:

- Source files: `.js`, `.jsx`, `.ts`, `.tsx`.
- CSS Modules: only `*.module.css` files.
- React projects that use `className`.
- CSS Module namespace imports:

```tsx
import styles from "./button.module.css";
```

- Dot notation usage:

```tsx
<button className={styles.primary} />
```

- Statically resolvable bracket notation usage:

```tsx
<button className={styles["primary"]} />
```

- Composition through `clsx` and `classnames`.
- Detection of classes used from a CSS Module but not defined in that CSS Module.
- Detection of CSS Module classes used as raw strings in `className`.
- Basic CLI configuration: target directory, ignores, ignored classes, and rules.
- Default ignore entries: `dist` and `node_modules`.

Out of scope for V1:

- SCSS, SASS, LESS, Stylus, or any other preprocessor.
- Full TypeScript type analysis.
- Arbitrary code evaluation.
- Perfect support for non-statically-resolvable dynamic classes.
- Advanced bundler-specific CSS Modules configuration.

## Result Model

The analyzer must always return an object with `status`. If the run fails, `status` is `"FAIL"` and diagnostics are returned inside `errors`. If the run succeeds, `status` is `"SUCCESS"` and `errors` is an empty array.

```ts
type CheckStatus = "SUCCESS" | "FAIL";

type RuleLevel = "off" | "warning" | "error";

type Diagnostic = {
  code:
    | "missing-css-module-class"
    | "raw-css-module-class"
    | "unresolved-dynamic-class"
    | "css-module-file-not-found"
    | "css-parse-error"
    | "source-parse-error";
  severity: "error" | "warning";
  message: string;
  filePath: string;
  line: number;
  column: number;
  cssModulePath?: string;
  className?: string;
};

type CheckResult = {
  status: CheckStatus;
  errors: Diagnostic[];
  filesChecked: number;
  cssModulesChecked: number;
};
```

Even though the array is named `errors`, it may contain diagnostics with `severity: "warning"` when a rule is configured as a warning. `status` is `"FAIL"` only when at least one emitted diagnostic has `severity: "error"`.

Initial rules:

- `missing-css-module-class`: emitted when `styles.foo` or `styles["foo"]` does not exist in the imported CSS Module.
- `raw-css-module-class`: emitted when a CSS Module class is used directly as a `className` string, for example `className="primary"`.
- `unresolved-dynamic-class`: emitted when a dynamic class access cannot be resolved statically, for example `styles[getClassName()]`, unless the user sets the rule to `warning` or `off`.
- Parse errors and missing files stop analysis for that file, but not for the whole run.

All rules are enabled as `error` by default.

## Dynamic Class Semantics

Dynamic usage must not all be treated the same.

Resolvable and checkable cases:

```tsx
styles["primary"]
styles[`primary`]
const kind = "primary";
styles[kind]
```

Partially resolvable cases:

```tsx
const kind = active ? "primary" : "secondary";
styles[kind]
```

For these cases, all known static alternatives must be checked.

Non-resolvable cases:

```tsx
styles[dynamicClass]
styles[getClassName()]
styles[prefix + suffix]
```

These usages must not produce false `missing-css-module-class` errors. In V1 they produce `unresolved-dynamic-class` according to the configured rule level. By default this is an error.

## Rules Configuration

Rules are configured through an object where each key is a diagnostic code and each value controls the rule level:

```ts
type RulesConfig = Partial<Record<Diagnostic["code"], RuleLevel>>;
```

Example:

```ts
rules: {
  "missing-css-module-class": "error",
  "raw-css-module-class": "error",
  "unresolved-dynamic-class": "warning",
  "css-module-file-not-found": "error",
  "css-parse-error": "error",
  "source-parse-error": "error",
}
```

Allowed values:

- `error`: emits a diagnostic with `severity: "error"` and can make the result `"FAIL"`.
- `warning`: emits a diagnostic with `severity: "warning"` without failing the result.
- `off`: disables the rule.

Default configuration:

```ts
rules: {
  "missing-css-module-class": "error",
  "raw-css-module-class": "error",
  "unresolved-dynamic-class": "error",
  "css-module-file-not-found": "error",
  "css-parse-error": "error",
  "source-parse-error": "error",
}
```

## CLI Proposal

Base command:

```bash
css-modules-class-checker [target]
```

Options:

```bash
--ignore <pattern...>       Ignore files or directories
--ignore-class <name...>    Ignore specific class names
--rule <rule=level...>      Configure rules: off, warning, or error
```

The CLI will only support one output format in V1: human readable. The output should be short, legible, and grouped clearly by file, with low-level information reduced.

Default ignored paths:

```text
dist
node_modules
```

Exit codes:

- `0`: no errors.
- `1`: errors were found.
- `2`: CLI configuration or runtime error.

## API Proposal

```ts
import { checkCssModules } from "css-modules-class-checker";

const result = await checkCssModules({
  target: "src",
  ignore: ["dist", "node_modules"],
  ignoreClasses: ["legacy-global", /^external-/],
  rules: {
    "unresolved-dynamic-class": "warning",
  },
});

console.log(result.status);
console.log(result.errors);
```

Main types:

```ts
type CheckOptions = {
  target?: string;
  ignore?: string[];
  ignoreClasses?: Array<string | RegExp>;
  rules?: RulesConfig;
};
```

`ignore` is always merged with the default ignores `["dist", "node_modules"]`, unless a future version adds an explicit option to replace the defaults.

## README Documentation

The project must include a clear and maintainable `README.md` before V1 can be considered complete.

It must document:

- Installation and execution with `npx`, `pnpm dlx`, and a local binary.
- Basic CLI usage with the `[target]` argument.
- Default ignored paths: `dist` and `node_modules`.
- Configuration for `--ignore`, `--ignore-class`, and `--rule`.
- Usage as an importable JavaScript/TypeScript API.
- The exact result shape: `status`, `errors`, `filesChecked`, and `cssModulesChecked`.
- `ignoreClasses` with strings and regular expressions.
- A table of available rules with `off`, `warning`, and `error`.
- A table of errors with code, meaning, default severity, and a short example.
- Known V1 limitations, especially non-resolvable dynamic classes and the lack of SCSS support.

## Architecture

Planned modules:

- `src/cli.ts`: CLI entry point, argument parsing, and exit codes.
- `src/index.ts`: public API.
- `src/checker.ts`: analysis orchestration.
- `src/files.ts`: source and CSS Module discovery.
- `src/css/extract-classes.ts`: class extraction from `*.module.css`.
- `src/source/parse.ts`: TS/TSX parsing with OXC.
- `src/source/imports.ts`: CSS Module import detection.
- `src/source/class-usages.ts`: extraction of `styles.foo`, `styles["foo"]`, `clsx(...)`, `classnames(...)`, and `className` usage.
- `src/source/resolve-static.ts`: limited static resolution of strings, constants, and simple conditionals.
- `src/reporters/text.ts`: human readable output.

Flow:

1. Resolve `target` and ignores.
2. Find `.js/.jsx/.ts/.tsx` source files.
3. Parse each source file with OXC.
4. Detect `*.module.css` imports.
5. Parse each imported CSS Module and extract exportable classes.
6. Extract class usages from the AST.
7. Compare usages against defined classes.
8. Emit normalized diagnostics.
9. Apply rules and ignored classes.
10. Render human readable CLI output or return the API result.

## TDD Strategy

Tests will have two levels:

- `tests/unit`: small tests for pure functions.
- `tests/uses`: integrated fixtures that simulate real projects.

Each case in `tests/uses` will have this shape:

```text
tests/uses/
  valid-basic/
    src/
      button.tsx
      button.module.css
    expected.json
  missing-class/
    src/
      button.tsx
      button.module.css
    expected.json
```

`expected.json` contains the expected result for that case. The test runner will walk every folder under `tests/uses`, run the checker against each fixture, and compare the normalized result.

The fixture test runner should be named `use-cases.ts`.

Recommended format:

```json
{
  "status": "FAIL",
  "errors": [
    {
      "code": "missing-css-module-class",
      "severity": "error",
      "filePath": "src/button.tsx",
      "className": "missing"
    }
  ]
}
```

The first test phase will not compare absolute paths or full messages. It will compare `status`, `code`, `severity`, `filePath`, `className`, and `cssModulePath` when applicable.

## Initial Use Cases

### 1. valid-basic

Must pass with no diagnostics.

```tsx
import styles from "./button.module.css";

export function Button() {
  return <button className={styles.primary} />;
}
```

```css
.primary {
  color: red;
}
```

### 2. missing-dot-notation

Must emit `missing-css-module-class`.

```tsx
import styles from "./button.module.css";

export function Button() {
  return <button className={styles.secondary} />;
}
```

```css
.primary {
  color: red;
}
```

### 3. valid-bracket-notation

Must pass with no diagnostics.

```tsx
import styles from "./button.module.css";

export function Button() {
  return <button className={styles["primary"]} />;
}
```

### 4. missing-bracket-notation

Must emit `missing-css-module-class` for `secondary`.

```tsx
import styles from "./button.module.css";

export function Button() {
  return <button className={styles["secondary"]} />;
}
```

### 5. valid-clsx

Must recognize `clsx` and validate module classes.

```tsx
import clsx from "clsx";
import styles from "./button.module.css";

export function Button({ active }: { active: boolean }) {
  return <button className={clsx(styles.primary, active && styles.active)} />;
}
```

### 6. valid-classnames

Must recognize `classnames` and validate module classes.

```tsx
import classNames from "classnames";
import styles from "./button.module.css";

export function Button() {
  return <button className={classNames(styles.primary)} />;
}
```

### 7. raw-css-module-class

Must emit `raw-css-module-class` when a module class is used as a raw string.

```tsx
import styles from "./button.module.css";

export function Button() {
  return <button className="primary" />;
}
```

### 8. valid-static-dynamic-const

Must resolve the constant and pass with no diagnostics.

```tsx
import styles from "./button.module.css";

const variant = "primary";

export function Button() {
  return <button className={styles[variant]} />;
}
```

### 9. missing-static-dynamic-const

Must resolve the constant and emit `missing-css-module-class`.

```tsx
import styles from "./button.module.css";

const variant = "secondary";

export function Button() {
  return <button className={styles[variant]} />;
}
```

### 10. unresolved-dynamic

Must emit `unresolved-dynamic-class`, not `missing-css-module-class`. By default this is an error. If the rule is configured as warning, it must emit the same code with `severity: "warning"`.

```tsx
import styles from "./button.module.css";

export function Button({ variant }: { variant: string }) {
  return <button className={styles[variant]} />;
}
```

### 11. ignore-class

Must support ignored classes through CLI/API configuration.

```tsx
import styles from "./button.module.css";

export function Button() {
  return <button className={styles.external} />;
}
```

With `ignoreClasses: ["external"]`, no diagnostics should be emitted. Regular expressions must also be supported, for example `ignoreClasses: [/^external-/]`.

### 12. css-module-file-not-found

Must emit `css-module-file-not-found` when an import points to a missing CSS Module.

```tsx
import styles from "./missing.module.css";

export function Button() {
  return <button className={styles.primary} />;
}
```

## Implementation Order

1. Create package scaffolding: `package.json`, TypeScript, Vitest, and `src`.
2. Create the fixture runner for `tests/uses` as `use-cases.ts`.
3. Create the first fixtures: `valid-basic` and `missing-dot-notation`.
4. Implement file discovery and minimal CSS parsing.
5. Implement TSX parsing and CSS Module import detection.
6. Implement dot notation validation.
7. Add bracket notation.
8. Add `clsx` and `classnames`.
9. Add raw CSS Module class detection.
10. Add simple static resolution for constants and conditionals.
11. Add diagnostics for non-resolvable dynamic classes.
12. Implement the CLI.
13. Implement the human readable reporter.
14. Harden tests for parse errors, missing files, and ignores.
15. Prepare `README.md` usage documentation and document V1 limitations.

## V1 Acceptance Criteria

V1 is considered ready when:

- All `tests/uses` cases pass.
- The CLI can run against a local folder.
- The API returns `status`, `errors`, `filesChecked`, and `cssModulesChecked`.
- The package builds to ESM/CJS or the package format chosen before publishing.
- The CLI exit code is correct.
- The CLI output is human readable and easy to scan.
- Non-resolvable dynamic classes do not produce false `missing-css-module-class` errors.
- `README.md` documents CLI usage, API usage, rules configuration, `ignoreClasses` with strings and regular expressions, and all error codes in a clear format.

## Open Questions

- If one file imports multiple CSS Modules, `className="primary"` could match more than one module. V1 will report the diagnostic if it matches any CSS Module imported by that same file.
- Global detection of CSS Module classes used as strings in files that do not import the module is out of scope for V1 because it can produce too many false positives.
- Before publishing, decide whether the package will be ESM-only or dual ESM/CJS.

## Development Principle

Every functional change must include:

- A fixture under `tests/uses` when it represents user-facing behavior.
- A unit test when it represents an isolated internal rule.
- A stable diagnostic when the result is reportable.
- A note in this document when it changes the functional contract.
