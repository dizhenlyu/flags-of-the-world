import { expect, test } from '@playwright/test';
import { button, heading, openGame, reachBoard, startRound, tiles } from './game';

test('fits a compact five-column board at 320, 390, 768 and 1440 CSS pixels', async ({ page }) => {
  await openGame(page);
  await startRound(page);
  await reachBoard(page);

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await tiles(page).evaluateAll(buttons => {
      const bounds = buttons.map(button => button.getBoundingClientRect());
      return {
        scrollWidth: document.documentElement.scrollWidth,
        widths: bounds.map(rect => rect.width),
        heights: bounds.map(rect => rect.height),
        rows: new Set(bounds.map(rect => rect.y)).size,
        gap: bounds[1].left - bounds[0].right,
        safe: bounds.every(rect => rect.left >= 0 && rect.right <= innerWidth),
      };
    });
    expect(layout.scrollWidth).toBe(width);
    expect(layout.safe).toBe(true);
    expect(layout.rows).toBe(5);
    expect(Math.min(...layout.widths, ...layout.heights)).toBeGreaterThanOrEqual(44);
    expect(layout.gap).toBeGreaterThanOrEqual(4);
  }
});

test('supports keyboard toggles, visible focus and live deadline status in reduced motion', async ({ page, browserName }) => {
  // macOS WebKit uses Option-Tab to include buttons in keyboard navigation.
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGame(page);
  await page.keyboard.press(tab);
  await expect(button(page, 'Start challenge')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(heading(page, 'Get ready')).toBeVisible();
  await reachBoard(page);
  await expect(page.getByRole('timer')).toContainText(/0:5[89]|1:00/);
  await page.keyboard.press(tab);
  await expect(tiles(page).first()).toBeFocused();
  expect(await tiles(page).first().evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Space');
  await expect(tiles(page).first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toHaveText('1 of 5 selected.');
  await page.keyboard.press('Enter');
  await expect(tiles(page).first()).toHaveAttribute('aria-pressed', 'false');
  await page.clock.fastForward(50_000);
  await expect(page.getByRole('status')).toContainText('10 seconds or less remaining');
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press('Space');
    await page.keyboard.press(tab);
  }
  for (let index = 5; index < 25; index++) await page.keyboard.press(tab);
  await expect(button(page, 'Submit choices')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(heading(page, /[0-5] \/ 5/)).toBeVisible();
});

test('preserves intrinsic flag proportions in study, on the board and in review', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await openGame(page);
  await startRound(page);
  await page.clock.runFor(3_050);
  const study = page.locator('.study-field img');
  await expect(study).toHaveCount(1);
  const firstSrc = await study.getAttribute('src');
  expect(firstSrc).toMatch(/\.svg$/);

  const geometry = async (images: ReturnType<typeof page.locator>) => images.evaluateAll(async elements =>
    Promise.all(elements.map(async element => {
      const image = element as HTMLImageElement;
      await image.decode();
      const style = getComputedStyle(image);
      return {
        source: image.getAttribute('src'),
        fit: style.objectFit,
        ratio: image.naturalWidth / image.naturalHeight,
        width: image.naturalWidth,
      };
    })),
  );

  const [first] = await geometry(study);
  expect(first.fit).toBe('contain');
  expect(first.width).toBeGreaterThan(0);
  await page.clock.runFor(36_450);
  const board = await geometry(tiles(page).locator('img'));
  expect(board).toHaveLength(25);
  expect(new Set(board.map(flag => flag.ratio)).size).toBeGreaterThan(2);
  expect(board.every(flag => flag.fit === 'contain' && flag.width > 0)).toBe(true);
  for (const tile of (await tiles(page).all()).slice(0, 5)) await tile.click();

  await button(page, 'Submit choices').click();
  await page.getByText('Review all 10 study flags').click();
  const review = await geometry(page.locator('.sequence img'));
  expect(review).toHaveLength(10);
  expect(review.every(flag => flag.fit === 'contain' && flag.width > 0)).toBe(true);
  expect(review[0]).toEqual(first);
});

test.describe('touch input', () => {
  test.use({ hasTouch: true, viewport: { width: 320, height: 780 } });

  test('toggles and submits with taps on a narrow board', async ({ page }) => {
    await openGame(page);
    await button(page, 'Start challenge').tap();
    await expect(heading(page, 'Get ready')).toBeVisible();
    await reachBoard(page);
    const first = tiles(page).first();
    await first.tap();
    await expect(first).toHaveAttribute('aria-pressed', 'true');
    await first.tap();
    await expect(first).toHaveAttribute('aria-pressed', 'false');
    for (const tile of (await tiles(page).all()).slice(0, 5)) await tile.tap();
    await button(page, 'Submit choices').tap();
    await expect(heading(page, /[0-5] \/ 5/)).toBeVisible();
  });
});
