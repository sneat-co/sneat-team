# sneat.team Extension Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `sneat.team` (ext-id `team`) extension as two public repos — `sneat-team` (frontend + backend implementation) and `sneat-team-ext` (contract surface) — wire a stub `follow` endpoint into `sneat-go`, and archive the obsolete `sneat-team-pwa`.

**Architecture:** `sneat-team-ext` owns the contract surface (TypeSpec wire contract + Go facade definitions + the single `@sneat/extension-team-contract` TS lib). `sneat-team` owns the implementation (Nx frontend under `frontend/` with `team-app` + `@sneat/extension-team-internal`, plus a `backend/team` Go module). `sneat-go` mounts the backend via a thin adapter under `/v0/api4team/`. This follows the user's model (ext = contract+definition, main = implementation), which is the `extension-contract-repo` convention — deliberately diverging from the template's default of scaffolding a contract lib in the main repo (tracked: sneat-libs#21, sneat-ext-template#1).

**Tech Stack:** Nx 22 · Angular 21 · Ionic 8 · pnpm · Vitest · Playwright (frontend); Go 1.22+ route patterns (backend); TypeSpec (contract).

## Global Constraints

- Repo layout: `~/projects/sneat-co/<repo>` (org/repo). Never a second clone.
- Ext-id is the single lowercase token **`team`**; repos are `sneat-team` / `sneat-team-ext` (family naming, not bare `team`).
- Package names map 1:1 to libraries: `@sneat/extension-team-contract` (only in `-ext`), `@sneat/extension-team-internal` (only in main). No `-shared`, no duplicate `-contract`.
- Backend route prefix: `/v0/api4team/`.
- Both repos **public**.
- The Nx workspace lives under `frontend/` in the main repo (matches live `listus`/`gameboard`).
- Commit messages end with the Co-Authored-By trailer per repo conventions.

---

## Phase 0 — Pre-flight (no writes)

### Task 0: Confirm preconditions

- [ ] **Step 1:** Verify neither repo exists.
  Run: `gh repo view sneat-co/sneat-team --json name; gh repo view sneat-co/sneat-team-ext --json name`
  Expected: both error "Could not resolve to a Repository".
- [ ] **Step 2:** Confirm `sneat-ext-template` is a GitHub template repo (determines creation method).
  Run: `gh repo view sneat-co/sneat-ext-template --json isTemplate`
  Expected: `{"isTemplate": true}` → use `--template`. If `false`, use the local-clone fallback in Task 1 Step 1b.
- [ ] **Step 3:** Confirm `gameboard-ext` is present locally to copy from.
  Run: `ls ~/projects/sneat-co/gameboard-ext/{typespec,backend,frontend}`
  Expected: all three dirs listed.
- [ ] **Step 4:** Inspect the backend Go scaffold source.
  Run: `ls ~/projects/sneat-co/sneat-mod-template/go && ls ~/projects/sneat-co/gameboard/backend/gameboard`
  Expected: directory listings (used as the model for `backend/team`).

---

## Phase 1 — `sneat-team-ext` (contract repo) FIRST

> Built first because the main repo's `internal` lib and app depend on `@sneat/extension-team-contract`.

### Task 1: Create and clone `sneat-team-ext`

**Files:** new repo `sneat-co/sneat-team-ext`.

- [ ] **Step 1:** Create the empty public repo.
  Run: `gh repo create sneat-co/sneat-team-ext --public --description "Public contract surface for the sneat.team (team) extension"`
  Expected: prints repo URL.
- [ ] **Step 2:** Seed it from a copy of `gameboard-ext` (working tree only, no git history).
  Run:
  ```bash
  cd ~/projects/sneat-co
  rsync -a --exclude '.git' --exclude 'node_modules' --exclude 'dist' --exclude 'tmp' gameboard-ext/ sneat-team-ext/
  cd sneat-team-ext && git init -b main && git remote add origin git@github.com:sneat-co/sneat-team-ext.git
  ```
  Expected: `sneat-team-ext/` populated; git initialized.

### Task 2: Rename gameboard → team across `-ext`

**Files:** Modify all of `sneat-team-ext/{typespec,backend,frontend,scripts,parity,.github,README.md,specscore.yaml}`.

- [ ] **Step 1:** Targeted, case-aware rename (mirror `customize.sh` semantics: avoid corrupting unrelated words).
  Run (review with `git status` after):
  ```bash
  cd ~/projects/sneat-co/sneat-team-ext
  # package/module/path identifiers
  grep -rlZ --exclude-dir=.git 'gameboard' . | xargs -0 sed -i '' \
    -e 's#github.com/sneat-co/gameboard-ext#github.com/sneat-co/sneat-team-ext#g' \
    -e 's#@sneat/extension-gameboard-contract#@sneat/extension-team-contract#g' \
    -e 's#api4gameboard#api4team#g' \
    -e 's#gameboard-ext#sneat-team-ext#g'
  # rename the .tsp file
  git -C . ls-files >/dev/null 2>&1 || true
  mv typespec/api4gameboard.tsp typespec/api4team.tsp 2>/dev/null || true
  ```
- [ ] **Step 2:** Handle remaining bare `gameboard`/`Gameboard`/`GAMEBOARD` symbol tokens by inspection.
  Run: `grep -rn -i gameboard . --exclude-dir=.git`
  Action: replace each remaining identifier with the `team`/`Team`/`TEAM` equivalent (Go package names, TS symbols, doc prose). Leave genuine references to the *gameboard extension* in prose only where they describe the cross-extension relationship; otherwise rename.
- [ ] **Step 3:** Verify no stray identifiers remain.
  Run: `grep -rn -i gameboard . --exclude-dir=.git | grep -v -i 'gameboard-live\|gameboard extension'`
  Expected: empty (only intentional cross-references remain).

### Task 3: Reduce contract to a `follow`-only skeleton

**Files:** Modify `typespec/api4team.tsp`, `backend/**`, `frontend/src/**`.

- [ ] **Step 1:** Replace the TypeSpec body with a minimal `follow` operation stub.
  `typespec/api4team.tsp`:
  ```tsp
  import "@typespec/http";
  using TypeSpec.Http;

  @service(#{ title: "api4team" })
  namespace Api4Team;

  /** Subscribe the current user to updates for a team. Stub — shape TBD. */
  @route("/v0/api4team")
  namespace Team {
    model FollowTeamRequest { teamID: string; }
    model FollowTeamResponse { followed: boolean; }

    @post
    @route("follow")
    op follow(@body body: FollowTeamRequest): FollowTeamResponse;
  }
  ```
- [ ] **Step 2:** Reduce the Go facade (`backend/`) to the matching `FollowTeamRequest`/`FollowTeamResponse` DTOs and a `Follower` facade interface stub; delete gameboard-specific DTOs/interfaces.
  Action: edit `backend/<pkg>.go` files so `go build ./...` compiles with only the follow DTOs + interface. Keep the module path `github.com/sneat-co/sneat-team-ext/backend`.
  Run: `cd backend && go build ./...`
  Expected: builds clean.
- [ ] **Step 3:** Reduce the TS contract lib (`frontend/src/`) to export the follow request/response types + any service token; delete gameboard-specific exports.
  Run: `cd ~/projects/sneat-co/sneat-team-ext/frontend && pnpm install && pnpm build` (or the repo's documented build command from its README)
  Expected: contract lib builds; package name is `@sneat/extension-team-contract`.

### Task 4: Verify and publish/link the contract, then push `-ext`

- [ ] **Step 1:** Run the repo's CI-equivalent checks locally.
  Run: `cd ~/projects/sneat-co/sneat-team-ext && bash scripts/check-no-extension-deps.sh` (and any typespec compile step the README documents)
  Expected: passes (the contract depends only on foundational/core code).
- [ ] **Step 2:** Decide contract availability for the main repo. Default: a **local workspace link** during dev (no npm publish yet). Document the chosen mechanism in `sneat-team-ext/README.md` (e.g. pnpm `file:`/`link:` or a pending npm publish). Note explicitly if a real `npm publish` is required before the main repo can build in CI.
- [ ] **Step 3:** Commit and push.
  Run:
  ```bash
  cd ~/projects/sneat-co/sneat-team-ext
  git add -A && git commit -m "feat: scaffold sneat-team-ext contract surface (follow stub)"
  git push -u origin main
  ```
  Expected: pushed; `gh repo view sneat-co/sneat-team-ext --web` shows content.

---

## Phase 2 — `sneat-team` (implementation repo)

### Task 5: Create `sneat-team` from the template

**Files:** new repo `sneat-co/sneat-team`.

- [ ] **Step 1a (template path):** If `isTemplate` was true:
  Run: `cd ~/projects/sneat-co && gh repo create sneat-co/sneat-team --public --template sneat-co/sneat-ext-template --clone`
  Expected: repo created and cloned to `~/projects/sneat-co/sneat-team`.
- [ ] **Step 1b (fallback):** If not a template repo:
  ```bash
  cd ~/projects/sneat-co
  git clone git@github.com:sneat-co/sneat-ext-template.git sneat-team
  cd sneat-team && rm -rf .git && git init -b main
  gh repo create sneat-co/sneat-team --public --source=. --remote=origin
  ```
- [ ] **Step 2:** Confirm template layout present.
  Run: `ls ~/projects/sneat-co/sneat-team/apps`
  Expected: `template-app  template-app-e2e`.

### Task 6: Run `customize.sh team`

- [ ] **Step 1:** Run the customizer from repo root (must be at root layout, before relocation).
  Run: `cd ~/projects/sneat-co/sneat-team && ./customize.sh team`
  Expected: renames to `team-app`/`team-app-e2e`, `@sneat/extension-team-{contract,shared,internal}`, symbols; script self-deletes.
- [ ] **Step 2:** Verify no `template` identifiers remain (excluding Angular keywords).
  Run: `grep -rn -i 'template' --include=*.ts --include=*.json --include=*.html ~/projects/sneat-co/sneat-team/{apps,libs} | grep -v 'templateUrl\|<ng-template\|template:' | head`
  Expected: empty or only legitimate Angular usages.

### Task 7: Remove `shared` and `contract` tiers; keep only `internal`

**Files:** Delete `libs/extensions/team/shared`, `libs/extensions/team/contract`; Modify `tsconfig.base.json`, `pnpm-workspace.yaml`, `libs/extensions/team/internal/package.json`, and any app/internal imports.

- [ ] **Step 1:** Delete the two libs.
  Run: `cd ~/projects/sneat-co/sneat-team && rm -rf libs/extensions/team/shared libs/extensions/team/contract`
- [ ] **Step 2:** Remove their path mappings from `tsconfig.base.json` (drop `@sneat/extension-team-shared` and the local `@sneat/extension-team-contract` path entry — the contract name now resolves to the external package).
- [ ] **Step 3:** In `libs/extensions/team/internal/package.json`, remove any `@sneat/extension-team-shared` dependency; keep `@sneat/extension-team-contract` as an external dependency (sourced from `sneat-team-ext` per Task 4 Step 2).
- [ ] **Step 4:** Fix imports — replace any `@sneat/extension-team-shared` imports in `team-app`/`internal` with `internal` equivalents (or inline); ensure `@sneat/extension-team-contract` imports resolve to the external package.
  Run: `grep -rn '@sneat/extension-team-shared' ~/projects/sneat-co/sneat-team`
  Expected: empty after fixes.
- [ ] **Step 5:** Wire the external contract for local builds per the mechanism chosen in Task 4 Step 2 (e.g. add `@sneat/extension-team-contract` via pnpm to point at `../sneat-team-ext/frontend` or its published version).

### Task 8: Relocate the Nx workspace into `frontend/`

**Files:** `git mv` the workspace into `frontend/`. Keep at root: `.github/`, `LICENSE`, `README.md`.

- [ ] **Step 1:** Move workspace files (mirror `gameboard/frontend` contents).
  ```bash
  cd ~/projects/sneat-co/sneat-team
  mkdir -p frontend
  git add -A && git commit -m "chore: customize template to team, drop shared/contract tiers" || true
  for p in apps libs nx.json package.json pnpm-lock.yaml pnpm-workspace.yaml project.json \
           tsconfig.base.json vitest.workspace.ts eslint.config.mjs .prettierrc .prettierignore \
           .editorconfig scripts .vscode .verdaccio; do
    [ -e "$p" ] && git mv "$p" "frontend/$p"
  done
  ```
  Expected: `frontend/` now holds the workspace; `.github`, `LICENSE`, `README.md` remain at root.
- [ ] **Step 2:** Fix any workspace-internal paths that assumed root (most Nx `project.json` `sourceRoot`s are workspace-relative and unaffected; verify config files referencing repo-root paths).
  Run: `grep -rn '"\.\./' frontend/nx.json frontend/tsconfig.base.json 2>/dev/null | head`
  Action: adjust only paths that pointed outside the workspace.

### Task 9: Install, build, and verify the frontend

- [ ] **Step 1:** Install.
  Run: `cd ~/projects/sneat-co/sneat-team/frontend && pnpm install`
  Expected: resolves including `@sneat/extension-team-contract`.
- [ ] **Step 2:** Lint/test/build everything.
  Run: `pnpm exec nx run-many -t lint test build`
  Expected: green (`team-app`, `@sneat/extension-team-internal`).
- [ ] **Step 3:** E2E smoke.
  Run: `pnpm exec nx e2e team-app-e2e`
  Expected: passes (or document any environment-gated skips).
- [ ] **Step 4:** Commit.
  Run: `cd ~/projects/sneat-co/sneat-team && git add -A && git commit -m "chore: relocate Nx workspace under frontend/ and verify green"`

### Task 10: Add `backend/team` Go module with the `follow` stub route

**Files:** Create `backend/team/{go.mod,handler.go,follow.go}` (modeled on `gameboard/backend/gameboard` + `sneat-mod-template/go`).

- [ ] **Step 1:** Scaffold the module.
  ```bash
  cd ~/projects/sneat-co/sneat-team && mkdir -p backend/team && cd backend/team
  go mod init github.com/sneat-co/sneat-team/backend/team
  ```
- [ ] **Step 2:** Implement `NewHandler` + `Register(mux)` registering exactly the `follow` route (returns a not-implemented stub). No `sneat-go` import.
  `handler.go`:
  ```go
  package team

  import "net/http"

  // Store is the persistence dependency (stub for now).
  type Store interface{}

  type Handler struct{ store Store }

  func NewHandler(store Store) *Handler { return &Handler{store: store} }

  // Register mounts the team routes on mux using Go 1.22 patterns.
  func (h *Handler) Register(mux *http.ServeMux) {
      mux.HandleFunc("POST /v0/api4team/follow", h.follow)
  }
  ```
  `follow.go`:
  ```go
  package team

  import "net/http"

  // follow subscribes the current user to a team's updates. Stub.
  func (h *Handler) follow(w http.ResponseWriter, r *http.Request) {
      http.Error(w, "not implemented", http.StatusNotImplemented)
  }
  ```
- [ ] **Step 3:** Build.
  Run: `cd ~/projects/sneat-co/sneat-team/backend/team && go build ./... && go vet ./...`
  Expected: clean.
- [ ] **Step 4:** Commit.
  Run: `cd ~/projects/sneat-co/sneat-team && git add backend && git commit -m "feat(backend): add team module with follow stub route"`

### Task 11: Push `sneat-team`

- [ ] **Step 1:** Push.
  Run: `cd ~/projects/sneat-co/sneat-team && git push -u origin main`
  Expected: pushed.

---

## Phase 3 — Wire backend into `sneat-go`

### Task 12: Add the thin adapter and register the extension

**Files:** Create `sneat-go/pkg/modules/team/module.go`; Modify `sneat-go/pkg/sneatmain/sneat_main.go`; Modify `sneat-go/go.mod` (require `github.com/sneat-co/sneat-team/backend/team`).

- [ ] **Step 1:** Confirm `sneat-go` is cloned.
  Run: `ls ~/projects/sneat-co/sneat-go/pkg/modules/gameboard/module.go`
  Expected: exists (copy as the model).
- [ ] **Step 2:** Create `pkg/modules/team/module.go` modeled on `backend-wiring.md`: adapters, `getMux()` (lazy build via `team.NewHandler`), `RegisterHttpRoutes` mounting `POST /v0/api4team/*path`, and `Extension()`. Only register `POST` (the single method the stub serves).
- [ ] **Step 3:** Add the require + replace (if using a local path during dev) for `github.com/sneat-co/sneat-team/backend/team` in `sneat-go/go.mod`.
  Run: `cd ~/projects/sneat-co/sneat-go && go mod tidy`
- [ ] **Step 4:** Register in `pkg/sneatmain/sneat_main.go`: import the package and add `team.Extension()` to the `startServer(...)` list next to `gameboard.Extension()`.
- [ ] **Step 5:** Build and test.
  Run: `cd ~/projects/sneat-co/sneat-go && go build ./... && go test ./...`
  Expected: green.
- [ ] **Step 6:** Commit on a branch (sneat-go conventions — check its CLAUDE.md before pushing to main).
  Run: `cd ~/projects/sneat-co/sneat-go && git checkout -b feat/wire-team-extension && git add -A && git commit -m "feat: wire team extension (follow stub) into sneat-go"`
  Action: open a PR per `sneat-go` conventions (do not push to `main` unless its CLAUDE.md allows).

---

## Phase 4 — Decommission old PWA & docs

### Task 13: Archive `sneat-team-pwa`

- [ ] **Step 1:** Archive.
  Run: `gh repo archive sneat-co/sneat-team-pwa --yes`
  Expected: success.
- [ ] **Step 2:** Verify.
  Run: `gh repo view sneat-co/sneat-team-pwa --json isArchived`
  Expected: `{"isArchived": true}`.

### Task 14: Commit the design doc and this plan into `sneat-team`

- [ ] **Step 1:** Move this plan + the design doc into the repo.
  ```bash
  mkdir -p ~/projects/sneat-co/sneat-team/docs/superpowers/plans ~/projects/sneat-co/sneat-team/docs/superpowers/specs
  mv ~/projects/sneat-co/sneat-team-scaffold-plan.md ~/projects/sneat-co/sneat-team/docs/superpowers/plans/2026-06-26-sneat-team-scaffold.md
  ```
- [ ] **Step 2:** Commit and push.
  Run: `cd ~/projects/sneat-co/sneat-team && git add docs && git commit -m "docs: add scaffold design and plan" && git push`

---

## Self-Review notes

- **Spec coverage:** sneat.team feature ACs (club/team/roster/coach/profiles) are deliberately **out of scope** here — this plan only scaffolds repos + a `follow` stub, per the user's request. Real endpoints land later.
- **Sequencing risk:** Phase 1 (`-ext`) precedes Phase 2 because the main repo consumes `@sneat/extension-team-contract`. Task 4 Step 2 forces an explicit decision on publish-vs-link so Task 9 can build.
- **Generated-content caveat:** Tasks 2, 7 edit files whose exact post-`customize.sh`/post-copy contents can't be known until in hand; those steps specify the operation + a grep/build verification gate rather than fixed line numbers.
- **Irreversible/external actions:** repo creation (Tasks 1, 5), archive (Task 13), sneat-go PR (Task 12) — all gated behind review.

---

## As-built addendum (2026-06-26)

This plan was executed with these deviations (rationale in the design doc):
- **`-ext` authored fresh**, not rsync+strip (gameboard-ext too domain-specific for a follow-only skeleton).
- **Contract consumption:** frontend uses pnpm `link:` to the sibling repo (ng-packagr `rootDir` blocked the tsconfig-path approach); backends use **published `backend/v0.0.1` tags** (no replaces) so the sneat-go PR is mergeable.
- **Template demo gutted** to a true skeleton (template ships a full list demo from listus).
- **sneat-go wiring** delivered as PR sneat-co/sneat-go#703 (not merged).
- All verification gates green (see design doc).
