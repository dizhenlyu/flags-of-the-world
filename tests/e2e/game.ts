import { expect, type Page } from '@playwright/test';

const startTime = Date.UTC(2026, 0, 1);

export const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { name });
export const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
export const tiles = (page: Page) => page.locator('.board button');

export async function openGame(page: Page) {
  await page.clock.install({ time: startTime });
  await page.clock.pauseAt(startTime + 1_000);
  const response = await page.goto('./');
  expect(response?.ok()).toBe(true);
  await expect(heading(page, 'Flags of the World')).toBeVisible();
}

export async function startRound(page: Page, action = 'Start challenge') {
  await button(page, action).click();
  await expect(heading(page, 'Get ready')).toBeVisible();
}

export async function reachBoard(page: Page, practice = false) {
  await page.clock.runFor(practice ? 69_500 : 39_500);
  await expect(heading(page, 'Find five matches')).toBeVisible();
  await expect(tiles(page)).toHaveCount(25);
}

export async function recordStudy(page: Page, practice = false) {
  await page.evaluate(() => {
    const seen: string[] = [];
    document.body.dataset.study = JSON.stringify(seen);
    const observer = new MutationObserver(() => {
      const flag = document.querySelector<HTMLImageElement>('.study-field img');
      if (flag && seen.at(-1) !== flag.src) seen.push(flag.src);
      document.body.dataset.study = JSON.stringify(seen);
    });
    observer.observe(document.querySelector('#app')!, { childList: true, subtree: true, attributes: true });
  });
  await reachBoard(page, practice);
  const seen = JSON.parse((await page.locator('body').getAttribute('data-study'))!) as string[];
  expect(seen).toHaveLength(30);
  const firstPass = seen.slice(0, 10);
  expect(new Set(firstPass).size).toBe(10);
  expect(seen).toEqual([...firstPass, ...firstPass, ...firstPass]);
  const choices = await tiles(page).locator('img').evaluateAll(images =>
    images.map(image => (image as HTMLImageElement).src));
  const targets = choices.flatMap((src, index) => firstPass.includes(src) ? [index] : []);
  expect(targets).toHaveLength(5);
  return targets;
}
