import { CATALOG_VERSION } from './catalog/flags';
import { RNG_VERSION } from './game/random';
import { CHALLENGE } from './game/rules';

type LocalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface RecordKey {
  mode: 'challenge';
  assisted: false;
  rulesVersion: string;
  catalogVersion: string;
  rngVersion: string;
}

export interface Preferences {
  namedPractice: boolean;
}

export const STANDARD_RECORD: RecordKey = {
  mode: 'challenge',
  assisted: false,
  rulesVersion: CHALLENGE.version,
  catalogVersion: CATALOG_VERSION,
  rngVersion: RNG_VERSION,
};

const SCHEMA_VERSION = 1;
const PREFERENCES_KEY = 'flags-of-the-world/preferences';

function bestKey(key: RecordKey) {
  const { mode, assisted, rulesVersion, catalogVersion, rngVersion } = key;
  return ['flags-of-the-world/best', mode, assisted, rulesVersion, catalogVersion, rngVersion].join('/');
}

function read(storage: LocalStorage | null, key: string): Record<string, unknown> | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value?.version === SCHEMA_VERSION ? value : null;
  } catch {
    return null;
  }
}

function write(storage: LocalStorage | null, key: string, value: Record<string, unknown>): boolean {
  try {
    if (!storage) return false;
    storage.setItem(key, JSON.stringify({ ...value, version: SCHEMA_VERSION }));
    return true;
  } catch {
    return false;
  }
}

function validScore(total: unknown): total is number {
  return typeof total === 'number' && Number.isInteger(total) &&
    total >= 0 && total <= CHALLENGE.rounds * CHALLENGE.targetCount;
}

export function loadBest(storage: LocalStorage | null, key: RecordKey): number | null {
  const total = read(storage, bestKey(key))?.total;
  return validScore(total) ? total : null;
}

export function saveBest(storage: LocalStorage | null, key: RecordKey, total: number): boolean {
  if (!validScore(total)) return false;
  const previous = loadBest(storage, key);
  if (previous !== null && total <= previous) return true;
  return write(storage, bestKey(key), { total });
}

export function clearBest(storage: LocalStorage | null, key: RecordKey): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(bestKey(key));
    return true;
  } catch {
    return false;
  }
}

export function loadPreferences(storage: LocalStorage | null): Preferences {
  return { namedPractice: read(storage, PREFERENCES_KEY)?.namedPractice === true };
}

export function savePreferences(storage: LocalStorage | null, preferences: Preferences) {
  write(storage, PREFERENCES_KEY, { ...preferences });
}
