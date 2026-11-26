import { expect, test } from '@playwright/test';
import { button, heading, openGame, reachBoard, recordStudy, startRound, tiles } from './game';

test('plays three generated rounds, scores partial timeouts and keeps an eligible best', async ({ page }) => {
  await openGame(page);
  await startRound(page);
  const firstTargets = await recordStudy(page);
  const firstBoard = await tiles(page).locator('img').evaluateAll(images => images.map(img => img.getAttribute('src')));
  for (const index of firstTargets) await tiles(page).nth(index).click();
  await expect(button(page, 'Submit choices')).toBeEnabled();
  const outside = Array.from({ length: 25 }, (_, index) => index).find(index => !firstTargets.includes(index))!;
  await tiles(page).nth(outside).click();
  await expect(page.getByRole('status')).toContainText('Deselect a flag first.');
  await expect(tiles(page).nth(outside)).toHaveAttribute('aria-pressed', 'false');
  await button(page, 'Submit choices').click();
  await expect(heading(page, '5 / 5')).toBeVisible();
  await page.clock.fastForward(100_000);
  await expect(heading(page, '5 / 5')).toBeVisible();
  await page.getByText('Review all 10 study flags').click();
  await expect(page.getByText('Not on board', { exact: true })).toHaveCount(5);

  await startRound(page, 'Next round');
  const secondTargets = await recordStudy(page);
  for (const index of secondTargets.slice(0, 2)) await tiles(page).nth(index).click();
  await expect(button(page, 'Submit choices')).toBeDisabled();
  await page.clock.fastForward(60_000);
  await expect(heading(page, '2 / 5')).toBeVisible();
  await expect(page.getByText('Time is up.', { exact: true })).toBeVisible();

  await startRound(page, 'Next round');
  await reachBoard(page);
  await page.clock.fastForward(60_000);
  await expect(heading(page, '0 / 5')).toBeVisible();
  const freshTab = await page.context().newPage();
  try {
    await freshTab.goto('./');
    await expect(freshTab.getByText('Device best: 7 / 15')).toBeVisible();
  } finally {
    await freshTab.close();
  }
  await button(page, 'See results').click();
  await expect(heading(page, '7 / 15')).toBeVisible();
  await expect(page.getByText('New device best')).toBeVisible();

  await startRound(page, 'Play again');
  await reachBoard(page);
  const replayBoard = await tiles(page).locator('img').evaluateAll(images => images.map(img => img.getAttribute('src')));
  expect(replayBoard).not.toEqual(firstBoard);
  await expect(page.getByRole('status')).toContainText('0 of 5 selected');
  await page.reload();
  await expect(heading(page, 'Flags of the World')).toBeVisible();
  await expect(page.getByText('Device best: 7 / 15')).toBeVisible();
});

test('keeps named practice untimed and out of challenge records', async ({ page }) => {
  await openGame(page);
  await page.getByRole('checkbox', { name: 'Show country names in Practice' }).check();
  await startRound(page, 'Start practice');
  await page.clock.runFor(3_050);
  await expect(page.locator('.study-name')).toBeVisible();
  await page.clock.runFor(66_450);
  await expect(tiles(page).first().locator('img')).toBeVisible();
  for (let round = 1; round <= 3; round++) {
    await page.clock.fastForward(600_000);
    await expect(heading(page, 'Find five matches')).toBeVisible();
    for (const tile of (await tiles(page).all()).slice(0, 5)) await tile.click();
    await button(page, 'Submit choices').click();
    if (round < 3) {
      await startRound(page, 'Next round');
      await reachBoard(page, true);
    }
  }
  await button(page, 'See results').click();
  await expect(page.getByText('Practice session complete.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Device best: —')).toBeVisible();
});

test('restarts a hidden challenge attempt and makes the match ineligible', async ({ page }) => {
  await openGame(page);
  await startRound(page);
  await page.clock.runFor(3_050);
  const study = page.locator('.study-field img');
  const oldFlag = await study.getAttribute('src');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(heading(page, 'Round interrupted')).toBeVisible();
  await expect(study).toHaveCount(0);
  await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); });
  await startRound(page, 'Start a fresh round');
  await page.clock.runFor(3_050);
  const newFlag = await study.getAttribute('src');
  await page.clock.runFor(36_450);
  expect(oldFlag).toBeTruthy();
  expect(newFlag).toBeTruthy();

  for (let round = 1; round <= 3; round++) {
    await expect(tiles(page)).toHaveCount(25);
    await page.clock.fastForward(60_000);
    if (round < 3) {
      await startRound(page, 'Next round');
      await reachBoard(page);
    }
  }
  await button(page, 'See results').click();
  await expect(page.getByText('An interrupted session does not count toward your device best.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Device best: —')).toBeVisible();
});

test('stalled study interrupts instead of skipping exposures', async ({ page }) => {
  await openGame(page);
  await startRound(page);
  await page.clock.runFor(3_050);
  await expect(page.locator('.study-field img')).toBeVisible();
  await page.clock.fastForward(1_500);
  await expect(heading(page, 'Round interrupted')).toBeVisible();
});

test('an image failure blocks the countdown and retry decodes assets first', async ({ page }) => {
  await openGame(page);
  await page.route('**/flags/*.svg', route => route.abort());
  await button(page, 'Start challenge').click();
  await expect(heading(page, 'Flags could not load')).toBeVisible();
  await page.unrouteAll({ behavior: 'wait' });
  await startRound(page, 'Try again');
});

test('an input at the exact deadline locks the previous selection before the next frame', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    const screen = document.querySelector('#screen')!;
    const observer = new MutationObserver(() => {
      if (screen.getAttribute('data-phase') === 'select') {
        document.body.dataset.selectionStarted = String(performance.now());
        observer.disconnect();
      }
    });
    observer.observe(screen, { attributes: true });
  });
  await startRound(page);
  const targets = await recordStudy(page);
  await tiles(page).nth(targets[0]).click();
  await page.evaluate(() => {
    const deadline = Number(document.body.dataset.selectionStarted) + 60_000;
    Object.defineProperty(performance, 'now', { value: () => deadline });
  });
  await tiles(page).nth(targets[1]).dispatchEvent('click');
  await expect(heading(page, '1 / 5')).toBeVisible();
  await expect(page.getByText('Time is up.', { exact: true })).toBeVisible();
});
