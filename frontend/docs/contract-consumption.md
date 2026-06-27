# Contract consumption

The team extension's wire contract — `@sneat/extension-team-contract`, exporting
`FollowTeamRequest` and `FollowTeamResponse` — is authored in the sibling
repository `sneat-team-ext` (`frontend/src/index.ts`) as a plain-TypeScript
package (no Angular dependency) and **published to npm**.

## How it is wired

This repo consumes the contract as a normal versioned npm dependency:

```jsonc
// frontend/package.json
"dependencies": {
  "@sneat/extension-team-contract": "^0.1.0"
}
```

The package's `package.json` has `main: src/index.ts` and ships its `src/`, so
the interface types resolve from the published package — no sibling checkout is
required, and this repo's CI can build standalone.

### Publishing the contract

`sneat-team-ext`'s contract is not an Nx project, so it is published with the
**plain (non-Nx) path** of the shared `publish-extension.yml` workflow in
`sneat-libs` (which holds the `@sneat/*` `NPM_TOKEN`):

```bash
gh workflow run publish-extension.yml --repo sneat-co/sneat-libs \
  -f repository=sneat-co/sneat-team-ext -f plain=true -f package-directory=frontend -f ref=main
```

Bump `sneat-team-ext/frontend/package.json`'s `version` before re-publishing, then
update the `^` range here if needed.

### Why a normal npm dependency and not a tsconfig path

An earlier approach aliased the contract via `tsconfig.base.json` to the sibling
source. That works for plain `tsc`/esbuild, but the `internal` library is built
with `@nx/angular:package` (ng-packagr), whose compiler enforces a single
`rootDir` and rejects `.ts` source resolved outside the library
(`TS6059: '…' is not under 'rootDir'`). Resolving the contract through
`node_modules` (a published package) makes the Angular compiler treat it as an
external import (exempt from `rootDir`), so `nx run-many -t lint test build` is
green.

> History: before the package was published, it was consumed via a pnpm
> `link:../../sneat-team-ext/frontend` dependency. Two Nx lint allowances were
> added for that out-of-workspace path — `@nx/enforce-module-boundaries` `allow`
> in `frontend/eslint.config.mjs` and `@nx/dependency-checks`
> `ignoredDependencies` in
> `frontend/libs/extensions/team/internal/eslint.config.mjs`. They are harmless
> now that it is a real npm dependency and may be removed as a cleanup.
