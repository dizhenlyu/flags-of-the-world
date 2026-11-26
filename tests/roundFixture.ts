import type { Round } from '../src/game/types';

export const exampleRound: Round = {
  study: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
  targets: ['a', 'b', 'c', 'd', 'e'],
  board: ['a', 'b', 'c', 'd', 'e', ...Array.from({ length: 20 }, (_, index) => `distractor-${index}`)],
};
