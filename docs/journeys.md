# User journeys for review

[Open the interactive mockup](index.html). The screens use a fixed example and manual steps; they demonstrate layout and transitions, not elapsed time or a completed game. Screens include welcome, memorize, blank interval, choice grid, round feedback, final score and interruption. Three review paths are available: first challenge, timeout, and interrupted session.

## 1. First challenge: understand → observe → recognize → learn

```mermaid
flowchart LR
  A[Welcome / brief rules] --> B[Preload flags + ready]
  B --> C[10 flags × 1 second × 3 passes]
  C --> D[5-second blank gap]
  D --> E[Choose 5 from 25 / 60 seconds]
  E --> F[Submit / lock choices]
  F --> G[Review hits, errors and misses]
  G --> H{Three rounds complete?}
  H -->|No| B
  H -->|Yes| I[Total out of 15 + local best]
  I --> J[Replay with new flags]
```

Review focus: the board must not look like a country-name quiz or a face-down pair game. Keep only one flag on screen during study. Show the selection cap, remaining time and clear next action.

## 2. Time expires with partial choices

```mermaid
flowchart LR
  A[Selecting / 3 of 5 marked] --> B[Deadline reached]
  B --> C[Lock immediately]
  C --> D[Score only current correct choices]
  D --> E[Explain timeout + missed targets]
  E --> F[Next round]
  E --> G[Choose untimed Practice after session]
```

Review focus: a timeout is a scored outcome, not an error modal. No guessing after time expires and no duplicate score if Submit is clicked at the boundary.

## 3. Player switches apps during study

```mermaid
flowchart LR
  A[Study or answer stage] --> B[Browser becomes hidden]
  B --> C[Neutral interruption screen]
  C --> D[Attempt discarded / record ineligible]
  D --> E[Continue with a fresh round]
  D --> F[Return home]
  E --> G[Preserve completed rounds]
  G --> H[Finish session / no best update]
```

Review focus: explain the consequence kindly; do not reveal the sequence, resume a stale timer or quietly award a record. Practice also restarts the interrupted round, without competitive consequences.

## Replay and practice

Results → Play again creates a new seed with the same rules. Results → Practice keeps the 10/25/5 task, doubles exposure to two seconds per flag and removes the answer deadline. A named/described option supports a different memory experience and remains separate from standard records.
