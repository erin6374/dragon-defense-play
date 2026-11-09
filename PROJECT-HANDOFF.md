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
