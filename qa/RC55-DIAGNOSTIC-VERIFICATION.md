# RC55 diagnostic source independently verified — November 13, 2026

**Exact verified source:** `6a10e71a7eaa808a26af1a7dc4b1305677a41674`, `5.5.0-rc.55`, `5.5-turbulent-plume-edge-rc55`. Five workflow SUCCESS: [browser 43534315855](https://github.com/erin6374/dragon-defense-play/actions/runs/43534315855), [licensed CC0 43534315830](https://github.com/erin6374/dragon-defense-play/actions/runs/43534315830), [cinematic 43534315897](https://github.com/erin6374/dragon-defense-play/actions/runs/43534315897), [focused fire 43534315915](https://github.com/erin6374/dragon-defense-play/actions/runs/43534315915), [genuine motion 43534316047](https://github.com/erin6374/dragon-defense-play/actions/runs/43534316047).

| Artifact | Members | ZIP CRC | Report |
|---|---:|---|---|
| Browser | 78 | PASS | `errors=[]`, `warnings=[]` |
| Cinematic | 6 | PASS | `errors=[]` |
| Focused fire | 7 | PASS | `errors=[]` |
| Motion | 33 | PASS | `errors=[]` |
| Windows preview | 150 | PASS | Exact SHA/build in `PREVIEW-BUILD.txt` |

Browser checkout, build/preflight, browser QA and Windows packaging steps passed. Both packaged CC0-1.0 WEBP hashes matched `assets/vfx/manifest.json`: flame `f0a5e760f37dd6a33f24463c674a1b9c3b11e767a33236a652edb40b0111834a`, smoke `c7880917a9710e02f206af2d7bc6dd81f21816fa24d6bd8eb28883a4cd400b2a`. Original school FBX present.

Five 100-frame/5s MP4s and one 600-frame/30s MP4 at 20 FPS confirmed with ffprobe. Seven actual skyline frames inspected (0, 4, 8, 12, 18, 24, 29s). Smoke remains repetitive; stylized building damage persists: **ART FAIL** against `campaign/visual_target.png`. Software WebGL ~0.3 FPS is not physical Windows FPS. GPU clock=3, sourceBufferWrites=198, unchangedSetSkips=36, fixed near pool [3,6,5,1]. Clean browser report includes bilateral damage and meteor-only ignition coverage.

This commit adds Windows CSV capture-quality checks and four synthetic regression scenarios; no gameplay/rendering changes. New commit exact-HEAD CI pending. Physical Windows 30–60s heavy-destruction FPS/CPU/RAM remains unmeasured; slideshow unresolved. No merge, deployment, force push, main/production/Pages, Building Explorer or Google PR #3 modifications.

**Next:** verify this QA commit's five exact-head workflows and artifacts, then obtain a physical Windows System Monitor CSV and diagnose the measured bottleneck.
