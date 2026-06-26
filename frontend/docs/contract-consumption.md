# Interim contract consumption

The team extension's wire contract — `@sneat/extension-team-contract`, exporting
`FollowTeamRequest` and `FollowTeamResponse` — lives in the sibling repository
`sneat-team-ext` at `frontend/src/index.ts`. It is a plain-TypeScript package
(no Angular dependency) and is **not** published to an npm registry yet.

## How it is wired today

This repo consumes the contract as a **local linked package** via pnpm:

```jsonc
// frontend/package.json
"dependencies": {
  "@sneat/extension-team-contract": "link:../../sneat-team-ext/frontend"
}
```

`pnpm install` creates a symlink at
`frontend/node_modules/@sneat/extension-team-contract` pointing at the sibling
checkout. The contract's `package.json` has `main: src/index.ts`, so TypeScript
resolves the interface types straight from source — no build step in the sibling
repo is required.

### Why a linked package and not a tsconfig path

The original plan was a `tsconfig.base.json` path alias pointing at the sibling
source. That works for plain `tsc`/esbuild, but the `internal` library is built
with `@nx/angular:package` (ng-packagr), whose Angular compiler enforces a single
`rootDir` and rejects any `.ts` source resolved outside the library
(`TS6059: '…' is not under 'rootDir'`). A tsconfig path resolves the contract to
a loose source file two directories up, which trips that check and fails the
`build` target.

Resolving the contract through `node_modules` instead makes the Angular compiler
treat it as an external library import (exempt from `rootDir`), so
`nx run-many -t lint test build` is green.

Two Nx lint rules cannot see a package whose real path is outside the workspace,
so the contract is whitelisted:

- `@nx/enforce-module-boundaries` — added to the `allow` list in
  `frontend/eslint.config.mjs`.
- `@nx/dependency-checks` — added to `ignoredDependencies` in
  `frontend/libs/extensions/team/internal/eslint.config.mjs`.

## When to switch

Replace the `link:` dependency with a normally versioned npm dependency once
either of the following is true:

- The contract gains runtime values (e.g. DI tokens, classes) rather than pure
  interfaces, or
- this repo's CI must build standalone, without the `sneat-team-ext` checkout
  sitting next to it.

At that point, publish `@sneat/extension-team-contract` and pin a version; the
import sites (`libs/extensions/team/internal/src/lib/team-service.ts` and
`services/team.service.ts`) need no changes.
