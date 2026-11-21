# RC50 independent verification — 2026-11-13

**Verified gameplay/QA source:** `5005094a5c8cc3f32b55069360bf58cb1a28a198` — `5.5.0-rc.50` / `5.5-smoke-soot-density-rc50`. This file is a QA record; it does not imply a deployment or Windows hardware FPS validation.

| Exact-source workflow | Run | Artifact | Result |
|---|---|---|---|
| Browser | [43395572187](https://github.com/erin6374/dragon-defense-play/actions/runs/43395572187) | 14025344203 | SUCCESS; ZIP CRC 78/78; `errors=[]`, `warnings=[]` |
| Cinematic | [43395572190](https://github.com/erin6374/dragon-defense-play/actions/runs/43395572190) | 14022397288 | SUCCESS; ZIP CRC 6/6; `errors=[]` |
| Focused fire | [43395572215](https://github.com/erin6374/dragon-defense-play/actions/runs/43395572215) | 14022946146 | SUCCESS; ZIP CRC 7/7; `errors=[]` |
| Licensed CC0 | [43395572228](https://github.com/erin6374/dragon-defense-play/actions/runs/43395572228) | none | SUCCESS; validates existing packaged assets, not a fresh import |
| Motion | [43395572252](https://github.com/erin6374/dragon-defense-play/actions/runs/43395572252) | 14026115254 | SUCCESS; ZIP CRC 33/33; `errors=[]` in both motion reports |
| Windows development preview | browser run 43395572187 | 14025816564 | ZIP CRC 147/147; exact source SHA/version/build |

Packaged CC0 assets independently hashed against `assets/vfx/manifest.json`: `flame03.webp` SHA-256 `f0a5e760f37dd6a33f24463c674a1b9c3b11e767a33236a652edb40b0111834a`; `wispy-smoke03.webp` SHA-256 `c7880917a9710e02f206af2d7bc6dd81f21816fa24d6bd8eb28883a4cd400b2a`. Both match. Preview contains `tools/analyze-windows-performance.py`.

Actual `skyline-long.mp4` independently decoded with ffprobe: 796×448, 600 frames, 20 fps, 30.000 seconds; `houses.mp4` and `dragon.mp4` independently confirmed 960×540, 100 frames, 20 fps, 5 seconds. Long-fire report: 585 burning frames, 380 multi-tower frames, max 382 draw calls, no errors. Reviewed 12 long-video frames (0,30,60,120,...,540,599), eight house-destruction frames, and all five cinematic camera PNGs.

RC49 comparison (same motion seed 20261110): all five cinematic PNGs byte-identical to RC49. Across all 600 decoded skyline frames, mean absolute per-channel difference 2.1077723, with 8.6940889% of pixels changing by >10 RGB levels (codec differences included). Visual inspection finds RC50 soot marginally darker, but plumes still repeated and gray; house collapse and frontage remain stylized. **Technical PASS; cinematic ART FAIL.** Software browser reported about 0.3 FPS with large unattributed rAF gaps outside measured sim/render time. This is not a physical Windows GPU measurement and cannot diagnose the user's slideshow complaint.

**Next action:** collect physical Windows 30–60-second Performance Lab CSV during active destruction, run `python tools/analyze-windows-performance.py <csv> --json`, and use foreground FPS/stall data to choose a measured bottleneck before further renderer changes. No merge, deployment, force push, original school FBX or Google PR #3 changes.
