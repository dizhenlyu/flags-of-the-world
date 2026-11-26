import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/design-review', { recursive: true });
await Promise.all([
  cp('docs/index.html', 'dist/design-review/index.html'),
  cp('docs/review', 'dist/design-review/review', { recursive: true }),
  cp('LICENSE', 'dist/LICENSE'),
  cp('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.md'),
  cp('COUNTRY_FLAGS_SOURCE.md', 'dist/COUNTRY_FLAGS_SOURCE.md'),
]);
