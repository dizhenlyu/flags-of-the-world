import { expect, it } from 'vitest';
import { clearBest, loadBest, loadPreferences, saveBest, savePreferences, STANDARD_RECORD } from '../src/storage';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
    data,
  };
}

it('keeps the high score on ties and lower results and isolates other rule versions', () => {
  const storage = memoryStorage();
  expect(loadBest(storage, STANDARD_RECORD)).toBeNull();
  expect(saveBest(storage, STANDARD_RECORD, 7)).toBe(true);
  saveBest(storage, STANDARD_RECORD, 7);
  saveBest(storage, STANDARD_RECORD, 5);
  expect(loadBest(storage, STANDARD_RECORD)).toBe(7);
  expect(loadBest(storage, { ...STANDARD_RECORD, rulesVersion: 'future' })).toBeNull();
  expect(clearBest(storage, STANDARD_RECORD)).toBe(true);
  expect(loadBest(storage, STANDARD_RECORD)).toBeNull();
});

it.each(['no json', '{"version":0,"total":5}', '{"version":1,"total":"5"}',
  '{"version":1,"total":1e999}', '{"version":1,"total":-1}', '{"version":1,"total":16}'])(
  'ignores malformed or invalid records (%s)', raw => {
    const storage = memoryStorage();
    saveBest(storage, STANDARD_RECORD, 5);
    const key = [...storage.data.keys()][0];
    storage.setItem(key, raw);
    expect(loadBest(storage, STANDARD_RECORD)).toBeNull();
  },
);

it('ignores invalid score writes and handles blocked storage access', () => {
  const storage = memoryStorage();
  for (const invalid of [NaN, Infinity, -1, 16, 2.5]) {
    expect(saveBest(storage, STANDARD_RECORD, invalid)).toBe(false);
  }
  expect(loadBest(storage, STANDARD_RECORD)).toBeNull();
  const denied = () => { throw new Error('Storage is blocked'); };
  const blocked = { getItem: denied, setItem: denied, removeItem: denied };
  expect(loadBest(blocked, STANDARD_RECORD)).toBeNull();
  expect(saveBest(blocked, STANDARD_RECORD, 5)).toBe(false);
  expect(clearBest(blocked, STANDARD_RECORD)).toBe(false);
  expect(loadPreferences(blocked)).toEqual({ namedPractice: false });
});

it('persists valid named-practice settings and ignores invalid ones', () => {
  const storage = memoryStorage();
  expect(loadPreferences(storage)).toEqual({ namedPractice: false });
  savePreferences(storage, { namedPractice: true });
  expect(loadPreferences(storage)).toEqual({ namedPractice: true });
  storage.setItem([...storage.data.keys()][0], '{}');
  expect(loadPreferences(storage)).toEqual({ namedPractice: false });
});
