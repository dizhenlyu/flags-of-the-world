const flags = {
  ni: ['Nicaragua', 'Blue, white and blue bands with a triangular emblem in the center'],
  br: ['Brazil', 'Green field, yellow diamond and a blue globe'],
  ca: ['Canada', 'Red maple leaf on white between two red bands'],
  fr: ['France', 'Vertical bands of blue, white and red'],
  ke: ['Kenya', 'Black, red and green bands with a shield in the center'],
  rw: ['Rwanda', 'Blue, yellow and green bands with a sun in the upper right'],
  bt: ['Bhutan', 'Yellow and orange diagonals with a white dragon'],
  za: ['South Africa', 'Green sideways Y separating red, blue and a black triangle'],
  uy: ['Uruguay', 'White and blue stripes with a sun in the upper left'],
  cz: ['Czechia', 'White over red with a blue triangle at the left'],
  se: ['Sweden', 'Yellow Nordic cross on blue'],
  ci: ['Côte d’Ivoire', 'Vertical bands of orange, white and green'],
  ar: ['Argentina', 'Light blue, white and light blue bands with a sun at center'],
  pl: ['Poland', 'White band over red'],
  dk: ['Denmark', 'White Nordic cross on red'],
  sv: ['El Salvador', 'Blue, white and blue bands with a wreath and coat of arms at center'],
  it: ['Italy', 'Vertical bands of green, white and red'],
  no: ['Norway', 'Blue Nordic cross edged with white on red'],
  in: ['India', 'Saffron, white and green bands with a blue wheel'],
  jp: ['Japan', 'White field with a red circle at center'],
  fi: ['Finland', 'Blue Nordic cross on white'],
  gr: ['Greece', 'Blue and white stripes with a white cross in the upper left'],
  mx: ['Mexico', 'Green, white and red vertical bands with an eagle in the center'],
  vn: ['Vietnam', 'Red field with a yellow star in the center'],
  kr: ['South Korea', 'White field with a red and blue circle and four black trigrams'],
  ie: ['Ireland', 'Vertical bands of green, white and orange'],
  ma: ['Morocco', 'Red field with a green outlined star'],
  es: ['Spain', 'Red, yellow and red bands with a coat of arms toward the left'],
  cl: ['Chile', 'White over red with a white star on blue at the upper left'],
  nz: ['New Zealand', 'Blue field with the Union Jack and four red stars edged in white'],
};

const study = ['ni', 'bt', 'br', 'cz', 'ke', 'rw', 'ca', 'uy', 'fr', 'za'];
const board = [
  'se', 'ci', 'ar', 'ni', 'pl',
  'dk', 'br', 'sv', 'it', 'no',
  'in', 'jp', 'ke', 'fi', 'ca',
  'gr', 'mx', 'fr', 'vn', 'kr',
  'ie', 'ma', 'es', 'cl', 'nz',
];
const targets = new Set(study.filter(code => board.includes(code)));
const passes = 3;
const maxChoices = 5;

const journeys = {
  first: ['welcome', 'memorize', 'hold', 'select', 'review', 'results'],
  timeout: ['select', 'review', 'results'],
  interrupt: ['memorize', 'interrupted', 'fresh'],
};

const labels = {
  welcome: 'Welcome',
  memorize: 'Memorize',
  hold: 'Five-second gap',
  select: 'Choose five',
  review: 'Round review',
  results: 'Match results',
  interrupted: 'Interruption',
  fresh: 'Fresh round',
};

const captions = {
  welcome: 'Choose Challenge or Practice to review the same visual memory task.',
  memorize: 'Use Next flag to step through the three passes. The live game would advance automatically.',
  hold: 'The flag disappears for five seconds before the board appears.',
  select: 'Select five flags. Use the Time runs out journey to review a partial submission.',
  review: 'Country names, correct choices and missed targets appear after submission.',
  results: 'Rounds 2 and 3 use sample scores. This preview does not save a personal best.',
  interrupted: 'An interrupted challenge round restarts with a new sequence and cannot set a personal best.',
  fresh: 'The replacement round begins with a different flag.',
};

const screen = document.querySelector('#screen');
const stepPicker = document.querySelector('#step');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
let journey;
let step;
let practice;
let exposure;
let selected;
let locked;

function image(code, alt = '') {
  return `<img class="flag" src="review/flags/${code}.svg" alt="${alt}" draggable="false">`;
}

function action(label, name, primary = false) {
  return `<button type="button" class="action${primary ? ' primary' : ''}" data-action="${name}">${label}</button>`;
}

function codeList(codes, includeBoardStatus = false) {
  return codes.map(code => {
    const status = includeBoardStatus ? (targets.has(code) ? 'On board' : 'Absent from board') : '';
    return `<li class="flag-item">${image(code)}<span>${flags[code][0]}</span>${status ? `<span>${status}</span>` : ''}</li>`;
  }).join('');
}

function renderStudy(fresh = false) {
  const pass = Math.floor(exposure / study.length) + 1;
  const position = exposure % study.length;
  const sequence = fresh ? ['kr', ...study.slice(1)] : study;
  const code = sequence[position];
  const lastExposure = pass === passes && position === study.length - 1;
  const canAdvance = !lastExposure || journey === 'first';
  screen.innerHTML = `<div class="center">
    <div class="screen-top">
      <h2>Memorize the flags</h2>
      <p class="muted">Pass ${pass} of ${passes} · Flag ${position + 1} of ${study.length}</p>
    </div>
    <div class="study-field">${image(code, flags[code][1])}</div>
    <div class="screen-bottom">
      <p class="muted">${practice ? '2 seconds per flag' : '1 second per flag'}</p>
      ${canAdvance ? action(lastExposure ? 'Preview the gap →' : 'Next flag →', 'advance-flag') : ''}
    </div>
  </div>`;
}

function renderBoard() {
  const time = journey === 'timeout' ? '0:01' : '1:00';
  const tiles = board.map((code, index) => `
    <button type="button" class="tile" data-flag="${code}" aria-pressed="false"
      aria-label="Option ${index + 1}: ${flags[code][1]}">
      ${image(code)}
      <span class="mark" aria-hidden="true"></span>
    </button>`).join('');
  screen.innerHTML = `<div class="center">
    <div class="screen-top">
      <h2>Which five did you see?</h2>
      <div class="readouts">
        <span id="selection-count" aria-live="polite"></span>
        <span class="timer"><span class="timer-label">Time left</span>${practice ? 'Untimed' : time}</span>
      </div>
    </div>
    <div class="board" role="group" aria-label="25 flag choices">${tiles}</div>
    <div class="screen-bottom">
      <p id="feedback" class="feedback" aria-live="polite">Select a flag again to remove it.</p>
      ${journey === 'timeout' ? action('Show what happens at timeout →', 'expire', true) : action('Submit choices →', 'submit', true)}
    </div>
  </div>`;
  updateSelections();
}

function renderReview() {
  const correct = [...locked].filter(code => targets.has(code));
  const incorrect = [...locked].filter(code => !targets.has(code));
  const missed = [...targets].filter(code => !locked.has(code));
  const outcomes = [
    ['Correct choices', correct],
    ['Incorrect choices', incorrect],
    ['Missed flags', missed],
  ];
  screen.innerHTML = `<div class="center review">
    <div class="screen-top">
      <h2>${journey === 'timeout' ? 'Time’s up' : 'Round 1 results'}</h2>
      <p class="score">${correct.length} / 5</p>
    </div>
    ${outcomes.map(([heading, codes]) => `<section class="outcome">
      <h3>${heading}</h3>
      ${codes.length ? `<ul>${codeList(codes)}</ul>` : '<p class="muted">None</p>'}
    </section>`).join('')}
    <details class="outcome">
      <summary>Review all 10 study flags</summary>
      <ol class="sequence">${codeList(study, true)}</ol>
    </details>
    <div class="actions">${action('Preview match results →', 'results', true)}${action('Back to welcome', 'home')}</div>
  </div>`;
}

function render() {
  const stages = journeys[journey];
  const stage = stages[step];
  document.querySelectorAll('[data-path]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.path === journey));
  });
  stepPicker.replaceChildren(...stages.map((key, index) => new Option(labels[key], index)));
  stepPicker.value = step;
  previous.disabled = step === 0;
  next.disabled = step === stages.length - 1;
  document.querySelector('#mode').textContent = stage === 'welcome'
    ? 'Solo'
    : stage === 'results' ? 'Match complete' : `${practice ? 'Practice' : 'Challenge'} · Round 1 of 3`;
  document.querySelector('#caption').textContent = captions[stage];

  switch (stage) {
    case 'welcome':
      screen.innerHTML = `<div class="message">
        <h2>Find the flags you remember</h2>
        <p>Watch ten flags in the same order three times. After a short gap, find five of them among 25 flags.</p>
        <p class="muted">Three rounds · 60 seconds to answer each round · 15 possible points</p>
        <div class="actions">${action('Start challenge →', 'start', true)}${action('Practice', 'practice')}</div>
      </div>`;
      break;
    case 'memorize':
    case 'fresh':
      renderStudy(stage === 'fresh');
      break;
    case 'hold':
      screen.innerHTML = `<div class="center">
        <div class="screen-top"><h2>Get ready to choose</h2></div>
        <div class="hold-field"><p><span class="timer">00:05</span><br><span class="muted">Until the board appears</span></p></div>
        <div class="screen-bottom">${action('Preview the board →', 'show-board')}</div>
      </div>`;
      break;
    case 'select':
      renderBoard();
      break;
    case 'review':
      renderReview();
      break;
    case 'results': {
      const firstScore = [...locked].filter(code => targets.has(code)).length;
      screen.innerHTML = `<div class="message">
        <h2>Match results</h2>
        <p class="score">${firstScore + 8} / 15</p>
        <ol class="round-scores">${[firstScore, 4, 4].map((score, index) =>
          `<li><strong>${score} / 5</strong><span class="muted">Round ${index + 1}</span></li>`).join('')}</ol>
        <div class="actions">${action('Preview another challenge →', 'start', true)}${action('Practice', 'practice')}</div>
      </div>`;
      break;
    }
    case 'interrupted':
      screen.innerHTML = `<div class="message">
        <h2>Round interrupted</h2>
        <p>Start this round with a different sequence. Completed rounds still count toward your match score.</p>
        <p class="muted">This match is ineligible for a personal best.</p>
        <div class="actions">${action('Continue with new flags →', 'fresh', true)}${action('Back to welcome', 'home')}</div>
      </div>`;
      break;
  }
}

function updateSelections() {
  screen.querySelectorAll('[data-flag]').forEach(button => {
    const isSelected = selected.has(button.dataset.flag);
    button.setAttribute('aria-pressed', String(isSelected));
    button.querySelector('.mark').textContent = isSelected ? '✓' : '';
  });
  screen.querySelector('#selection-count').textContent = `${selected.size} / ${maxChoices} selected`;
  const submit = screen.querySelector('[data-action="submit"]');
  if (submit) submit.disabled = selected.size !== maxChoices;
}

function toggleFlag(code) {
  const feedback = screen.querySelector('#feedback');
  if (selected.has(code)) {
    selected.delete(code);
  } else if (selected.size < maxChoices) {
    selected.add(code);
  } else {
    feedback.textContent = 'Deselect one flag before adding another.';
    return;
  }
  feedback.textContent = 'Select a flag again to remove it.';
  updateSelections();
}

function showStep(index, focusHeading = false) {
  if (journeys[journey][step] === 'select') locked = new Set(selected);
  step = index;
  exposure = 0;
  render();
  if (focusHeading) {
    const heading = screen.querySelector('h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

function go(stage) {
  showStep(journeys[journey].indexOf(stage), true);
}

function start(path, isPractice = false, at = 0) {
  journey = path;
  step = at;
  practice = isPractice;
  exposure = 0;
  selected = new Set(path === 'timeout' ? ['ni', 'br', 'sv'] : []);
  locked = new Set(selected);
  render();
}

document.querySelector('.journeys').addEventListener('click', event => {
  const button = event.target.closest('[data-path]');
  if (button) start(button.dataset.path);
});

screen.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.flag) {
    toggleFlag(button.dataset.flag);
    return;
  }
  switch (button.dataset.action) {
    case 'start':
    case 'practice':
      start('first', button.dataset.action === 'practice', 1);
      showStep(1, true);
      break;
    case 'advance-flag':
      if (exposure === study.length * passes - 1) {
        go('hold');
      } else {
        exposure += 1;
        renderStudy(journeys[journey][step] === 'fresh');
        const nextFlag = screen.querySelector('[data-action="advance-flag"]');
        if (nextFlag) nextFlag.focus({ preventScroll: true });
      }
      break;
    case 'show-board': go('select'); break;
    case 'submit':
    case 'expire': go('review'); break;
    case 'results': go('results'); break;
    case 'fresh': go('fresh'); break;
    case 'home':
      start('first');
      showStep(0, true);
      break;
  }
});

stepPicker.addEventListener('change', () => showStep(Number(stepPicker.value)));
previous.addEventListener('click', () => showStep(step - 1));
next.addEventListener('click', () => showStep(step + 1));

start('first');
