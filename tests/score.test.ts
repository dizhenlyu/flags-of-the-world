import { expect, it } from 'vitest';
import { scoreRound, InvalidSelectionError } from '../src/game/score';
import { exampleRound } from './roundFixture';

it('scores correct, wrong and missed flags independently', () => {
  expect(scoreRound(exampleRound, ['a', 'b', 'c', 'd', 'e']).points).toBe(5);
  expect(scoreRound(exampleRound, ['a', 'b', 'c', 'd', 'distractor-0'])).toEqual({
    correct: ['a', 'b', 'c', 'd'],
    wrong: ['distractor-0'],
    missed: ['e'],
    points: 4,
  });
  expect(scoreRound(exampleRound, []).points).toBe(0);
});

it.each([['a', 'a'], ['f'], ['a', 'b', 'c', 'd', 'e', 'distractor-0']])(
  'rejects invalid selections (%s)', (...ids) => {
    expect(() => scoreRound(exampleRound, ids)).toThrow(InvalidSelectionError);
  },
);
