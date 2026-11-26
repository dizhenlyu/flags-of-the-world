# Flags of the World

Watch ten flags. Find the five that return.

Flags of the World is an open-source solo visual-memory game inspired by the flag recognition challenge in *The Devil’s Plan: Dead Again*, Season 3, Exile Match 06.

- [Play Flags of the World](https://dizhenlyu.github.io/flags-of-the-world/)
- [Explore the archived interactive design review](https://dizhenlyu.github.io/flags-of-the-world/design-review/)

## How to play

Each Challenge round shows ten distinct flags for one second each, in the same order three times. After a five-second gap, find five of those flags among 25 choices. Submit when you have five choices or let the 60-second timer score your current picks. Each match earns one point, with a maximum of 15 points across three rounds.

Practice gives you two seconds per study flag and unlimited time to choose. You can turn on country names before starting Practice. Use touch or Tab and Enter/Space to choose flags. The round review reveals every correct choice, incorrect choice and missed target.

Challenge saves the best eligible three-round score in this browser. Switching away during an active round replaces the interrupted attempt with a freshly generated one and makes the session ineligible for a device best. Refreshing returns to the welcome screen.

## Development

Use the Node version in `.node-version`, then run:

```sh
npm ci
npm run dev
```

See the [deployment guide](docs/deployment.md) for production preview and verification commands. The game uses TypeScript, Vite and 64 locally bundled national flag SVGs. Gameplay and records run entirely in your browser.

## Project documents

- [Rules and evidence](docs/rules.md)
- [Design specification](docs/superpowers/specs/2026-11-26-flags-of-the-world-design.md)
- [Implementation plan](docs/superpowers/plans/2026-11-26-flags-of-the-world.md)
- [Player journeys](docs/journeys.md)
- [Contributing](CONTRIBUTING.md)

Original code and documentation are [MIT licensed](LICENSE). See the [third-party notices](THIRD_PARTY_NOTICES.md) for artwork attribution. This independent fan project is unaffiliated with Netflix or TEO.
