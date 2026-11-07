# Dragon Defense — carry-over bookmark

Continue the Tech Freire Dragon Defense graphics overhaul. Do not start over.

- Repository: https://github.com/erin6374/dragon-defense-play
- Working branch: `feature/north-broad-graphics`
- Existing draft PR: https://github.com/erin6374/dragon-defense-play/pull/2
- Latest verified checkpoint before the sky pass: `2fed106`.
- Live production remains on main; the draft overhaul has NOT been merged or deployed.
- Local project: `C:\Users\Tech-Erin\Documents\ChatGPT\TECH FREIRE Building Projects\dragon-defense-play`.
- Interim ZIP: `Dragon-Defense-5.3-preview.zip` in the parent project folder. Refresh it at the end; it is not the final release.

## Already implemented

Perspective camera with fixed 3D city blocks; subtle foreground offsets; depth-tested dragon; Philadelphia landmark geometry; original school FBX and damage/collapse paths; translucent school glazing and physical material settings; dusk vehicle headlight road pools; aligned distant meteor impacts, warm meteor cores, and shared flash-geometry lifetime fix.

Full local Playwright checks passed for the last saved checkpoint. Reports and actual screenshots are committed under `qa/review/`. Performance counts are software-renderer observations, NOT verified hardware FPS. Read `CHANGELOG.md` and `qa/CONTINUATION-STATUS.md`; inspect newer commits and current PR checks before making changes.

## Remaining priorities

Improve city and skyline realism, sky/cloud appearance and cinematic disaster staging. Verify the actual atrium and geography against reference images. Original uploaded mockup and Street View screenshots were not accessible from referenced chat `6aed7042-35c8-83e9-9ce5-1e37429a8d45`; ask the user to reattach them when needed. Do not invent surveyed accuracy or claim photorealism is complete. Preserve separate Building Explorer.

## User preferences and release policy

Keep working without repeated continuation prompts. Budget remaining session resources and reserve time to test, update this bookmark, and package ALL latest verified changes near the end. The earlier ZIP was created prematurely and is only a checkpoint. Publish/deploy only after checks pass; keep unfinished visual work clearly labeled as a preview. If Windows Security blocks a file edit or screenshot write, ASK THE USER to clear that specific block rather than repeatedly working around it.

## Local QA

`qa/local.mjs` starts a local server and runs `qa/browser.mjs`. Set `PLAYWRIGHT_MODULE` to the bundled playwright-core `index.mjs`, and `QA_BROWSER_EXECUTABLE` to installed Microsoft Edge. Local networking requires the approved execution mode. Use a writable TEMP/TMP folder for the browser profile. Existing runtime: `C:\Users\Tech-Erin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright-core\index.mjs`. Edge: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.

Regular ChatGPT may not have filesystem or GitHub execution access. Use the linked PR and this file as context; request the ZIP/reference images if needed, and do not claim code execution without tools.

## Latest session checkpoint

The atmospheric sky pass is now implemented and passed the complete local browser suite. See qa/review/sky-report.json and sky-dusk.png. The latest branch commit includes this bookmark; use the current PR head as the definitive revision.


The subsequent skyline curtain-wall material pass also passed full local browser QA. Latest evidence: qa/review/skyline-day.png and skyline-report.json. The scene remains stylized and the original reference uploads are still needed for fidelity review.


## References recovered November 7

User supplied the cinematic mockup at H:\Downloads\1.Dragons Defence\Archive\Dragon Defense on North Broad Street.png. User does not have Street View screenshots and explicitly asked us to research 2221 North Broad Street ourselves. Stop requesting those uploads. Architect's public exterior/interior photographs: https://cicadaphiladelphia.squarespace.com/education/tech-freire . Address and project documentation: https://www.architectmagazine.com/project-gallery/tech-freire-charter-school/ . These document the real school; the supplied mockup is the cinematic appearance target, not surveyed geography. Photo geometry and nearby parcels still require inspection before claiming accuracy.


Latest follow-up: source interior night emission increased and glass emission reduced; full browser QA passed. Evidence: qa/review/interior-night.png and interior-report.json. PROJECT-HANDOFF.md remains the architecture guide; consult newer changelog entries for current state.


## Combined development checkpoint

Integrated remote skyline work through 78e4262 with local source-interior night lighting f5f8400. Full combined local browser QA passed. Reviewed dedicated falling/rubble screenshots: some tilted tower geometry extends below the apparent ground and slabs read as thin floating strips. Correct the collapse ground/clipping and fragment presentation next; do not treat numerical position tests as visual acceptance. Evidence is qa/review/06-skyline-*.png and integration-report.json. No production rollout.


Latest correction: collapsing tower bodies now stay above ground; full local QA passed. See grounded-collapse.png and grounded-report.json. PLAY-PREVIEW.cmd launches a local server at http://127.0.0.1:8769/. Public production is still unchanged.


Latest: upright textured facade fragments with rotated-box ground support; full local QA passed. Evidence: facade-panels-falling.png and facade-panels-report.json. Hardware performance and cinematic realism remain unverified.


## Latest chat continuation — Windows launch reliability and skyline batching (November 7)

The user successfully reached the local preview at `http://127.0.0.1:8769/` after previously opening `index.html` via `file://` and seeing CORS errors.

- `PLAY-PREVIEW.cmd` now selects the installed Python 3, detects an already occupied port, starts the server from its own folder and opens the browser after HTTP responds. The Windows-specific batch behavior has not yet been tested interactively on the user's PC; do not claim otherwise.
- The `index.html` boot error now correctly distinguishes `file://` CORS issues and local HTTP/server/vendor-file failures. Three.js is bundled under `vendor/three`; the old message suggesting a CDN was inaccurate.
- Browser QA has a static regression check for the launch instructions/import map.
- The existing 3D collapse slab faces were reindexed to combine five side-material faces into one group and retain one textured facade group. The geometry still includes 36 box indices, with two material groups instead of six. This can reduce draw submissions when rubble is visible, but hardware FPS is not verified. Browser QA checks groups, materials and index counts.
- New browser QA is running for these latest changes. Verify workflow state and artifacts for the current PR head, not an old commit.
- This session did not merge or deploy; production main remains v5.2.3. Do not alter the separate Building Explorer.


## Latest regression repair — November 7

GitHub browser QA run #61 **failed** with `SyntaxError: Invalid or unexpected token` originating from a malformed inline startup diagnostics script in `index.html`. The culprit was literal backslash-n text between JS statements, introduced in the earlier launch-help edit. Corrected the snippet (commit `79d81fa`) and added fast Node `vm.Script` inline-script syntax validation to `qa/browser.mjs` (commit `a81a194` after regex correction). The changelog records the details. **Do not claim this repair is verified** until the current PR head's QA completes; run #65 initially queued.

The user explicitly asked to keep development going when a chat stops. A separate hourly "Dragon Defense Development" scheduled task was created to try to resume bounded work using GitHub, while the existing "Dragon Defense QA Watch" continues checking build status. These automations do not guarantee Windows gameplay or GPU testing, and must not merge/deploy. Avoid duplicate edits from concurrent sessions. Keep production main at v5.2.3.


## Scheduled continuation — cumulative distant impacts (November 7)

At the start of this run, the branch was still at `e5de445` (no intervening commits), and GitHub browser QA run #66 had **passed**. That verifies the earlier startup syntax repair. The draft PR remains #2, with main unchanged.

New development on this branch: `787f0bd` increases per-tower cumulative damage from distant meteor strikes, allowing repeated hits to trigger collapse independently of foreground health; `1c80f77` adds a browser regression scenario and a screenshot. `CHANGELOG.md` has detailed scope. **Do not claim this new feature is QA-verified until the newest workflow run passes.** Inspect the current branch head and GitHub Actions first; other sessions may have added commits. The change intentionally does not alter local player/neighborhood health, and has no hardware FPS evidence. Do not merge or deploy without further review.


### QA follow-up: scenario ordering

Run #68 **failed** at the existing assertion that a facade section starts at its release height. This was a test-interference issue: the new cumulative-strike scenario had already started the same landmark's falling animation before the older forced-collapse test. Commit `dd40f11` moves the new strike-cascade test **after** the old collapse/restart assertions, so both run from an appropriate initial state. Changelog updated in `7ee5796`. Recheck the newest PR-head browser QA before reporting success. Do not confuse the run #68 failure with a JavaScript crash or conclude the feature is verified without a passing rerun.


### QA follow-up: strike count after reset

Run #71 failed the **new** assertion `repeated skyline hits accumulate independent tower damage`. Cause: moving the cascade after the reset cleared the original one-hit setup, but the cascade still executed only five hits while labeling them six. Five hits yield 0.35 damage, below the intended 0.40 threshold. Commit `b0d9f37` corrects the loop to perform six actual hits (0.42 expected). This is a test-setup correction, not a change to game logic. **Fresh PR-head QA is pending; do not mark verified yet.**


### Verified browser QA for cumulative distant strikes

GitHub Actions browser QA run #74 **passed** for the six-hit regression fix at `b0d9f37`, and run #76 **passed** for the complete subsequent PR head `f8e2f52`. This verifies the independent repeated-hit skyline-collapse scenario, the old collapse/reset assertions, startup, and the rest of the software-WebGL browser suite. Changelog records these runs. Documentation-only commits may trigger newer QA runs; always check the current branch head before claiming the newest commit has passed. The effect is intentionally cosmetic for foreground health. Hardware FPS, Windows preview launcher behavior, and photorealistic geographic fidelity remain unverified. Main and Building Explorer are unchanged.


## Scheduled continuation — skyline restart integrity (November 7)

At the start of this run the branch matched `407d188` exactly; GitHub Actions run #78 had **passed**. No competing branch edits or running QA were detected. The earlier six-hit skyline damage test was already verified.

This run added a **read-only QA state extension** (`8c8b7ac`) and a **post-cascade restart regression** (`7a8b004`). It checks that restarting a level clears tower damage, collapse/scale, rubble, flash, persistent smoke and scorch. A dedicated post-restart skyline screenshot is written to QA artifacts. Changelog documents the change. **The new test is not verified until the current PR head's GitHub browser QA passes.** Do not report a gameplay feature or hardware speedup: these commits only improve test coverage. Re-check latest head and CI before any further edits; avoid overlap with other development sessions. Main v5.2.3 and Building Explorer remain untouched.


## Scheduled continuation — long-session helicopter patrol (November 7)

Before editing, confirmed branch was still `161ed854` (identical to prior handoff) and GitHub Actions browser QA run #82 **passed**. No competing edits were present. Inspected the existing skyline animation and found a concrete visual defect: the left-moving distant helicopter used a signed JavaScript remainder for its 170-unit patrol. After approximately 5 minutes, its x-position could fall below its intended patrol bounds. Commit `5871847` normalizes the remainder. Commit `9b94277` adds a QA-only sampler for helicopter positions at 0, 300, 600 and 1,200 simulated seconds; commit `a6b55f0` adds finite-position and patrol-bound assertions for all three distant helicopters. Changelog documents the change. This is a cosmetic long-session correction, not a new gameplay feature or measured performance gain.

**Verification pending:** check the latest PR-head GitHub Actions browser QA before reporting this change as passed. Do not duplicate this helicopter fix. If QA fails, inspect the exact assertion/log first. Preserve main and the separate Building Explorer; no deployment or packaging occurred.



## Scheduled continuation — allocation-free night lighting (November 7)

Checked the development branch against the previous handoff commit `0756ea89`: **identical**, no competing edits. GitHub Actions browser QA **run #87 passed** at that head, verifying the earlier long-session distant helicopter patrol regression. Do not repeat that fix.

Audited `src/game.js`'s per-frame `updateNight(dt)`: an unused haze color blend constructed two `THREE.Color` objects per call, and sun/ambient interpolation constructed three more. Commit `e8da884` removes the unused blend and reuses three preinitialized immutable palette colors. Hex values and interpolation order are unchanged; this is an allocation reduction only, **not measured hardware FPS, GC, or visual fidelity**. Changelog documents the exact scope.

**Verification:** the new code and documentation require a fresh GitHub browser QA result for the current PR head. Check the newest workflow and any failures before further edits. Existing suite covers dusk/night and moving vehicle light behavior but is not a pixel-perfect comparison. Avoid concurrent writes while QA or another development session is in progress. Production main and separate Building Explorer remain untouched; no merge, package, or deployment.


## Scheduled continuation — pointer aiming duplicate touch events (November 7)

At run start, `feature/north-broad-graphics` still matched `5c82a5b`; no competing commits were detected. GitHub Actions browser QA run #90 was **successful** for the preceding lighting optimization. The prior night-light allocation work is therefore browser-QA verified (not hardware-FPS verified).

A code audit found that the canvas registered two `pointermove` listeners: a universal `aim` handler and a second touch-drag handler that called `aim` again when touch buttons were pressed. This performed redundant raycasts. Commit `7bc274a` removes the second listener and reuses two persistent vectors for the remaining pointer raycast. The existing touch `pointerdown` listener is preserved. Commit `9ab44c6` adds read-only aim telemetry to the QA snapshot. Commit `1253e06` adds a browser regression for left/right touch-pointer movement and a single-handler source guard; commit `18e29c2` corrects the guard regex. Changelog has the full scope.

**Verification pending:** check browser QA for the current PR head after the documentation commits; do not claim touch hardware or measured FPS. If QA fails, inspect the exact assertion before further edits. No changes to main, Building Explorer, deployment, or release packages. Avoid overlapping with any new branch commits from other sessions.
