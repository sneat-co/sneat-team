# sneat.team Extension Scaffold — Design

**Date:** 2026-06-26 · **Status:** Implemented · **Owner:** alex

## Goal

Stand up the `sneat.team` (ext-id `team`) extension as the standard Sneat
extension shape — frontend + backend implementation in one repo, contract
surface in a sibling `-ext` repo — wired into `sneat-go`, with a single `follow`
stub endpoint. Real club/team/roster/coach/profile features (the
[`sports/sneat-team`](https://github.com/sneat-co/backstage/tree/main/spec/features/sports/sneat-team)
feature) are **out of scope** — this is scaffolding only.

## Decisions

- **Ext-id `team`**: app `team-app`, packages `@sneat/extension-team-*`, route
  prefix `/v0/api4team/`. Repos use the `sneat-team` family name (not bare
  `team`).
- **Two repos, both public:**
  - `sneat-team` — implementation: `frontend/` (Nx workspace) + `backend/` (Go).
  - `sneat-team-ext` — contract surface: `typespec/` + `backend/` (Go facade
    defs) + `frontend/` (`@sneat/extension-team-contract`).
- **Contract lives only in `-ext`.** Each package name maps to exactly one
  library: `@sneat/extension-team-contract` (in `-ext`),
  `@sneat/extension-team-internal` (in main). No `-shared`, no duplicate
  `-contract`. This deliberately diverges from the template's default of
  scaffolding a `contract` lib in the main repo — see follow-ups
  [sneat-libs#21](https://github.com/sneat-co/sneat-libs/issues/21) and
  [sneat-ext-template#1](https://github.com/sneat-co/sneat-ext-template/issues/1).
- **Template demo gutted to a skeleton.** `sneat-ext-template` ships a full
  list-management demo (from `listus`); it was stripped to a minimal `team-app`
  + a stub `TeamService`/`TEAM_SERVICE` in `internal`.
- **Workspace under `frontend/`** (matches live `listus`/`gameboard`).
- **`follow` stub** (`POST /v0/api4team/follow`): subscribe to team updates.
  Unspecified placeholder — following/notifications are actually owned by
  `sports/gameboard-live`; reconciled later.
- **Old `sneat-team-pwa` archived** (2021-era, unrelated bundle; nothing
  salvageable).

## Architecture

- `sneat-team-ext` owns the frozen wire contract: `typespec/api4team.tsp`
  (no emitters), Go facade DTOs/interface (`…/backend/team`), and the plain-TS
  `@sneat/extension-team-contract`. Depends only on foundational/core code
  (enforced by `scripts/check-no-extension-deps.sh`).
- `sneat-team/frontend` consumes the contract; the Angular DI token
  `TEAM_SERVICE` lives in `internal` (the `-ext` package is framework-agnostic).
- `sneat-team/backend/team` exposes `NewHandler` + `Register(mux)` mounting the
  `follow` stub; consumes the `-ext` contract DTOs; no `sneat-go` import.
- `sneat-go/pkg/modules/team/module.go` mounts the backend under
  `/v0/api4team/` and registers `team.Extension()` in `startServer`.

## As-built deviations from the plan

- **`-ext` authored fresh** (not rsync+strip from `gameboard-ext`) — the
  reference was too gameboard-specific for a `follow`-only skeleton.
- **Contract consumption = package links, not tsconfig paths.** ng-packagr's
  `rootDir` rejected an out-of-tree tsconfig path (TS6059), so the frontend uses
  a pnpm `link:../../sneat-team-ext/frontend` dependency
  (see `frontend/docs/contract-consumption.md`). The Go backends use published
  `backend/v0.0.1` tags (no replaces) so `sneat-go` builds cleanly.
- **Go module tags published** (`backend/v0.0.1` on both repos) so the `sneat-go`
  PR is mergeable without local `replace` directives.

## Verification

- `sneat-team-ext`: `go build/vet`, `tsc --noEmit`, invariant script — green.
- `sneat-team/frontend`: `nx run-many -t lint test build` — green.
- `sneat-team/backend`: `go build/vet/test` — green (3 handler tests).
- `sneat-go`: `go build`, `go vet`, `go test ./pkg/modules/... ./pkg/sneatmain/...`
  — green. Wired via PR [sneat-go#703](https://github.com/sneat-co/sneat-go/pull/703).

## Known follow-ups

- Publish/realize the frontend contract package so `sneat-team` CI can build
  standalone (currently relies on the sibling `link:`).
- Reconcile the `follow` contract with `gameboard-live`.
- Minor: remove dead `showRouteMenu`/menu-outlet code in `team-app`'s `app.ts`.
- Standards/template reconciliation (sneat-libs#21, sneat-ext-template#1).
