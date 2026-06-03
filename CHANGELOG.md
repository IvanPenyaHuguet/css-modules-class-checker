# Changelog

All notable changes to this project will be documented in this file.

## 1.0.0 - 2026-05-30

### Added

- Initial stable release of `@stale-styles/css-modules`.
- Added a CLI for checking JavaScript and TypeScript projects that use CSS Modules.
- Added a public API through `checkCssModules`.
- Added diagnostics for missing CSS Module classes, unused CSS Module classes, raw CSS Module class strings, empty CSS Module selectors, unresolved dynamic class access, missing CSS Module files, CSS parse errors, and source parse errors.
- Added support for default CSS Module imports and named CSS Module imports.
- Added support for `className` and `class` attributes.
- Added support for common CSS Module access patterns, including dot notation, bracket notation, static template literals, constants, conditional expressions, string literal unions, object literal maps, and string enums.
- Added support for class composition through `clsx` and `classnames`, including arrays, objects, nested values, conditional expressions, and computed object keys.
- Added support for CSS Modules locals conventions: `camelCase`, `camelCaseOnly`, `dashes`, and `dashesOnly`.
- Added configurable CSS Module file matching through `matchFiles`.
- Added configurable ignored files, ignored class names, and per-rule severity levels.
- Added CSS parsing based on `lightningcss`, including support for nested selectors, pseudo selectors, media rules, and `:global(...)` selectors.
- Added text reporting, exit codes, TypeScript declarations, and package exports.
- Added documentation for CLI usage, API usage, supported rules, diagnostics, supported patterns, and known limitations.
- Added unit and fixture coverage for supported usage patterns and diagnostics.
