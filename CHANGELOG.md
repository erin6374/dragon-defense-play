# Dragon Defense v5.3.0 — North Broad Street

## Continuation — stable meteor impact flash during skyline collapse

- Fixed a visual anchoring inconsistency: the short-lived skyline meteor impact flash was still parented to the damaged tower, so an impact that triggered structural collapse could cause the visible flash to shrink or move with the facade. The explosion's reported contact point and persistent smoke were already world-space anchored.
- Reparented the preallocated flash sprite to the stable skyline group, retaining its existing shared effect material, opacity fade and geometry budget. The original local facade contact point is cached separately for later strikes and scorch marks. At strike time, a copy of its pre-collapse world contact point is converted into skyline-local sprite coordinates before the tower changes transform.
- Updated existing world-position QA probes to use the unchanged local facade contact, and added browser assertions that the flash coincides with the returned meteor contact and remains fixed in world space across a synchronous tower collapse. The smoke/scorch mechanics, school gameplay and collision rules are unchanged.
- This change is on draft PR #2 only. New browser QA, subjective appearance and hardware performance remain unverified.


## Continuation — stable meteor contact point during skyline collapse

- Corrected a source-confirmed coordinate ordering issue: `strikeNearest` previously calculated the world-space explosion position *after* `setDamage` shrank or tilted the struck skyscraper. The meteor burst could therefore appear at a displaced facade location on the very strike that caused collapse.
- Capture the world-space contact point before applying tower damage, and return that preserved position for the existing cinematic explosion. Smoke/scorch placement, collapse behavior, object counts and foreground health are unchanged.
- Added a deterministic six-strike browser regression: for each subsequent strike, the returned explosion position must equal the pre-damage facade contact point. The test also requires at least one impact to actually move the facade, so the check cannot pass vacuously.
- Prior head `f5fcb28` passed browser QA run #119. **New code remains unverified until its own browser QA completes.** This is a coordinate-correctness fix, not a hardware performance claim. No merge/deploy or Building Explorer edits.


## Continuation — immediate smoke and stable-position regression

- Moved the skyline smoke sprite's visibility toggle into the meteor strike handler. The plume appears in the impact event itself, without waiting for a subsequent animation update; damaged towers no longer repeat that visibility assignment every frame.
- The smoke still drifts in its existing skyline-space coordinates, uses the same one-sprite budget, and is hidden on restart.
- Browser QA now checks visibility **before** the next update and compares smoke world positions immediately before and after a forced tower collapse in one synchronous probe. This closes a coverage gap: checking parent identity and world scale alone could miss unwanted translation.
- Previous head `f136f6c` passed GitHub browser QA run #114. This new change remains unverified until a fresh PR-head run passes. No measured hardware performance or cinematic-fidelity claim; production and Building Explorer unchanged.


## Continuation — damage-triggered skyline smoke updates

- Removed redundant per-frame smoke `Sprite.scale.set` and `SpriteMaterial.opacity` writes from `philadelphia-geometry-skyline.js`. The width/opacity depend only on the accumulated strike damage, so they are now assigned once in `strikeNearest`; per-frame animation still updates the floating smoke position.
- All nine skyline towers retain the same one-sprite-per-landmark budget, damage intensity curve, wind-like drift and reset behavior. No additional textures or lights.
- Expanded the existing six-hit meteor cascade browser regression to confirm the plume grows with early additional impacts, its size/opacity never decrease as hits accumulate, and the foreground health remains unchanged.
- This is a source-level per-frame work reduction only. Actual CPU/GPU performance and visual similarity have not been measured; fresh browser QA is pending. Production and the separate Building Explorer were not changed.


## Continuation — independent post-impact skyline smoke

- Corrected a visual hierarchy issue: persistent skyscraper smoke had been parented to the tower group, so a collapsing facade's vertical scale also compressed the smoke plume.
- Smoke remains one preallocated sprite per landmark, but is now parented to the stable skyline group. On each strike, its origin is resolved once from the facade's world transform into skyline coordinates. Subsequent subtle smoke drift uses that stable origin while the tower collapses.
- Added a browser regression that checks smoke remains visible and that its world-space scale does not change when the tower shrinks. This does not change local meteor collisions, gameplay, school destruction or production.
- Latest software-WebGL QA is pending. Actual visual quality and hardware FPS remain unverified.


## Continuation — freeze fully settled skyline rubble (November 7)

- Confirmed `feature/north-broad-graphics` was identical to previous handoff `90194fc`; browser QA **run #101 passed**, verifying the earlier intact-skyline flicker change.
- The skyline `update()` path kept advancing `fallElapsed` and recalculating rotations, matrices and ground support heights for every facade slab **indefinitely after landing**. This is avoidable per-frame CPU work when several distant towers have collapsed.
- Each tower now tracks `fallSettled`, set only after all three slabs have completed rotation and reached their supported ground heights. Once settled, subsequent frames skip the slab transform loop. `fallActive` remains true to preserve the semantic "collapse occurred" state; restart clears both flags and restores the initial slab poses. No materials, physics trajectories or geometry were changed.
- Added browser regression that advances the already-settled skyline by another two simulated seconds and asserts `fallElapsed` and slab heights remain unchanged. Gameplay source commit `20f8757`, regression commit `f1be956`. **Fresh QA must pass for this change to be verified.** This is a source-level optimization only; no measured CPU time, hardware FPS, GPU gains or screenshot fidelity claims. No production main, Building Explorer, merge, deployment or packaging changes.


## Continuation — skip intact skyline electrical flicker work (November 7)

- Before editing, confirmed branch was identical to `7e2805d` and GitHub browser QA run #96 had **passed**, verifying the previous touch-aiming regression. No competing commits were present.
- In `src/rendering/philadelphia-geometry-skyline.js`, the per-frame skyline update evaluated a `Math.sin` and `Math.pow` flicker pulse for **every tower**, even though an intact tower has `collapse=0` and therefore cannot visually flicker. The update now skips the pulse calculation for intact towers, retaining the exact original formula for damaged towers. Nine skyline landmarks exist in the current geometry configuration; this reduces unnecessary work on intact frames, but **no CPU time, GPU time, hardware FPS or power savings have been measured**.
- Added a reversible, QA-only emissive sampling probe and browser assertions that intact dusk-window emission stays steady while a damaged tower retains varying electrical flicker. The probe restores the live animation time and does not advance fall physics.
- Source optimization commit `9851093`, QA probe `239aa25`, regression assertions `000543c`. **Await full browser QA for the latest PR head**; source review alone is not verification. No main, Building Explorer, merge, deployment or package changes.


## Continuation — single-pass pointer aiming and touch regression (November 7)

- Confirmed GitHub browser QA run #90 passed for the prior lighting optimization; the development branch had not advanced beyond `5c82a5b` before these edits.
- Fixed a redundant `pointermove` registration: the universal pointer listener already processes touch drags, but a second touch-specific handler called `aim(e)` again on every pressed touch move. Removed the duplicate while retaining touch `pointerdown` aiming.
- Reused two scratch vectors for normalized pointer coordinates and the ray-plane intersection instead of constructing a new `THREE.Vector2` and `THREE.Vector3` on each pointer event. Intended aiming clamp and plane are unchanged.
- Added read-only `snap().aim` telemetry and browser QA coverage that dispatches left/right touch pointer moves, checks finite/clamped coordinates and directional response, and asserts there is exactly one pointermove registration.
- Gameplay source commit `7bc274a`; QA telemetry `9ab44c6`; regression check `1253e06`, corrected static regex `18e29c2`. **Current change awaits fresh PR-head browser QA.** No claim of measured hardware FPS or touchscreen-device verification; no merge, deployment, or Building Explorer changes.


## Continuation — remove per-frame lighting color allocations (November 7)

- Audited `updateNight(dt)`, which runs on the game animation path. Its unused `hazeColor` computation allocated two `THREE.Color` objects per call without affecting the scene. Removed that dead blend.
- Replaced three other `new THREE.Color(...)` calls in the sun/ambient color interpolation with immutable palette colors initialized once. The original hex values and `setHex().lerp()` order are preserved, so the intended daytime/dusk/night colors are unchanged.
- This eliminates **up to five JavaScript color-object constructions per lighting update**; it is a source-level allocation reduction, **not** a measured FPS or garbage-collection improvement. Existing browser QA includes dusk and night scene captures and vehicle-lighting checks. Await the latest PR-head workflow before treating this change as browser-verified.
- Commit `e8da884`. No changes to `main`, Building Explorer, gameplay mechanics, or deployment.


## Continuation — distant helicopter patrol wrap (November 7)

- Corrected a long-session skyline animation defect: the westbound decorative helicopter's JavaScript remainder became negative after approximately five minutes, allowing it to leave its intended 170-unit patrol interval. The orbit remainder is now normalized to a nonnegative value before applying the helicopter's x-offset.
- Added a QA-only, reversible helicopter-position sampler for 0, 300, 600, and 1,200 simulated seconds; browser QA checks all three distant helicopter positions stay finite and within their original patrol bounds. The sampler restores the current animation time and does not simulate foreground combat.
- This is a cosmetic background-traffic correction, not a gameplay, camera, GPU optimization, or real-world flight-path change. New browser QA is **pending**; no hardware FPS or cinematic fidelity claim.


## Continuation — skyline aftermath restart regression (November 7)

- Extended the existing read-only skyline QA state snapshot to expose strike damage, collapse fraction, height scale, and the visibility of meteor flash, smoke, and scorch effects.
- After the six-hit distant meteor cascade, browser QA now starts a new level and asserts that accumulated damage, falling rubble, impact flash, smoke, and scorch have all reset. Captures a dedicated `06-skyline-after-restart.png` renderer screenshot.
- No gameplay, rendering or production behavior was changed; this closes a missing automated check for the newly added cumulative disaster effect.
- Commits `8c8b7ac` and `7a8b004`. Full browser QA for this addition **pending**; no hardware FPS or visual-fidelity claim.


## Continuation — distant disaster independent of foreground health

- Cumulative distant meteor impacts now contribute **0.07** local structural damage per strike (capped at **0.90**) to their targeted skyline landmark, rather than **0.018** capped at **0.28**. Repeated impacts can therefore trigger facade breakup and persistent rubble even if the school and neighborhood are unharmed.
- A hit immediately reevaluates the existing landmark collapse state; no new meshes, physics systems, or foreground gameplay damage were introduced.
- Browser QA now stages six consecutive hits on Comcast Technology Center, verifies visible rubble and active facade fall, and asserts that the foreground health does not change. A dedicated skyline screenshot is captured.
- **Verification:** QA run #68 failed an existing release-height assertion because the new six-hit test had already started a tower fall before the pre-existing forced-collapse scenario. The test was moved after the existing collapse/reset checks in commit `dd40f11`, isolating both scenarios. Run #71 then caught an off-by-one test setup: the reset had cleared the first hit, so the isolated test was staging only five impacts (0.35) while expecting six (0.42). Commit `b0d9f37` corrects the loop. The full browser QA **passed** on run #74 (commit `b0d9f37`) and again on run #76 (commit `f8e2f52`, then-current PR head). These are software-WebGL checks, not hardware performance or an independent visual fidelity assessment. This is a stylized background-disaster effect, not surveyed geographic realism or measured GPU performance.


## QA regression fix — malformed startup script

- GitHub QA run #61 failed its final `report.errors` assertion with `SyntaxError: Invalid or unexpected token`. The cause was literal `\\n` sequences accidentally inserted *between JavaScript statements* while revising the `index.html` launch warning. The HTML has been corrected to real statement line breaks, while message text still uses valid escaped newlines inside its string literals.
- Added a fast Node `vm.Script` syntax preflight for inline `index.html` scripts to catch this class of error immediately, before launching the expensive software-WebGL browser suite.
- The regression was real; earlier v5.3 QA success does not cover the broken commit. Fresh workflow verification is required for the fix. No changes were made to main or Building Explorer.


## Continuation — facade debris material batching

- Optimized the reusable distant skyscraper facade slab geometry: a stock box with six material groups now has its indexed triangles arranged into one five-face side-material group and one textured-front group.
- The same six faces and existing UVs remain, preserving the material distinction while reducing group/draw submission from six to two for each displayed facade slab. With three fragments on each of nine landmarks, that is a theoretical maximum reduction of 108 draw submissions when all nine towers have visible debris.
- Added browser QA assertions that the three debris sections each retain 36 indices and use exactly two geometry/material groups. This is a rendering optimization only, not a new effect or a measured FPS gain; hardware testing remains pending.


## Continuation — accurate startup diagnostics

- Corrected the on-screen startup failure message. The current v5.3 import map loads a vendored local Three.js module, not `cdn.jsdelivr.net`; the old warning incorrectly blamed CDN access and referred to a nonexistent diagnostics text file.
- When the game is opened directly using `file://`, the panel now explains the exact `PLAY-PREVIEW.cmd` and `http://127.0.0.1:8769/` workflow. For HTTP startup failures, it points to the local server directory, `src/game.js` and bundled Three.js files.
- Verified the referenced `vendor/three/build/three.module.js` and FBX loader files exist in the development branch. Browser behavior of the newly worded error path remains untested; normal browser QA is in progress.


## Continuation — reliable Windows preview startup

- Updated `PLAY-PREVIEW.cmd` to launch the v5.3 game over HTTP rather than opening `index.html` under the blocked `file://` protocol. The launcher now checks for Python 3 (`py -3` or `python`) and explains missing-runtime errors.
- Detects an already occupied port 8769 and refuses to silently display a potentially different copy of the game. Starts the server from the launcher's own folder and opens the default browser only after an HTTP 200 response.
- No gameplay, rendering, school geometry or production code changed. This is a Windows batch-file change; a Windows interactive end-to-end test has not yet been run. GitHub browser QA validates the web game but does not execute this batch file.


## Continuation — unobstructed skyline visual QA

- Reviewed run #45's actual screenshots and report. Browser QA passed without errors or warnings; the release/mid-fall/settling probes show correct numerical positions. The existing 1024 × 576 gameplay screenshots, however, place the original school and foreground buildings over the skyscrapers and cannot independently establish the skyline's appearance.
- Added a QA-only orthographic camera that renders the existing scene from in front of the distant skyline without altering the production gameplay camera or creating a substitute visual scene.
- Browser QA now captures five real PNGs: `06-skyline-intact.png`, `06-skyline-strike.png`, `06-skyline-release.png`, `06-skyline-falling.png`, and `06-skyline-rubble.png`.
- This improves evidence, not gameplay. New screenshots still require inspection and the latest workflow must pass. Hardware/mobile FPS remains unverified.


## Continuation — continuous facade release (no upward teleport)

- Corrected the first-frame collapse transition: preallocated facade slabs previously sat at ground level until the first simulation update teleported them to their high release positions. Slabs now start at their planned release heights while their rubble parent is hidden, so activation and falling are visually continuous.
- Reset restores release-height transforms as well as hiding rubble and clearing fall timers. The existing staggered fall and grounded settling are unchanged.
- Browser QA now checks release height at collapse activation, intermediate falling, settled ground contact, and restart cleanup. Visual screenshot and hardware performance verification are still pending.


## Continuation — falling skyline facade sections

- The three preallocated large facade slabs per landmark now descend in staggered gravity-like arcs once collapse begins, before settling permanently in the independent ground-level rubble group.
- The simulation clamps each falling slab to its ground elevation and advances with bounded frame delta. No runtime debris geometry is allocated.
- Game reset now restores fragment positions, rotations, fall timers, and rubble visibility.
- Added deterministic browser QA assertions for triggered collapse, mid-fall positions, settled sections and restart cleanup, plus an actual browser collapse screenshot.
- This is a stylized collapse transition, not a full structural or rigid-body simulation. The change is in draft PR #2 only; new QA results and hardware performance are unverified.


## Continuation — grounded skyline rubble and fallen facade sections

- Fixed an architectural hierarchy problem: skyline rubble was a child of the collapsing tower and therefore inherited its translation and scale. Rubble now sits in the fixed skyline group at ground elevation.
- Each of the nine landmarks now has three recognizable fallen facade slabs using one shared box geometry and existing facade-side material; the preexisting 32 instanced small rubble pieces are retained.
- The collapse update changes the slab profiles based on damage severity, without spawning objects during impacts.
- Browser QA now stages a distant skyscraper collapse, verifies the rubble remains detached and grounded, counts three slabs, and captures a real renderer screenshot.
- This is still a visual approximation, not physical rigid-body simulation. Fresh browser QA and hardware benchmark verification remain pending. No merge/deployment to production.


## Continuation — skyline facade impact marks

- Meteor hits now leave a visible scorch-and-crack overlay at the individual skyscraper impact location, persisting after the flash fades. The mark grows more pronounced as repeated strikes accumulate.
- Reuses a single 128 × 128 procedural texture and one preallocated sprite per landmark. No new meshes or textures are created per hit; at most nine mark sprites exist.
- The mark is attached to its landmark and cleared on restart. The browser QA strike test now asserts that flash, persistent smoke, and facade damage are all visible.
- Visual screenshot inspection and hardware performance remain unverified. This is a development-branch change only; production and Building Explorer are untouched.


## Continuation — persistent meteor aftermath on landmarks

- A targeted distant meteor hit now leaves a persistent, soft smoke plume on the struck skyline tower after the immediate impact flash disappears.
- Each of the nine landmarks preallocates a single smoke sprite; all share one small canvas texture, with no per-hit material or geometry allocation. Smoke intensity and width reflect accumulated strikes.
- Smoke resets when the game restarts. The deterministic Chrome QA scene now asserts both the impact flash and smoke are visible after a staged skyscraper strike.
- Automated QA, actual browser screenshot review, and hardware FPS results remain unverified for this checkpoint; no changes were deployed to main.


## Continuation — landmark-targeted distant meteor strikes

- Distant meteor streaks now trigger a strike effect on the nearest Philadelphia skyline landmark instead of always exploding in empty space at a uniform altitude.
- Each of the nine modeled landmarks has one dormant impact sprite; all sprites use a shared procedural glow atlas. Impact flashes fade in simulated time, with no per-strike GPU texture or mesh allocations.
- Each strike adds a small, capped contribution to that landmark's visual damage; existing skyline destruction progression and foreground gameplay remain separate.
- Corrected impact alignment to use each tower's fully transformed facade position, including collapse transforms.
- Added a deterministic browser QA hook to stage a strike on Comcast Technology Center, assert that tower-specific damage and the flash are active, and capture `qa-output/06-landmark-strike.png` from the running renderer. The new test outcome and hardware performance are not yet confirmed.


## Continuation — damaged skyline electrical flicker

- Damaged Philadelphia landmark facades now show irregular intermittent window illumination after dark, suggesting electrical failures during citywide meteor strikes.
- Fixed cumulative emission darkening caused by multiplying the existing material intensity on every incremental damage update. Intensity is now recomputed deterministically from current nighttime, damage and animation state.
- Uses existing tower materials and nine lightweight calculations per skyline update; no new geometry, dynamic lights or textures.
- Browser QA and actual visual review for this change remain pending. This does not change school damage, local meteor impacts, gameplay mechanics or the live production build.

## Continuation — distant rooftop architecture

- Added simple HVAC units and stair-access housings to selected rows of distant residential and commercial buildings. Geometry remains fixed to each building's roof.
- Reused the distant neighborhood's existing InstancedMesh architecture; the new rooftop material adds at most one draw batch per populated depth tier, with no per-building draw calls or per-frame update logic.
- Visual composition and browser QA are pending confirmation. Gameplay, school source geometry, collisions and the released version were not changed.

## Continuation — soft distant smoke

- Replaced the distant neighborhood's rigid black damage cones with translucent layered smoke sprites drawn from one shared 64 × 128 procedural atlas.
- Retained the same 28-marker cap and existing health-driven placement; no additional smoke objects or draw calls at an equivalent damage level.
- All smoke sprites share one texture and material. This is a visual pass only; fire damage, gameplay collisions, and school destruction remain unchanged.
- Browser screenshot review and benchmark results for these new changes are pending GitHub Actions verification.


## Continuation — baked atmospheric depth variation

- Farther residential blocks now blend their existing instanced facade colors slightly toward a muted atmospheric palette; deterministic parcel-level tonal variation reduces repeated identical fronts.
- Reuses the existing building geometry, materials, and draw batches. No additional draw calls or per-frame work are introduced by this change.
- This is an artistic distance cue, not a claim of surveyed parcel colors or geographic accuracy. Browser visual QA and hardware performance remain to be reviewed for this change.


## Continuation — vehicle lighting and distant impact alignment

- Continued the existing `feature/north-broad-graphics` branch and draft PR #2, rather than repeating its world-space neighborhood and camera changes. Main remains at `edc3337`; its Pages workflow succeeded. No production rollout is included here.
- Added dusk-sensitive vehicle headlight emission and feathered road illumination that follows the chassis through turns. Road pools use one transparent draw per lit moving vehicle and no additional dynamic lights. Daylight and parked vehicles do not draw road pools.
- Convert skyline-local meteor positions to world coordinates before placing distant impact flashes. This keeps explosions aligned with the visible descending streaks as the camera follows the player.
- Retain the shared distant-flash geometry when individual flashes expire, avoiding repeated disposal and GPU re-upload of geometry still used by other flashes.
- Added browser checks for daylight/night road illumination, clean canvas captures, and a local QA launcher that starts and closes its own preview server.

Verification and remaining visual limitations are documented in `qa/CONTINUATION-STATUS.md`. Building Explorer remains separate; no files in its project were changed.

This release builds on v5.2.3 (`edc333709757933903c70e2bef93c2e439507059`).

- Switched the gameplay view to a perspective camera. Streets, neighboring buildings and the school stay in fixed world coordinates while the camera follows the dragon. Only the distant skyline and low foreground planting use decorative offsets.
- Restored depth testing for the dragon and added a transition from the rooftop perch to the street flight lane. The school still uses the original FBX geometry and its existing localized damage and collapse paths.
- Reworked the Broad Street lane markings, crosswalks and vacant lot. Connected the two cross streets to the deeper street grid and extended the geometry visible past both intersections.
- Tuned school brick and window colors against the Street View frontage. Added world-space masonry courses to the source façade. Reframed the Liberty Place, Comcast and City Hall silhouettes against a deeper sky with varied façade lighting.
- Suppressed empty broken-building batches until they contain debris. Distant neighborhood batches can now be culled as the camera pans.

## Reference decisions

The eight supplied Street View screenshots were used for the window-bank proportions, contrasting adjoining buildings, vacant lot and street markings. The supplied cinematic mockup guided the camera height, distant landmark order, dusk palette and foreground planting. Philadelphia's [address geocoder](https://api.phila.gov/ais/v1/search/2221%20N%20BROAD%20ST) and [building footprints](https://opendataphilly.org/datasets/building-footprints/) confirm the site and the approximate school height (89 ft, about 27 m). The [project architect's photographs](https://cicadaphiladelphia.squarespace.com/education/tech-freire) document the high front lobby and glazing. The [Comcast campus photographs](https://www.visitphilly.com/things-to-do/attractions/comcast-center-campus/) informed the two tower silhouettes.

The district uses a compressed game-space street grid. The far skyline is a composed landmark view and the west-side planting is set dressing. The source geometry still provides the main façade and original openings. The visual fidelity of the double-height interior, vehicle lighting and individual parcels requires separate visual verification.

## School glazing follow-up

The neutral source materials now use rough masonry, metallic trim, and translucent glazing. Actual source interior geometry is visible through the windows. Source geometry, exterior probes, localized damage, collapse, restart, camera pans and night lighting passed the full local Playwright suite. Atrium fidelity to the original photographs remains unverified.


## Distant meteor lighting

Warm incandescent meteor heads replace blue-gray cores while retaining the atmospheric smoke trail. Full local browser QA passed; cinematic composition remains subject to visual review.


## Atmospheric sky refinement

Five cloud-noise scales replace the coarse cloud pattern, with softer coverage and restrained warm dusk edges. No additional scene geometry. Full local Playwright QA passed; actual dusk capture is in qa/review/sky-dusk.png. Carry-over context is in CONTINUE-IN-CHATGPT.md.


## Skyline curtain-wall materials

Comcast, Liberty Place and glass towers use larger glazing panels, restrained pane variation and broad baked sky reflections. No extra textures or draw calls. Full local browser QA passed; skyline-day.png and skyline-report.json record the result.


## Interior night lighting

Night emission now emphasizes retained source interior surfaces while glass emission is subdued. No new geometry or lights. Full local browser QA passed; actual capture is qa/review/interior-night.png. This is a presentation improvement, not a verified atrium reconstruction.


## Grounded tower collapse and playable preview

All collapsing landmarks now shorten above the ground datum; tilted profiles lift their lower corner rather than sinking below the street. Full local QA passed and the rubble screenshot was inspected. PLAY-PREVIEW.cmd serves the development build on localhost:8769 using Python.


## Falling facade panels

Fragments now use upright architectural proportions and the tower facade material, rotating toward a resting pose. Ground support uses the full rotated box extent. Full local browser regression passed. Hardware cost remains unverified.

