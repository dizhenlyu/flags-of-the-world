export type FlagId = string;
export type Mode = 'challenge' | 'practice';

export interface Flag {
  id: FlagId;
  name: string;
  description: string;
  assetPath: string;
  equivalenceGroup: string;
}

export interface Ruleset {
  version: string;
  mode: Mode;
  exposureMs: number;
  passes: 3;
  studyCount: 10;
  boardCount: 25;
  targetCount: 5;
  gapMs: 5000;
  answerMs: number | null;
  rounds: 3;
}

export interface Round {
  study: FlagId[];
  targets: FlagId[];
  board: FlagId[];
}

export interface RoundResult {
  correct: FlagId[];
  wrong: FlagId[];
  missed: FlagId[];
  points: number;
}

export type Rng = () => number;

interface Session {
  mode: Mode;
  assisted: boolean;
  roundIndex: number;
  round: Round;
  results: readonly RoundResult[];
  eligibleForBest: boolean;
  rulesVersion: string;
  catalogVersion: string;
  rngVersion: string;
}

export type GameState =
  | { phase: 'home' }
  | (Session & (
    | { phase: 'loading' | 'load-error' | 'results' }
    | { phase: 'countdown' | 'hold'; until: number }
    | { phase: 'memorize'; exposure: number; insertedAt: number; until: number | null }
    | { phase: 'select'; deadline: number | null; selected: readonly FlagId[]; limitNotice: boolean }
    | { phase: 'review'; timedOut: boolean }
    | { phase: 'interrupted'; reason: 'hidden' | 'study-delay' }
  ));

export type GameEvent =
  | { type: 'START'; mode: Mode; assisted: boolean; round: Round }
  | { type: 'ASSET_FAILED' | 'RETRY' | 'HOME' }
  | { type: 'ASSETS_READY' | 'TICK' | 'SUBMIT' | 'HIDDEN'; nowMs: number }
  | { type: 'PAINTED'; exposure: number; nowMs: number }
  | { type: 'TOGGLE'; id: FlagId; nowMs: number }
  | { type: 'NEXT_ROUND' | 'RESTART_ROUND'; round: Round };
