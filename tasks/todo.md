# Task List

## Phase 1 — Relocate

- [ ] **T1** — `git mv` workspace files into `frontend/`
  - Move: `apps libs nx.json package.json pnpm-lock.yaml pnpm-workspace.yaml project.json tsconfig.base.json vitest.workspace.ts eslint.config.mjs scripts .prettierrc .prettierignore .editorconfig .vscode .verdaccio`
  - Keep at root: `.github .gitignore README.md`
  - Verify: `ls` shows only `.github .gitignore README.md frontend/ .git/` at root
  - Verify: `git status` shows all as renames, zero untracked

## Phase 2 — Gut (parallel after T1)

- [ ] **T2** — Delete demo libs
  - `rm -rf frontend/libs/extensions/team/contract`
  - `rm -rf frontend/libs/extensions/team/shared`
  - Remove `ext-team-contract` and `ext-team-shared` from `nx.json` `release.projects`

- [ ] **T3** — Rewire `internal` lib to minimal skeleton
  - Delete `frontend/libs/extensions/team/internal/src/lib/services/list.service.ts`
  - Delete `frontend/libs/extensions/team/internal/src/lib/services/list-item.service.ts`
  - Create `frontend/libs/extensions/team/internal/src/lib/team-service.ts` — `ITeamService` interface + `TEAM_SERVICE` token
  - Create `frontend/libs/extensions/team/internal/src/lib/services/team.service.ts` — `TeamService` stub with `follow()` → `throwError`
  - Rewrite `frontend/libs/extensions/team/internal/src/lib/services/index.ts` — export only `team.service`
  - Rewrite `frontend/libs/extensions/team/internal/src/lib/provide-team-internal.ts` — use `TeamService` + `TEAM_SERVICE`
  - Rewrite `frontend/libs/extensions/team/internal/src/index.ts` — export `team-service`, `services`, `provide-team-internal`
  - Fix `frontend/libs/extensions/team/internal/src/lib/provide-team-internal.spec.ts` — import `TEAM_SERVICE` from `./team-service`, assert `TeamService` wired

- [ ] **T4** — Gut app to minimal skeleton
  - `rm -rf frontend/apps/team-app/src/app/space/`
  - Edit `frontend/apps/team-app/src/app/app.routes.ts` — remove `space/:spaceType/:spaceID` route block
  - Grep + confirm no `@sneat/extension-team-shared` or `@sneat/extension-team-contract` in `apps/`

## Phase 3 — Fix Config (after T2, T3, T4)

- [ ] **T5** — Fix workspace configs
  - `frontend/tsconfig.base.json`: change `@sneat/extension-team-contract` path to `"../sneat-team-ext/frontend/src/index.ts"`, remove `@sneat/extension-team-shared`
  - `frontend/nx.json`: confirm `release.projects = ["ext-team-internal"]` only
  - `frontend/eslint.config.mjs`: remove `depConstraints` entries for deleted `ext-team-contract` and `ext-team-shared` source tags
  - `frontend/libs/extensions/team/internal/package.json`: remove any `@sneat/extension-team-shared` reference

## Checkpoint A — Pre-build sanity (manual verify)

- [ ] `ls frontend/libs/extensions/team/` → only `internal/`
- [ ] `grep -rn '@sneat/extension-team-shared' frontend/apps/` → empty
- [ ] `grep -rn 'ListService' frontend/libs/extensions/team/internal/src/` → empty
- [ ] `cat frontend/tsconfig.base.json` → correct paths
- [ ] `ls /Users/alexandertrakhimenok/projects/sneat-co/sneat-team-ext/frontend/src/index.ts` → exists

## Phase 4 — Build to Green

- [ ] **T6** — `cd frontend && pnpm install`
- [ ] **T6** — `pnpm exec nx run-many -t lint test build`
- [ ] **T7** — Iterate on failures (see plan.md risk register for common cases)

## Checkpoint B — Green build (record output)

- [ ] Capture `nx run-many` summary line
- [ ] Attempt e2e: `pnpm exec nx e2e team-app-e2e` (document result)

## Phase 5 — Document & Commit

- [ ] **T8** — Create `frontend/docs/contract-consumption.md` explaining tsconfig path mapping
- [ ] **T9** — `git add -A && git commit` with trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- [ ] **T10** — Write `/Users/alexandertrakhimenok/projects/sneat-co/sneat-team-gut-report.md`
