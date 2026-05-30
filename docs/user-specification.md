# User Specification

Project name: `css-modules-class-checker` (provisional)

The main purpose is to provide a Node.js executable program, usable as a CLI with `npx`, `pnpm dlx`, or similar tools, that checks whether class names used in the codebase are defined in the corresponding CSS Module files. It should also detect CSS Module class names used incorrectly as raw class strings.

## File Naming Convention

All project files must use kebab-case names.

Examples:

- `use-cases.ts`
- `something-something-asd.tsx`
- `button.tsx`
- `button.module.css`

This applies to all source files, test files, fixtures, and documentation examples.

## Use Cases

- The program should be executable with `npx`, `pnpm dlx`, or similar tools as a command-line interface.
- The program should be importable as a module in JavaScript/TypeScript projects, allowing integration into build processes or custom scripts.
- The program should check class names used in JavaScript/TypeScript files and verify whether they are defined in the corresponding CSS Module files.
- The program should detect CSS Module class names used as raw strings and report them as errors.
- The main use case is a TypeScript React project, focused on `.tsx` files with CSS Modules.
- The program must not support SCSS or other preprocessor files; only `.css` files are supported as CSS Modules.
- An argument can be passed to specify the target directory.
- Ignored class names must be configurable.
- Dynamic class names should be handled, such as `styles[dynamicClass]`, `styles[getClassName()]`, and `styles[staticValue + dynamicValue]`.
- The program should support `clsx` and `classnames` for conditional class names.
