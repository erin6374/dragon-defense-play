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
