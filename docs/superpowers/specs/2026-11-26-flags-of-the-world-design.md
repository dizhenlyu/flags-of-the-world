# Flags of the World — proposed design

Date: 2026-11-26. Status: **proposal for review**, not an approved implementation specification. User-selected direction: **solo memory challenge first, multiplayer later**. Other defaults below are recommendations.

## Intent and scope

Make the episode’s rapid visual recognition challenge playable in a browser with a short, repeatable session. The distinguishing mechanic is remembering ten flags then recognizing five among 25, including close distractors. The player should understand the task without knowing country names or watching the show.

The current deliverable is a public planning repository with rule extraction, mockups and an implementation/deployment plan. The full game will be implemented after review. No production game logic is present in the mockup.

Success means a first-time player can start without an account, finish three rounds, understand every mistake, and replay on desktop or phone. A regular session has at most 285 seconds of active play plus countdowns/review: 3 × (30 + 5 + 60). Early submit can shorten this.

## Approaches considered

| Approach | Benefit | Tradeoff | Decision |
| --- | --- | --- | --- |
| Vite + TypeScript + native HTML/CSS | Small static build; clear timers and state; accessible buttons | Manual UI lifecycle management | Recommended for solo MVP |
| React + Vite | Familiar components as screens and settings grow | Additional runtime and framework patterns for a small UI | Viable if future interface complexity warrants it |
| Phaser/canvas game | Rich scenes, effects and game-loop tools | More accessibility work; little benefit for a flag grid | Defer |

GitHub Pages serves the entire solo app. Real-time multiplayer is later work requiring synchronization infrastructure; sharing a seed can support an informal same-puzzle challenge without pretending scores are trusted.

## Scope boundaries

MVP: Challenge, Practice, rules tutorial, round review, final score, replay, local best, keyboard and touch controls, bundled flags, reduced motion, static hosting.

Later: same-seed links, local turn-taking with hidden answers, online rooms, localization, larger flag catalog, curated similar-flag difficulty.

Exclude from MVP: login, global rankings, ads, analytics SDKs, remote flag APIs, copied show branding, service worker/offline installation, paid backend. Avoid geographic trivia prompts, speed-based scoring and immediate right/wrong feedback: they would change the tested skill.

## Rules contract

Use [the evidence and adaptation table](../../rules.md) as the rules source. Challenge constants are 10 distinct flags, 1,000 ms each, 3 same-order passes, 5,000 ms blank interval, 25 distinct board flags, exactly 5 targets, 60,000 ms selection time, 3 rounds, one point per correct selection, no speed bonus.

Practice keeps the counts but uses 2,000 ms exposures and an untimed selection stage. Submit requires exactly five; timeout accepts current choices. Flags may recur between rounds, but not duplicate within a study sequence or board. Do not add a sequence-order task.

## Player journeys and screen responsibilities

See [journey diagrams](../../journeys.md) and [interactive review screens](../../index.html).

1. **Welcome:** one Challenge action, a Practice alternative, and compact “10 → 25 → 5” explanation. Before first play show the timing, three rounds and device-local best behavior.
2. **Ready / memorize:** load/decode all selected assets before countdown. One centered flag, pass 1/3 and flag 1/10. No country labels, previous thumbnails, next/rewind buttons or pause during a challenge. Transitions are instant, without animated flag distortion.
3. **Hold:** a neutral five-second screen; neither study flag nor board remains visible.
4. **Choose:** a compact 5×5 grid of local flag SVGs with stable placement. The timer and selection count sit above the board. Selection adds a high-contrast outline and checkmark without shifting any flag. Use descriptive accessible labels during the challenge and show country names in review. Submit at exactly five.
5. **Round review:** correct, wrong, and missed categories use text/icons as well as colors; reveal names and the entire study sequence. Correct-but-absent study flags are labeled “not on board,” not “missed.” Next round is explicit.
6. **Results:** total /15 and per-round scores. Challenge best only for completed eligible runs. Replay creates a new seed; Practice has no comparison against challenge best.
7. **Interruption:** neutral overlay immediately on visibility loss; invalidate an active challenge attempt. On return, a fresh round continues the session but the entire match is marked ineligible for a record. Refresh discards in-progress gameplay; only settings/completed best persist.

## Visual direction and accessibility

The user’s references emphasize two compositions: a single, large flag during memorization and a dense board of rectangular flags during selection. Use a flat charcoal play area, restrained mint controls, square image edges, and compact board gutters. Keep progress, timing, instructions, and controls outside the flag area. Use national flag artwork with local SVGs and an original sample arrangement.

The review uses original-ratio artwork from the pinned `country-flags` source. Fit the whole flag in its study frame and in equal board cells. Preserve the asset’s width-to-height ratio and leave neutral space around it as needed. Review the catalog at small tile sizes before launch, including white flags, detailed emblems, and similar color patterns.

The 5×5 board must fit at 320 CSS px: minimum 44×44 effective targets, at least 4 px separation, no horizontal scrolling. On desktop use larger cards; on mobile remove peripheral chrome before shrinking the board. Country names only appear outside challenge play. Keyboard users use normal Tab, Enter/Space; visible focus is never suppressed. Status announcements cover phase, selection counts, and meaningful time warnings, not every second. Reduced motion removes decorative transitions. Preserve score with numeric text and explicit outcome labels for colorblind users.

Visual memory cannot be made equivalent for all sensory needs. Supply named/described practice with announced flags, longer exposure and no time pressure; keep its record category separate. Standard challenge images expose concise visual descriptions rather than target membership or country-name hints. Descriptions must distinguish catalog entries without revealing whether they are correct.

## Architecture

- `src/game/types.ts`: FlagId, Ruleset, Round, GameState, GameEvent and Result contracts.
- `src/game/rules.ts`: immutable challenge/practice settings and version.
- `src/game/random.ts`: versioned deterministic PRNG and Fisher–Yates shuffle.
- `src/game/generateRound.ts`: select 10 study flags, sample 5 targets, select 20 distractors from outside all 10, then shuffle board.
- `src/game/reducer.ts`: pure phase transitions and selection limits; accepts event timestamps from an injected clock.
- `src/game/score.ts`: validate selections and compute correct/wrong/missed IDs.
- `src/game/clock.ts`: rendering-aware exposure scheduling and answer deadline; owns cancellation.
- `src/catalog/flags.ts`, `public/flags/`: curated metadata, visual-equivalence groups and SVG assets.
- `src/ui/`: phase-specific rendering; event listeners cleaned up on transition.
- `src/storage.ts`: versioned settings/best parsing with safe fallback if storage fails.

State flow: home → loading → countdown → memorize → hold → select → review → next round or results. Active phases can go to interrupted; loading can go to load-error. The UI sees only the data needed by each stage. Client source remains inspectable; there is no claim of anti-cheat security.

### Timing and lifecycle decisions

Use `performance.now()` for monotonic time. Do not decrement a counter once per callback. For the answer stage, store `deadline = start + 60000`; every input and render checks it, and a click at or after the deadline submits the pre-click selection. Timeout and submit resolve through one lock transition and cannot score twice.

For memorization, each flag must get a complete nominal exposure starting from its actual painted frame. Schedule the next flag from the actual render rather than rapidly skipping flags to catch up. If a visible-page stall delays the transition by more than 250 ms, invalidate the challenge attempt with an interruption message. This preserves comparability rather than extending an unseen study window. Practice may restart without record consequences. Hidden tabs immediately interrupt; orientation changes alone do not restart the game.

### Generator and data constraints

Catalog must supply at least 30 mutually distinguishable eligible flags: ten study flags plus 20 distractors. Require unique IDs and no visual-equivalence collision across the entire 30-flag round union. Select all 30 deterministically from the eligible catalog, partition into study and distractors, choose targets from study, shuffle board. Throw a typed configuration error if constraints cannot be met; never spin indefinitely. Keep visually identical variants out of the first catalog; do not rely on pixel differences users cannot perceive.

Use a checked-in catalog version and RNG version in stored results and future seed links. Use original-ratio SVGs from a pinned catalog, such as the [country-flags collection](https://github.com/hampusborgos/country-flags). Keep the source notice and review differences important to recognition. Bundle assets locally. Name the reviewed catalog as an explicit country/territory selection.

## Acceptance criteria

- Generator properties hold across at least 1,000 seeds; same seed + versions produces same sequence and board.
- Study shows all 30 exposures, then the blank gap, then the board; feedback cannot reveal answers early.
- Five-choice cap and deselection work by touch and keyboard; submission is idempotent.
- A late input, slow render, background tab, broken asset, refresh and blocked storage each have a deliberate, tested outcome.
- Three completed rounds produce an accurate /15 result; practice/interrupted sessions never update standard best.
- No clipped board at 320/390/768/1440 px; verify Safari, Chromium and Firefox, including real mobile checks where available.
- Release build loads from `/flags-of-the-world/` with no missing flag assets and no secrets in output.

## Decisions for review

Confirm the proposed visual direction, three-round solo structure, separate Practice mode, MIT license, and interruption policy. These choices are reviewable defaults; no additional approval is needed to keep researching or preparing this repository. Game implementation begins after design review.
