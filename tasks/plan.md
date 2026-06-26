# Implementation Plan: Relocate & Gut sneat-team to Minimal Skeleton

## Context

The repo at `sneat-co/sneat-team` was scaffolded from `sneat-ext-template` and ships a full list-management demo. The goal is to:

1. Move the Nx workspace into `frontend/` (matching the `gameboard` convention)
2. Delete the demo `contract` and `shared` libs
3. Rewire `internal` to a minimal skeleton that consumes types from the sibling `sneat-team-ext` repo via tsconfig path mapping
4. Gut the app to remove demo pages
5. Fix workspace config
6. Reach a green build

## Current State (as of 2026-06-26)

### Repo root layout (files to move into `frontend/`)
```
apps/                         # team-app + team-app-e2e
libs/extensions/team/
  contract/                   # @sneat/extension-team-contract — list DTOs/interfaces (TO DELETE)
  internal/                   # @sneat/extension-team-internal — ListService wiring (TO REWIRE)
  shared/                     # @sneat/extension-team-shared — pages + components (TO DELETE)
nx.json
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
project.json
tsconfig.base.json
vitest.workspace.ts
eslint.config.mjs
scripts/
.vscode/
.verdaccio/
.prettierrc
.prettierignore
.editorconfig
```

### Files to keep at repo root (NOT moved)
```
.github/
.gitignore
README.md
```

### Key dependencies to understand

- `internal/src/lib/provide-team-internal.ts` imports `TEAM_SERVICE` from `@sneat/extension-team-contract` (the LOCAL contract lib being deleted)
- `internal/src/lib/services/index.ts` exports `ListService` + `ListItemService` (both being deleted)
- `apps/team-app/src/app/app.routes.ts` has a `space/:spaceType/:spaceID` route loading `team-space.routes.ts` (imports shared lib — being deleted)
- `apps/team-app/src/app/space/team-space.routes.ts` imports from `@sneat/extension-team-shared` (being deleted)
- `apps/team-app/src/main.ts` imports `provideTeamInternal` from `@sneat/extension-team-internal` (KEEP — rewire it)
- `apps/team-app/src/app/home/team-home-page.component.ts` — no demo imports, uses `@sneat/space-components` (KEEP as-is)
- `apps/team-app/src/app/my/my-profile-page.component.ts` — no demo imports (KEEP as-is)

### Sibling contract source
`/Users/alexandertrakhimenok/projects/sneat-co/sneat-team-ext/frontend/src/index.ts` exports:
- `FollowTeamRequest { teamID: string }`
- `FollowTeamResponse { teamID: string; followed: boolean }`

### Reference convention
`/Users/alexandertrakhimenok/projects/sneat-co/gameboard/frontend/` is the established pattern for the `frontend/` subdirectory layout. Its root contains the same Nx workspace files.

## Dependency Graph

```
PHASE 1: Relocate
  T1: git mv workspace into frontend/
    → All subsequent tasks depend on this

PHASE 2: Gut (parallel after T1)
  T2: Delete demo libs (contract/, shared/)           [depends on T1]
  T3: Rewire internal lib to FollowTeam skeleton      [depends on T1]
  T4: Gut app routes and remove space/ directory      [depends on T1]

PHASE 3: Fix config (after T2, T3, T4)
  T5: Fix workspace configs (tsconfig, nx, eslint)    [depends on T2, T3, T4]

CHECKPOINT A: All files deleted/rewired, configs updated

PHASE 4: Build to green
  T6: pnpm install + nx build                         [depends on T5]
  T7: Iterate on build failures                       [depends on T6]

CHECKPOINT B: nx run-many lint test build = GREEN

PHASE 5: Document & commit
  T8: Add contract-consumption note                   [depends on T7]
  T9: git commit                                      [depends on T8]
  T10: Write gut report                               [depends on T9]
```

---

## Phase 1 — Relocate

### T1: Move workspace into `frontend/`

**What:** Use `git mv` to relocate all workspace files into a new `frontend/` subdirectory. Keep `.github`, `.gitignore`, `README.md` at root.

**Files to move** (only those that exist — verify with `ls -la`):
- `apps/` → `frontend/apps/`
- `libs/` → `frontend/libs/`
- `nx.json` → `frontend/nx.json`
- `package.json` → `frontend/package.json`
- `pnpm-lock.yaml` → `frontend/pnpm-lock.yaml`
- `pnpm-workspace.yaml` → `frontend/pnpm-workspace.yaml`
- `project.json` → `frontend/project.json`
- `tsconfig.base.json` → `frontend/tsconfig.base.json`
- `vitest.workspace.ts` → `frontend/vitest.workspace.ts`
- `eslint.config.mjs` → `frontend/eslint.config.mjs`
- `scripts/` → `frontend/scripts/`
- `.prettierrc` → `frontend/.prettierrc`
- `.prettierignore` → `frontend/.prettierignore`
- `.editorconfig` → `frontend/.editorconfig`
- `.vscode/` → `frontend/.vscode/`
- `.verdaccio/` → `frontend/.verdaccio/`

**After moving:** Scan for any path in moved configs that broke (e.g. `$schema` pointing to `./node_modules/` — those are relative and stay valid; check `tsconfig.base.json` `baseUrl: "."` is still correct relative to `frontend/`).

**Acceptance criteria:**
- `ls /Users/alexandertrakhimenok/projects/sneat-co/sneat-team/` shows only: `.github/`, `.gitignore`, `README.md`, `frontend/`, `.git/`
- `ls frontend/` shows `apps libs nx.json package.json ...`
- `git status` shows all as renames, no untracked
- `frontend/tsconfig.base.json` paths still start with `./libs/...` (correct relative to `frontend/` as baseUrl)

**Verification:**
```bash
ls /Users/alexandertrakhimenok/projects/sneat-co/sneat-team/
ls /Users/alexandertrakhimenok/projects/sneat-co/sneat-team/frontend/
git -C /Users/alexandertrakhimenok/projects/sneat-co/sneat-team status --short | head -30
```

---

## Phase 2 — Gut (run in parallel after T1)

### T2: Delete demo libs

**What:** Remove the `contract` and `shared` extension libs entirely.

```bash
cd frontend
rm -rf libs/extensions/team/contract
rm -rf libs/extensions/team/shared
```

**Also remove from `nx.json` release config:**
- Remove `ext-team-contract` and `ext-team-shared` from `release.projects` array. Keep `ext-team-internal`.

**Acceptance criteria:**
- `ls frontend/libs/extensions/team/` shows only `internal/`
- `nx.json` `release.projects` contains only `["ext-team-internal"]`

**Verification:**
```bash
ls frontend/libs/extensions/team/
grep -A5 '"release"' frontend/nx.json
```

---

### T3: Rewire `internal` lib to minimal skeleton

All paths relative to `frontend/libs/extensions/team/internal/`.

**Delete:**
- `src/lib/services/list.service.ts`
- `src/lib/services/list-item.service.ts`

**Create `src/lib/team-service.ts`:**
```ts
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { FollowTeamRequest, FollowTeamResponse } from '@sneat/extension-team-contract';

// Minimal team service contract. Expand as sneat.team is specified.
export interface ITeamService {
  follow(request: FollowTeamRequest): Observable<FollowTeamResponse>;
}

export const TEAM_SERVICE = new InjectionToken<ITeamService>('TeamService');
```

**Create `src/lib/services/team.service.ts`:**
```ts
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { FollowTeamRequest, FollowTeamResponse } from '@sneat/extension-team-contract';
import { ITeamService } from '../team-service';

@Injectable()
export class TeamService implements ITeamService {
  follow(_request: FollowTeamRequest): Observable<FollowTeamResponse> {
    return throwError(() => new Error('not implemented'));
  }
}
```

**Rewrite `src/lib/services/index.ts`:**
```ts
export * from './team.service';
```

**Rewrite `src/lib/provide-team-internal.ts`:**
```ts
import { Provider } from '@angular/core';
import { TEAM_SERVICE } from './team-service';
import { TeamService } from './services';

export function provideTeamInternal(): Provider[] {
  return [TeamService, { provide: TEAM_SERVICE, useExisting: TeamService }];
}
```

**Rewrite `src/index.ts`:**
```ts
export * from './lib/team-service';
export * from './lib/services';
export * from './lib/provide-team-internal';
```

**Fix `src/lib/provide-team-internal.spec.ts`:**
```ts
import { TestBed } from '@angular/core/testing';
import { TEAM_SERVICE } from './team-service';
import { TeamService } from './services';
import { provideTeamInternal } from './provide-team-internal';

describe('provideTeamInternal', () => {
  it('returns providers that wire TEAM_SERVICE to TeamService', () => {
    const providers = provideTeamInternal();
    expect(providers).toContain(TeamService);
    expect(providers).toContainEqual({
      provide: TEAM_SERVICE,
      useExisting: TeamService,
    });
  });

  it('resolves TEAM_SERVICE to TeamService via DI', () => {
    TestBed.configureTestingModule({ providers: provideTeamInternal() });
    const service = TestBed.inject(TEAM_SERVICE);
    expect(service).toBeInstanceOf(TeamService);
  });
});
```

**Also update `src/lib/services/` vitest config** if it references the old list services (check `vitest.config.ts` — likely no changes needed).

**Acceptance criteria:**
- `internal/src/lib/services/` contains only `team.service.ts` and `index.ts`
- `internal/src/lib/team-service.ts` exists with `ITeamService` + `TEAM_SERVICE`
- `internal/src/lib/provide-team-internal.ts` no longer references `ListService`
- `internal/src/index.ts` exports `team-service`, `services`, `provide-team-internal`
- Spec file imports `TEAM_SERVICE` from `./team-service` (not from `@sneat/extension-team-contract`)

**Verification:**
```bash
ls frontend/libs/extensions/team/internal/src/lib/services/
grep -n 'ListService\|list-item\|list\.service' frontend/libs/extensions/team/internal/src/lib/provide-team-internal.ts
grep -n 'TEAM_SERVICE' frontend/libs/extensions/team/internal/src/lib/provide-team-internal.spec.ts
```

---

### T4: Gut the app to a minimal skeleton

**Delete:**
```bash
rm -rf frontend/apps/team-app/src/app/space/
```

**Edit `frontend/apps/team-app/src/app/app.routes.ts`** — remove the `space/:spaceType/:spaceID` route block entirely. Keep `''`, `my`, and `signed-out` routes.

**Check for stray imports:**
```bash
grep -rn '@sneat/extension-team-shared\|@sneat/extension-team-contract' frontend/apps/team-app/src/
```
If any hits found in `home/` or `my/`, strip those references. The home and my pages currently import nothing from demo libs (verified above) — so this should be clean.

**Acceptance criteria:**
- `frontend/apps/team-app/src/app/space/` does not exist
- `app.routes.ts` has no `space/:spaceType/:spaceID` route and no import of `team-space.routes`
- `grep -rn '@sneat/extension-team-shared\|@sneat/extension-team-contract' frontend/apps/team-app/src/` returns empty

**Verification:**
```bash
ls frontend/apps/team-app/src/app/ 2>/dev/null
grep -n 'space' frontend/apps/team-app/src/app/app.routes.ts
grep -rn '@sneat/extension-team-shared\|@sneat/extension-team-contract' frontend/apps/team-app/src/
```

---

## Phase 3 — Fix Config

### T5: Fix workspace configs

#### `frontend/tsconfig.base.json` — Update `paths`

Change `@sneat/extension-team-contract` to point at sibling repo:
```json
"@sneat/extension-team-contract": [
  "../sneat-team-ext/frontend/src/index.ts"
]
```
(Relative to `frontend/` as the baseUrl `.`, `../sneat-team-ext/` resolves to the sibling repo.)

Remove the `@sneat/extension-team-shared` entry entirely.

Keep `@sneat/extension-team-internal` as-is.

Final `paths`:
```json
{
  "@sneat/extension-team-contract": ["../sneat-team-ext/frontend/src/index.ts"],
  "@sneat/extension-team-internal": ["./libs/extensions/team/internal/src/index.ts"]
}
```

#### `frontend/nx.json` — Fix release projects

Remove `ext-team-contract` and `ext-team-shared` from `release.projects`. Already noted in T2 — confirm here.

#### `frontend/libs/extensions/team/internal/package.json` — Remove shared ref

Remove any `@sneat/extension-team-shared` peer dep if present. Keep `@sneat/extension-team-contract` as a note (it is path-mapped, not installed).

#### `frontend/eslint.config.mjs` — Remove shared/contract boundary rules

The eslint module boundary rules reference `ext-team-shared` and `ext-team-contract` source tags. After deletion, remove those rules (or the entire `contract` and `shared` sections). Keep the `internal` and `app` rules. Verify no `DepConstraint` rule references deleted project tags.

**Acceptance criteria:**
- `frontend/tsconfig.base.json` has no `@sneat/extension-team-shared` path
- `frontend/tsconfig.base.json` `@sneat/extension-team-contract` points to `../sneat-team-ext/frontend/src/index.ts`
- `frontend/nx.json` release.projects = `["ext-team-internal"]`
- `cat ../sneat-team-ext/frontend/src/index.ts` from `frontend/` resolves correctly (parent-relative path works)

**Verification:**
```bash
cat frontend/tsconfig.base.json
grep -A10 '"release"' frontend/nx.json
cat frontend/libs/extensions/team/internal/package.json | grep -i shared
```

---

## Checkpoint A — Pre-build sanity

Before running the build:
```bash
# Confirm only internal lib remains
ls frontend/libs/extensions/team/

# Confirm no shared/contract refs remain in app
grep -rn '@sneat/extension-team-shared\|@sneat/extension-team-contract' frontend/apps/

# Confirm no list-service refs remain in internal
grep -rn 'ListService\|list\.service\|list-item' frontend/libs/extensions/team/internal/src/

# Confirm tsconfig paths correct
cat frontend/tsconfig.base.json

# Confirm sibling file exists at mapped path
ls /Users/alexandertrakhimenok/projects/sneat-co/sneat-team-ext/frontend/src/index.ts
```

---

## Phase 4 — Build to Green

### T6: Install and run build

```bash
cd /Users/alexandertrakhimenok/projects/sneat-co/sneat-team/frontend
pnpm install
pnpm exec nx run-many -t lint test build
```

### T7: Iterate on build failures

Common expected failure categories and fixes:

| Failure | Cause | Fix |
|---|---|---|
| `Cannot find module '@sneat/extension-team-contract'` in `provide-team-internal.ts` | Path not updated | Verify `tsconfig.base.json` path + recheck relative path from `frontend/` root |
| `../sneat-team-ext/frontend/src/index.ts` not found | Path wrong | Use absolute resolve: `"../sneat-team-ext/frontend/src/index.ts"` relative to `frontend/` |
| `ListService` missing | Old service deleted but still referenced | Check all files under `internal/src/` for old imports |
| `templateSpaceRoutes` not found | `space/` deleted but route still in app.routes | Re-check T4 was applied |
| ESLint boundary violations | Old boundary rules in eslint.config.mjs | Remove contract/shared dep constraint rules |
| `ext-team-contract` project not found | nx.json still references deleted project | Fix nx.json release.projects |
| `vitest.workspace.ts` includes deleted paths | Pattern matches deleted dirs | Usually `**/vitest.config.*` glob — should auto-exclude missing dirs |

**On each failure:** fix the specific file, re-run only the failing target first (`nx run ext-team-internal:test`), then full run.

**Acceptance criteria:**
- `pnpm exec nx run-many -t lint test build` completes with summary line `Successfully ran targets lint, test, build for N projects`
- Zero errors in lint, test, build for: `ext-team-internal`, `team-app`
- e2e: attempt `pnpm exec nx e2e team-app-e2e`; if it fails only due to no browser/display, document that and continue

---

## Checkpoint B — Green build confirmed

Capture exact output:
```bash
cd /Users/alexandertrakhimenok/projects/sneat-co/sneat-team/frontend
pnpm exec nx run-many -t lint test build 2>&1 | tail -20
```

---

## Phase 5 — Document & Commit

### T8: Add contract-consumption note

Create `frontend/docs/contract-consumption.md` (or add to `frontend/README.md`):

> **Interim contract consumption:** `@sneat/extension-team-contract` is resolved via a TypeScript path alias pointing at the sibling `sneat-team-ext` repo (`../sneat-team-ext/frontend/src/index.ts` relative to `frontend/`). No npm install is required. When the contract gains runtime values (DI tokens, classes) or this repo's CI runs standalone (without the sibling checkout), switch to a published npm package.

### T9: Commit

```bash
cd /Users/alexandertrakhimenok/projects/sneat-co/sneat-team
git add -A
git -c user.name="Alexander Trakhimenok" -c user.email="alexander.trakhimenok@gmail.com" \
  commit -m "$(cat <<'EOF'
relocate workspace to frontend/, gut demo to minimal team skeleton

- Move Nx workspace into frontend/ (mirrors gameboard convention)
- Delete contract + shared libs; keep only internal
- Rewire internal: ITeamService + TEAM_SERVICE + TeamService stub
- Wire @sneat/extension-team-contract to sibling sneat-team-ext via tsconfig path
- Remove space routes and space/ dir from app
- nx run-many lint test build: GREEN

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

### T10: Write gut report

Write to `/Users/alexandertrakhimenok/projects/sneat-co/sneat-team-gut-report.md`:
- Final `frontend/` tree (2-3 levels)
- Every file deleted/created/modified
- Exact `nx run-many` output (summary lines)
- e2e status
- Commit hash (`git rev-parse HEAD`)
- Any concerns (sibling repo coupling, eslint rules removed, etc.)

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| tsconfig path `../sneat-team-ext/` resolves wrong after move to `frontend/` | Medium | Verify path from `frontend/` baseUrl: `../sneat-team-ext/frontend/src/index.ts` must resolve to `/Users/alexandertrakhimenok/projects/sneat-co/sneat-team-ext/frontend/src/index.ts` |
| ESLint boundary rules reference deleted project tags | Medium | Grep eslint config for `ext-team-contract` and `ext-team-shared` and remove those `depConstraints` entries |
| vitest.workspace.ts glob picks up deleted lib dirs | Low | The glob `**/vitest.config.*` naturally skips missing files; Vitest warns but doesn't fail |
| `home/` or `my/` pages have hidden shared imports | Low | Verified they don't; confirm with grep after gutting |
| `provide-team-internal.spec.ts` uses Angular TestBed | Medium | The spec uses `TestBed.inject` — requires Angular testing setup in vitest. Check existing vitest setup files in `internal/`; add `@angular/core/testing` shim if needed. Alternatively, keep the spec pure (no TestBed) to avoid complexity. |
| git mv of dotfiles fails on macOS | Low | Use individual `git mv` calls for dotfiles (.prettierrc, .editorconfig, etc.) |

---

## Execution Order Summary

```
T1 (relocate)
  ↓
T2 (delete libs) ─┐
T3 (rewire internal) ├── parallel
T4 (gut app) ──────┘
  ↓
T5 (fix configs)
  ↓
[Checkpoint A]
  ↓
T6 (pnpm install + build)
  ↓
T7 (iterate on failures) — loop until green
  ↓
[Checkpoint B]
  ↓
T8 (docs) → T9 (commit) → T10 (report)
```
