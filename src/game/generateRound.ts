import { shuffle } from './random';
import { CHALLENGE } from './rules';
import type { Flag, Rng, Round } from './types';

export class RoundConfigurationError extends Error {
  override name = 'RoundConfigurationError';
}

export function generateRound(catalog: readonly Flag[], rng: Rng): Round {
  if (new Set(catalog.map(flag => flag.id)).size !== catalog.length) {
    throw new RoundConfigurationError('The flag catalog contains duplicate IDs.');
  }

  const { studyCount, boardCount, targetCount } = CHALLENGE;
  const total = studyCount + boardCount - targetCount;
  const groups = new Map<string, Flag[]>();
  for (const flag of catalog) {
    const group = groups.get(flag.equivalenceGroup) ?? [];
    group.push(flag);
    groups.set(flag.equivalenceGroup, group);
  }
  if (groups.size < total) {
    throw new RoundConfigurationError(`The catalog needs ${total} distinct flag groups.`);
  }

  const drawn = shuffle([...groups.values()], rng).slice(0, total).map(
    group => group[Math.floor(rng() * group.length)].id,
  );
  const study = drawn.slice(0, studyCount);
  const targets = shuffle(study, rng).slice(0, targetCount);
  const board = shuffle([...targets, ...drawn.slice(studyCount)], rng);
  return { study, targets, board };
}
