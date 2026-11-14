# RC59 verification — source 05998339ee6ea15f0ab686545b84c8a7453439e0

Date: 2026-11-14. This is an **independent artifact verification of the exact source SHA above**, not approval of the cinematic target or physical Windows performance. Gameplay version: `5.5.0-rc.59`; build: `5.5-licensed-smoke-sheet-roll-rc59`.

## Five exact-source workflows

| Workflow | Run | Result |
| --- | --- | --- |
| browser QA | [43621022072](https://github.com/erin6374/dragon-defense-play/actions/runs/43621022072) | SUCCESS, exact SHA |
| cinematic scene | [43621022059](https://github.com/erin6374/dragon-defense-play/actions/runs/43621022059) | SUCCESS, exact SHA |
| focused fire | [43621022020](https://github.com/erin6374/dragon-defense-play/actions/runs/43621022020) | SUCCESS, exact SHA |
| licensed CC0 importer | [43621022040](https://github.com/erin6374/dragon-defense-play/actions/runs/43621022040) | SUCCESS, exact SHA |
| genuine motion | [43621022076](https://github.com/erin6374/dragon-defense-play/actions/runs/43621022076) | SUCCESS, exact SHA |

All run metadata had `head_sha=05998339ee6ea15f0ab686545b84c8a7453439e0`. Downloaded GitHub Actions artifacts and checked every ZIP entry with CRC: browser 78/78, cinematic 6/6, focused fire 7/7, genuine motion 33/33, Windows development preview 154/154. Browser `report.json` contained `errors=[]` and `warnings=[]`; cinematic/focused/motion reports had `errors=[]`, `sha=05998339ee6ea15f0ab686545b84c8a7453439e0`. The browser report itself does not contain a source SHA field; the exact SHA is established by workflow-run metadata. Browser expected build/version matched RC59.

## Video and visual inspection

`ffprobe` verified five 5.000-second MP4s (100 frames at 20 FPS: dragon, houses, skyfall, skyline, traffic) and one genuine 30.000-second `skyline-long.mp4` (600 frames at 20 FPS). Seven decoded long-video frames at 0, 4, 8, 12, 18, 24 and 29.95 seconds, and five cinematic screenshots (day, dusk, night, left, right), were inspected. Skyline fire/smoke remained active and visually repetitive, and the school/neighborhood facades and destruction still look stylized. **ART FAIL** versus `campaign/visual_target.png`. A successful rendering workflow is not art approval.

## Asset provenance and source preservation

Packaged `assets/vfx/manifest.json` identifies **CC0-1.0** assets from Unity Labs Paris / Thomas Iche. The packaged `flame03.webp` SHA-256 is `f0a5e760f37dd6a33f24463c674a1b9c3b11e767a33236a652edb40b0111834a`, and `wispy-smoke03.webp` SHA-256 is `c7880917a9710e02f206af2d7bc6dd81f21816fa24d6bd8eb28883a4cd400b2a`; both exactly match the manifest. The original school `assets/tech-freire-original.fbx` is 36,233,776 bytes and SHA-256 `8fe8c980ea7b73795db4c5b947853615d861c2b0c50db37e8a5541560b1d77e4`, unchanged.

## Diagnostic regression and remaining blockers

Locally reran `tools/test-windows-framebuffer-recovery.py`: six freshness cases passed. `tools/test-capture-windows-performance.py`: four tests passed, including loopback HTTP scoped CSV and invalid-range checks. These are **synthetic/local tests**, not a Windows hardware capture. The browser QA report observed about **0.4 FPS** and **28 unattributed requestAnimationFrame gaps** in software-WebGL CI; do not equate this with physical Windows GPU performance. Physical Windows 60-second heavy-destruction FPS/CPU/RAM and adaptive framebuffer evidence is still missing. The user's slideshow complaint remains unresolved.

**Next action:** Run the included `CAPTURE-WINDOWS-PERFORMANCE.cmd` in the verified extracted Windows preview during heavy destruction and inspect its timestamped CSV and JSON. No main, production, Pages, Building Explorer, original school FBX, Google PR #3, merge, or deployment changes are authorized by this verification.
