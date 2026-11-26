import { CHALLENGE } from './rules';
import type { FlagId, Round, RoundResult } from './types';

export class InvalidSelectionError extends Error {
  override name = 'InvalidSelectionError';
}

export function scoreRound(round: Round, selected: readonly FlagId[]): RoundResult {
  const picks = new Set(selected);
  const board = new Set(round.board);
  if (picks.size !== selected.length || picks.size > CHALLENGE.targetCount ||
      selected.some(id => !board.has(id))) {
    throw new InvalidSelectionError('Select up to five distinct flags from the board.');
  }

  const targets = new Set(round.targets);
  const correct = selected.filter(id => targets.has(id));
  return {
    correct,
    wrong: selected.filter(id => !targets.has(id)),
    missed: round.targets.filter(id => !picks.has(id)),
    points: correct.length,
  };
}
