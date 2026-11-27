# Integration Preview 10 — completion tracker
Date: 2026-11-27 (Eastern time). Code checkpoint: 6fbd274257559ff64f61aecc9761b82d6c7af6c9.
Scope: combined playable browser integration preview, not final production game, independent Antigravity branch, architectural viewer, or Unity port.

## Scoring
Weight each area by its contribution to preview acceptance. Stage values: 0 = not started; 25 = audited/planned; 50 = partially implemented, further work/verification needed; 75 = principal code changes implemented and targeted regressions passed; 100 = acceptance confirmed in live integrated gameplay (and release gate passed for release QA). Scores are engineering estimates, not measured labor or time remaining. Keep weights stable in subsequent updates unless scope changes explicitly. A passing synthetic fixture is not live gameplay verification.

| Area | Weight | Stage | Weighted points | Remaining acceptance work |
|---|---:|---:|---:|---|
| Performance and rendering | 25 | 75 | 18.75 | Browser A/B profiling, long-frame/stall evidence, GPU/shader validation |
| Architecture and asset integration | 15 | 50 | 7.50 | Packaged school geometry regression, mapped block visual and interior inspection |
| School and neighborhood destruction | 15 | 75 | 11.25 | Live localized impact, gradual school damage and repair tests |
| Flight controls and map traversal | 10 | 75 | 7.50 | Live campaign/sandbox end-to-end navigation and responsiveness |
| Cinematics and camera | 10 | 50 | 5.00 | Complete chapter transition, camera, introductory and skip/reset walkthrough |
| Threat readability, traffic and pedestrians | 10 | 75 | 7.50 | Live threat distinctions, collision, traffic and responder QA |
| Campaign/tutorial/finale | 10 | 50 | 5.00 | Opening/tutorial, all 15 waves, difficulty, final encounter, victory/defeat |
| Release QA and packaging | 5 | 0 | 0.00 | Entire regression suite, browser stress and playthrough, verified preview build |
| **Total** | **100** | | **62.50** | |

First scored checkpoint: **62.5% (63% rounded)**. No prior comparable score exists. No live FPS, campaign completion or release is claimed.
Latest batch: chapter ends derived from chapter starts (2, 5, 10, 14); escort progression guard; cinematic generation guard and iframe-source check; parcel-aware threat warning; bounded camera zoom; redundant staging rebuild suppression and settlement resource disposal. Four new targeted regression groups passed; full repository suite and browser execution not performed. Chapter-end change follows existing chapter start table; verify narrative intent in live play.
