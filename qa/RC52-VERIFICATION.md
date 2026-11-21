# RC52 independent verification — 2026-11-13

**Verified source:** `d2348612b07f60d75319f5e1beca0fe9e8e606d9`; build `5.5.0-rc.52` / `5.5-facade-atlas-variation-rc52`. This is a technical QA report, **not cinematic acceptance or Windows hardware performance approval**.

## Exact-source workflows
- browser: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43434692190
- cinematic: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43434692203
- focused fire: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43434692198
- licensed CC0: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43434692283
- motion: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43434692194

## Independently inspected artifacts
- Browser QA artifact 14043268375: 78/78 ZIP CRC, `report.json errors=[] warnings=[]`, version/build matched.
- Cinematic artifact 14043076459: 6/6 CRC, report exact SHA and `errors=[]`; five actual camera PNGs inspected.
- Focused fire artifact 14041982514: 7/7 CRC, exact SHA and `errors=[]`; 100-frame 5-second 20fps MP4.
- Motion artifact 14043624063: 33/33 CRC, exact SHA, `errors=[]`, genuine 600-frame 30-second 20fps long skyline MP4 and five 100-frame 5-second clips; long-fire report: 585 burning frames, 380 multi-tower frames, max 387 software draw calls.
- Windows preview artifact 14043293401: 148/148 CRC, `PREVIEW-BUILD.txt` exact source SHA, `build-info.json` version/build matched. `assets/vfx/manifest.json` declares CC0-1.0. Converted `flame03.webp` SHA-256 `f0a5e760f37dd6a33f24463c674a1b9c3b11e767a33236a652edb40b0111834a`, `wispy-smoke03.webp` SHA-256 `c7880917a9710e02f206af2d7bc6dd81f21816fa24d6bd8eb28883a4cd400b2a`; both match manifest. Original upstream source archives were not independently re-downloaded in this pass.
- Browser impact/reset, skyline meteor-linked ignition, unchanged combustion pool and left/right damage scenarios are present and clean. Browser software timing has multi-second unattributed rAF gaps and is **not physical Windows FPS**.

## Critical visual reachability defect
All five cinematic PNG files (`day`, `dusk`, `left`, `right`, `night`) are **byte-identical** to independently downloaded RC51 cinematic artifacts from run 43425220931. The RC52 `src/rendering/facade-atlas.js` change is used by `installSchoolFlankingHouses` in `src/rendering/school-flanking-houses.js`, but `src/game.js` only imports `installSchoolFlankingHouses` and never invokes it. Therefore RC52's local canvas paint contract PASS does not imply an in-game visual change. The static screenshot equality alone would not prove no effect outside those views; the missing runtime call provides the stronger source-level evidence.

New `qa/facade-reachability.mjs` prints `active:false`; `--require-active` deliberately exits nonzero. Do not connect decorative overlays without preserving damage-linked visibility. The live active Broad Street reference facades already bind trim/sign meshes to physical support parts.

## Acceptance and next action
**Technical source QA PASS. Cinematic ART FAIL. Physical Windows FPS unresolved.** Smoke remains repetitive; surrounding house geometry and collapse remain stylized. **Next:** modify one active, damageable frontage path, verify screenshot pixel delta and impact cleanup, then separately obtain a real Windows 30–60s heavy-destruction CSV before FPS conclusions. No merge/deployment/force push/Google PR #3 edits.
