import './styles.css';
import { FLAGS } from './catalog/flags';
import { preloadRound } from './catalog/images';
import { createClock } from './game/clock';
import { generateRound } from './game/generateRound';
import { createRng } from './game/random';
import { reduceGame } from './game/reducer';
import { CHALLENGE } from './game/rules';
import type { FlagId, GameEvent, GameState, Mode, Rng } from './game/types';
import { clearBest, loadBest, loadPreferences, saveBest, savePreferences, STANDARD_RECORD } from './storage';
import { createRenderer } from './ui/render';

declare const __BUILD_COMMIT__: string;

const commit = document.createElement('meta');
commit.name = 'build-commit';
commit.content = __BUILD_COMMIT__;
document.head.append(commit);

let storage: Storage | null;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}

const root = document.querySelector<HTMLElement>('#app')!;
const renderGame = createRenderer(root);
const preferences = loadPreferences(storage);
let best = loadBest(storage, STANDARD_RECORD);
let recordMessage = '';
let state: GameState = { phase: 'home' };
let images = new Map<FlagId, HTMLImageElement>();
let rng: Rng;

const now = () => performance.now();
const clock = createClock({
  now,
  requestFrame: callback => requestAnimationFrame(callback),
  cancelFrame: id => cancelAnimationFrame(id),
  onTick(nowMs) {
    if (document.hidden) {
      dispatch({ type: 'HIDDEN', nowMs });
    } else if (state.phase === 'memorize' && state.until === null) {
      // This callback comes on the frame after the decoded image was inserted.
      dispatch({ type: 'PAINTED', exposure: state.exposure, nowMs });
    } else {
      dispatch({ type: 'TICK', nowMs });
    }
  },
});

function saveResult(state: Extract<GameState, { phase: 'review' }>) {
  if (state.mode === 'practice') {
    recordMessage = 'Practice session complete.';
    return;
  }
  if (!state.eligibleForBest || state.assisted) {
    recordMessage = 'An interrupted session does not count toward your device best.';
    return;
  }
  const key = {
    ...STANDARD_RECORD,
    rulesVersion: state.rulesVersion,
    catalogVersion: state.catalogVersion,
    rngVersion: state.rngVersion,
  };
  best = loadBest(storage, key);
  const total = state.results.reduce((sum, result) => sum + result.points, 0);
  if (best === null || total > best) {
    if (saveBest(storage, key, total)) {
      best = loadBest(storage, key);
      recordMessage = 'New device best';
    } else {
      recordMessage = 'Your score could not be saved on this device.';
    }
  } else {
    recordMessage = total === best ? 'Matched your device best.' : '';
  }
}

function render(nowMs = now()) {
  renderGame(state, nowMs, { best, namedPractice: preferences.namedPractice, recordMessage }, images);
}

function dispatch(event: GameEvent) {
  const previous = state;
  state = reduceGame(state, event);
  if (state.phase !== previous.phase) {
    if (state.phase === 'review' && state.results.length === CHALLENGE.rounds) saveResult(state);
    if (state.phase === 'home') {
      images.clear();
      best = loadBest(storage, STANDARD_RECORD);
      recordMessage = '';
    }
    if (state.phase === 'loading') {
      images.clear();
      const loading = state;
      void preloadRound(loading.round).then(loaded => {
        if (state !== loading) return;
        const nowMs = now();
        if (document.hidden) {
          dispatch({ type: 'HIDDEN', nowMs });
        } else {
          images = loaded;
          dispatch({ type: 'ASSETS_READY', nowMs });
        }
      }, () => {
        if (state === loading) dispatch({ type: 'ASSET_FAILED' });
      });
    }

    const timed = state.phase === 'countdown' || state.phase === 'memorize' ||
      state.phase === 'hold' || (state.phase === 'select' && state.deadline !== null);
    if (timed) clock.start();
    else clock.stop();
  }
  if (state !== previous || event.type === 'TICK') render();
}

function start(mode: Mode, assisted = false) {
  const bytes = crypto.getRandomValues(new Uint32Array(4));
  rng = createRng([...bytes].join('-'));
  recordMessage = '';
  dispatch({ type: 'START', mode, assisted, round: generateRound(FLAGS, rng) });
}

root.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('button');
  if (!button) return;
  const nowMs = now();
  if (button.dataset.flag) {
    dispatch({ type: 'TOGGLE', id: button.dataset.flag, nowMs });
    return;
  }

  switch (button.dataset.action) {
    case 'challenge':
      start('challenge');
      break;
    case 'practice':
      start('practice', preferences.namedPractice);
      break;
    case 'replay':
      if (state.phase === 'results') start(state.mode, state.assisted);
      break;
    case 'home':
      dispatch({ type: 'HOME' });
      break;
    case 'retry':
      dispatch({ type: 'RETRY' });
      break;
    case 'submit':
      dispatch({ type: 'SUBMIT', nowMs });
      break;
    case 'next':
      if (state.phase === 'review') {
        const finalRound = state.results.length === CHALLENGE.rounds;
        dispatch({ type: 'NEXT_ROUND', round: finalRound ? state.round : generateRound(FLAGS, rng) });
      }
      break;
    case 'restart':
      dispatch({ type: 'RESTART_ROUND', round: generateRound(FLAGS, rng) });
      break;
    case 'clear':
      if (window.confirm('Clear the best score stored on this device?')) {
        if (clearBest(storage, STANDARD_RECORD)) {
          best = null;
          recordMessage = 'Device best cleared.';
        } else {
          recordMessage = 'The device best could not be cleared.';
        }
        render();
      }
      break;
  }
});

root.addEventListener('change', event => {
  if (event.target instanceof HTMLInputElement && event.target.id === 'named-practice') {
    preferences.namedPractice = event.target.checked;
    savePreferences(storage, preferences);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) dispatch({ type: 'HIDDEN', nowMs: now() });
});
window.addEventListener('pagehide', () => dispatch({ type: 'HIDDEN', nowMs: now() }));
render();
