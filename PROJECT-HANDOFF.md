## November 9 — RC9d QA #358 legacy assertion repair (exact-head QA pending)

[Browser QA #358](https://github.com/erin6374/dragon-defense-play/actions/runs/42654962237) failed at qa/browser.mjs:617 because the **old** test expected a large splitter to survive its first hit. That contradicts the newly requested one-hit fragmentation rule. Updated the browser assertion to require the first fireball to destroy the large rock and spawn at least three targetable medium fragments. No gameplay/rendering changes in this repair; new exact-head QA must pass before certification. Detached breath emitter fix remains next.

## November 9 — RC9d fireball shatter (exact-head QA pending)

- One player fireball contact, direct or peripheral shockwave, defeats ordinary meteors. Medium meteors split into three small rocks, large meteors into three medium rocks, small meteors disappear. Final boss remains multi-hit; explicitly indestructible flags stay immune; non-player shockwaves retain original damage.
- Flaming impact shrapnel uses existing instanced particle pools. Fragmentation is capped at two generations and 48 simultaneous rocks; new fragments inherit a brief blast grace. Reuses cached rock meshes and materials.
- Version 5.4.0-rc.9.3 / 5.4-fireball-shatter-rc09d; deterministic QA assertions added. **Exact-head browser QA and preview verification still required.** Detached dragon breath remains next priority. No production, main, Building Explorer, or licensed FBX changes.

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

## November 9 — Rubble silhouette revision pending exact-head QA

[QA #348](https://github.com/erin6374/dragon-defense-play/actions/runs/42602631839) passed on `26cffc2`, including collapse and restart assertions. The artifact's `06d` image still looked like a flattened slab. The latest development revision narrows the folded roof and staggers three taller wall fragments in the existing instanced batch, with stricter browser checks. Verify the latest branch commit's GitHub Actions result and inspect `06c`/`06d` before certifying. No production or Building Explorer changes, no European Dragon FBX import, no real GPU FPS claim.

## November 9 — Distant roof collapse silhouette (exact-head QA pending)

- [QA #347](https://github.com/erin6374/dragon-defense-play/actions/runs/42594805121) passed for `3c5f374`. Visual inspection of `06d-distant-building-rubble.png` showed the intact full-size black roof masking the three new facade fragments.
- During collapse the existing instanced roof now contracts in width/depth, shifts sideways, and cants into the debris; the intact and restart transforms remain unchanged. No new geometry, draw calls, coordinates, gameplay hitboxes or per-frame allocations.
- Browser QA now checks roof width, depth, tilt and restart alongside the existing rubble screenshot. **New exact-head QA and screenshot review required before certification.** Real GPU performance unverified.

## November 9 — Distant facade debris checkpoint (QA pending)

Distant collapse now uses three instanced wall fragments per building to break up the flat slab silhouette. One shared rubble mesh per distance tier is hidden until needed, and restart clears all fragments. Inspect `06c-distant-building-before.png` and `06d-distant-building-rubble.png` in the exact-head QA artifact; compare actual draw calls and confirm the pieces read as rubble rather than flying blocks. The source-level change does not alter building placement, collision or gameplay. **Do not claim this visual pass certified until exact-head browser QA succeeds.**

## Street-center deployment and neighborhood barrage (November 9)

Military vehicles stage at Broad Street world Z=24, between the inner lane centers at Z=20 and Z=27. The player can shoot every foreground meteor, including the fast flaming subtype. Scenic meteors can hit the structural back blocks and the instanced far rows. Near-empty block health raises strike cadence, volley size and strength. Use `06e-zero-block-background-fire.png` for the zero-gauge collapse and fire capture. Restart clears the falling streaks, rubble, fire and smoke.

## Distant city collapse checkpoint (November 9)

The long-range city in `src/rendering/distant-neighborhood.js` records which instances belong to each building, including fringe buildings. Distant strikes accumulate damage on the nearest eligible building. A fall compresses the shell, drops and tilts its roof slab, and lowers the smoke toward the rubble. Existing facade batches are reused, eight falls may be active at once, and impact and ambient smoke share a 28-sprite cap. Restart restores the original instance transforms. Compare `06c-distant-building-before.png` and `06d-distant-building-rubble.png` from the exact-head QA artifact.

The wave-13 military placement audit measures the real hull footprints against the building bounds, cross streets, and Broad Street sidewalk. Use `militaryPlacement` in the browser report and `07a-military-placement-scene.png` for a view without HUD overlays. Placement remains at the existing sites until a relocation target is defined.

## Foreground meteor class checkpoint (November 9)

The `fastImpact` spawn flag is separate from the ordinary flaming material and the dragon-hunter behavior. Direct fireball and blast damage check the flag. Fast impact meteors use existing foreground targets and damage handling, plus the existing capped ember pool. Distant skyline sprites live outside the playable meteor list.

## Distant disaster cadence checkpoint (November 9)

The distant meteor and background damage timers are reset with the rest of the game. The browser fixture stages intact and heavily damaged foreground buildings at the same wave and checks that the actual scheduler spawns streaks more frequently and shortens the interval between skyline strikes. The fixture restarts the game before ordinary QA resumes.

## Paulo flight silhouette checkpoint (November 9)

The shared procedural rig in `src/dragon/paulo-rig.js` folds the knees further and sweeps the hips back as the legs approach full tuck. The existing hover pose and 0.6-second takeoff and landing windows are preserved. The browser suite checks the position of all four claw tips in torso space and saves side-view flight and glide captures. Use the browser QA run for the exact commit when packaging a preview.

## Grounded Paulo turning checkpoint (November 9)

Prior head `3ba3948` passed QA #318. Added `ground-turn` intent for perched/inactive direction changes, a 0.8s rear-up and directional pivot in the procedural rig, browser regression assertions and `17-paulo-ground-turn-side.png`. The gameplay parent retains control of facing/hitboxes; this animation only anticipates the reversal. New exact-head QA and visual review pending. The licensed European Dragon FBX is still not in GitHub. Production and Building Explorer unchanged.

## QA #317 banking-pitch regression repair (November 8 late night)

The full browser job on `2e67ecf` failed at `qa/browser.mjs:1345` because the old bank-pose test asserted zero pitch, incompatible with the newly added deliberate shallow nose-down pitch. The repair changes only the browser assertion to require a small, direction-symmetric negative pitch; the existing yaw/head-lead/roll assertions remain. New exact-head QA is required before preview certification. No model binaries imported, no gameplay or production edits.

## Latest coordinated bank steering checkpoint (November 8 late night)

QA #316 passed for prior commit `533ad4e`. A new visual-only Paulo banking pass adds signed body yaw, a shallow nose-down pitch and head-leading yaw, with browser assertions for mirrored turns. New exact-head QA pending. Existing wind physics and original/new model toggle are preserved. Ground rear-up turning is still outstanding, as is integration of the licensed European Dragon asset. No real GPU validation or production changes.

# Dragon Defense — Project Handoff

## Latest landing airbrake checkpoint (November 8 night)

QA #315 passed for commit `82a8f4d` and produced a Windows preview and browser QA artifact. The next change adds an eagle-inspired landing wing flare to the procedural Paulo rig, with joint assertions and a new screenshot. Exact-head QA is pending. Ground rear-up turning and the licensed European Dragon binary remain outstanding. Do not touch main or Building Explorer.

## Current animation checkpoint (November 8)

The procedural Paulo visual rig has a new eagle-inspired leg-tuck pass (flight/glide/bank fully tucked; hover partly tucked; takeoff/landing transitions), signed bank roll and tail steering. Exact-head browser QA is pending. The licensed European Dragon binary has **not** been imported. Original/new procedural toggle is already public and QA #314 passed before this change. Ground rear-up turning remains a separate animation task. See `CONTINUE-IN-CHATGPT.md` and `CHANGELOG.md` for commit status.


Updated November 7, 2026. Read this before changing code.

## Street gale playtest

On the feature branch, hold the primary fire control for at least 0.7 seconds, aim along Broad Street and release. Aim against approaching traffic to see buses and trucks slide backward. Try a gust from the school frontage to see the sidewalk planting bend and the dust spiral across the road. Tap to fire, and use the existing gas control independently. Wind recharges in four seconds.

Street cone and impulse tuning live in `src/simulation/ground-wind.js`. The ground projection and the two debris pools are in `src/game.js`. `src/rendering/wind-planting.js` bends existing tree and shrub geometry and restores its rest pose after the gust. Use the browser QA run for the preview’s exact commit and download the artifact labeled `RC9c_Wind_Windows_Preview`.

## 1. Project overview and core concept

**Tech Freire: Dragon Defense** is a browser action-defense game set around TECH Freire Charter School at 2221 North Broad Street, Philadelphia. The player controls a dragon, intercepts incoming meteors, protects the school and surrounding city, and progresses through waves and campaign chapters. Traffic, pedestrians, emergency vehicles, helicopters, fire, structural damage and building collapse animate the district. The current task is a major graphics overhaul, preserving existing gameplay and the separate Building Explorer project.

**Platform and stack:** static HTML/CSS, vanilla JavaScript ES modules, Three.js/WebGL, local vendor libraries and FBXLoader. No application bundler or package.json is required to serve the game. Node.js and Playwright are used for QA. GitHub Pages serves production. Browser assets include the original school FBX and procedural/material textures. Desktop and touch/mobile controls exist; mobile hardware performance is not established.

**Visual goal:** real 3D midground city blocks, modest near-foreground parallax, distant recognizable Philadelphia landmarks, accurate school facade/atrium and surroundings, realistic lighting/materials/vehicles, and cinematic distant meteor destruction. The attached cinematic mockup is the artistic target, not a surveyed panorama. The current game remains substantially more stylized than that target.

## 2. Authoritative repository and state

- Repository: https://github.com/erin6374/dragon-defense-play
- Branch: `feature/north-broad-graphics`
- Existing draft PR: https://github.com/erin6374/dragon-defense-play/pull/2
- Source checkpoint at handoff preparation: `413bf65` (reference documentation); last rendering change: `cad2e97`.
- Last inspected production main: `edc333709757933903c70e2bef93c2e439507059`, v5.2.3. Recheck remote before assuming it is unchanged.
- Overhaul declares version `5.3.0`, build `5.3-north-broad-01`. That build string was NOT advanced for each follow-up; use commit SHA to distinguish revisions.
- Workspace: `C:\Users\Tech-Erin\Documents\ChatGPT\TECH FREIRE Building Projects\dragon-defense-play`.
- No overhaul merge or production deployment has been performed. Do not confuse a pushed draft PR or ZIP with deployed production.

Recent work, oldest first: `b6fa2cb` headlights and distant-impact alignment; `bc3bf27` review evidence; `b71bb6a` physical school materials/translucent glazing; `2fed106` warm meteor cores; `ed6ae9d` cloud refinement/bookmark; `cad2e97` skyline curtain-wall texture refinement; `413bf65` recovered reference sources.

## 3. Architecture and directory map

```text
index.html                       UI, styling, import map, application entry
build-info.json                  release metadata
sw.js / manifest.webmanifest     service worker / install metadata
model-inspector.html             source-model inspection view
assets/tech-freire-original.fbx   original school source asset
assets/visuals/                  material and effect textures
vendor/                         browser libraries and Three.js addons
campaign/                       campaign pages and visual_target.png
src/game.js                     main orchestration, state, entities, rendering loop, QA bridge
src/neighborhood.js             neighborhood construction and city coordination
src/architectural-voxels.js      architectural voxel representation
src/core/                       timestep, balance, diagnostics, build IDs, capture tools
src/input/actions.js            input action definitions and input state
src/simulation/                 traffic, lanes, impacts, structures, chapter/event logic
src/rendering/                  source batching, geometry, materials, effects, quality control
qa/browser.mjs                  full browser regression and screenshot suite
qa/local.mjs                    local server + browser suite launcher
qa/review/                      committed screenshots and JSON test reports
qa/dashboard/index.html         public QA viewer
qa-output/                     local generated QA artifacts (gitignored)
.github/workflows/browser-qa.yml PR browser QA
.github/workflows/pages.yml      gated Pages publishing
CHANGELOG.md                    implementation history
CONTINUE-IN-CHATGPT.md           compact migration bookmark
qa/CONTINUATION-STATUS.md         earlier detailed status; later changes supersede parts
```

### Main relationships and state

`src/game.js` is a large module, not a class-oriented application. Module-scoped mutable state holds wave/score/health, active and paused status, dragon state, scene/camera/renderer, and arrays of cars, meteors, projectiles, debris and effects. UI listeners feed input state and production game functions. A fixed-step helper drives simulation; rendering and adaptive resolution run through the animation loop. Do not casually split this module without tracing initialization order and closures.

- `createFixedStep`: bounded simulation steps; `AdaptiveFramebuffer`, `AdaptiveQuality`, and visual presets control rendering pressure.
- `createDestructibleSchool`: pieces with position, dimensions, material kind, integrity, falling/resting state and velocities; instanced material batches; `impact`, `collapse`, `update`, `reset`, `stats`.
- `fitSchoolFromFacade`, `classifyArchitecturalMesh`, `SCHOOL_SOURCE`, `SCHOOL_TARGET`: source axis/scale/placement and partition of school versus independent flanking buildings.
- `batchSchoolSource`: preserves selected source triangles and batches compatible meshes by material/attribute format. Neutral source materials now become MeshStandardMaterial, with rough masonry, metallic trim and translucent glazing.
- `createSchoolSourceDamage`: world-space 3D damage texture, shader discard/scorch, `stamp`, `patch`, `reset`, `strikes`. Preserves local holes rather than mirroring damage across the building.
- Intact school uses the source FBX surface; damage simulation supplies detached pieces. Terminal collapse hands off to approximate reconstructed geometry. Do not replace this with a second overlapping intact shell.
- `createPhiladelphiaSkyline`: geometry landmark profiles with cached facade/emissive maps, beacons and damage visuals. Placement is artistic/compressed, not surveyed.
- `createCinematicSky`: fullscreen shader gradient, layered procedural clouds, sun/moon/stars and phase/darkness uniforms.
- `buildRoadVehicle` creates chassis/detail meshes; `batchVehicleVisuals` consolidates static parts. Steering pivots, brakes, beacons and headlight road pools must remain independently controllable.
- `setRoadVehicleNight` controls emissive headlights and road-pool visibility. Pools add one transparent draw per lit moving vehicle, no dynamic light slot. Cars use pooled roots, routes, desired/current speeds, lane positions and emergency/service state.
- `updateDistantMeteors`: skyline-local streaks; transforms impact positions through `skyline.localToWorld` before scene-space explosions. Shared flash geometry must not be disposed when one effect expires.
- `createStableLightPool`, `InstancedParticlePool`, static BIM/prop batching and vehicle pooling reduce allocation and draw overhead.
- Diagnostics: `window.__DD_PERF`, `__DD_GAME_METRICS`, frame-health and performance/capture labs. `window.__DD_QA` exists only with `?qa=1`; its helpers call production functions rather than a mock renderer.

## 4. Complete code delivery

The accompanying source ZIP contains ALL tracked files at this checkpoint, including the complete `src/game.js`, modules, UI, workflows, vendor libraries, school FBX, textures, campaign and committed QA evidence. Nothing critical is replaced by a placeholder.

`Dragon-Defense-Critical-Source.md`, supplied separately, contains verbatim complete text for the foundation files, every file under `src/`, QA scripts and workflows. This is deliberately separate from this readable handoff. Binary assets and vendor libraries are supplied in the ZIP rather than pasted into Markdown. Local `qa-output/`, Git history, installed Node/browser dependencies, and the separate Building Explorer are not included by `git archive`.

Use actual source files, not snippets copied from an older conversation. Read `index.html`, `src/game.js`, `src/neighborhood.js`, source-fit/batching/damage modules, then the subsystem relevant to the next task.

## 5. Implemented versus pending

### Verified locally

Perspective gameplay camera; fixed world-space streets/neighborhood through both pan directions; modest foreground offset; source school bounds and triangle fidelity; exterior masonry probes; localized meteor damage; total collapse, settled rubble and restart. Full Playwright runs also cover startup, dusk and day/night vehicle-light visibility. Latest skyline pass completed locally with no recorded browser errors. Review the JSON for exact counters and warnings.

Real captures: `qa/review/skyline-day.png`, `sky-dusk.png`, `school-glazing.png`, `night.png`, `dusk.png`. Matching stage reports: `skyline-report.json`, `sky-report.json`, `glazing-report.json`, `meteor-report.json`. Older screenshots are evidence for their respective commits, not interchangeable latest-state snapshots.

### Implemented but not fully validated

Physical school materials/translucent glazing reveal existing source interiors, but accurate atrium appearance is unverified. Philadelphia silhouettes are recognizable, but materials remain stylized and landmark bearings are artistically composed. Distant effects have coordinate/lifetime fixes and warm cores, but no sustained cinematic disaster review establishes parity with the mockup. Traffic/emergency/gameplay systems predate this pass; the graphics suite is not exhaustive campaign coverage.

### Unfinished or known limitations

- Photorealistic/near-photorealistic target has NOT been reached.
- Real atrium geometry, facade colors/details, individual adjacent parcels and geography need photo/map comparison.
- HUD/buttons obscure much of the street at 1024×576. Captures hiding only direct body children can leave the radar canvas visible.
- Hardware and mobile frame rates remain unverified. Software WebGL samples around 0.8–1.4 FPS cannot be presented as normal device performance or an optimization benchmark. Counts vary with evolving traffic and effects; no controlled speedup was established.
- `qa/CONTINUATION-STATUS.md` has historical statements about unavailable references and opaque glazing. The references below and later changelog entries supersede those statements.
- Latest remote CI status must be queried. Earlier commits passed GitHub CI, but do not assume every new head has completed it.

### Immediate next three tasks

1. Inspect the supplied mockup and architect exterior/lobby photographs; inspect public map/street imagery for 2221 North Broad. Record concrete differences and fix the school/atrium and immediate surroundings without distorting source scale or duplicating geometry.
2. Make a substantial visual pass toward the mockup: coherent dusk composition, readable warm interiors, richer masonry/street materials, better vehicles and controlled distant disaster staging. Capture matched before/after scenes; avoid treating tiny parameter changes as completion of the overhaul.
3. Run browser QA and meaningful controlled performance comparisons, inspect screenshots, update changelog/bookmark, and refresh a clearly labeled release candidate. Merge/deploy only after checks and visual acceptance criteria pass.

## 6. References and visual direction

User-supplied image: `H:\Downloads\1.Dragons Defence\Archive\Dragon Defense on North Broad Street.png`. The chat attachment shows a purple/gold dragon, warm window interiors, detailed masonry rowhouses, Philadelphia landmarks at dusk, wet-looking street reflections, foreground shrubs, traffic/emergency lights, and cinematic meteors/fire/smoke. It is the visual target; its buildings and geography are not automatically factual.

The user does NOT have Street View screenshots and explicitly instructed the agent to research the address. Do not ask again for those screenshots.

- Architect's public exterior/interior project gallery: https://cicadaphiladelphia.squarespace.com/education/tech-freire
- Address/project record: https://www.architectmagazine.com/project-gallery/tech-freire-charter-school/
- Project history: https://www.northstarmuseumseducation.com/project/freire-charter-schools

Research located these sources and confirmed the school's address and the architect's description of tall ceilings, generous column bays, large Broad Street windows and soaring lobby. Detailed visual inspection and parcel/map calibration were NOT completed. Some direct photo requests returned cache misses; the gallery itself was accessible. Do not claim Street View was inspected.

`campaign/visual_target.png` is already in the repository, but was not compared to the newly attached mockup in this session. Inspect it before assuming they are the same image. External photos are reference material, not assets licensed for redistribution.

## 7. Running and testing

Serve the repository over HTTP; do not rely on opening index.html via file URLs. A simple Python server is sufficient for manual play. For automated tests, run from the repository root:

```powershell
$env:PLAYWRIGHT_MODULE='C:\Users\Tech-Erin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright-core\index.mjs'
$env:QA_BROWSER_EXECUTABLE='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
node qa/local.mjs
```

`qa/local.mjs` serves port 8767, invokes the full suite, then closes the server. It avoids separate-process preview connection problems. Browser uses SwiftShader software rendering. On another machine install Playwright/Chrome and adjust environment paths. CI installs playwright-core 1.56.1 and uses installed Google Chrome on Ubuntu.

Windows required an accessible TEMP/TMP location for browser profiles and approved local-network execution. A working profile directory was `C:\Users\Tech-Erin\.codex\visualizations\2026\11\07\01a1b41e-f945-7783-b924-e8cc90907839`. Several Windows Security blocks affected distinct executables (shell copying, Node screenshot writes, patch tool edits); user cleared them individually. If a new block occurs, ask the user to allow that specific action. Do not disable security or repeatedly reroute around it.

Run `git diff --check` and relevant `node --check` commands. QA output includes screenshots and report.json. A stale report after interruption is not proof of a successful new run; verify process exit and report timestamp. In this session successful Playwright runs generally took minutes with no streaming output.

## 8. Constraints, conventions and release policy

- Preserve separate Building Explorer; no work was done to that project.
- Keep city midground in real world coordinates. Decorative parallax is limited to foreground and distant composition.
- Preserve original source model and uniform fit; avoid per-axis stretching and moving neighboring rowhouses into the school group.
- Preserve shader damage behavior when modifying materials. Source batching and negative-transform winding correction are important.
- Share geometry/materials where appropriate; do not dispose resources shared by live effects. Avoid extra shadow-casting dynamic lights for decorative effects.
- Static-hosting compatible ES modules; no new server dependency in production.
- Main push triggers Pages workflow after browser QA and published-file checks. Existing PR is draft; no production deploy in this session.
- User wants sustained progress, not repeated stops asking to continue. Reserve resources for final tests, source packaging and the carry-over bookmark. Earlier packaging was premature; ZIPs are explicitly interim previews until the overhaul is complete.
- Do not claim access to an exact resource meter if unavailable. The user reported seeing 37% remaining; that is not an independently measured budget.
- No extra agents were used. No skill mandated delegation.

## 9. Resume checklist

1. Read this file and current changelog; inspect git status, remote branch/PR and CI before editing.
2. Open the mockup and public photo references. Source accuracy is now researchable; missing user Street View uploads are not a reason to stop.
3. Continue the three tasks above. Preserve existing verified gameplay and source geometry.
4. Update the bookmark, publish tested changes to the existing PR, and package the latest verified source before ending the session.

If the next model is regular ChatGPT without execution tools, upload the source ZIP and this document. It can review and propose code but must not claim it ran tests, committed, or deployed without those capabilities.


### November 8 RC9c QA visual-capture finding

The exact-head #306 browser job passed its QA assertions and saved a QA artifact, but the workflow ended **cancelled** during the second (Windows preview) artifact finalization after GitHub's artifact service returned invalid JSON. Actual `06b-high-wave-disaster-glow*.png` screenshots showed the chapter cinematic overlay, **not** the skyline: staging wave 15 automatically opens the chapter cinematic. The QA correction dismisses the cinematic through existing QA-only `closeCinematic()`, asserts it is hidden and the game unpaused, and retains wave-7 restoration. Windows preview workflow label was also corrected from stale RC9b to RC9c. Inspect fresh exact-head QA and high-wave screenshots before accepting the visual effect. New user requests (3D first-hit targeting, 7-second military gas disable, windstorm, chapter-only dragon roof respawn, contact impulses) are recorded in PR #2 comment 6726406282; none are implemented in this QA-only patch.
