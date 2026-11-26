# Rules extraction and evidence

Research date: 2026-11-26. Scope: Season 3, Exile Match 06, called **Flags Around the World** in the English subtitle track and **만국기** in Korean coverage. The relevant rule explanation is in **episode 12**, around 08:17–09:04. This is visual recognition from memory, not a face-down pair-matching game; recalling the order or naming countries is not required.

## Evidence hierarchy

1. **Episode 12 English subtitle track**, accessed through [this public subtitle listing](https://subdl.com/fr/s/info/1BwetqVmHy/the-devils-plan), specifically the S03E12 English SDH file. This is a third-party copy of episode dialogue, not a Netflix-hosted transcript. It supplies explicit timings and scoring; it was read for research and is not included in this repository. Timestamps refer to that edition and may vary between releases. I did not visually inspect the Netflix episode.
2. **[Korean community episode account](https://namu.moe/w/데블스%20플랜:%20데드%20어게인/유배지)**, Day 5 / Exile Match 06. Corroborates participants, 10 flags, 30-second exposure, 25 choices, five targets, three rounds and a playoff.
3. **[English Wikipedia overview](https://en.wikipedia.org/wiki/The_Devil%27s_Plan)**. Search-index text retrieved on this date describes three passes and 25 choices, but says two minutes. The directly opened page was an older revision missing this section. Treat this as inconsistent secondary evidence, not the timing authority.
4. **[Netflix’s season announcement](https://about.netflix.com/ko/news/the-devils-plan-dead-again-teaser)** supports the season title and cast, not the detailed game rules.

## Extracted mechanics

| Mechanic | Evidence | Confidence / treatment |
| --- | --- | --- |
| Ten distinct national flags, one at a time, one second per flag | E12 08:23–08:28 | Explicit in subtitle track |
| Same sequence repeats three times in the same order; 30 seconds total | E12 08:29–08:35 | Explicit |
| Five-second gap before the choice board | E12 08:35–08:39 | Explicit |
| 25 flags on the board; exactly five are from the memorized ten | E12 08:39–08:46 | Explicit |
| Find and circle those five within one minute | E12 08:46–08:53 | Explicit; prefer over secondary two-minute claim |
| One point for each correct choice | E12 08:54–08:57 | Explicit |
| Three rounds, lowest cumulative scorer eliminated | E12 08:57–09:04; 15:22–15:48 | Explicit |
| A tie for last place leads to an additional round between tied players | E12 15:39–16:15 | Observed playoff; repeated ties unspecified |

Maximum regular-match score is **15**, derived from five possible points in each of three rounds. The unmatched five from the study sequence must be absent from the board; the other 20 board flags are distractors. A 5×5 layout is our web presentation choice, since subtitle text alone does not establish board geometry.

## Not established by the available rule explanation

- Exact eligible flag pool and how similar-looking distractors were chosen.
- Whether all boards contained distinct flags (assumed for our generator).
- Formal penalty, if any, for circling more than five, and correction/erasure rules.
- Whether early submission was permitted; speed is not announced as a scoring factor.
- General tie handling beyond the one playoff shown; three-way ties or another playoff tie.
- Any restrictions on note-taking. We do not claim a verified show rule for these.

## Proposed solo adaptation — explicitly our choices

| Choice | Proposed behavior |
| --- | --- |
| Match length | Three rounds with independent boards; 0–5 points each, total 0–15 |
| Selecting | Toggle up to five flags; attempting a sixth shows “Deselect a flag first.” |
| Submit | Enabled at exactly five; locks the round immediately; no speed bonus |
| Timeout | Lock current 0–5 choices; partial correct answers count; missing or wrong choices score zero |
| Feedback | Reveal correct selections, mistakes and missed targets after lock; never during selection |
| Between rounds | Untimed review and an explicit Next round button; no unexpected countdown |
| Challenge | 1,000 ms per flag × 10 × 3, 5,000 ms blank interval, 60,000 ms answer limit |
| Practice | Same counts, but 2,000 ms per flag and no answer deadline; separate from challenge records |
| Start | User gesture, all round assets decoded, then a three-second ready countdown |
| Interrupted challenge | If hidden during countdown, study, gap or selection, abandon that attempt; offer a new round or return home. Preserve previous completed rounds, mark the match interrupted and ineligible for a best. Never replay the same studied sequence for score. |
| Interrupted practice | Freeze on a neutral screen; on return, restart study with a new round |
| Records | Challenge best stored on this device only; only complete, uninterrupted matches qualify; equal totals remain ties |
| Country names | No visible names during challenge study/selection. Accessible descriptions and a separate named practice option; name-assisted runs do not share the standard record category. Names appear in review. |
| Flag catalog | Versioned, curated list of national flags; exclude indistinguishable renderings within a round. First catalog targets at least 60 entries, not a claim to contain every flag in the world. |

Future multiplayer must share an identical board, hide answers until all players lock, and have an explicit tie policy. A trusted online score service would require infrastructure beyond GitHub Pages.

## Verification before calling a mode “show accurate”

Check the Netflix rule segment visually against these timestamps, confirm any on-screen exceptions and flag catalog, and record additional evidence. Until then, the product should say **inspired by**, with the confirmed timings above and adaptation choices clearly documented.
