import { expect, test } from '@playwright/test';
import { button, heading, openGame, recordStudy, startRound, tiles } from './game';

test('serves the game, local flags and one complete round under the project path', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', error => problems.push(error.message));
  page.on('requestfailed', request => problems.push(request.url()));
  page.on('response', response => {
    if (!response.ok() && response.status() !== 304) problems.push(response.url());
  });
  await openGame(page);
  expect(new URL(page.url()).pathname).toBe('/flags-of-the-world/');
  await expect(page.locator('meta[name="build-commit"]')).toHaveAttribute(
    'content', process.env.EXPECTED_DEPLOY_COMMIT ?? /^(local|[a-f0-9]{40})$/,
  );
  await startRound(page);
  const targets = await recordStudy(page);
  for (const index of targets) await tiles(page).nth(index).click();
  await button(page, 'Submit choices').click();
  await expect(heading(page, '5 / 5')).toBeVisible();
  for (const source of await page.locator('img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src))) {
    expect(new URL(source).pathname).toMatch(/^\/flags-of-the-world\/flags\/[a-z]{2}\.svg$/);
  }
  await page.reload();
  await expect(heading(page, 'Flags of the World')).toBeVisible();
  expect(problems).toEqual([]);
});

test('preserves the interactive design review and its relative flag assets', async ({ page }) => {
  const response = await page.goto('./design-review/');
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle('Flags of the World — Design Review');
  await page.locator('#step').selectOption({ label: 'Memorize' });
  const image = page.locator('.study-field img');
  await expect(image).toBeVisible();
  expect(await image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await image.getAttribute('src')).toMatch(/^review\/flags\//);
});
