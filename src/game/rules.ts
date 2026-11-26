import type { Ruleset } from './types';

export const READY_MS = 3_000;
export const STUDY_DELAY_LIMIT_MS = 250;
export const RULES_VERSION = '1';

export const CHALLENGE: Readonly<Ruleset> = Object.freeze({
  version: RULES_VERSION,
  mode: 'challenge',
  exposureMs: 1_000,
  passes: 3,
  studyCount: 10,
  boardCount: 25,
  targetCount: 5,
  gapMs: 5_000,
  answerMs: 60_000,
  rounds: 3,
});

export const PRACTICE: Readonly<Ruleset> = Object.freeze({
  ...CHALLENGE,
  mode: 'practice',
  exposureMs: 2_000,
  answerMs: null,
});
