# Dragon Defense — carry-over bookmark

## Latest continuation — reusable Paulo rig and pose driver (November 7–8)

**Do not redo the extraction or merge the release prematurely.** As of this handoff the development branch contains these unmerged changes:

- **Latest verified prior checkpoint:** GitHub browser QA [#42442263143](https://github.com/erin6374/dragon-defense-play/actions/runs/42442263143) passed. Its actual screenshots were reviewed: left/right bank angles show opposite longitudinal roll; thin, edge-on wing membranes still need artistic refinement. The procedural Paulo model remains a blockout, not a production skinned GLB.
- **New renderer-independent factory:** `src/dragon/paulo-rig.js` exports `createPauloRig(THREE,{breathPreviewFactory})`; creates geometry and a detached root, returns `applyPose(time,pose,bankDirection)`, articulated joints/QA data and `dispose()`. The actual `dragon-lab/paulo-lab.js` has been reduced to viewer, camera, control and scene logic and now imports the exact same rig. Game use MUST omit the lab-only breath preview factory.
- **Safe lifetime:** `rig.dispose()` unmounts the visual root and disposes unique geometries/materials once. Subsequent pose writes are a no-op; the second disposal is harmless. This is groundwork for the required selectable legacy-dragon fallback, **not** a runtime model switch yet.
- **Visual clock/intent:** `src/dragon/paulo-animation-intent.js` remains the pure 12-pose state selector; added `src/dragon/paulo-pose-driver.js` to bridge game signals with continuous wingbeat phase, capped 50ms visual delta, pause freeze and reset independently of simulation. Six independent source-level driver checks passed.
- **Browser QA:** `qa/browser.mjs` now constructs a second unattached Paulo rig using the real Three.js module, runs all twelve poses, checks mirrored banks/membranes/tail/fangs, cleans it up and checks safe repeated disposal/updates. It also covers pose-driver pause/reset/phase behavior.
- **Verification:** changed JS and browser test syntax parsed; the newest full browser QA must be checked at the exact latest PR head before claiming the extraction verified. Prior green runs do not validate these new commits. Preserve draft PR #2, production main, Building Explorer and the existing v5.3.1 playable dragon.

**Next sequence:** (1) Get current-head browser suite green and inspect actual screenshot output for the shared rig; (2) art/animation polish and actual Windows GPU check; (3) guarded gameplay child/fallback integration preserving existing attack/collision simulation; (4) consolidate all recent graphics/wind/Paulo changes per `RELEASE-PLAN-v5.4.md` only after acceptance. Avoid running two unsynchronized dragon simulators or injecting the lab renderer into the game.


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


## Scheduled continuation — intact skyline flicker work (November 7)

Before this run's edits, `feature/north-broad-graphics` exactly matched `7e2805d`; the previous browser QA run #96 had **passed**. There were no competing branch changes. Do not repeat the prior touch-pointer work.

This run changed `src/rendering/philadelphia-geometry-skyline.js` to bypass per-frame `sin/pow` electrical flicker calculations when a skyline tower has `collapse=0`. The old damaged-tower pulse formula is unchanged (`9851093`). A reversible `sampleSkylineEmissive` QA probe (`239aa25`) and browser regression (`000543c`) compare steady dusk emissive windows before impact with varying emission after a forced tower collapse. Changelog records scope and caveats. This is an unmeasured source-level CPU-work reduction; do not claim hardware FPS or GPU gains.

**Next step:** check the newest PR-head browser QA and inspect exact failure logs if it fails. A newly introduced assertion checks `damagedValues` vary by more than 0.002; if this fails, first verify staged dusk darkness and the sample times before changing gameplay. The current PR head may advance due to documentation-only commits. Avoid conflicting writes with other sessions. Production main v5.2.3 and Building Explorer remain unchanged; do not merge or deploy.

## Scheduled continuation — settled skyline rubble (November 7)

At start, development branch was still exactly `90194fc`; GitHub Actions browser QA **run #101 passed** for the prior intact-tower flicker optimization. No concurrent edits or active QA were found at start.

Identified a per-frame source inefficiency: skyline towers with `fallActive` kept recomputing all three facade slab rotations, matrices and ground-support heights after their rubble had landed. Gameplay commit `20f8757` adds a `fallSettled` flag, set only when all slabs have finished their rotation and reached the ground. The animation loop then stops doing slab transforms for that tower; reset clears the flag and restores release poses. QA commit `f1be956` extends the existing facade-fall regression to advance another two simulated seconds after landing and check both elapsed fall time and slab heights remain constant. Changelog documents the change.

**Verification pending:** check the newest PR-head GitHub browser QA; inspect failures before further edits. This optimization is not measured hardware FPS or CPU time, and no source-level speed claim should be inflated. If test fails, verify the final fall pose and settling condition before changing visuals. No edits to main, Building Explorer, deployment or packaging. Avoid duplicate/conflicting writes.


## Interactive continuation — stable skyline smoke (November 7)

Before changes, PR #2 head was `1a1cb13`; GitHub browser QA run #105 had **passed**. Existing scheduled fixes included touch pointer handler de-duplication, intact-tower emissive skipping, and settled-rubble transform skipping; do not repeat them.

This interactive pass corrected an unaddressed visual hierarchy issue: persistent smoke was attached to the shrinking skyscraper. Changed `src/rendering/philadelphia-geometry-skyline.js` so the smoke sprite lives in stable skyline coordinates and follows a one-time converted strike origin, without new sprites or per-frame resource allocation. Extended the deterministic `stageSkylineStrike` and `stageSkylineCollapse` QA probes and browser assertions to confirm the smoke stays visible, its parent remains stable and its world-space scale does not shrink during tower collapse. The changelog records scope.

**Verification pending until the newest PR-head browser QA completes.** If it fails, inspect actual error/log first and correct on the existing branch. Production `main` v5.2.3, Building Explorer and deployment remain untouched. Other hourly sessions may be updating this branch, so compare branch head and tests before any new writes.


## Interactive continuation — impact-only smoke updates (November 7)

Starting checkpoint: PR #2 head `4635445` passed GitHub browser QA run #110. This run audited the new independent skyline smoke effect and found smoke dimensions/opacity were still being assigned every frame, even though they depend only on cumulative hits. Commit `ad46338` moves those stable property writes into `strikeNearest`, retaining the same opacity/size formulas and per-frame position drift. Commit `b2eae59` adds a six-hit QA regression checking that plume width/opacity increase or stay constant as damage accumulates. Changelog is updated.

**Verification pending:** inspect latest PR-head GitHub Actions browser QA before considering this change verified. Do not claim measured FPS or graphics improvement, and avoid overlapping development branch writes if another scheduled session has started. No merge, production deployment, or Building Explorer changes.


## Scheduled continuation — immediate smoke and world-position QA (November 7)

At start, draft PR #2 was still at `f136f6c`, and GitHub browser QA run #114 had **passed**. The prior impact-triggered smoke size/opacity optimization is therefore browser-verified; no new performance measurement was obtained. No concurrent branch writes were observed before edits.

Gameplay commit `0cdd438` makes the existing smoke sprite visible immediately in `strikeNearest` instead of reassigning `visible=true` every frame after damage. QA probe commit `1fee745` captures immediate visibility and world positions on either side of the same synchronous tower collapse. Browser test commit `ce2131b` asserts that smoke is visible before the next animation update and remains in exactly the same world position when the tower shrinks, complementing the earlier parent/scale checks. Changelog records scope.

**Verification pending:** inspect the latest PR-head GitHub Actions browser QA. If it fails, read the specific failure before any additional edit. The branch must remain in draft; no production merge/deploy or Building Explorer changes. The new source-level visibility optimization has no measured FPS benefit. Another session may advance this branch, so always re-check head before writing.


## Scheduled continuation — skyline impact coordinate anchoring (November 7)

At start, draft PR #2 head `f5fcb28` matched the latest handoff and browser QA run #119 had **passed**. No competing branch edits or running QA were observed before this change.

The skyline meteor handler was returning its explosion world position after `setDamage` changed the struck tower's height/tilt. The actual contact point and persistent smoke were resolved before damage, so a collapse-triggering strike could place its cinematic explosion at the displaced facade rather than the incoming meteor's contact. Gameplay commit `b1dd36c` captures the hit position before damage, without adding per-impact allocations. QA probe commit `a00a052` exposes expected pre-damage and actual post-damage contact positions; browser regression commit `268744c` checks the returned explosion position against the former for six strikes and ensures at least one tower transform actually occurs. Changelog updated in `eee3114`.

**Next action:** inspect newest PR-head browser QA. If the new regression fails, read the exact logs and verify the assumption that repeat strikes use the same local impact position; correct the test or code based on evidence. Do not mark this fix verified before QA passes. Avoid overlapping branch edits with other sessions. No main merge/deploy or Building Explorer changes.


## Interactive continuation — meteor flash stable-space anchoring (November 7)

The branch was at `ff7d7ea`, with GitHub browser QA run #124 **passed**. There were no competing commits at start. This pass found that, despite correctly returning the pre-damage contact coordinate and anchoring smoke, the actual impact flash sprite remained attached to the shrinking/tilting tower and could visually move during its own collapse-triggering strike.

Reparented the existing flash sprite to stable skyline space (`src/rendering/philadelphia-geometry-skyline.js`) and retained the pre-collapse local facade contact as `tower.impactLocal` for subsequent strikes. The `src/game.js` QA probes now separately report local-facade-derived impact locations and actual stable flash position. The browser suite verifies initial flash/contact coincidence and no flash movement across a synchronous tower shrink (`qa/browser.mjs`). Changelog records the exact change. No new visual assets or per-frame meshes.

**Verification pending:** check latest PR-head browser QA, inspect failures before any new change, and make no measured hardware-FPS or cinematic-quality claims. This does not touch main v5.2.3, deployment, or the separate Building Explorer. Scheduled tasks may advance the branch; re-check PR head before writing.

## Scheduled continuation — repeated-hit flash/contact QA (November 7)

At start, draft PR #2 was at `092efaad`, matching the preceding handoff, and browser QA run #130 had **passed**. No concurrent changes or active QA were found. The prior stable-space impact-flash code is browser-verified.

This pass changed only `qa/browser.mjs` (commit `857813a`) to check all six successive skyline meteor strikes, not just the first, for finite visible flash positions, stable skyline parenting and exact coincidence with each strike's reported pre-collapse world contact. The existing cascade already verifies that a late hit actually moves the facade; this closes the gap between the visual flash and returned explosion location on those late hits. Changelog commit `ec06180` documents the QA-only change.

**Next action:** check the latest PR-head browser QA. If it fails, inspect the specific failing assertion and logs before further edits. The expanded test is **not verified** until that run passes. No gameplay source changes, hardware measurements, main merge/deploy, or Building Explorer edits. Recheck branch head before writing because other sessions may advance it.

## Scheduled continuation — repeat-impact flash radius (November 7)

- At start, the PR head was unchanged at `27ad3bfa1b0b2ada4ee1baa727ba1ec2b4a22134`, and GitHub browser QA run #133 **passed** the prior six-strike flash-position regression. No competing commits were present.
- Found a narrow visual defect in `src/rendering/philadelphia-geometry-skyline.js`: `strikeNearest()` did not reset the impact sprite scale even though `update()` grows it from radius 5 to 12 as it fades. Consecutive strikes could briefly display an oversized new flash until the next animation tick. Added `impact.scale.setScalar(5)` at strike time (commit `a8610d4`).
- The read-only QA probe now captures `flashScaleImmediately` before its next update (commit `5ad3602`); `qa/browser.mjs` checks radius 5 for all six consecutive strikes (commit `5fe53e9`). Changelog updated in `fb74252`. No new sprites, textures, effects or performance claim.
- **Next:** Inspect the latest PR-head browser QA after the handoff commit. Treat this fix as unverified until it passes. If QA is running or the branch has moved, do not overlap another session. Hardware GPU/FPS, architectural fidelity, Windows launcher and cinematic visual acceptance remain unverified. Do not merge, deploy, change main, or edit Building Explorer.

## Interactive chat continuation — post-impact skyline aftermath QA (November 7)

The user exhausted the prior Work session and requested continuing development here. The draft PR #2 head was `f861715` with **successful browser QA #138**. Latest changes by the scheduled sessions already included the six-impact position regressions and resetting flash radius on each hit. No competing branch changes were observed at this checkpoint.

This pass expanded automated coverage rather than stacking unverified effects: after staging skyline collapse and simulating additional seconds, the browser QA now confirms the short-lived flash disappears while scorch, persistent smoke, and rubble remain visible. It also checks finite, bounded smoke drift in skyline world coordinates and produces an extra real rendered image (`06-skyline-smoke-aftermath.png`) separate from the earlier rubble frame. Source changes only expose a read-only QA smoke-position field; no gameplay or visual behavior changed. Commits through `2733545` recorded in the changelog. Subsequent commits add a second QA-only close camera capture (`06-skyline-close-aftermath.png`) because screenshot review of #138 found foreground residential blocks still obscuring the skyline's lower rubble. The closer camera's actual generated pixels still require visual inspection.

**Verification pending** on the most recent PR head. The new smoke drift assertion expects displacement >0.001 and <4 between the staged frames; if QA fails, inspect the actual report and simulation-time behavior before modifying production code. Do not claim an FPS gain or visual acceptance based solely on software-rendered QA. Keep production main at v5.2.3, preserve separate Building Explorer, and do not merge or deploy. Check for scheduled-session concurrency before further pushes.

## User-requested Dragon wind v5.3.1 preview (November 7)

User explicitly requested the dragon's wind breath nudge ground vehicles and pedestrians according to weight, move small amounts of street debris using particles, blow/disperse smoke, and package a new preview ZIP here.

On the development branch:
- `src/simulation/ground-wind.js` supplies pure cone, intensity and relative vehicle-size rules.
- `src/game.js` integrates limited nudge for bikes, cars, large vehicles and pedestrians; projected wind reaches ground beneath an airborne dragon. Each gust has a fixed, per-target movement cap. Two preallocated instanced dust/litter particle batches appear at ground level, without gameplay-damaging forces.
- `src/rendering/cinematic-effects.js` bends/thins nearby school-fire smoke, and existing vehicle/explosion smoke puffs move and disperse under wind.
- Browser QA now checks pure force rules and live movement/particle/smoke behavior via temporary QA-only targets. New `PREVIEW_v5.3.1_README.txt` describes Windows launch and playtesting.
- Build identity bumped to v5.3.1 / `5.3-wind-ground-01`. CI workflow includes a new successful-run upload artifact `DragonDefense_v5.3.1_Windows_Preview`, staging full playable files excluding repository/dev/QA intermediates.
- Previous baseline head `7da3abe` passed browser QA #148. **Newest wind build verification is pending.** Check most recent PR head CI; investigate any failed assertion or package upload, then download and share exact artifact ZIP if successful. Do not assert that local Windows hardware has been tested.
- Production main remains v5.2.3, draft PR #2 unmerged; Building Explorer untouched. Check competing hourly development work before editing.


## v5.3.1 Windows preview QA verification and warning cleanup (November 7)

Browser QA run #166 **passed** the user's requested wind effects. The actual report showed no browser errors and one benign Three.js warning for an ignored `roughness` property on the new `MeshBasicMaterial` ground-litter batch. Ground interaction probe recorded pedestrian movement 12.13662, bike 12.11385 and bus 12.00740025 from start X=12; 38 dust and 13 scrap instances; street smoke puff shifted 12→12.5813 and opacity reduced below original. GitHub Actions successfully uploaded `DragonDefense_v5.3.1_Windows_Preview` (110 playable files, launcher and source/FBX/vendor files verified locally). A copy was downloaded to a working container but may not persist into later conversations.

The ignored material property was removed in commit `c4c2ee5`, and QA was strengthened to fail if any browser warnings occur in commit `b107f07`. Changelog updated. **These final cleanup commits require fresh QA and new packaged artifact.** Use the latest successful run's `DragonDefense_v5.3.1_Windows_Preview` artifact for the user's requested ZIP; never claim the previous run includes the cleanup commit. Keep PR #2 draft and production main unchanged.

## Paulo v5.4 — isolated procedural dragon laboratory (November 7)

User approved a realistic mascot hybrid inspired by the **anatomy and motion**, not copyrighted character assets, of Game of Thrones / House of the Dragon. Two concept-art sheets were generated in chat, and the user requested continuing into modeling and animation.

Created `dragon-lab/index.html`, `dragon-lab/paulo-lab.js`, `dragon-lab/DESIGN-SPEC.md`. The standalone lab is served by the normal v5.3.1 launcher at `http://127.0.0.1:8769/dragon-lab/`. It is an original **procedural blockout**, with separate articulated torso, chest, neck, head, jaw, seven-piece tail, four legs and mirrored shoulder/elbow/wrist wing rigs. It has 12 pose studies (idle/hover/flight/glide/bank/inhale/wind/fire/gas/hit/land/takeoff), animation speed, joint markers, orbit/zoom and anatomical camera presets. No existing gameplay dragon, camera, collision, score or controls changed. This is **not** a final skinned GLB and has not been integrated into the playable game.

`qa/browser.mjs` now loads the lab in a separate headless page and checks pose state count, wings, fire/wind jaw opening and page errors; saves `08-paulo-dragon-lab.png`. **Check latest QA result**, inspect screenshot and correct any viewer/runtime issues before calling this prototype verified. Next steps: orthographic silhouette review, asymmetric wing articulation, geometry and material quality, animation transition/blend plan, benchmark on real GPU, only then guarded integration behind a fallback toggle. Existing v5.3.1 wind preview is the playable baseline. Keep draft PR #2 unmerged and production main v5.2.3.

## Paulo v5.4 geometry pass — curved membranes and armor (November 7)

In `dragon-lab/paulo-lab.js`, replaced original single-triangle wing membranes with ten curved/scalloped tessellated panels (7 radial × 13 span vertices per panel; 910 total), still attached to existing shoulder/elbow/wrist pivots. Added 66 instanced overlapping dorsal armor plates in one draw batch. Previous pose improvements made state changes immediate, differentiated wind bracing from fire and expanded the inhale chest; QA verifies those behaviors. `qa/browser.mjs` now asserts membrane panel count, vertex budget and armor instance count. **Check latest QA before claiming this pass verified.** Keep the lab separate from playable dragon. Evaluate screenshot for wing surface orientation, silhouette and actual camera readability; next steps are deformation quality and skinned rig, not game integration yet.

## Paulo v5.4 flexible wing prototype (November 7)

`dragon-lab/paulo-lab.js` now caches the rest positions for all ten tessellated wing membranes and deforms interior vertices in a bounded oscillation for billow/flutter while preserving boundary positions. Normal buffers are recomputed every fourth animation update, no new meshes created per frame. The deformation amplitude depends on animation state (hover vs glide). `qa/browser.mjs` checks that a sampled interior vertex moves relative to the rest buffer after hovering. **Latest QA must pass before claiming verified.** Next inspect screenshot for visual quality, address surface artifacts and progress toward real skinned GLB. Main gameplay is unchanged.


## Scheduled continuation — front-view banking evidence (November 7)

At start, draft PR #2 remained at `9409c1f`; current-head browser QA run #234 passed and packaged the v5.3.1 Windows preview. Inspected actual QA artifact Paulo front, side, top, rear and both bank images. The top-down bank pair has little visual differentiation despite telemetry verifying opposite roll and mirrored shoulder angles. Paulo remains an isolated procedural blockout.

Added **QA-only** matched front orthographic banking captures (`14-paulo-bank-front-right.png`, `14-paulo-bank-front-left.png`) at paused 0.75 seconds, with camera-fit and state assertions. Existing top captures remain; no gameplay or rig edits.

**Next:** verify new PR-head browser QA and inspect both new front images. Do not claim visual acceptance or hardware FPS. Preserve draft PR, production main, Building Explorer and the v5.3.1 preview.

## Scheduled continuation — Paulo bank axis correction (November 7)

At start, draft PR #2 remained at `d1b65f7` and current-head browser QA **run #235 passed**. Downloaded and inspected the actual `14-paulo-bank-front-left.png` and `14-paulo-bank-front-right.png` artifact images. The left bank exposes the dorsal surface and the right bank exposes the ventral surface rather than showing mirrored wing-up/wing-down roll. Source audit found the root banking pose used `root.rotation.z` (pitch for a dragon facing +X) instead of `root.rotation.x` (longitudinal roll).

This continuation corrects only the isolated `dragon-lab/paulo-lab.js` bank axis, preserves Z-axis hit recoil, updates the `rootRoll` QA probe to measure X rotation and adds a browser assertion for zero pitch in either bank. Changelog records the visual evidence. **New QA pending**: inspect fresh front-bank images and browser result before calling the fix visually accepted. No playable-dragon integration, hardware FPS claim, main merge, deployment or Building Explorer change. Recheck branch head before further edits.


## Scheduled continuation — verified Paulo banking and camera parity (November 7)

At start the branch still matched `2abd8670`; [browser QA run #236](https://github.com/erin6374/dragon-defense-play/actions/runs/42438685499) passed. Downloaded and directly inspected both new front-bank PNGs from the actual run artifact. The left/right poses now visibly bank in opposite directions (rather than exposing the dorsal/ventral surfaces), confirming the prior longitudinal-axis correction in the isolated lab. The current screenshot evidence is **not** a final visual sign-off on wing membranes or gameplay integration; some membrane surfaces appear edge-on and narrow from the front.

The run #236 report gives opposite longitudinal rolls of +0.274/-0.274 rad at 0.75s, with front-frame extents (0.769, 0.481) and (0.769, 0.498). Added a narrow `qa/browser.mjs` regression asserting matched front-bank orthographic framing remains comparable, so future camera-fit changes do not bias the visual comparison. This adds no gameplay or model geometry changes. **Check the latest head's new browser QA before marking the new assertion verified.** Next: review wing membrane readability in oblique flight views and consider a bounded art fix only if an actual visual defect is demonstrated. Hardware GPU/frame pacing, final asset quality and integration remain unverified. Do not merge/deploy; keep main and Building Explorer unchanged.

## RC2 exact-head verification and Windows launcher documentation (November 8)

Checked live branch `ef67361549c3bad9b60b6e3c2536174ee586bec3` against prior `b07c345`: 14 newer commits had already introduced RC2 release identity, wing color/readability work, hit-recoil timing fixes and packaging. Exact-head browser QA [#275](https://github.com/erin6374/dragon-defense-play/actions/runs/42447703016) **passed**, with zero reported errors/warnings. Downloaded and inspected its actual QA screenshots and report; opposite Paulo banking remains visible, but the new model still looks comparatively dark in the night gameplay close-up. The CI software renderer reports large scheduling gaps, not Windows GPU FPS; do not treat its instantaneous FPS as a hardware benchmark.

Downloaded the actual 29,911,589-byte RC2 Windows preview ZIP and verified all 119 ZIP entries pass CRC integrity; required game, vendor, launcher, rig/driver, lab and build-info files are present. The launcher relies on Python 3, previously not mentioned in README, so added Windows Python 3 prerequisite/install guidance (commit `a03bf311`) and recorded evidence in CHANGELOG (commit `f4314f8`). This documentation-only update requires a **new exact-head QA run and fresh RC2 artifact** before declaring the updated package verified. RC2 is still a development preview with legacy dragon default and optional `?paulo=1` visual-only toggle; no physical Windows test, Android APK, merge, deployment, main or Building Explorer change.

**Next:** check current branch head against this handoff, wait for new PR-head browser QA and verify its artifact. Do not duplicate concurrent work. If no CI regressions, review the nighttime Paulo body/wing contrast with user or hardware evidence before further art changes. Preserve rollback RC1 and draft PR #2.
