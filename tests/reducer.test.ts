import { expect, it } from 'vitest';
import { reduceGame } from '../src/game/reducer';
import type { GameEvent, GameState, Mode } from '../src/game/types';
import { exampleRound } from './roundFixture';

function run(state: GameState, ...events: GameEvent[]) {
  return events.reduce(reduceGame, state);
}

function ready(mode: Mode = 'challenge') {
  return run({ phase: 'home' },
    { type: 'START', mode, assisted: false, round: exampleRound },
    { type: 'ASSETS_READY', nowMs: 0 },
  );
}

function study(state: GameState, start = 3_000, duration = 1_000) {
  state = reduceGame(state, { type: 'TICK', nowMs: start });
  for (let i = 0; i < 30; i++) {
    state = run(state,
      { type: 'PAINTED', exposure: i, nowMs: start + i * duration },
      { type: 'TICK', nowMs: start + (i + 1) * duration },
    );
  }
  return state;
}

function choose(mode: Mode = 'challenge') {
  return reduceGame(study(ready(mode), 3_000, mode === 'challenge' ? 1_000 : 2_000), {
    type: 'TICK', nowMs: mode === 'challenge' ? 38_000 : 68_000,
  });
}

function toggle(state: GameState, id: string, nowMs = 40_000) {
  return reduceGame(state, { type: 'TOGGLE', id, nowMs });
}

it('shows all 30 full, painted study slots in order, then a five-second hold', () => {
  let state = ready();
  expect(reduceGame(state, { type: 'TICK', nowMs: 2_999 }).phase).toBe('countdown');
  state = reduceGame(state, { type: 'TICK', nowMs: 3_000 });
  const seen = [];
  for (let i = 0; i < 30; i++) {
    const painted = 3_020 + i * 1_020;
    expect(state).toMatchObject({ phase: 'memorize', exposure: i });
    if (state.phase !== 'memorize') throw new Error('expected study');
    seen.push(state.round.study[state.exposure % 10]);
    expect(reduceGame(state, { type: 'TICK', nowMs: painted })).toBe(state);
    state = reduceGame(state, { type: 'PAINTED', exposure: i, nowMs: painted });
    expect(reduceGame(state, { type: 'TICK', nowMs: painted + 999 })).toBe(state);
    state = reduceGame(state, { type: 'TICK', nowMs: painted + 1_000 });
  }
  expect(seen).toEqual([...exampleRound.study, ...exampleRound.study, ...exampleRound.study]);
  expect(state).toMatchObject({ phase: 'hold', until: 38_600 });
  expect(reduceGame(state, { type: 'TICK', nowMs: 38_599 })).toBe(state);
  expect(reduceGame(state, { type: 'TICK', nowMs: 38_600 })).toMatchObject({
    phase: 'select', deadline: 98_600,
  });
});

it('uses 2,000 ms exposures and an unlimited answer window in practice', () => {
  const first = run(ready(), { type: 'TICK', nowMs: 3_000 });
  expect(first.phase).toBe('memorize');
  const practice = run(ready('practice'), { type: 'TICK', nowMs: 3_000 },
    { type: 'PAINTED', exposure: 0, nowMs: 3_000 });
  expect(reduceGame(practice, { type: 'TICK', nowMs: 4_999 })).toBe(practice);
  expect(reduceGame(practice, { type: 'TICK', nowMs: 5_000 })).toMatchObject({ exposure: 1 });
  const selecting = choose('practice');
  expect(selecting).toMatchObject({ phase: 'select', deadline: null });
  expect(toggle(selecting, 'a', 1_000_000)).toMatchObject({ phase: 'select', selected: ['a'] });
});

it('locks partial selections before a same-time click and scores exactly once', () => {
  const state = toggle(choose(), 'a', 97_999);
  const result = toggle(state, 'b', 98_000);
  expect(result).toMatchObject({ phase: 'review', timedOut: true, results: [{ points: 1, correct: ['a'] }] });
  expect(run(result, { type: 'SUBMIT', nowMs: 98_000 }, { type: 'TICK', nowMs: 100_000 })).toBe(result);
  expect(reduceGame(choose(), { type: 'TICK', nowMs: 98_000 })).toMatchObject({
    phase: 'review', timedOut: true, results: [{ points: 0 }],
  });
});

it('caps choices at five, supports deselection and submits only a full board selection', () => {
  const four = exampleRound.targets.slice(0, 4).reduce((state, id) => toggle(state, id), choose());
  expect(reduceGame(four, { type: 'SUBMIT', nowMs: 50_000 })).toBe(four);
  expect(toggle(four, 'f')).toBe(four);
  const capped = toggle(toggle(four, 'e'), 'distractor-0');
  expect(capped).toMatchObject({ limitNotice: true, selected: exampleRound.targets });
  const swapped = toggle(toggle(capped, 'e'), 'distractor-0');
  expect(reduceGame(swapped, { type: 'SUBMIT', nowMs: 50_000 })).toMatchObject({
    phase: 'review', timedOut: false, results: [{ points: 4 }],
  });
});

it('preserves completed scores when a hidden attempt restarts and ends after three rounds', () => {
  let state = reduceGame(choose(), { type: 'TICK', nowMs: 98_000 });
  state = run(state, { type: 'NEXT_ROUND', round: exampleRound },
    { type: 'ASSETS_READY', nowMs: 0 }, { type: 'HIDDEN', nowMs: 100 });
  expect(state).toMatchObject({ phase: 'interrupted', eligibleForBest: false, results: [{ points: 0 }] });
  const newRound = { ...exampleRound, board: [...exampleRound.board].reverse() };
  state = reduceGame(state, { type: 'RESTART_ROUND', round: newRound });
  expect(state).toMatchObject({ phase: 'loading', round: newRound, roundIndex: 1 });
  for (let i = 1; i <= 2; i++) {
    state = study(reduceGame(state, { type: 'ASSETS_READY', nowMs: 0 }));
    state = run(state, { type: 'TICK', nowMs: 38_000 }, { type: 'TICK', nowMs: 98_000 },
      { type: 'NEXT_ROUND', round: exampleRound });
  }
  expect(state).toMatchObject({ phase: 'results', eligibleForBest: false, results: [
    { points: 0 }, { points: 0 }, { points: 0 },
  ] });
});

it('interrupts a stalled challenge without skipping study flags', () => {
  const first = run(ready(), { type: 'TICK', nowMs: 3_000 }, { type: 'PAINTED', exposure: 0, nowMs: 3_010 });
  expect(reduceGame(first, { type: 'TICK', nowMs: 4_260 })).toMatchObject({
    phase: 'memorize', exposure: 1, until: null,
  });
  expect(reduceGame(first, { type: 'TICK', nowMs: 4_261 })).toMatchObject({
    phase: 'interrupted', reason: 'study-delay', eligibleForBest: false,
  });
});

it('keeps countdown behind asset readiness and lets a failed round retry', () => {
  const loading = reduceGame({ phase: 'home' }, { type: 'START', mode: 'challenge', assisted: false, round: exampleRound });
  expect(reduceGame(loading, { type: 'TICK', nowMs: 9_000 })).toBe(loading);
  const failed = reduceGame(loading, { type: 'ASSET_FAILED' });
  expect(failed.phase).toBe('load-error');
  expect(reduceGame(failed, { type: 'RETRY' })).toMatchObject({ phase: 'loading', round: exampleRound });
});

it('interrupts a challenge if a study flag cannot be confirmed painted promptly', () => {
  const pending = reduceGame(ready(), { type: 'TICK', nowMs: 3_000 });
  expect(reduceGame(pending, { type: 'PAINTED', exposure: 0, nowMs: 3_250 })).toMatchObject({
    phase: 'memorize', until: 4_250,
  });
  expect(reduceGame(pending, { type: 'PAINTED', exposure: 0, nowMs: 3_251 })).toMatchObject({
    phase: 'interrupted', reason: 'study-delay', eligibleForBest: false,
  });
});
