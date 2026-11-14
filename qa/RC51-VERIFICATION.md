# RC51 independent verification — November 13, 2026

Verified gameplay source: `ff4c4e67943af8c15d44a0d7d3b23f761955d223` (`5.5.0-rc.51`, `5.5-meteor-causal-skyline-rc51`). This record is not a new gameplay build.

## Exact-source workflow conclusions
- Browser: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43417536619
- Cinematic: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43417536631
- Focused fire: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43417536566
- Licensed CC0: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43417536545
- Motion: SUCCESS — https://github.com/erin6374/dragon-defense-play/actions/runs/43417536459

## Independently downloaded and checked artifacts
- Browser artifact 14032502713: 78/78 ZIP CRC; report errors=[], warnings=[]; version/build labels match.
- Cinematic artifact 14031764816: 6/6 ZIP CRC; report errors=[]; SHA matches; five day/dusk/night/left/right PNGs present.
- Focused-fire artifact 14032237095: 7/7 ZIP CRC; report errors=[]; SHA matches; 100-frame/5s/20fps MP4.
- Motion artifact 14034212528: 33/33 ZIP CRC; both reports errors=[]; SHA matches. Actual browser-rendered skyline-long.mp4: 600 frames, 30.000 seconds, 20fps, 796×448. Five 100-frame/5s/20fps clips also checked via ffprobe. Reviewed 11 long-video frames and six house-destruction frames.
- Windows preview artifact 14033301186: 147/147 ZIP CRC; PREVIEW-BUILD.txt matches SHA/version/build; original school FBX packaged. Both CC0 WEBP hashes match manifest (Flame03 f0a5e760f37dd6a33f24463c674a1b9c3b11e767a33236a652edb40b0111834a; WispySmoke03 c7880917a9710e02f206af2d7bc6dd81f21816fa24d6bd8eb28883a4cd400b2a); CC0-1.0 attribution retained.
- Browser causal invariants: zero ambient fires before impact, fires and damage after impact, landmark fire after damage, and fire/smoke cleared after both restart scenarios.
- New `tools/verify-qa-artifacts.py` checks ZIP CRC, source labels, reports, MP4 frame count/duration with ffprobe, license hashes and causality. Local real-RC51 artifact PASS; intentionally wrong SHA rejected.

## Remaining blockers
**Technical workflow PASS is not art approval.** Visual inspection of actual recordings shows repeated dark gray smoke columns and simplified rowhouse facades/collapse geometry: **ART FAIL**. Browser software-rendered FPS ~0.4 with large unattributed rAF scheduling gaps; not evidence of Windows GPU FPS. User-reported physical Windows slideshow remains unresolved. No performance gain claimed.

**One next action:** obtain a physical Windows 30–60s heavy-destruction Performance Lab CSV and analyze foreground FPS/stalls before selecting the next bounded improvement. Preserve meteor-only ignition, left/right damage, gameplay, fixed pools and original FBX. No merge, force push, deployment or Google PR #3 edit.
