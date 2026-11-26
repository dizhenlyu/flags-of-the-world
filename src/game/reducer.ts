import { CATALOG_VERSION } from '../catalog/flags';
import { RNG_VERSION } from './random';
import { CHALLENGE, PRACTICE, READY_MS, STUDY_DELAY_LIMIT_MS } from './rules';
import { scoreRound } from './score';
import type { GameEvent, GameState } from './types';

type SessionState = Exclude<GameState, { phase: 'home' }>;
type SelectionState = Extract<GameState, { phase: 'select' }>;

function interrupt(state: SessionState, reason: 'hidden' | 'study-delay'): GameState {
  return { ...state, phase: 'interrupted', reason, eligibleForBest: false };
}

function lockRound(state: SelectionState, timedOut: boolean): GameState {
  return {
    ...state,
    phase: 'review',
    timedOut,
    results: [...state.results, scoreRound(state.round, state.selected)],
  };
}

export function reduceGame(state: GameState, event: GameEvent): GameState {
  if (event.type === 'HOME') return { phase: 'home' };
  if (event.type === 'START') {
    const assisted = event.mode === 'practice' && event.assisted;
    return {
      phase: 'loading',
      mode: event.mode,
      assisted,
      round: event.round,
      roundIndex: 0,
      results: [],
      eligibleForBest: event.mode === 'challenge',
      rulesVersion: CHALLENGE.version,
      catalogVersion: CATALOG_VERSION,
      rngVersion: RNG_VERSION,
    };
  }
  if (state.phase === 'home') return state;

  const rules = state.mode === 'challenge' ? CHALLENGE : PRACTICE;
  switch (state.phase) {
    case 'loading':
      if (event.type === 'HIDDEN') return interrupt(state, 'hidden');
      if (event.type === 'ASSET_FAILED') return { ...state, phase: 'load-error' };
      if (event.type === 'ASSETS_READY') {
        return { ...state, phase: 'countdown', until: event.nowMs + READY_MS };
      }
      break;
    case 'load-error':
      if (event.type === 'RETRY') return { ...state, phase: 'loading' };
      break;
    case 'countdown':
      if (event.type === 'HIDDEN') return interrupt(state, 'hidden');
      if (event.type === 'TICK' && event.nowMs >= state.until) {
        return { ...state, phase: 'memorize', exposure: 0, insertedAt: event.nowMs, until: null };
      }
      break;
    case 'memorize':
      if (event.type === 'HIDDEN') return interrupt(state, 'hidden');
      if (event.type === 'PAINTED' && state.until === null && event.exposure === state.exposure) {
        if (state.mode === 'challenge' && event.nowMs - state.insertedAt > STUDY_DELAY_LIMIT_MS) {
          return interrupt(state, 'study-delay');
        }
        return { ...state, until: event.nowMs + rules.exposureMs };
      }
      if (event.type === 'TICK' && state.until !== null && event.nowMs >= state.until) {
        if (state.mode === 'challenge' && event.nowMs - state.until > STUDY_DELAY_LIMIT_MS) {
          return interrupt(state, 'study-delay');
        }
        const exposure = state.exposure + 1;
        if (exposure === rules.studyCount * rules.passes) {
          return { ...state, phase: 'hold', until: event.nowMs + rules.gapMs };
        }
        return { ...state, exposure, insertedAt: event.nowMs, until: null };
      }
      break;
    case 'hold':
      if (event.type === 'HIDDEN') return interrupt(state, 'hidden');
      if (event.type === 'TICK' && event.nowMs >= state.until) {
        return {
          ...state,
          phase: 'select',
          deadline: rules.answerMs === null ? null : event.nowMs + rules.answerMs,
          selected: [],
          limitNotice: false,
        };
      }
      break;
    case 'select':
      if (event.type === 'HIDDEN') return interrupt(state, 'hidden');
      if (event.type === 'TICK' || event.type === 'TOGGLE' || event.type === 'SUBMIT') {
        if (state.deadline !== null && event.nowMs >= state.deadline) return lockRound(state, true);
      }
      if (event.type === 'SUBMIT' && state.selected.length === rules.targetCount) {
        return lockRound(state, false);
      }
      if (event.type === 'TOGGLE' && state.round.board.includes(event.id)) {
        if (state.selected.includes(event.id)) {
          return { ...state, selected: state.selected.filter(id => id !== event.id), limitNotice: false };
        }
        if (state.selected.length >= rules.targetCount) {
          return { ...state, limitNotice: true };
        }
        return { ...state, selected: [...state.selected, event.id], limitNotice: false };
      }
      break;
    case 'review':
      if (event.type === 'NEXT_ROUND') {
        if (state.results.length === rules.rounds) return { ...state, phase: 'results' };
        return { ...state, phase: 'loading', roundIndex: state.roundIndex + 1, round: event.round };
      }
      break;
    case 'interrupted':
      if (event.type === 'RESTART_ROUND') return { ...state, phase: 'loading', round: event.round };
      break;
  }
  return state;
}
