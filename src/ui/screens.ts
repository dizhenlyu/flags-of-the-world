import { flagFor, flagUrl } from '../catalog/images';
import type { FlagId, GameState } from '../game/types';

type SessionState = Exclude<GameState, { phase: 'home' }>;

export interface RecordDisplay {
  best: number | null;
  namedPractice: boolean;
  recordMessage: string;
}

export function action(label: string, type: string, primary = false) {
  return `<button type="button" class="action${primary ? ' primary' : ''}" data-action="${type}">${label}</button>`;
}

function heading(text: string) {
  return `<h1 tabindex="-1">${text}</h1>`;
}

function intro(text: string, detail: string, actions = '') {
  return `<div class="message">${heading(text)}<p class="muted">${detail}</p>${actions}</div>`;
}

function home({ best, namedPractice, recordMessage }: RecordDisplay) {
  return `<div class="home-intro">
    ${heading('Flags of the World')}
    <p class="tagline">Watch ten flags. Find the five that return.</p>
    <div class="actions">
      ${action('Start challenge', 'challenge', true)}
      ${action('Start practice', 'practice')}
    </div>
    <label class="practice-option"><input type="checkbox" id="named-practice" ${namedPractice ? 'checked' : ''}>
      Show country names in Practice
    </label>
  </div>
  <ol class="instructions">
    <li><strong>Watch 10 flags</strong><span>One second each, in the same order three times.</span></li>
    <li><strong>Wait 5 seconds</strong><span>Then the 25-flag board appears.</span></li>
    <li><strong>Find 5 matches</strong><span>Choose within 60 seconds. Each match earns a point.</span></li>
  </ol>
  <div class="home-footer">
    <div><p>Device best: <strong>${best === null ? '—' : `${best} / 15`}</strong></p>
      <p class="muted">Three rounds per session. Practice gives you two seconds per flag and unlimited time to choose.</p></div>
    ${best === null ? '' : action('Clear local record', 'clear')}
  </div>
  <p id="record-message" class="muted">${recordMessage}</p>`;
}

function reviewImage(id: FlagId) {
  return `<img class="flag" src="${flagUrl(id)}" alt="" width="72" height="48">`;
}

function flagList(ids: readonly FlagId[], category?: (id: FlagId) => string) {
  return ids.map(id => {
    const outcome = category?.(id);
    return `<li class="flag-item">
      ${reviewImage(id)}
      <span>${flagFor(id).name}</span>
      ${outcome ? `<small>${outcome}</small>` : ''}
    </li>`;
  }).join('');
}

function outcome(title: string, ids: readonly FlagId[]) {
  return `<section class="outcome" aria-label="${title}">
    <h2>${title} <span class="muted">(${ids.length})</span></h2>
    ${ids.length ? `<ul class="flag-list">${flagList(ids)}</ul>` : '<p class="muted empty">None</p>'}
  </section>`;
}

function review(state: Extract<GameState, { phase: 'review' }>) {
  const result = state.results[state.roundIndex];
  const finalRound = state.roundIndex === 2;
  return `<div class="review">
    <header class="screen-top review-top">
      <div><p class="muted">Round score</p>${heading(`${result.points} / 5`)}
        ${state.timedOut ? '<p class="muted">Time is up.</p>' : ''}</div>
      ${action(finalRound ? 'See results' : 'Next round', 'next', true)}
    </header>
    ${outcome('Correct choices', result.correct)}
    ${outcome('Incorrect choices', result.wrong)}
    ${outcome('Missed targets', result.missed)}
    <details class="outcome">
      <summary>Review all 10 study flags</summary>
      <ol class="flag-list sequence">${flagList(state.round.study, id => {
        if (result.correct.includes(id)) return 'Correct choice';
        if (result.missed.includes(id)) return 'Missed target';
        return 'Not on board';
      })}</ol>
    </details>
  </div>`;
}

function results(state: SessionState, { best, recordMessage }: RecordDisplay) {
  const total = state.results.reduce((sum, result) => sum + result.points, 0);
  return `<div class="message results">
    <p class="muted">Session score</p>
    ${heading(`${total} / 15`)}
    <ol class="round-scores" aria-label="Round scores">
      ${state.results.map((result, index) => `<li>Round ${index + 1}<strong>${result.points} / 5</strong></li>`).join('')}
    </ol>
    ${state.mode === 'challenge' && best !== null ? `<p class="muted">Device best: ${best} / 15</p>` : ''}
    <p class="muted">${recordMessage}</p>
    <div class="actions">${action('Play again', 'replay', true)}${action('Home', 'home')}</div>
  </div>`;
}

export function screen(state: GameState, record: RecordDisplay) {
  switch (state.phase) {
    case 'home':
      return home(record);
    case 'loading':
      return intro('Loading flags', 'Preparing this round.');
    case 'load-error':
      return intro('Flags could not load', 'Check your connection and try loading this round again.',
        `<div class="actions">${action('Try again', 'retry', true)}${action('Home', 'home')}</div>`);
    case 'countdown':
      return intro('Get ready', 'Watch for the first flag.', '<div class="countdown" data-timer aria-hidden="true"></div>');
    case 'memorize':
      return `<header class="screen-top">${heading('Remember these flags')}<p class="muted" id="study-progress"></p></header>
        <div class="study-field"></div>${state.assisted ? '<p class="study-name" id="study-name" aria-live="polite"></p>' : ''}`;
    case 'hold':
      return `<header class="screen-top">${heading('Hold that thought')}</header>
        <div class="hold-field" aria-hidden="true"><span class="countdown" data-timer></span></div>`;
    case 'select':
      return `<header class="screen-top select-top">
        <div>${heading('Find five matches')}<p class="muted">Choose flags you saw during study.</p></div>
        ${state.deadline === null ? '<div class="timer-box">Untimed</div>' :
          '<div class="timer-box" role="timer"><span class="muted">Time left</span><strong data-timer></strong></div>'}
      </header>
      <p class="selection-status" id="selection-status" role="status"></p>
      <div class="board" role="group" aria-label="25 flags">
        ${state.round.board.map(id => {
          const flag = flagFor(id);
          const description = state.assisted ? `${flag.name}. ${flag.description}` : flag.description;
          return `<button type="button" class="tile" data-flag="${id}" aria-pressed="false" aria-label="${description}">
            <span class="mark" aria-hidden="true">✓</span>
          </button>`;
        }).join('')}
      </div>
      <div class="screen-bottom">${action('Submit choices', 'submit', true)}</div>`;
    case 'review':
      return review(state);
    case 'results':
      return results(state, record);
    case 'interrupted':
      return intro('Round interrupted',
        `${state.reason === 'hidden' ? 'The page was hidden during an active round.' : 'The page paused during study.'}
        Completed scores carry over.${state.mode === 'challenge' ? ' This session is ineligible for a device best.' : ''}`,
        `<div class="actions">${action('Start a fresh round', 'restart', true)}${action('Home', 'home')}</div>`);
  }
}
