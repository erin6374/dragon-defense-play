# RC55 independent verification — 2026-11-13

Verified source SHA: `33ec0969030e0aef2f8e8df74e9020ed2a8278cb`, build `5.5.0-rc.55` / `5.5-turbulent-plume-edge-rc55`.

| Exact-source workflow | GitHub Actions run | Result |
| --- | --- | --- |
| Browser QA | [43519177836](https://github.com/erin6374/dragon-defense-play/actions/runs/43519177836) | success, ZIP CRC 78/78 |
| Cinematic | [43519177829](https://github.com/erin6374/dragon-defense-play/actions/runs/43519177829) | success, CRC 6/6 |
| Focused fire | [43519177857](https://github.com/erin6374/dragon-defense-play/actions/runs/43519177857) | success, CRC 7/7 |
| Licensed CC0 | [43519177818](https://github.com/erin6374/dragon-defense-play/actions/runs/43519177818) | success |
| Genuine motion | [43519177830](https://github.com/erin6374/dragon-defense-play/actions/runs/43519177830) | success, CRC 33/33 |
| Windows preview | [browser run](https://github.com/erin6374/dragon-defense-play/actions/runs/43519177836) | packaged, CRC 150/150 |

Actual artifacts: browser `14086515969`, cinematic `14082780993`, focused `14082865712`, motion `14083994521`, Windows preview `14086401421`. Browser report `errors=[]`, `warnings=[]`; other reports `errors=[]`. All report SHAs and Windows `PREVIEW-BUILD.txt` match verified source. Packaged CC0-1.0 WEBP hashes match manifest: flame `f0a5e760f37dd6a33f24463c674a1b9c3b11e767a33236a652edb40b0111834a`, smoke `c7880917a9710e02f206af2d7bc6dd81f21816fa24d6bd8eb28883a4cd400b2a`. Original school FBX present.

Actual MP4s inspected with ffprobe: five 100-frame/5-second motion clips and one 600-frame/30-second skyline clip at 20 FPS; focused-fire 100-frame clip. Six actual long-motion screenshot frames reviewed. Combustion diagnostics fixed near pool `[3,6,5,1]`, `clock=3`, `sourceBufferWrites=198`, `unchangedSetSkips=36`. Technical PASS is not cinematic approval: repetitive smoke and stylized house damage remain **ART FAIL**. Physical Windows hardware FPS/CPU/RAM CSV is missing, so slideshow unresolved.

Next: verify subsequent 60-second diagnostic commit's five workflows; obtain 30–60-second physical Windows System Monitor CSV and identify measured bottleneck. No merge or deployment.
