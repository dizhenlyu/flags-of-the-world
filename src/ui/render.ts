import { flagFor } from '../catalog/images';
import type { FlagId, GameState } from '../game/types';
import { screen, type RecordDisplay } from './screens';

export function createRenderer(root: HTMLElement) {
  root.innerHTML = `<main class="game">
    <header class="game-header"><span>Flags of the World</span><span id="session-progress" class="muted"></span></header>
    <section id="screen"></section>
  </main>
  <footer class="project-footer">
    <a href="https://github.com/dizhenlyu/flags-of-the-world">Project source</a>
    <a href="${import.meta.env.BASE_URL}design-review/">Design review</a>
  </footer>`;

  const view = root.querySelector<HTMLElement>('#screen')!;
  const progress = root.querySelector<HTMLElement>('#session-progress')!;
  let phase: GameState['phase'] | null = null;
  let exposure = -1;

  function setText(element: Element | null, text: string) {
    if (element && element.textContent !== text) element.textContent = text;
  }

  function setTimer(seconds: number, format = false) {
    const value = format ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : String(seconds);
    setText(view.querySelector('[data-timer]'), value);
  }

  return function renderGame(
    state: GameState, nowMs: number, record: RecordDisplay,
    images: ReadonlyMap<FlagId, HTMLImageElement>,
  ) {
    const phaseChanged = phase !== state.phase;
    if (phaseChanged) {
      const firstRender = phase === null;
      phase = state.phase;
      exposure = -1;
      view.dataset.phase = phase;
      view.innerHTML = screen(state, record);
      if (!firstRender) {
        view.querySelector('h1')?.focus();
      }
      if (state.phase === 'select') {
        for (const tile of view.querySelectorAll<HTMLButtonElement>('.tile')) {
          const image = images.get(tile.dataset.flag!)!;
          image.alt = '';
          tile.prepend(image);
        }
      }
      const roundLabel = state.phase === 'home' ? '' : ` · Round ${state.roundIndex + 1} of 3`;
      const modeLabel = state.phase === 'home' ? 'Solo memory game' :
        state.mode === 'challenge' ? 'Challenge' : 'Practice';
      setText(progress, `${modeLabel}${roundLabel}`);
    }

    switch (state.phase) {
      case 'home':
        setText(view.querySelector('.home-footer strong'), record.best === null ? '—' : `${record.best} / 15`);
        setText(view.querySelector('#record-message'), record.recordMessage);
        if (record.best === null && view.querySelector('[data-action="clear"]')) {
          view.querySelector('h1')?.focus();
          view.querySelector('[data-action="clear"]')?.remove();
        }
        break;
      case 'countdown':
      case 'hold':
        setTimer(Math.max(0, Math.ceil((state.until - nowMs) / 1000)));
        break;
      case 'memorize':
        if (exposure === state.exposure) break;
        exposure = state.exposure;
        const id = state.round.study[exposure % 10];
        const flag = flagFor(id);
        const image = images.get(id)!;
        image.alt = flag.description;
        view.querySelector('.study-field')!.replaceChildren(image);
        setText(view.querySelector('#study-progress'), `Pass ${Math.floor(exposure / 10) + 1} of 3 · Flag ${exposure % 10 + 1} of 10`);
        setText(view.querySelector('#study-name'), flag.name);
        break;
      case 'select': {
        const seconds = state.deadline === null ? null : Math.max(0, Math.ceil((state.deadline - nowMs) / 1000));
        if (seconds !== null) setTimer(seconds, true);
        const count = state.selected.length;
        const warning = seconds !== null && seconds <= 10 ? ' 10 seconds or less remaining.' : '';
        const limit = state.limitNotice ? ' Deselect a flag first.' : '';
        setText(view.querySelector('#selection-status'), `${count} of 5 selected.${warning}${limit}`);
        const submit = view.querySelector<HTMLButtonElement>('[data-action="submit"]')!;
        submit.disabled = count !== 5;
        for (const tile of view.querySelectorAll<HTMLButtonElement>('.tile')) {
          const pressed = String(state.selected.includes(tile.dataset.flag!));
          if (tile.getAttribute('aria-pressed') !== pressed) tile.setAttribute('aria-pressed', pressed);
        }
        break;
      }
    }
  };
}
