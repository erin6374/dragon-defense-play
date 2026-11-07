# Dragon Defense v5.3.0 — North Broad Street

## Continuation — distant disaster independent of foreground health

- Cumulative distant meteor impacts now contribute **0.07** local structural damage per strike (capped at **0.90**) to their targeted skyline landmark, rather than **0.018** capped at **0.28**. Repeated impacts can therefore trigger facade breakup and persistent rubble even if the school and neighborhood are unharmed.
- A hit immediately reevaluates the existing landmark collapse state; no new meshes, physics systems, or foreground gameplay damage were introduced.
- Browser QA now stages six consecutive hits on Comcast Technology Center, verifies visible rubble and active facade fall, and asserts that the foreground health does not change. A dedicated skyline screenshot is captured.
- **Verification:** the code and regression test have been committed, but the updated browser workflow result must be checked before declaring this change verified. This is a stylized background-disaster effect, not surveyed geographic realism or measured GPU performance.


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

