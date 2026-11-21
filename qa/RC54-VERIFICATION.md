# RC54 independent exact-source verification — 2026-11-13

Verified source commit: `d037c9e77679a02c4114a417e2ec4313b19ab395` — `5.5.0-rc.54`, `5.5-async-smoke-silhouette-rc54`. The next QA/documentation commit is **not** independently verified by these runs.

| Workflow | Run | Result | Actual downloaded ZIP CRC |
|---|---|---|---|
| Browser | [43492199093](https://github.com/erin6374/dragon-defense-play/actions/runs/43492199093) | success; errors=[] warnings=[] | 78/78 |
| Cinematic | [43492199380](https://github.com/erin6374/dragon-defense-play/actions/runs/43492199380) | success; errors=[] | 6/6 |
| Focused fire | [43492199037](https://github.com/erin6374/dragon-defense-play/actions/runs/43492199037) | success; errors=[] | 7/7 |
| Licensed CC0 | [43492199044](https://github.com/erin6374/dragon-defense-play/actions/runs/43492199044) | success | no artifact |
| Genuine motion | [43492199255](https://github.com/erin6374/dragon-defense-play/actions/runs/43492199255) | success; errors=[] | 33/33 |
| Windows preview | [browser run artifact](https://github.com/erin6374/dragon-defense-play/actions/runs/43492199093) | source/build labels match | 149/149 |

Both packaged CC0-1.0 WEBP SHA-256 hashes match `assets/vfx/manifest.json`; original school FBX present. `ffprobe` independently confirms five 100-frame/5-second MP4s, one 600-frame/30-second skyline MP4, and focused-fire 100-frame/5-second MP4, all at 20 FPS. Seven frames from actual long recording inspected; smoke is still repetitive. Browser diagnostics show GPU clock 3, sourceBufferWrites 198, unchangedSetSkips 36, meteor-causal ignition and fire cleared on restart; these do not establish physical Windows FPS.

## Matched RC53 → RC54 motion comparison

New `tools/compare-motion-recordings.py` compares decoded matched frames, not filenames or report-only statistics. Baseline RC53 source `3a373980d34652eb357bcb5399e790ffb0f277c6` vs RC54 source `d037c9e77679a02c4114a417e2ec4313b19ab395`; 796×448 frames, threshold >10 max-channel RGB. All nine sampled frames (0, 20, 60, 120, 240, 360, 480, 580, 599) changed. At frame 360 (18s), 9,651/356,608 pixels changed above threshold (2.706%); at frame 599 (29.95s), 11,343 (3.181%). Identical-input negative control exits nonzero. This proves active rendered difference, **not** cinematic acceptance.

## Outstanding blockers

**ART FAIL** remains for repetitive smoke, stylized facade/house destruction against `campaign/visual_target.png`. User's Windows slideshow complaint is unresolved: no 30–60s physical Windows FPS/CPU/RAM capture. No merge, deployment, force push, main/production/Pages, Building Explorer, school FBX, or Google PR #3 modification.

**Next:** capture physical Windows heavy-destruction Performance Lab CSV; analyze bottleneck before targeted optimization, and verify the new QA commit's exact-head CI.
