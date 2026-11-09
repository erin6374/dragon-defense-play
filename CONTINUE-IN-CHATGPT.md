## November 9 — RC9e browser QA #361 full HUD clearance repair

[Browser QA #361](https://github.com/erin6374/dragon-defense-play/actions/runs/42664814978) reached the live 1024×576 UI and found the radar at top 104 while the health HUD ended at 107; the test requires an 8px gap. The existing desktop power-status banner also started at 100, within the health HUD. Raised the radar to 120, moved the power banner to 120, the wave toast to 166 and hunter warning to 208, retaining compact-screen rules. No gameplay/rig changes. **New exact-head QA pending.**

## November 9 — RC9e QA #360 static assertion scope repair

[Browser QA #360](https://github.com/erin6374/dragon-defense-play/actions/runs/42664690651) failed before browser startup: a new global text assertion forbade `gustOrigin.copy(dragon.position)` anywhere in game.js, but two existing synthetic QA staging helpers intentionally initialize their test gust at the body position. Production `releaseWind` and active-frame wind use the new `syncWindMouth` source. Removed the overbroad global assertion; retained positive source checks and live pose-aware browser assertions. **Exact-head QA pending**; no gameplay change in this repair.

## November 9 — RC9e breath-origin repair (exact-head QA pending)

- Wind and fire now start at animated muzzle sockets for both legacy and Paulo preview models. The gust source and visible cone follow completed head, flight, turn and movement poses every frame rather than freezing at release.
- Full 3D gust orientation matches gameplay direction; street-level dust remains intentional. No new draw calls or geometry for mouth sockets.
- Browser QA samples legacy hover/turn and Paulo hover/flight/bank, asserting muzzle, physics source and visible cone coincide. RC9d meteor shatter retained. Version 5.4.0-rc.9.4 / 5.4-fireball-mouth-anchor-rc09e.
- **Exact-head browser QA and preview verification required.** Main, production, Building Explorer and licensed European Dragon binaries unchanged.

## November 9 — Independent distant-fire sway (exact-head QA pending)

- [QA #355](https://github.com/erin6374/dragon-defense-play/actions/runs/42627571793) **passed** for `8337b51`, including the corrected distant smoke-drift regression. The browser and Windows-preview artifact steps completed; the artifact screenshots have not been independently reviewed in this run.
- The existing distant fire sprite now sways laterally and changes height subtly, with per-building phase offsets. It reuses the existing sprite/material and 28-marker budget; no new draw calls, geometry, textures, or per-frame allocations. Smoke, flame anchors, and collapse/restart behavior remain intact.
- Browser QA now checks flame coordinates and size bounds across intact/falling/settled states, plus cleanup on restart. **New exact-head QA and screenshot review required before certification.** No manual preview deployment, main merge, licensed FBX import, or real-GPU FPS claim.

## November 9 — QA #354 smoke-drift assertion repair (exact-head QA pending)

- [QA #354](https://github.com/erin6374/dragon-defense-play/actions/runs/42616563688) failed at `qa/browser.mjs:879`: the new plume test required >0.01 world-unit displacement in **both** adjacent 0.55-second snapshots. The sine-wave drift can be near a turning point in one interval, so this was a phase-sensitive assertion; the run does not establish a rendering or gameplay regression.
- Replaced the brittle per-interval condition with a finite, bounded range over the intact, falling and settled smoke X positions. This still requires visible horizontal drift during the staged collapse without a teleport, and retains the restart smoke cleanup assertion. No production renderer, gameplay, assets or timing changed.
- Exact-head browser QA must pass before certification; inspect its `06d-distant-building-rubble.png` image and report. Real-GPU FPS remains unverified.

## November 9 — Animated distant impact smoke (exact-head QA pending)

- [QA #353](https://github.com/erin6374/dragon-defense-play/actions/runs/42608999174) **passed** on `c2b7e16`, with no browser errors or warnings. Inspected `06d-distant-building-rubble.png`: the folded roof and three tilted facade pieces are visible; the simplified block shapes remain a future art target.
- The existing distant impact smoke sprite now drifts sideways and bobs over damaged/collapsing buildings. Uses the current 28-marker cap with no new sprites, textures, geometry, draw calls, hitbox changes, or per-frame allocations.
- Browser QA now checks plume movement across collapse frames and complete removal on restart. Exact-head QA and screenshot review required before release; real-GPU 60 FPS remains unverified.

## November 9 — Sharper distant rubble (exact-head QA pending)

- Baseline [QA #348](https://github.com/erin6374/dragon-defense-play/actions/runs/42602631839) **passed** for `26cffc2`; report `errors=[]`, `warnings=[]`, with intact/settled/restart geometry verified. Visual inspection of `06d-distant-building-rubble.png` found the roof fold worked but the collapsed form remained slab-like.
- Next narrow revision reduces the roof footprint and staggers the same three taller/narrower wall fragments. Browser QA now asserts a smaller roof and a fragment taller than the settled shell. Inspect exact-head `06c` and `06d` screenshots before certifying; do not claim real GPU 60 FPS or deploy manually.

## November 9 — Distant roof collapse silhouette (exact-head QA pending)

- [QA #347](https://github.com/erin6374/dragon-defense-play/actions/runs/42594805121) passed for `3c5f374`. Visual inspection of `06d-distant-building-rubble.png` showed the intact full-size black roof masking the three new facade fragments.
- During collapse the existing instanced roof now contracts in width/depth, shifts sideways, and cants into the debris; the intact and restart transforms remain unchanged. No new geometry, draw calls, coordinates, gameplay hitboxes or per-frame allocations.
- Browser QA now checks roof width, depth, tilt and restart alongside the existing rubble screenshot. **New exact-head QA and screenshot review required before certification.** Real GPU performance unverified.

## November 9 — Distant facade debris checkpoint (QA pending)

Distant collapse now uses three instanced wall fragments per building to break up the flat slab silhouette. One shared rubble mesh per distance tier is hidden until needed, and restart clears all fragments. Inspect `06c-distant-building-before.png` and `06d-distant-building-rubble.png` in the exact-head QA artifact; compare actual draw calls and confirm the pieces read as rubble rather than flying blocks. The source-level change does not alter building placement, collision or gameplay. **Do not claim this visual pass certified until exact-head browser QA succeeds.**

## November 9 — Foreground street and zero-health background barrage

The batteries now stage between the inner Broad Street lanes. All foreground meteor classes are shootable. Near and far background buildings are targets for visible falling meteors. The same neighborhood health calculation drives the gauge and the barrage, with faster volleys, major structural damage, and fire and smoke as the gauge empties. Check `zeroBlockBackgroundDamage`, `meteorShootability`, and `militaryPlacement` in the exact-head browser report. Paulo animation remains paused.

## November 9 — Foreground meteor classes

Paulo animation is paused at `58ac48b`. The current focus is the gameplay and cinematic checklist in [PR #2](https://github.com/erin6374/dragon-defense-play/pull/2#issuecomment-6732992679). The long-range rows now retain rubble after strikes. The wave-13 placement audit records all three battery hulls against buildings and street clearances. The existing coordinates are retained pending a specific relocation target.

Ordinary rocks remain shootable regardless of material, size, or location. The new fast impact subtype appears from wave 4, survives fire and blast damage, and uses the existing foreground impact path. Distant streaks now have a cool core. Look for `meteorShootability` in the exact-head browser QA report.

## November 9 — Distant disaster cadence verification

Baseline `58ac48b` passed [browser QA #336](https://github.com/erin6374/dragon-defense-play/actions/runs/42569616250). The next checkpoint covers neighborhood-driven distant meteor escalation at runtime and resets carried-over timers on restart. The browser report records the intact and damaged intervals under `distantMeteorCadence`. See the exact commit's QA run for verification.

## November 9 — Paulo flight silhouette

Browser QA [#335](https://github.com/erin6374/dragon-defense-play/actions/runs/42567760521) passed for baseline `9f04c7e`, which contains the grounded turn. The [earlier run for `a1c3b4d`](https://github.com/erin6374/dragon-defense-play/actions/runs/42567301859) was canceled. This pass deepens the four-leg tuck in the shared rig. Compare `15-paulo-flight-tucked-side.png` and `18-paulo-glide-tucked-side.png` from the browser QA artifact for the current commit. Check that run before sharing its playable preview.

## Latest continuation — grounded Paulo direction reversal (November 9)

QA #318 passed for `3ba3948` (https://github.com/erin6374/dragon-defense-play/actions/runs/42561480882). This continuation adds a distinct grounded `ground-turn` animation with hind-leg support, lifted forefeet, transient rear-up and mirrored torso/head pivot; it is visual-only and does not flip gameplay facing or hitboxes. The standalone dragon lab and browser QA cover the new pose and save a side-view screenshot. **Do not claim the new exact-head QA passed until the workflow completes.** Do not merge main, change production, or fabricate the licensed European Dragon asset.

## Latest continuation — QA #317 regression repair (November 8 late night)

The latest head `2e67ecf` failed [browser QA #317](https://github.com/erin6374/dragon-defense-play/actions/runs/42556616944) in the Paulo lab at an outdated assertion requiring zero root pitch while the new coordinated bank deliberately introduces a shallow nose-down pitch. The failure occurred after gameplay tests and before the rest of the dragon-lab checks. A narrow test-only repair now asserts shallow symmetric bank pitch; the separate reusable-rig test continues to verify signed yaw/head lead and mirrored roll. **Do not label this fix verified until exact-head browser QA passes.** No changes to wind, gameplay, original/new toggle, licensed FBX status, or production.

## Latest continuation — coordinated bank steering (November 8 late night)

Previous commit `533ad4e` passed [browser QA #316](https://github.com/erin6374/dragon-defense-play/actions/runs/42550703490). The next narrow change adds visual-only signed body yaw, shallow nose-down pitch and head-leading yaw to the procedural Paulo banking pose, plus mirrored-turn regression assertions. Full browser QA for the new exact head is pending. No changes to gameplay movement, hitboxes, old/new model toggle or production. Ground rear-up turning and licensed European Dragon binary integration remain outstanding.

# Dragon Defense — carry-over bookmark

## Latest continuation — landing airbrake (November 8 night)

Prior commit `82a8f4d` passed [browser QA #315](https://github.com/erin6374/dragon-defense-play/actions/runs/42545115434), with both Windows preview and browser QA artifacts available. This continuation adds a visual-only eagle-inspired landing wing flare to the procedural Paulo rig, matching the existing 0.6-second leg extension; adds wing joint assertions and a deterministic side-view landing screenshot. Exact-head QA for this change is **pending** until the new GitHub Actions run completes. The original/new procedural toggle remains; the licensed European Dragon binary is not present. Do not claim real GPU FPS or merge production. Ground rear-up/pivot turning is still outstanding.

## Latest continuation — procedural Paulo flight tuck (November 8 evening)

The branch's prior checkpoint `94c391c` passed [QA #314](https://github.com/erin6374/dragon-defense-play/actions/runs/42540166276) and includes the restored public old/new model toggle. This continuation changes **only the procedural Paulo visual rig and browser regression coverage**: flight/glide/bank fold four legs rearward, hover partially tucks, takeoff/landing use a 0.6-second transition, bank maintains signed roll and tail steering. QA adds joint-angle assertions and `15-paulo-flight-tucked-side.png`. **The exact new-head QA is pending until GitHub Actions reports success.** No licensed European Dragon FBX, ground rear-up turn, or hardware GPU verification. Production main and Building Explorer untouched.


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

## Scheduled continuation — RC2 Windows Python 3 fallback guard (November 8)

At start, draft PR #2 and branch remained at `3982dcd6622cd83b152654979d1a3277bfdd67ba`; exact-head browser QA [#278](https://github.com/erin6374/dragon-defense-play/actions/runs/42450767263) passed and uploaded an RC2 Windows artifact. Read current launcher and README. Found a deterministic source-level launch risk: `python --version` accepted Python 2 on PATH, but `python -m http.server` requires Python 3. Updated `PLAY-PREVIEW.cmd` to reject non-Python-3 fallback, preserving preferred `py -3`, and added an exact-line browser QA guard. **Check new commit's PR-head QA before marking this fix browser-verified.** Windows hardware execution and GPU FPS remain untested. Do not merge/deploy; leave production main and Building Explorer untouched.

## Scheduled continuation — RC2 QA green; licensed realistic Paulo candidates (November 8)

At start, development branch had advanced one commit from `96062397` to `e42f9983` with a separate user's `PAULO-REALISTIC-ASSET-AUDIT.md`. **Do not duplicate or overwrite that asset audit.** Exact-head browser QA [#280](https://github.com/erin6374/dragon-defense-play/actions/runs/42456654546) **passed**, including the browser job and Windows RC2 packaging. Prior [#279](https://github.com/erin6374/dragon-defense-play/actions/runs/42454741049) also **passed**, verifying the launcher Python 3 source-level guard in browser QA, but not on actual Windows hardware.

Two user-supplied, CC BY 4.0 candidates are now documented: Regina Cachoa's European Dragon FBX (five animation stacks, absolute Windows texture paths) and LasquetiSpice's Three Motion Loops GLB (three clips, required obsolete specular-glossiness material extension). The audit describes a separate audition ZIP in another conversation; **the actual binary sources are not in this repository**, and the audition viewer failed local Chromium GPU initialization. No real-time visual acceptance, asset choice, physical Windows launch or GPU FPS has been established. Do not silently replace Paulo's procedural rig or copy unverified third-party assets into the game. Keep attribution/modification notices and license source links when later distributing modified assets.

**Next safe work:** inspect actual audition renders on working GPU, check four-foot perched / flight / wing / facial quality, select one source only after evidence, then prepare an optimized skinned GLB and guarded visual-only fallback behind `?paulo=1`. Preserve RC2's legacy default and all attack/collision simulation. Before any new edit, recheck branch head and latest PR QA because another session is working on the realistic asset track. This continuation updates documentation only. Do not merge/deploy or modify main/Building Explorer.

## Scheduled continuation — RC5 high-speed missile collision follow-up (November 8)

At start branch was `cb5a7ca633453162c86a52a30850abfbf51dc749` and exact-head browser QA [#285](https://github.com/erin6374/dragon-defense-play/actions/runs/42460992019) **passed**, including Windows RC5 preview packaging. Audited the new RC5 military collateral detector and found a deterministic frame-step tunneling issue: point-only collision at the end of a missile movement could skip narrow buildings or the road on a slow frame. Changed the helper to test the full frame segment against approximate structure/road AABBs and return the earliest impact point, plus deterministic regression tests. Preserve existing collision priority and optional callback behavior. **Check exact-head QA for this new change before calling it browser verified.** This is a software robustness fix, not a measured GPU performance change. Continue with RC4 wind vehicle visual evidence and RC5 collateral screenshots; avoid duplicate commits from other sessions. Main, deployment, Building Explorer and licensed dragon binaries remain untouched.

## Scheduled continuation — RC5 active-target rocket sweep (November 8)

At start branch matched `977d021648ec71f849e8cefd17536621a8afcff6`; exact-head [browser QA #288](https://github.com/erin6374/dragon-defense-play/actions/runs/42463054731) **passed**, including Windows preview packaging. Audited the rocket movement path: collateral used segment/AABB sweep, but shot, meteor and dragon collisions remained endpoint-only and could tunnel at low frame rate. Added a pure segment/sphere first-contact helper and used it for these three collision classes without changing their priority or collateral behavior; added deterministic QA cases. Five independent Node assertions passed, but **new PR-head browser QA and gameplay visual evidence are pending**. Do not claim GPU FPS or licensed European Dragon integration. Keep main, deployment and Building Explorer untouched; compare branch head before editing.


## Scheduled continuation — RC5 first contact ordering (November 8)

At start branch matched `87ee68fd4c6408fadffeb05dd4b1afb007752e79`; exact-head [browser QA #289](https://github.com/erin6374/dragon-defense-play/actions/runs/42466717298) **passed**, including Windows RC5 preview packaging. The active-target rocket sweep had a same-class ordering defect: first array entry won even when another projectile or meteor intersected earlier along the rocket path. Added a pure nearest-contact helper and changed only same-class selection while preserving shot > meteor > dragon > collateral priority; added deterministic ordering and eligibility assertions. **Check new exact-head browser QA before certification.** Screenshots/visual acceptance and physical GPU FPS remain unverified. No main, deployment, Building Explorer or licensed dragon asset change.


## Scheduled continuation — RC5 compact HUD layout regression (November 8)

At start branch matched `9ee667f44849c82879af9f8fd4e000285d708e68`; exact-head [browser QA #290](https://github.com/erin6374/dragon-defense-play/actions/runs/42471074050) **passed** including Windows preview packaging. Previous QA imagery had shown crowding at 848×480 around the chapter/status/wave labels. Added compact-only CSS to separate those labels and a Playwright 848×480 bounding-box check with a **synthetic** wave/hostile-aircraft alert screenshot; the screenshot is a layout probe, not evidence of wave 15 gameplay. No missile/gameplay logic changes. **Check fresh exact-head QA and inspect `02b-compact-hud-synthetic-alerts.png` before declaring the layout fixed.** If assertions fail, correct the regression before proceeding. Preserve draft PR, main, deployment and Building Explorer; real GPU FPS unverified.


## Scheduled continuation — RC5 desktop wave and compact warning spacing (November 8)

At start the branch still matched `0cf3afa86c6f74f48652ce113bede2d896f14695`; exact-head [browser QA #291](https://github.com/erin6374/dragon-defense-play/actions/runs/42475844384) **passed** and produced a Windows preview. Inspected actual screenshots: `02-playing.png` at 1024×576 has wave toast visually obscured by the interception bar; `02b-compact-hud-synthetic-alerts.png` at 848×480 has the synthetic hostile-aircraft warning touching the first row of menu buttons. Added only responsive alert spacing and two browser DOM-geometry regression assertions; no gameplay, HUD control, rendering or asset changes. **Verify the new exact-head browser QA and inspect both updated screenshots before calling this accepted.** Preserve draft PR #2, production main, Pages deployment and Building Explorer; real hardware GPU FPS and licensed European Dragon integration remain unverified.


## Scheduled continuation — RC5 desktop HUD/status clearance (November 8)

Before editing, branch exactly matched `02c39cf0089d1c9e9af938fe1e03a064a879a20b`; [browser QA #294](https://github.com/erin6374/dragon-defense-play/actions/runs/42480421784) **passed** with Windows preview. Inspected actual `02-playing.png` and compact synthetic alert PNG: earlier wave/warning separation is visible. A distinct 1024×576 defect remained: interception status at y=70–103 covered the bottom of the top health/lives HUD (visible in screenshot). Desktop-only spacing moves status below the HUD and wave/hostile warnings lower in sequence; Playwright now checks HUD→status→wave vertical clearance. Compact rules and gameplay are untouched. **Check the new exact-head browser QA and actual screenshot before certifying.** Hardware FPS, licensed European Dragon, main, manual deployment and Building Explorer remain unchanged.


## Scheduled continuation — RC9b radar clearance in full/touch layouts (November 8)

At start branch matched `4e7ecc055c2353ba71b5927fce11a76d5e7c6cb0` and [QA #303](https://github.com/erin6374/dragon-defense-play/actions/runs/42495308567) **passed**. Downloaded and inspected actual desktop full/cinematic and compact synthetic-alert screenshots. Found full desktop radar over menu buttons and compact radar over FIRE/GAS; cinematic desktop is already clear. Added mode-specific radar CSS and Playwright assertions/snapshots for desktop full, compact full and compact cinematic. Local Chromium was blocked from localhost (`ERR_BLOCKED_BY_ADMINISTRATOR`); do **not** claim local browser QA. Check new exact-head GitHub Actions and screenshots before accepting. Preserve RC9b build identity, main, Pages deployment, Building Explorer and licensed dragon binaries; real GPU FPS unverified.


## Scheduled continuation — RC9c distant impact glow (November 8)

At start development HEAD was `e793e38d4b3bdb8a1f6bcc72c025061fdc4a8b49` and exact-head [QA #304](https://github.com/erin6374/dragon-defense-play/actions/runs/42500182720) **passed**. Added a small screen-space sky glow for two distant Philadelphia disaster zones, with restrained wave/damage escalation and deterministic QA assertions. No additional draw calls or gameplay changes. **Inspect fresh RC9c exact-head browser QA and screenshots before certifying visual acceptance.** Real GPU FPS and licensed European Dragon binaries remain unverified; do not merge/deploy or touch main/Building Explorer.


## Scheduled continuation — RC9c visible skyline glows (November 8, 2026)

Previous exact-head [browser QA #305](https://github.com/erin6374/dragon-defense-play/actions/runs/42505013025) passed on `d0d519d`, but visual inspection found fire glows obscured by roofs (shader centers y=.16/.23). Moved centers to y=.49/.55 with broader falloff and restrained color; no extra draw calls, lights, geometry or gameplay changes. Added wave-15 rendered screenshots and wave-7 restoration to Playwright. **Fresh exact-head browser QA and screenshot inspection are required** before accepting the visual correction. Preserve PR #2 draft, main, Pages and Building Explorer. Licensed dragon binary and hardware FPS remain unverified.


## Scheduled continuation — RC9c wave-15 screenshot/cutscene correction (November 8, 2026)

Exact-head QA #306 for `e957659` executed all browser assertions, saved screenshots and packaged files, but was **cancelled** while finalizing the Windows preview upload (artifact service returned HTML instead of JSON repeatedly); do not call it a passing workflow. Its retained browser QA artifact revealed both `06b-high-wave-disaster-glow*.png` images were **chapter cinematic overlays** rather than skyline gameplay. The new test dismisses the wave-15 chapter cinematic with the existing QA-only `closeCinematic()`, asserts hidden overlay and unpaused gameplay, and captures actual wave-15 gameplay; restores wave 7 as before. Also fixes the stale RC9b Windows preview label to RC9c. **Run exact-head QA and inspect the new screenshots before approving glow visibility.** New user gameplay requirements for 3D attack first-hit ordering, 7-second military paralysis, windstorm impulse, chapter-only roof spawn and physical bumps are documented in PR #2 comment 6726406282; not implemented by this QA fix. Keep main, Pages, Building Explorer and licensed dragon binary untouched.

## Scheduled continuation — RC9c wave-15 toast-free visual QA (November 8, 2026)

Exact-head [QA #307](https://github.com/erin6374/dragon-defense-play/actions/runs/42519919972) **passed** for `2400e1d`, but artifact review showed both wave-15 screenshots still obscured by the independent `#toast` announcement (“A NEW CHAPTER BEGINS”). Closing the cinematic and asserting unpaused gameplay did not clear that message. Added test-only Playwright wait for `#toast` to become empty, an explicit assertion, and report fields `toastBeforeWait`/`toastCleared` before both screenshots; game code and gameplay remain unchanged. **Verify new exact-head QA and inspect screenshots** before accepting disaster glow. Next, implement true 3D attack hit ordering in a separate tested commit; 7-second military paralysis, windstorm, chapter continuity and collision bumps remain planned in PR #2. Preserve draft PR, main, Pages, Building Explorer and licensed dragon binaries. Real GPU FPS unverified.


## Scheduled continuation — RC9c high-wave toast screenshot timeout (November 8)

Exact-head QA #308 failed at `qa/browser.mjs:784`: waiting for the 1.8-second chapter toast to expire timed out after 10 seconds, even though the chapter cinematic was dismissed and gameplay was unpaused. The QA atmospheric-settle helper does not necessarily advance the gameplay timer. QA artifact `13635007342` includes `report.json` with `toastBeforeWait` and the timeout. Commit `f1b72a7` replaces that timer-dependent wait with screenshot-only DOM toast clearing after recording its text; no gameplay logic, timer, visuals or production source changed. **Check exact-head QA for f1b72a7 and visually inspect the new wave-15 screenshots before certifying glow visibility.** Then pursue chapter-only perch and 3D attack ordering. Preserve main, Pages, Building Explorer and licensed dragon binaries.


## Scheduled continuation — chapter-only Paulo perch (November 8)

QA #309 passed at `8b464ba` and branch was unchanged before editing. Removed unconditional roof perch in `newWave()` so Paulo remains freely positioned through ordinary waves. Initial reset and chapter settlement still call `perchDragon` explicitly. Added browser QA source assertions. **Check latest exact-head QA and verify wave transition gameplay** before certifying; this is not yet an end-to-end runtime position test. Continue with 3D attack first-hit ordering and windstorm. No main, Pages, Building Explorer, or licensed dragon binary changes.


## Scheduled continuation — runtime ordinary-wave position QA (November 8)

QA #310 passed at `59be198`. Added QA-only `advanceOrdinaryWave` hook and browser assertion: start wave 2, move Paulo to (31,23,15), advance via real `newWave()` to wave 3, assert unchanged xyz, then restore wave 1. This exercises runtime position preservation rather than just source matching. **Exact-head QA pending**; fix any failures before further graphics/gameplay work. No main/production/Building Explorer changes.


## Scheduled continuation — nearest swept fireball interception (November 8)

QA #311 passed for runtime Paulo ordinary-wave position regression at `51cf369`. New game change selects earliest segment-sphere intersection among meteors for Paulo's fireball; existing scoring and impact effects retained. Added source-level guard in browser QA. **Exact-head QA pending**; verify no JavaScript syntax/runtime regressions before further work. This change does NOT yet solve wind/gas/vehicle/helicopter 3D target ordering. No main/production/Building Explorer edits.


## Scheduled continuation — public original/Paulo model toggle (November 8, evening)

Exact-head [wind QA #313](https://github.com/erin6374/dragon-defense-play/actions/runs/42535065712) **passed** on `c32c2a0`, with `DragonDefense_v5.4.0_RC9c_Wind_Windows_Preview` and browser QA artifacts. The previous wind commit `efb68fe` workflow was cancelled, so use the succeeding tested head. Restored the original/experimental procedural Paulo visual-only model toggle in the normal full HUD (not query-gated); original stays default and fallback. QA now clicks the real button in both directions and checks aria-pressed and rig state. **Exact-head QA for this toggle change pending; inspect artifacts before release.** In cinematic HUD, press H to restore full controls and access the toggle. The licensed European Dragon FBX is still absent from GitHub; do not label the procedural preview as the licensed model. The user's new animation requests (flight feet tuck, eagle-like banking and tail steering, ground rear-up/pivot) are recorded in PR #2 comment 6728906088, not yet implemented. No main/Pages/Building Explorer changes; hardware FPS unverified.


## November 9 — background catastrophe scales with foreground damage
Added capped `damageFraction` multiplier to `updateDistantMeteors` chapter ramp; computed from foreground neighborhood building damage, affecting distant strike cadence and streak density without uncapping existing 58-streak limit. Source-level browser QA guard added. **Exact-head QA pending**. Meteor class shootability, all background building destruction and military placement remain outstanding. Avoid racing concurrent edits.
