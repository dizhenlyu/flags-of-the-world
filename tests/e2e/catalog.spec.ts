import { expect, test } from '@playwright/test';
import { FLAGS } from '../../src/catalog/flags';

test('every national flag decodes from the production build', async ({ page }) => {
  await page.goto('./');
  const errors = await page.evaluate(async paths => {
    return (await Promise.all(paths.map(async path => {
      const flag = new Image();
      flag.src = path;
      try {
        await flag.decode();
        return flag.naturalWidth && flag.naturalHeight ? null : path;
      } catch {
        return path;
      }
    }))).filter(path => path !== null);
  }, FLAGS.map(flag => flag.assetPath));
  expect(errors).toEqual([]);
});
