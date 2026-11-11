## November 10 late evening ET — RC5 real-video review and licensed-flipbook presentation candidate (NOT VERIFIED)
- Live branch and PR #2 synchronized at `3ac573f7d0fae650a8317a4ab278d1fb81c7d864`; exact-head [browser QA 42954312851](https://github.com/erin6374/dragon-defense-play/actions/runs/42954312851) **passed** with `report.json.errors=[]`, `warnings=[]`. Independent [motion QA 42954312954](https://github.com/erin6374/dragon-defense-play/actions/runs/42954312954) **passed**, artifact 13827044385: five real 100-frame MP4s plus 600-frame 30-second `skyline-long.mp4` at 20fps, exact SHA, no captured errors. Windows preview artifact 13826034635 exists, but **no RC5 authorized same-SHA Pages seven-file certification**.
- Downloaded and reviewed actual RC4/RC5 `houses.mp4`, `skyline.mp4` at **1.2, 2.4, 3.4, 4.8s** and RC5 long skyline at **3, 6, 12, 18, 24, 29.95s**. RC5 still shows four small near-identical window fires, pale narrow smoke and weak warm facade contact; tower remains standing. RC5 is dimmer/smaller than RC4 at the same close-camera frames. Long recording shows minimal large-scale plume evolution across 30s. **MOT-03 remains visually FAILED**, despite the verified licensed media and passing technical QA. Rowhouse retains two window-localized fires at 1.2–2.4s, transitions to distinct low rubble fires by 3.4–4.8s, without a single falling torch.
- New **candidate**: enlarge only the CC0 Flame03 crossed cards (1.78x width, 1.18x height), spread WispySmoke03 sheets (1.48x width, 1.18x height, 2.2x lateral sway), balance alpha/gray tint and add flipbook-only warm facade contact glow. No procedural cone tweaks; original procedural A/B remains untouched. Same two audited CC0 WebP atlases, 168 neighborhood + 36 skyline source slots, four draw batches/pool, no new allocations, textures, particles or draw calls. Source change requires fresh exact-head browser + five/30s motion videos and real visual acceptance, Windows package and automatic Pages seven-file public check. **Do not certify or deploy on this note alone.**
- Left-screen North Broad geographic infill and main-street destruction parity remain separately unimplemented. Preserve draft PR, no main/production/Building Explorer/main-owned Pages edits, merge, forced deploy, hardware GPU FPS/APK claims.

## November 10 ~22:18 ET — licensed flipbook pivot + 30-second fire QA (NEW SHA NOT VERIFIED)

- **User direction:** stop procedural fire shader micro-tuning. Research confirms Unity Labs official 2016 Flame02/03 and WispySmoke01/02/03 assets are expressly **CC0**. Exact ZIP URLs, EmberGen/Niagara flipbook technique, conversion/integrity requirements and A/B acceptance are documented in [qa/VFX-FLIPBOOK-IMPLEMENTATION.md](qa/VFX-FLIPBOOK-IMPLEMENTATION.md). Download of original ZIPs is currently blocked by DNS in this runtime; no unverified binary, fake SHA or proprietary game asset has been committed. **Visible material replacement is pending.**
- **Actual RC3 vs RC4 videos inspected:** downloaded motion artifacts RC3 13821435104 and RC4 13823304397; compared houses and skyline at **0.6, 1.2, 2.4, 3.4, 4.8s**. RC4 keeps two attached house window fires, low separated rubble fires and four horizontal tower-window fires, but smoke is thinner/less visible and flame silhouettes still look like small candles. **MOT-03 remains visually OPEN.** RC4 exact-head browser [42946449558](https://github.com/erin6374/dragon-defense-play/actions/runs/42946449558) and motion [42946449589](https://github.com/erin6374/dragon-defense-play/actions/runs/42946449589) passed. RC4 same-SHA public seven-file gate is not established here; RC3 2003ead remains the last proven public fallback.
- **QA-only candidate:** added `qa/long-fire.mjs`, run after existing five clips in independent `motion-qa.yml`, to record **600 real gameplay frames at 20fps = 30s** (`skyline-long.mp4`, snapshots, `long-fire-report.json`, offline review HTML). Motion job timeout raised to 45 minutes. Added `tools/audit-vfx-source.py` for ZIP SHA-256/member integrity; source assets are NOT imported yet. This new commit requires its own exact-head browser and independent motion checks; a long video is not automatically a cinematic pass.
- **Concurrency/release:** feature branch updates must use expected-SHA CAS, never overwrite other sessions. Do not merge, touch main/production/Building Explorer/main-owned Pages workflow, or claim GPU FPS/APK. Geography-grounded North Broad infill and destruction parity remain pending.

# Dragon Defense — reproducible browser and motion QA environment

## November 10 ~21:35 ET — RC3 VERIFIED public; RC4 continuous-plume candidate UNVERIFIED

- **Verified public RC3:** exact SHA `2003ead582afa91403b43ee49d144960ac99dbe3`; browser [42939279410](https://github.com/erin6374/dragon-defense-play/actions/runs/42939279410) succeeded, artifact 13820097222 `report.json.errors=[]`, `warnings=[]`. Independent motion [42939279474](https://github.com/erin6374/dragon-defense-play/actions/runs/42939279474) succeeded, artifact 13821435104: exact SHA, `errors=[]`, five genuine 100-frame 20fps MP4s. Authorized automatic Pages [42940569797](https://github.com/erin6374/dragon-defense-play/actions/runs/42940569797) deployed from exact checkout `2003ead` and its **seven unauthenticated public `curl` + `cmp -s` comparisons passed** (deploy job 130263964159). [Play RC3](https://erin6374.github.io/dragon-defense-play/preview/). Technical public provenance is established, but **MOT-03 art acceptance remains OPEN**.
- **Actual RC2 vs RC3 recordings inspected:** `houses.mp4` and `skyline.mp4` at **0.6, 1.2, 2.4, 3.4, 4.8 seconds** and consecutive 0.1-second frame steps from 1.2–2.0s. RC3 has slightly broader facade flames and smoke; rowhouse retains two upper-window origins and multiple low rubble flames at 3.4–4.8s without a falling rigid torch. Four skyline windows burn while the tower remains standing. However the skyline still reads as four small candle fires and discrete cotton-like smoke heads with insufficient continuous ascent. The source-level change is not an art pass.
- **RC4 narrow shader candidate:** replace six independently rising, age-resetting smoke billboards per origin with six continuously anchored, tall, overlapping smoke sheets. Independent slow lateral sway, upward-advected turbulent density, widening with height, fade at top, off-white/gray smoke. The original flame shader, surface contact glow, embers and structural anchors remain unchanged. Fixed pools **168 neighborhood + 36 skyline**, four draw batches per pool, six smoke sheets/source, **no new textures, geometry, per-impact allocations, or gameplay changes**. RC4 `5.5.0-rc.4` / `5.5-continuous-plumes-rc4` is **UNVERIFIED** until its own exact-head browser, independent motion MP4 review, and automatic Pages seven-file byte gate.
- **RC4 visual risks:** sheets may appear like flat translucent rectangles or excessive haze; check upper-window attachment, 1.2–4.8s smoke movement, sudden pops, and separate low rubble vents. Do not declare MOT-03 fixed solely because automated QA passes. Keep PR #2 draft; no main/production/Building Explorer/main Pages workflow edits. Geography-grounded left-side North Broad infill and universal building collapse remain unimplemented.


This file is the authoritative setup reference for new ChatGPT sessions. Always inspect the **live** PR head and workflow definitions first; SHA values in older handoffs are historical.

## Exact-head browser QA

- Workflow: `.github/workflows/browser-qa.yml`, GitHub Actions `ubuntu-24.04`, Node **22**, system `google-chrome`, `playwright-core@1.56.1` installed outside the repository under `$RUNNER_TEMP/dragon-qa`.
- Server: `python3 -m http.server 8765 --bind 127.0.0.1` from repository root. Set `PLAYWRIGHT_MODULE="$RUNNER_TEMP/dragon-qa/node_modules/playwright-core/index.mjs"` and `QA_BROWSER_CHANNEL=chrome`, then `node qa/browser.mjs`.
- Checkout must equal `github.event.pull_request.head.sha` (or `github.sha` for explicit dispatch). The workflow checks this before testing. Browser QA is **cancellable** when newer PR heads arrive; cancelled runs are not passing releases.
- Artifact: `dragon-defense-browser-qa`, containing `report.json`, real-renderer screenshots including `06-skyline-fire-close.png` and `06-skyline-standing-fire-close.png`; successful workflow also packages `DragonDefense_Development_Preview` with `PREVIEW-BUILD.txt`. Artifact retention: **30 days**.

## Independent motion QA

- Workflow: `.github/workflows/motion-qa.yml`, GitHub Actions `ubuntu-24.04`, Node **22**, `playwright-core@1.56.1`, `imageio-ffmpeg==0.8.1` installed in isolated Python venv. `QA_FFMPEG` points to its encoder binary.
- Same local Python HTTP server and Playwright module as above. Run `node qa/motion.mjs` from repository root.
- Fixed seed **20261110**; **five 5-second 960×540 clips at 20fps, 100 frames each**: `skyfall.mp4`, `dragon.mp4`, `houses.mp4`, `skyline.mp4`, `traffic.mp4`. The exact tested SHA is embedded in `report.json`.
- Artifact: `dragon-defense-motion-qa`, including MP4s, frame PNGs, `report.json`, `review-guide.md`, and `index.html` offline reviewer with quarter-speed/frame-step. Retention: **30 days**.
- Motion workflow uses `cancel-in-progress: false`; a newer PR update may queue behind an older recording. Do not confuse pending or cancelled runs with verified success.

## Visual acceptance and release provenance

1. Read `CONTINUE-IN-CHATGPT.md`, `PROJECT-HANDOFF.md`, `qa/MOTION-VISUAL-REVIEW.md`, `qa/CURRENT-STATUS.md`, PR #2 and live Actions statuses.
2. Confirm exact-head browser success, report `errors=[]`, `warnings=[]`, screenshots and playable ZIP manifest.
3. Confirm exact-head independent motion success, report `errors=[]`, 100 frames per scenario. **Watch MP4s**, not only numeric telemetry. Compare time-stamped sequences against the prior verified motion baseline.
4. For public `/preview/`, wait for the **authorized automatic Pages deployment** and its unauthenticated **seven-file byte comparison** to pass at the same SHA. A successful artifact upload alone does not establish public correctness. Never modify main-owned Pages workflow or force deployment.
5. Log SHA, run IDs, artifact IDs, observed defects and verification limits in PR #2 and handoffs. Keep `main`, production root and Building Explorer untouched. Browser software WebGL is **not** a real Windows GPU FPS measurement; no APK verification is implied.

## Concurrency

Before any edit, recheck live branch head, PR comments and running workflows. Stage source changes off the exact expected SHA and fast-forward the target branch only through an expected-SHA compare-and-swap lease; on mismatch, stop, inspect and reconcile rather than overwriting concurrent work.

## RC24 smoke pool

RC24 adds one fixed InstancedMesh for 56 window-level rowhouse smoke quads using the existing dust atlas. Browser QA must verify capacity 56, one draw call, independent smoke positions, and window-height flame origins. Compare the five exact-head MP4 clips to verified RC23 before visual acceptance.

## RC25 window-band smoke / glow regression

The skyline renderer preallocates 36 flame, 36 smoke and 36 glow instances (nine towers × four window origins) in three instanced draw calls. QA checks horizontal separation, bounded vertical offsets, off-white central smoke and small flames. The independently recorded `skyline.mp4` must be reviewed for visible smoke motion and absence of hard loop pops; no visual acceptance is inferred from passing numeric assertions alone.

## RC3 window-band flame and smoke gate

RC3 `5.5.0-rc.3` changes only procedural combustion shader constants, skyline window-source size and build metadata. Review actual 20fps `houses.mp4` and `skyline.mp4` at 0.6/1.2/2.4/3.4/4.8 seconds against exact-head RC2; inspect full-speed playback and frame-step for hard plume resets. The tower site width remains capped at 1.92 local units for the existing QA contract. Existing capacities, draw calls, textures, source transforms, game state, and production isolation must remain unchanged. Do not certify public /preview/ without the automatic same-SHA seven-file byte comparison.
