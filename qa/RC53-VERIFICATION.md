# RC53 independent exact-source QA — November 13, 2026

Verified gameplay source (not this documentation/QA commit): `9e1a5f63bd595d396b088265e43dff9338adb220` — `5.5.0-rc.53` / `5.5-structural-historic-reveals-rc53`.

| Workflow | Exact-source Actions run | Result | Downloaded artifact CRC |
| --- | --- | --- | --- |
| browser | [43452928976](https://github.com/erin6374/dragon-defense-play/actions/runs/43452928976) | SUCCESS | 78/78 browser and 148/148 Windows preview |
| cinematic | [43452928755](https://github.com/erin6374/dragon-defense-play/actions/runs/43452928755) | SUCCESS | 6/6 cinematic |
| focused fire | [43452928817](https://github.com/erin6374/dragon-defense-play/actions/runs/43452928817) | SUCCESS | 7/7 focused fire |
| licensed CC0 | [43452928743](https://github.com/erin6374/dragon-defense-play/actions/runs/43452928743) | SUCCESS | licensed manifest and source hashes checked |
| genuine motion | [43452928959](https://github.com/erin6374/dragon-defense-play/actions/runs/43452928959) | SUCCESS | 33/33 motion |

Downloaded actual ZIP archives and ran `tools/verify-qa-artifacts.py` with all five archives and the exact source SHA: PASS. Browser `errors=[]`, `warnings=[]`; cinematic/focused/motion `errors=[]`. Windows `PREVIEW-BUILD.txt` stamps the verified SHA, version and build. Both converted CC0 textures match manifest SHA-256: flame `f0a5e760f37dd6a33f24463c674a1b9c3b11e767a33236a652edb40b0111834a`, smoke `c7880917a9710e02f206af2d7bc6dd81f21816fa24d6bd8eb28883a4cd400b2a`. Source ZIP/member hashes are documented in the CC0-1.0 manifest.

Actual ffprobe motion: `skyline-long.mp4` 600 frames / 30.000 seconds / 20 FPS; `dragon.mp4`, `houses.mp4`, `skyfall.mp4`, `skyline.mp4`, `traffic.mp4` each 100 frames / 5.000 seconds / 20 FPS. Focused-fire `skyline.mp4` also 100 frames / 5 seconds. Eight frames sampled from the long MP4; persistent repetitive smoke and simplified fire/architecture remain an **ART FAIL**.

RC52 vs RC53 same-camera PNGs, 1280×720, exact pixel differences (max RGB channel >0): day **3430**, dusk **3431**, night **3404**, left **4950**, right **2252**. Threshold >10 differences: **3054**, **3058**, **2370**, **3532**, **1876**. New `tools/compare-cinematic-screenshots.py` reproduces these counts with Pillow, checks both report SHAs and errors, and has a tested unchanged-input negative case. The new structural window details are therefore visible; modest change is not cinematic acceptance. No additional draw calls were observed across the same five views.

Browser unchanged-state combustion pool evidence includes `stable:true`, GPU clock advance in active skyline coverage, and positive unchanged-set skips. Browser performance ~0.4 software-WebGL FPS includes unattributed rAF gaps; this is **not** Windows hardware performance.

**Outstanding:** physical Windows heavy-destruction FPS/CPU/RAM CSV and art approval. **Next:** obtain a 30–60-second Windows Performance Lab CSV, analyze with `tools/analyze-windows-performance.py`, then make one measured change. Google PR #3 remains independent/older RC30, never auto-merge. No production, main, Pages, Building Explorer, school FBX or force push.
