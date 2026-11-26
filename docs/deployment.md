# GitHub Pages deployment plan

Repository: `dizhenlyu/flags-of-the-world` (public). Intended URL: `https://dizhenlyu.github.io/flags-of-the-world/`.

## Phase 0 — publish this review package

The initial repository contains documentation and a manually advanced mockup, not the playable game. Publish the `main` branch’s `/docs` folder through Settings → Pages → Deploy from a branch. `docs/index.html` is the entry point and `docs/.nojekyll` prevents Jekyll processing. No build or runtime dependencies are needed for this phase.

Verify the Pages build succeeds and the public URL returns the review title. Open the study screen and board from the project URL to check that the relative CSS, JavaScript, and SVG paths resolve under `/flags-of-the-world/`. Preserve the upstream license beside the review artwork.

## Phase 1 — build and verify the game

Use Vite with `base: '/flags-of-the-world/'`. Commit a package lock; pin the chosen supported Node LTS in `.node-version` and CI. Select compatible stable dependency versions at implementation time, not from an unverified “latest” example. Reference flags through the build base URL, never hard-code `/flags/...` at the domain root. Use a single page with no history routing in v1 so refresh works without a server rewrite.

Proposed package commands:

```sh
npm ci
npm run typecheck
npm run test -- --run
npm run build
npx playwright install --with-deps
npm run test:e2e
```

All commands are **planned interfaces**, not commands currently available in this docs-only repository. E2E tests serve `dist` under `/flags-of-the-world/`, not just the dev-server root.

## Phase 2 — automated production publishing

Switch Pages source to **GitHub Actions** when the game is ready. Create `.github/workflows/ci.yml` for pull-request checks, and `.github/workflows/deploy.yml` for successful default-branch releases and manual dispatch. Pull requests must not deploy production.

1. Checkout and set up the pinned Node version; install with `npm ci`.
2. Run typecheck, unit tests, build, then browser acceptance tests against the built artifact.
3. Preserve the review package at `dist/design-review/` and copy the source/license notices needed by the release.
4. Run `actions/configure-pages`, upload **only `dist/`** with `actions/upload-pages-artifact`, and deploy with `actions/deploy-pages`.
5. Put deploy in the `github-pages` environment; set `needs: build`. Use `contents: read` for build and `pages: write` / `id-token: write` only for deploy. Use a `pages` concurrency group to avoid overlapping deployments.
6. Pin actions to reviewed commit SHAs with version comments when creating the actual workflow; validate current recommended action versions then. No personal access token is required by the deployment workflow.
7. After deploy, verify HTTPS, title/version marker, a loaded flag, a full round, mobile layout and refresh at the project path.

GitHub documents Pages as static HTML/CSS/JS hosting. It cannot run a real-time room server. Keep multiplayer services out of this release and never place service secrets in frontend environment variables.

## Release and rollback

Create a `v0.1.0` release only after acceptance checks pass; list supported modes and rule deviations. Record the deployed commit in the build. If a regression ships, revert the faulty change on `main` and rerun the same pipeline. Retain the last successful release tag so the previous state can be rebuilt; verify the restored version at the public URL. Do not bypass failing checks to roll forward.

## Operations and privacy

The app proposes no accounts or application analytics. Scores remain in browser storage and are user-resettable. GitHub still applies its own hosting logs and privacy practices. Use Issues for reproducible bugs and rules evidence; catalog or timing changes require a ruleset version bump so best scores do not silently mix different conditions.

## Sources checked 2026-11-26

- [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Configure a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Vite deployment and project base path](https://vite.dev/guide/static-deploy.html#github-pages)
