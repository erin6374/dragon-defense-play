# RC59 exact-source verification and RC58 visual comparison — 2026-11-14

Source SHA: `2cbb63d3402986d74aaed57ef1e0e36b53e3d0d7`. Build: `5.5.0-rc.59`, `5.5-licensed-smoke-sheet-roll-rc59`. This document records observed source QA, **not** a release or cinematic art approval. No hardware Windows benchmark was available.

## Exact-source GitHub Actions

- browser: **completed / success**, https://github.com/erin6374/dragon-defense-play/actions/runs/43599825232
- cinematic: **completed / success**, https://github.com/erin6374/dragon-defense-play/actions/runs/43599825318
- focused fire: **completed / success**, https://github.com/erin6374/dragon-defense-play/actions/runs/43599825346
- licensed CC0: **completed / success**, https://github.com/erin6374/dragon-defense-play/actions/runs/43599825374
- genuine motion: **completed / success**, https://github.com/erin6374/dragon-defense-play/actions/runs/43599825395

## Downloaded artifacts inspected

- Browser QA ZIP: **78/78** ZIP entries CRC PASS; `report.json` has `errors=[]`, `warnings=[]`, expected build `5.5.0-rc.59`.
- Cinematic ZIP: **6/6** ZIP entries CRC PASS; `report.json` SHA exact, `errors=[]`; inspected day, dusk, night, left and right PNG views. Facades and nearby buildings remain stylized.
- Focused-fire ZIP: **7/7** CRC PASS; `report.json` SHA exact, `errors=[]`.
- Genuine-motion ZIP: **33/33** CRC PASS; `report.json` SHA exact, `errors=[]`; `long-fire-report.json` SHA exact, `errors=[]`, source `actual browser-rendered fixed-step game frames`. Five short videos each 100 frames / 5 s at 20 FPS; skyline-long.mp4 **600 frames / 30.0 s / 20 FPS / 796×448** (ffprobe). Long report: **585 burning frames**, **380 multi-tower frames**, **396 max draw calls**. Seven decoded skyline frames inspected at 0, 5, 10, 15, 20, 25, 29.9 s.
- Windows development preview ZIP: **151/151** CRC PASS; original school `assets/tech-freire-original.fbx` **36,233,776 bytes**, SHA-256 `8fe8c980ea7b73795db4c5b947853615d861c2b0c50db37e8a5541560b1d77e4`. CC0-1.0 atlas SHA-256 `flame03.webp`: `f0a5e760f37dd6a33f24463c674a1b9c3b11e767a33236a652edb40b0111834a`; `wispy-smoke03.webp`: `c7880917a9710e02f206af2d7bc6dd81f21816fa24d6bd8eb28883a4cd400b2a`. Both match packaged `assets/vfx/manifest.json`. Manifest retains original publisher, license and source ZIP/member hashes.

## RC58 ce94 baseline → RC59 actual motion

Baseline SHA: `ce94b8dabe0f6b5bb3906bb6b193cf1083a1e5d5`, genuine-motion run https://github.com/erin6374/dragon-defense-play/actions/runs/43594517303. Candidate: RC59 genuine-motion run https://github.com/erin6374/dragon-defense-play/actions/runs/43599825395. Downloaded both archives. Ran the repository's `tools/compare-motion-recordings.py` with `--require-change`, `--baseline-sha`, `--candidate-sha`. All six encoded MP4s changed. All nine sampled long-video frames changed at channel threshold 10/255.

| Long-video timestamp | Whole-frame pixels with maximum RGB channel difference >10 |
|---|---:|
| 0 s | 0.004% |
| 1 s | 0.020% |
| 3 s | 0.244% |
| 6 s | 0.432% |
| 12 s | 0.523% |
| 18 s | 1.200% |
| 24 s | 0.687% |
| 29 s | 0.746% |
| 29.95 s | 1.685% |

These are encoded-frame differences, **not** a perceptual quality score. Side-by-side decoded frames show smoke changing slightly, but repetitive plume silhouettes remain conspicuous. The bounded ±0.21 radian roll is implemented and has a measurable effect; it does not solve the visual target. **CINEMATIC ART FAIL**.

## Performance and next action

Browser software-WebGL CI reports approximately **0.3 FPS** and **28** unattributed requestAnimationFrame gaps; it is not representative of physical Windows hardware. **No physical Windows FPS/CPU/RAM heavy-destruction CSV has been supplied.** The severe slideshow complaint and whether RC58's adaptive framebuffer recovery engages on Windows are unresolved.

**Next action:** Capture a physical Windows 30–60-second heavy-destruction Performance Lab CSV and inspect real frame pacing, CPU/RAM, render age and framebuffer adjustments. Preserve gameplay and the original FBX. Do not merge/deploy or integrate older Google PR #3.
