# GitHub Pages deployment

The [game](https://dizhenlyu.github.io/flags-of-the-world/) uses GitHub Actions to publish to `dizhenlyu/flags-of-the-world`. The original [interactive design review](https://dizhenlyu.github.io/flags-of-the-world/design-review/) is packaged from `docs/index.html` and `docs/review/`.

## Build and verify

Use the Node LTS version pinned in `.node-version`.

```sh
npm ci
npm run typecheck
npm test -- --run
npm run build
npx playwright install --with-deps
npm run test:e2e
```

Playwright serves the production output at `http://127.0.0.1:4173/flags-of-the-world/` and runs Chromium, Firefox and WebKit. You can also start that preview yourself with `npm run preview`.

## Publish

In repository Settings → Pages, select **GitHub Actions**. Pull requests run CI. Pushes to `main` and manual dispatches on `main` run the deployment workflow. It runs the same checks, uploads only `dist/`, then deploys to the `github-pages` environment. The public build records its commit in the `build-commit` meta tag.

After GitHub reports a successful deployment, rerun the browser smoke tests against the live site with the deployed commit SHA:

```sh
PLAYWRIGHT_BASE_URL=https://dizhenlyu.github.io/flags-of-the-world/ \
  EXPECTED_DEPLOY_COMMIT=YOUR_DEPLOYED_SHA \
  npm run test:e2e -- tests/e2e/release.spec.ts --project=chromium
```

## Rollback

For a gameplay regression, revert the faulty change on `main` and let the workflow rebuild and verify the reverted source. The `v0.1.0` tag identifies the first playable release. The previous production commit, `75bf432ce637201d35952a762ab8ef87307d7265`, contains the original static mockup. To preview that version, check out the commit separately and run `python3 -m http.server 8000 --directory docs`.

## Privacy

The game has no account or application analytics. Device best and the Practice naming preference are stored in the browser. Catalog, rules and random-generator versions scope the best score. GitHub applies its own hosting logs and privacy practices.
