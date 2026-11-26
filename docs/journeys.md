# User journeys for review

The interactive mockup has three review paths: first challenge, timeout, and interrupted session. It uses a fixed example with manual steps and sample clocks. [Open the interactive mockup](index.html).

## Flag presentation

During study, one large national flag fills the center of a flat charcoal field. Pass and flag counters sit above the field. After the five-second gap, 25 flag images form a tight 5×5 grid. The timer and selection count sit above the board. A mint outline and checkmark show selections without moving the images.

The user’s reference images informed scale and spacing. The demo uses its own board arrangement, includes Nicaragua as the first study example, and places similar designs such as Nicaragua and El Salvador on the board. Each flag keeps its source proportions. Equal board cells fit the entire image, with charcoal space where the aspect ratios differ. Country names appear in the review, where the player can also open the original study sequence.

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

In the mockup, use **Next flag** to view the sequence or choose **Choose five** in the screen picker to jump to the board. Submit five flags to see which choices matched and which targets you missed.

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
