# Cinematic building-fire replacement — licensed flipbook pipeline

## Status (November 10, 2026, ~22:18 ET)

**Technique approved; texture import and visible material replacement NOT YET IMPLEMENTED.** This branch adds an independent 30-second actual-gameplay fire capture and source-integrity auditing, not a new cinematic fire material. Do not call MOT-03 resolved.

### Actual RC3 vs RC4 visual review

Downloaded and decoded exact-head independent motion artifacts: RC3 `13821435104` (SHA `2003ead582afa91403b43ee49d144960ac99dbe3`) and RC4 `13823304397` (SHA `f67a80b21667f01a61176449eac49e83c577cc5a`). Both contain five genuine 100-frame, 20fps MP4s. Reviewed `houses.mp4` and `skyline.mp4` at **0.6, 1.2, 2.4, 3.4, 4.8 seconds**, with motion available for frame stepping.

- **Houses:** two upper-window flames remain separate at 0.6–2.4s; at 3.4–4.8s the house collapses and separate low rubble flames remain. RC4 smoke is softer and less opaque but still resembles vertical cards, not a convincingly turbulent volumetric plume. MOT-02 behavior preserved.
- **Skyline:** four horizontal-window fires are present at 1.2–4.8s, towers stand. RC4's smoke is *less visible* than RC3's at 2.4–4.8s, and neither passes cinematic acceptance: the flames resemble small synchronized candles and the pale plumes lack large-scale irregularity, reflected firelight and wind-coupled evolution. No shader-only micro-tuning is recommended.
- **RC4 technical QA:** browser [42946449558](https://github.com/erin6374/dragon-defense-play/actions/runs/42946449558) and independent motion [42946449589](https://github.com/erin6374/dragon-defense-play/actions/runs/42946449589) succeeded, motion report SHA exactly `f67a80b...`. **RC4 same-SHA automatic Pages seven-file check not independently established in this review.** Last proven public fallback is RC3 `2003ead...`; the live URL may have advanced since.

## License and authoritative technique references

- [Unity Labs official free VFX image sequences and flipbooks](https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks), November 28, 2016: explicitly releases the sequences **under CC0**, including `Flame02`, `Flame03`, `SmallFlame01` variants, and `WispySmoke01/02/03`. Source packages offer preassembled flipbook ZIPs and EXR/TGA frame sequences. **This does not mean all Unity assets are CC0.**
- Original direct ZIPs from official page: [Flame02 flipbooks](https://unity3d.com/files/labs/downloads/vfx/assets01/Flame02/Flame02-flipbooks.zip), [Flame03 flipbooks](https://unity3d.com/files/labs/downloads/vfx/assets01/Flame03/Flame03-flipbooks.zip), [WispySmoke01 flipbooks](https://unity3d.com/files/labs/downloads/vfx/assets01/WispySmoke01/WispySmoke01-flipbooks.zip), [WispySmoke02 flipbooks](https://unity3d.com/files/labs/downloads/vfx/assets01/WispySmoke02/WispySmoke02-flipbooks.zip). These are exact links surfaced from the official Unity article; **archive contents and SHA-256 not yet verified**. Runtime/container download currently failed due DNS resolution of `unity3d.com`; do not fabricate source hashes or commit substituted art.
- [Epic Niagara Baker](https://dev.epicgames.com/community/learning/tutorials/Gxxq/unreal-engine-niagara-baker) explains frame grids, atlas sizes, and capture frame rates. [JangaFX EmberGen export documentation](https://docs.jangafx.com/embergen/pages/getting_started.html) describes flipbook PNG with RGB/alpha and render passes. Use the technique, not copyrighted engine assets or commercial game code.

## Next implementation gate

1. Fetch **original official** ZIPs through an environment with access. Run `python3 tools/audit-vfx-source.py <archive.zip> --output <audit.json>`. Record original archive and member SHA-256, dimensions, frame count/grid, color space, alpha channel, and license URL in a committed manifest. Reject ambiguous or corrupt archives.
2. Convert chosen CC0 flame and smoke passes offline to RGBA PNG/WebP atlases, using premultiplied-alpha handling and 2px edge gutters to avoid tile bleed. Preserve linear/sRGB intent. Use exact per-asset frame metadata; do not guess frame grids or fake alpha. Benchmark decoded texture size and GPU memory. Do not load EXR/TGA in the browser.
3. Replace **visible skyline/background combustion** with frame-interpolated atlas shaders on the existing 36 skyline and 168 neighborhood source slots. Layer 2–3 offset/asynchronous flame cards per opening, animate UV frame crossfades, use low-opacity smoke flipbook plus flow/distortion and height fade, and keep facade glow/soot and independent rubble behavior. Retain procedural fallback behind an A/B flag until visually accepted.
4. No per-impact textures/materials/geometry allocations. Preserve existing four-batch budgets or document any measured bounded increase, distance LOD and game rules. The shader must not jump on atlas wrap: blend across last/first frame only when the source sequence is loop-safe; otherwise crossfade two phase-offset instances.
5. Compare **full-speed actual** `skyline.mp4`, `houses.mp4`, and new `skyline-long.mp4` (30 seconds, 600 real 20fps frames) against the user's North Broad cinematic reference and verified RC3. Inspect smoke loop points, facade contact, reflected glow, horizontal window rows, and fire continuity through structural collapse. Record timestamped before/after visual findings.
6. Require exact-head browser QA with errors/warnings empty, independent five-clip plus long-clip motion reports and human visual acceptance, Windows package, and authorized automatic Pages **seven-file unauthenticated byte comparison for the same SHA**. Only then certify public `/preview/`.

The new 30-second capture is an **evidence-gathering change**, not a fire rendering replacement. It uses the real deterministic skyline gameplay path and records four simultaneous window origins after two staged tower strikes. Its automated metrics do not establish cinematic quality, hardware GPU FPS, or an APK.

## Other pending work

Geographically grounded left-of-screen North Broad infill (parcel/Street View evidence) and destruction parity for static flanking skins remain separate, unimplemented tasks. Do not invent addresses or imply those assets have been reconstructed. Keep PR #2 draft and main, production, Building Explorer and main-owned Pages workflow untouched.
