# Dragon Defense — reproducible browser and motion QA environment

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
