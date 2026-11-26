import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/flags-of-the-world/',
  define: {
    __BUILD_COMMIT__: JSON.stringify(process.env.GITHUB_SHA ?? 'local'),
  },
  test: {
    include: ['tests/*.test.ts'],
  },
});
