# Flags of the World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a review proposal; do not interpret this document as authorization to implement or delegate future work.

**Goal:** Ship a three-round solo flag-memory game to GitHub Pages with faithful core timings and explicitly labeled web adaptations.

**Architecture:** A pure TypeScript game engine owns deterministic generation, scoring and phase transitions. A thin native HTML UI and injected clock drive the experience. SVGs, metadata and all runtime code ship as static assets.

**Tech Stack:** TypeScript, Vite, semantic HTML/CSS, Vitest, Playwright; npm lockfile and a pinned supported Node LTS. Select compatible stable versions at implementation time.

**Spec:** [Proposed design](../specs/2026-11-26-flags-of-the-world-design.md), supported by [rules evidence](../../rules.md).

## Global constraints

- Solo first; no login, backend, public leaderboard or live flag API.
- Challenge: 10 distinct flags × 1,000 ms × 3 same-order passes; 5,000 ms gap; 25 distinct choices containing exactly 5 study flags; 60,000 ms selection; 3 rounds; correct choice = 1 point; no speed bonus.
- Practice: same counts; 2,000 ms per flag; no answer deadline; separate from challenge records.
- Select at most five; submit requires exactly five; timeout scores current choices once.
- Use bundled SVGs, explicit catalog/RNG/rules versions and no visually indistinguishable flags in one round.
- A 5×5 board fits at 320 px with 44 px touch targets; keyboard operation, visible focus, reduced motion and non-color feedback.
- Build base `/flags-of-the-world/`; no history-router dependency.
- Preserve this review package and third-party notices in the eventual release.

## Review focus

1. Late clicks and duplicate timeout/submit events cannot mutate or rescore a locked round (Task 2).
2. Slow image loading, page stalls and hidden tabs cannot grant extra eligible study time or silently skip flags (Tasks 1–3).
3. Storage denial/corruption and refresh do not break play or resurrect an active timed round (Task 4).
4. Catalog equivalence collisions and insufficient eligible flags fail clearly instead of biasing generation or hanging (Task 1).
5. Project-path hosting, narrow screens, keyboard-only navigation and screen-reader announcements work outside the dev-server root (Tasks 3 and 5).

## File map and shared interfaces

```text
index.html, package.json, package-lock.json, tsconfig.json, vite.config.ts
src/main.ts                       application wiring
src/game/{types,rules,random}.ts   shared contracts, constants, deterministic RNG
src/game/generateRound.ts         round construction
src/game/{reducer,score,clock}.ts  transitions, scoring, timing
src/catalog/flags.ts              versioned metadata and equivalence groups
src/ui/{render,screens}.ts        semantic phase screens and event wiring
src/styles.css                   responsive layout and focus
src/storage.ts                   versioned settings and completed best
public/flags/*.svg                reviewed local assets
tests/{generator,score,reducer,clock,storage}.test.ts
tests/e2e/{session,accessibility,release}.spec.ts
.github/workflows/{ci,deploy}.yml
```

Use these contracts consistently; implementation can refine internal representations without changing their behavior:

```ts
type FlagId = string;
type Mode = 'challenge' | 'practice';
type Flag = { id: FlagId; name: string; description: string;
  assetPath: string; equivalenceGroup: string };
type Ruleset = { version: string; mode: Mode; exposureMs: number;
  passes: 3; studyCount: 10; boardCount: 25; targetCount: 5;
  gapMs: 5000; answerMs: number | null; rounds: 3 };
type Round = { study: FlagId[]; targets: FlagId[]; board: FlagId[] };
type RoundResult = { correct: FlagId[]; wrong: FlagId[];
  missed: FlagId[]; points: number };
type Rng = () => number; // [0,1), deterministic and versioned
generateRound(catalog: readonly Flag[], rng: Rng): Round;
scoreRound(round: Round, selected: readonly FlagId[]): RoundResult;
```

`GameState` is a discriminated union by phase: `home | loading | countdown | memorize | hold | select | review | results | interrupted | load-error`. Common session fields: `mode`, `roundIndex` (0–2), `round`, `selected`, `results`, `eligibleForBest`, `rulesVersion`, `catalogVersion`, `rngVersion`. Active states hold the phase start/deadline as applicable. Define it in `types.ts` before consumers.

`GameEvent` includes `START`, `ASSETS_READY`, `ASSET_FAILED`, `TICK`, `TOGGLE`, `SUBMIT`, `NEXT_ROUND`, `HIDDEN`, `RESTART_ROUND`, `HOME`; events needing timing carry `nowMs`. `NEXT_ROUND` and `RESTART_ROUND` carry a newly generated `Round`. The reducer never calls randomness, storage or the DOM. `reduceGame(state, event): GameState` is pure. UI listeners dispatch events; side effects live in application wiring.

## Task 1 — reproducible, valid rounds with usable flag data

**Files:** project setup, `types.ts`, `rules.ts`, `random.ts`, `generateRound.ts`, `catalog/flags.ts`, `public/flags/`, `tests/generator.test.ts`, third-party notices.

**Produces:** `createRng(seed: string): Rng`, `generateRound(...)`, `CHALLENGE`, `PRACTICE`, `FLAGS`, catalog and RNG version constants. The first catalog contains at least 60 reviewed entries and at least 30 distinct equivalence groups.

- [ ] Add the smallest Vite/TypeScript/Vitest setup and scripts `dev`, `build`, `preview`, `typecheck`, `test`; commit the lockfile and Node version.
- [ ] Write generator tests with the invariant assertions below; run `npm run test -- --run tests/generator.test.ts` and confirm a failure from missing implementation.

```ts
expect(round.study).toHaveLength(10);
expect(new Set(round.study).size).toBe(10);
expect(round.board).toHaveLength(25);
expect(new Set(round.board).size).toBe(25);
expect(round.board.filter(id => round.study.includes(id)).sort())
  .toEqual([...round.targets].sort());
expect(round.targets).toHaveLength(5);
```

- [ ] Add 1,000-seed coverage, exact same-seed repeatability, all IDs belonging to the catalog, no equivalence collisions across the 30-flag union, and failure for duplicate IDs or fewer than 30 eligible groups. Verify test failures before implementation.
- [ ] Implement versioned deterministic RNG/shuffle and bounded sampling. Select 30 distinguishable flags, partition ten study and twenty distractors, choose five study targets, and shuffle targets+distractors. Leave the other five study flags off-board.
- [ ] Import and review at least 60 SVGs from a pinned licensed source; retain the full source license. Add English names and distinguishing visual descriptions. Check each path, SVG decoding and equivalence group. Avoid network dependencies at runtime.
- [ ] Run generator tests, typecheck and build; confirm invariants and absence of missing assets. Commit as `feat: add deterministic flag rounds and catalog`.

## Task 2 — scoring and timed phase engine

**Files:** `reducer.ts`, `score.ts`, `clock.ts`, `types.ts`, `tests/{reducer,score,clock}.test.ts`.

**Consumes:** Task 1 contracts and rules. **Produces:** `reduceGame`, `scoreRound`, and `createClock({now, requestFrame, cancelFrame, onTick})` returning `{start(): void; stop(): void}`. Inject those dependencies for tests; production uses browser APIs.

- [ ] Write score tests: five correct → 5; four correct plus one wrong → 4; empty → 0; duplicate IDs, off-board IDs or more than five throw a typed invalid-selection error. Run and observe failures.
- [ ] Write transition/timing tests: 3,000 ms countdown, 30 complete 1,000 ms study slots in correct repeated order, 5,000 ms hold, 60,000 ms selection; practice exposures 2,000 ms and no answer deadline. At the answer deadline, auto-lock before applying any same-time click. Duplicate submit/tick cannot change a locked result.
- [ ] Add tests for sixth-choice refusal, deselection, early submit with four ignored, three-round termination, hidden-tab interruption, new-round recovery with best ineligible, and canceling old clock callbacks on home/restart.
- [ ] Add visible-stall tests: never skip flags to catch up; >250 ms overdue study transition invalidates challenge; permitted small delay schedules from actual paint. Stop all timing on review and results. Run the failing tests.
- [ ] Implement scoring and the pure reducer, including exactly-once round finalization; connect a single cancellable clock with timestamp-based deadlines. Use injected render/clock boundaries so study exposure begins when painted, not when an image request starts.
- [ ] Run all engine tests and typecheck. Commit as `feat: implement timed memory challenge engine`.

## Task 3 — accessible end-to-end solo play

**Files:** `src/main.ts`, `src/ui/{render,screens}.ts`, `src/styles.css`, `index.html`, `tests/e2e/{session,accessibility}.spec.ts`, Playwright config.

**Consumes:** engine, clock, rules and catalog. **Produces:** `renderGame(root: HTMLElement, state: GameState, dispatch: (event: GameEvent) => void): void` and `preloadRound(round: Round): Promise<void>`. Reject preload when any required image fails to decode; never start a timer on partial readiness.

- [ ] Add browser tests for a full challenge through three rounds with exact total, early submission, partial timeout, zero-selection timeout, five-choice cap, untimed review, and practice. Use injected/fake time rather than waiting five minutes. Confirm failures before adding screens.
- [ ] Add keyboard-only, 320/390/768/1440 px, reduced-motion, accessible names/status, failed image, background interruption and slow-render tests. Ensure challenge review distinguishes missed board targets from the five absent study flags.
- [ ] Build welcome/tutorial, ready, study, blank gap, choice grid, review, results, loading failure and interruption screens matching the approved mockups. Every phase change removes old listeners and pending callbacks. Asset failure offers retry/home; retry preloads before a new countdown.
- [ ] Check the visual hierarchy with real bundled SVGs. Show one large flag on the study screen and a fixed 5×5 flag board with the timer and selection count above it. Place selection marks without shifting tiles. Check small details in similar flag designs at the narrowest supported size.
- [ ] Keep grid order fixed and targets visually undisclosed until lock. Announce phase, count and 10-second warning without announcing every countdown tick. Use textual outcome labels in review. Provide named/described practice as a separate choice.
- [ ] Run browser suite in Chromium, Firefox and WebKit; inspect the board at specified widths and complete one manual keyboard session. Commit as `feat: add responsive solo game interface`.

## Task 4 — completed-session records and replay

**Files:** `storage.ts`, results/home UI, `tests/storage.test.ts`, session E2E.

**Produces:** `loadPreferences(storage: Storage): Preferences`, `loadBest(storage: Storage, key: RecordKey): number | null`, `saveBest(storage: Storage, key: RecordKey, total: number): void`. Define `RecordKey` from mode/assistance, rules/catalog/RNG versions. `Preferences` includes practice assistance and motion/sound preferences only if implemented; avoid unused settings.

- [ ] Write tests for missing/corrupt JSON, wrong schema version, blocked read/write, non-finite/out-of-range score, lower-score retention and tied totals. No storage error may prevent gameplay.
- [ ] Write tests that practice, assisted and interrupted sessions cannot modify the standard best; refresh discards timed state, Replay resets selection/results and generates a fresh session seed. Confirm failures.
- [ ] Implement versioned parsing and safe storage fallback; show a modest message if best cannot be saved. Add Clear local record with an explicit control. Do not store in-progress boards or claim cloud sync.
- [ ] Run storage and session tests, typecheck and build. Commit as `feat: add local best and fresh-session replay`.

## Task 5 — open-source release and GitHub Pages

**Files:** `vite.config.ts`, `.github/workflows/{ci,deploy}.yml`, `tests/e2e/release.spec.ts`, README, deployment guide, notices.

**Consumes:** successful Tasks 1–4 and [deployment plan](../../deployment.md). **Produces:** verified Pages release at the project URL with archived design review under `/design-review/`.

- [ ] Add release smoke tests running the built `dist` under `/flags-of-the-world/`: home loads, no flag 404s, full round completes, refresh returns home, no absolute-domain-root flag references. Confirm failing base-path tests before changing deployment configuration.
- [ ] Configure Vite base and copy the mockup to `dist/design-review/`; include notices. Add CI for typecheck/tests/build/E2E; add deployment only after successful build, on `main` or manual dispatch. Pin action SHAs at implementation time and use least-privilege Pages permissions.
- [ ] Run the complete release command sequence from deployment.md; inspect built files for unexpected secrets, source transcripts or missing licenses. Confirm all checks pass.
- [ ] Switch Pages source from docs branch publishing to Actions, push the release commit, wait for successful deployment, then verify the public URL and version. Keep README status honest throughout.
- [ ] Exercise rollback in a safe preview or document the verified previous release SHA and rebuild command. Tag `v0.1.0` only after the public smoke check. Commit as `ci: publish verified game releases to GitHub Pages`.

## Milestones and later work

Order: **review → valid rounds → engine → playable UI → records → release**. Tasks 1–2 establish the reusable domain core; 3–4 produce the playable experience; 5 ships it. The current docs/visuals commit completes none of these production milestones.

Later, prefer a same-seed challenge link before online rooms. For actual simultaneous play, separately design a server-authoritative match clock, private submissions, reconnect/timeout rules, room lifecycle and playoff rules. Never retrofit a global leaderboard over untrusted local scores.

## Self-review

The five review-focus risks map to specific tests above. Rules, versions and function names are shared rather than redefined per task. Assets, interruption recovery, assistive practice, partial timeouts, local storage, mobile layout, project-path routing and release rollback are covered. Remaining product choices are in the proposed design’s review section; exact dependency versions and catalog selection belong to implementation review.
