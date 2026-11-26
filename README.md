# Flags of the World

An open-source HTML5 visual-memory mini game inspired by the flag recognition challenge in *The Devil’s Plan: Dead Again*, Season 3, Exile Match 06.

**Status: planning and design review. The playable game is not implemented yet.**

Watch ten flags. Remember what you saw. Find the five that return.

## Review the proposal

- [Interactive journey mockups](https://dizhenlyu.github.io/flags-of-the-world/) — illustrative screens, not a working game.
- [Rules and evidence](docs/rules.md) — episode timestamps, source conflict, and web adaptation decisions.
- [Product and technical design](docs/superpowers/specs/2026-11-26-flags-of-the-world-design.md).
- [Implementation plan](docs/superpowers/plans/2026-11-26-flags-of-the-world.md).
- [GitHub Pages deployment plan](docs/deployment.md).
- [User journeys](docs/journeys.md) — first session, replay, timeout, interruption.

## Core loop

1. See ten distinct flags, one second each, in the same order three times: 30 seconds.
2. Wait through a five-second blank interval.
3. Select five familiar flags from 25 choices within **60 seconds**.
4. Receive one point per correct selection; play three rounds, up to 15 points.

The one-minute selection window comes from the episode 12 English subtitle track (08:46–08:53). An English wiki summary says two minutes; that discrepancy is recorded in the rules document. This is a source-based reconstruction, not an official rulebook.

## Intended first release

Solo challenge and practice, responsive desktop/mobile UI, keyboard operation, local personal best, and bundled SVG flags. Proposed stack: TypeScript + Vite + semantic HTML/CSS, Vitest, and Playwright. No account or backend required. Multiplayer is later scope.

## Preview locally

Open `docs/index.html` in a browser, or serve the documentation:

```sh
python3 -m http.server 8000 --directory docs
```

Visit `http://localhost:8000`. The walkthrough advances manually and uses a fixed example. There is no running timer, random generator, saved score, or competitive mode in this preview.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md). Original code, diagrams, and documentation are [MIT licensed](LICENSE). Third-party assets keep their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

This is an independent fan project, unaffiliated with Netflix or TEO. No show footage, subtitles, music, logos, or contestant images are distributed here.
