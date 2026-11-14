# RC58 exact-source independent QA — November 14, 2026

**Verified source:** `04699f42af42e121cdeab497d763c2a7c92538c4`, build `5.5.0-rc.58` / `5.5-sustained-slideshow-framebuffer-recovery-rc58`.

Five workflows completed SUCCESS: [browser 43584822188](https://github.com/erin6374/dragon-defense-play/actions/runs/43584822188), [cinematic 43584822025](https://github.com/erin6374/dragon-defense-play/actions/runs/43584822025), [focused fire 43584822097](https://github.com/erin6374/dragon-defense-play/actions/runs/43584822097), [licensed CC0 43584822026](https://github.com/erin6374/dragon-defense-play/actions/runs/43584822026), [genuine motion 43584822048](https://github.com/erin6374/dragon-defense-play/actions/runs/43584822048).

| Artifact | ZIP CRC | Report |
|---|---:|---|
| Browser | 78/78 | `errors=[]`, `warnings=[]` |
| Cinematic | 6/6 | `errors=[]`, exact SHA |
| Focused fire | 7/7 | `errors=[]`, exact SHA |
| Genuine motion | 33/33 | `errors=[]`, exact SHA |
| Windows preview | 150/150 | `5.5.0-rc.58`, correct build label |

Five real 100-frame/5-second MP4s (dragon, houses, skyfall, skyline, traffic) and one real 600-frame/30-second skyline MP4 at 20 FPS. All six MP4 files byte-identical to verified RC57 `9562c1201118b7cd8f724bee50a125b84a1eeeba`. Seven actual skyline frames inspected (1, 5, 10, 15, 20, 25, 29 seconds); repetitive smoke and stylized damage remain **ART FAIL**. Long report records 585 burning frames, 380 multi-tower burning frames, max 396 draw calls.

Packaged `assets/vfx/flame03.webp` SHA-256 `f0a5e760f37dd6a33f24463c674a1b9c3b11e767a33236a652edb40b0111834a` and `assets/vfx/wispy-smoke03.webp` SHA-256 `c7880917a9710e02f206af2d7bc6dd81f21816fa24d6bd8eb28883a4cd400b2a` match CC0-1.0 manifest. Original `assets/tech-freire-original.fbx` SHA-256 `8fe8c980ea7b73795db4c5b947853615d861c2b0c50db37e8a5541560b1d77e4` matches RC57; 36,233,776 bytes.

Software WebGL browser CI shows ~0.4 FPS and 27 long frame gaps. **This does not measure physical Windows FPS or prove that RC58's downscale recovery improves performance.** The new bounded telemetry change exposes actual framebuffer scale/adjustments/dimensions in future Windows CSVs and analyzer summaries, using browser samples only. Synthetic local HTTP/CSV/analyzer 40-second test passed; new commit exact-head workflows pending.

**Next:** verify the new commit's exact-head workflows, then obtain a 30–60-second physical Windows heavy-destruction Performance Lab CSV. Do not merge, deploy, force push or modify Google PR #3, Pages, Building Explorer or original FBX.
