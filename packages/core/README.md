# @stale-styles/core

Private internal package that contains the shared CSS Modules analysis engine
used by the public CLI, API, and lint plugin packages.

This package is not intended to be installed or consumed directly. Use one of
the public packages instead:

- [`@stale-styles/cli`](../cli/README.md)
- [`@stale-styles/css-modules`](../css-modules-app/README.md)
- [`@stale-styles/eslint-plugin`](../eslint-plugin/README.md)

## Package Commands

From this workspace:

```bash
npm run build --workspace @stale-styles/core
npm run test --workspace @stale-styles/core
npm run typecheck --workspace @stale-styles/core
npm run lint --workspace @stale-styles/core
npm run format:check --workspace @stale-styles/core
```
