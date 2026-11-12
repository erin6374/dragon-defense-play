## November 12 — RC31 performance and visible-impact repair candidate

User reports RC30 is a slideshow and background/skyscraper fires start randomly. Treat this as a blocking regression; RC30 automated success did NOT establish playable hardware performance. Source inspection confirmed a timer-only `cinematicSkyExplosion` path remained in `updateDistantMeteors`, despite earlier causality claims. Also skyline streaks struck the nearest tower at a Y threshold rather than reaching the actual contact.

RC31 removes timer-only bursts. Skyline meteors now resolve a non-mutating facade target before flight and interpolate to that exact contact over 2–2.8s; only arrival can call `strikeNearest`. Residential approaches are extended from .82s/31 units to 1.8s/70 units for visible warning. Existing impacts still trigger fire/spread. QA zero-block fixture advances through the actual new travel duration.

Performance: drawing buffer now has explicit pixel budgets (Balanced 1280×720, Mobile 960×540, Cinematic 1920×1080) while CSS size/aspect and adaptive scaling remain. At 4K, Balanced pixel work drops from ~7.64M to <=.922M pixels; this is a pixel-count bound, NOT an FPS claim. Empty combustion pools are hidden, instance ranges stop at the final active source, and inactive particle vertices exit before noise/animation work. Fixed capacity and source indices remain unchanged. Actual-Three local tests PASS for empty, sparse, reused, cleared and reset pools; pixel budgets tested at 720p/1080p/4K/portrait. JavaScript syntax/diff pass.

Runtime/visual acceptance PENDING: exact-head browser shader compilation and positive impact tests, five-view images, long gameplay and fire recordings, packaged hashes/CRC. Need actual hardware FPS before declaring the slideshow fixed. Preserve pending prior long-motion jobs. Do not release or mark art accepted. Main, Pages, production, Building Explorer and original FBX untouched.

## November 11 — RC19 whole-scene cinematic candidate

User requested a whole-game cinematic review against the attached mockup, Street View and Maps images. See `qa/CINEMATIC-REVIEW.md` for the complete visual audit and remaining gaps. RC19 adds a one-time prefiltered sky/urban reflection probe, restrained day/night fill, closer school component colors, six mature alpha-tested leafy street trees, smoother distant crowns, finer lit skyline windows and louvered crown, quieter sky/dusk grading and mapped asphalt response. Original FBX geometry, RC18 licensed fire/smoke A/B, controls and destruction remain unchanged. New independent five-view cinematic capture uses actual production renderer. Local syntax/diff PASS; local Chromium cannot launch. Fresh exact-head browser, scene images, full five+30s motion, Windows package and authorized Pages checks required. This is a candidate, NOT mockup-level realism/art acceptance or measured GPU performance. Current RC18 browser/motion were still running/pending at review; preserve independent long motion. No main/production/Building Explorer/Pages workflow edits or forced deployment.

## November 11 — RC12 facade fire damage candidate

RC11 7eaf6ec browser 42980344300 and focused motion 42980344354 SUCCESS. Downloaded exact focus artifact 13837441718; report SHA matches and actual skyline-99 image reviewed: elevated flame cluster still sits on otherwise intact windows. RC12 adds nine fixed UV contacts to each existing facade shader: broken-pane darkening, upward soot and irregular warm reflected light; suppresses original office emission inside damaged panes. No added draw calls, textures, dynamic lights or hit-time GPU resources. Reset clears all contacts; QA asserts nine finite heated contacts on every tower and complete reset. Existing licensed flame/smoke assets, physical origins, pools and gameplay retained. Local syntax/Three shader assembly checks pass; actual browser compilation and newest focused/full videos remain REQUIRED. MOT-03 remains OPEN. RC11 full motion still running at review; preserve it. No Windows execution or hardware FPS claim. Draft development branch only; expected-SHA CAS.

## November 11 ~02:35 ET — RC11 roof-safe, impact-aligned licensed skyline fire (UNVERIFIED)

- **Evidence:** Actual RC9 1ecd95e vs RC10 eaad457 focused skyline MP4s compared at 1.2/2.4/3.4/4.8s; RC10 frame-stepped 3.0–4.9s at 0.1s intervals. RC10 improves taller, separate CC0 flames and dark soot over RC9's horizontal white smoke band, but the blaze is still a compact lower-tower patch, with repetitive silhouettes and weak facade illumination. Earlier 76591d3 600-frame/30s video reviewed at 0/3/6/9/12/15/18/21/24/27/29.9s: same patch remains nearly stationary. **MOT-03 NOT artistically accepted.**
- **Concrete architectural defect fixed in candidate:** skyline meteor/scorch contact previously varied from 46–82% of tower height, but all nine flames were forcibly clamped below 60% regardless of roof shape. RC11 derives the top of the full-width wall from the actual polygon roof profile (Liberty .765, City Hall .62, Comcast Technology .79, Comcast Center .92, setback .74, flat .97), reserves space for three distinct burning floors, and constrains impact and fire contacts to the same physically supported facade. This is NOT another procedural cone/shader adjustment.
- **GPU/gameplay:** existing licensed Unity CC0 Flame03/WispySmoke03 atlas material, nine asynchronous window origins per tower, 81 preallocated slots, four fixed draw batches, original procedural A/B, smoke packets, standing skyscrapers, dragon modes, meteor splitting and neighborhood systems unchanged. No hit-time allocations, new textures or additional draw calls. Actual GPU FPS untested.
- **QA strengthened:** real-Three all-nine-landmark test now checks every fire origin below its roof's full-width wall top and within 3.5 window pitches of the meteor/scorch contact, while retaining 81 distinct GPU source origins, resource reuse and reset. Exact-head browser, independent 5×100-frame plus 600-frame/30s motion, Windows ZIP and authorized automatic Pages seven-file byte comparison are ALL required before any RC11 release claim.
- **RC10 technical checkpoint:** browser 42975651767 SUCCESS (errors=[],warnings=[]), focused motion 42975651759 SUCCESS (genuine 100 frames), Windows ZIP 13834994923 CRC/hashes PASS. Automatic Pages 42976434683 SUCCESS with explicit eaad457 checkout and seven-file public comparison; its workflow run SHA is a separate Pages source SHA. RC10 sustained motion 42975651771 now SUCCESS, artifact 13836892218, exact eaad457, errors=[], five 100-frame MP4s plus genuine 600-frame/30s skyline. Personally reviewed 0/3/6/9/12/15/18/21/24/27/29.9s: the three-floor blaze remains nearly stationary in the lower tower and smoke is one mostly unified column; no cinematic acceptance. Houses at .6/1.2/2.4/3.4/4.8s retain two upper-window fires and separated low rubble fires after collapse. RC11 remains entirely untested; new exact-head gates required. Geographic North Broad GIS infill and full streetfront collapse parity remain OPEN.
- **Safety:** development branch and draft PR only, non-forced expected-SHA CAS, never main/production/Building Explorer/main-owned Pages workflow, no merge/forced deploy. PR review evidence: comment 6789801409.

## November 11 — RC10 defense depth, free-flight cleanup and rising smoke candidate

- User requests: fire remains visually unacceptable; retain control during round/chapter cleanup, bilateral background housing, frequent distinct background house strikes, all nearby meteors interceptable, faster fire and cross-lane military gas.
- Source candidate: defense zone = street/school block plus immediate rear row (building centers z >= -36). Playable spawns target this zone; every rock in the playable collection is interceptable using swept perspective-projected screen-aim contact, retaining earliest-hit priority and existing HP/splitting rules. Fire speed 35 -> 64 world units/sec. Distant-only strikes target deeper houses; both streak materials now cool blue-gray/lavender with an on-screen legend. Background strike cadence 1.15 -> .36 sec by damage, two/three targets per event; no first-row automatic hits. Far side infill extends 8 -> 22 illustrative houses per side/row using existing instanced batches, preserving cross-street exclusions; this is visual coverage, NOT surveyed GIS parcel completion.
- Chapter settlement no longer calls perchDragon or skips player movement. Initial reset and actual cutscene entry still perch. Meteor spawning/progression and school fire-health drain pause during cleanup; hostile military fire suppressed. Gas reaches ground lanes within 22 depth units, including military launchers: 7s disable, green hull, searchlight off, recovery; airborne gas must descend below 7.2 first.
- Fire candidate preserves actual CC0 media, A/B fallback and all fixed pool limits. Licensed smoke sheets now rise/expand as six staggered age-faded packets instead of six stationary overlapping sheets; darker soot; narrower/brighter/taller flame cards and reduced tower source breadth to avoid horizontal strip. **MOT-03 remains OPEN: not artistically accepted.** RC9 exact-head motion 42969076161 now SUCCESS (artifact 13834081675); RC10 requires fresh videos and actual inspection.
- Local syntax/diff checks PASS. Actual packaged Three Node smoke checks PASS: projection ray consistency at five depths, cross-lane military gas altitude rejection/disable/recovery, and 81-slot combustion material preparation. Full local browser FAILED BEFORE LAUNCH: host denies Chromium singleton socket(), no gameplay pass. Added real browser regression for intercepts at z=0/-25/-35, right/up movement during settlement, and actual military model gas/recovery. Exact-head browser, independent five+30s motion, Windows and public same-SHA validation PENDING. No hardware FPS, Windows execution, APK or art acceptance claim.
- Branch remains isolated, PR draft, expected-SHA CAS only. Do not modify main, production, Building Explorer/main Pages workflow; no merge or forced deploy. Original dirty worktree preserved; changes made in separate exact-head worktree.

## November 10 — v5.5.0 RC1 building combustion replacement

- Replaces the complete persistent neighborhood/skyline fire stack with a shared
  texture-free GPU combustion module. Removes the dominant central sprites,
  ambient rooftop sprites, and prior secondary window-fire batches.
- Three crossed flame sheets, six density-integrated smoke puffs, five embers,
  and one soot/opening/glow surface per source. Fixed 168-source neighborhood
  and 36-source skyline pools; four draw batches each; distance-tier budgets.
- Real rowhouse window coordinates, horizontal roof breaches, structural-part
  anchors for nearer buildings, and window-grid snapping on standing towers.
  Sources settle with rubble, clear on restart, and reuse GPU resources.
- Fixes the existing compact HUD radar overlap found during browser QA. Updates
  the stale window title and runtime metadata to identify the new candidate.
- Read `qa/COMBUSTION-RELEASE.md` for implementation and validation scope. The
  stored campaign visual target informed the work; the new chat's mentioned
  attachment was absent and its acceptance sentence was truncated.
- Validation: complete local browser QA passed with zero errors/warnings; all
  five 100-frame motion scenarios passed. House/skyline frames reviewed at
  1.2/2.4/3.4/4.8 seconds. Anchors and collapse transitions improved, but narrow
  flame tips and distinct smoke lobes remain stylized. Exact-head CI, hardware
  GPU FPS and final art acceptance are not established by these local checks.
  Keep PR #2 draft and unmerged.

## November 10 — v5.4.0-rc.20 footage-driven Paulo flight refinement

- Compared five deterministic gameplay MP4s with the prior baseline. Verified the meteor-only lighter soot treatment removes skyline-obscuring black columns while retaining identifiable flaming meteors; the previous smoke pillars were too intense and now the smoke may be slightly understated at range.
- **Paulo wing art:** Reworked the procedural membranes toward darker desaturated leather, with deeper scalloped spaces between finger bones, greater 3D camber and lower emissive color intensity; the same existing membrane batches and vertices are reused, with no new draw calls or collider changes.
- **Animation:** Shoulder, elbow and wrist now use time-lagged wing strokes, producing more credible flex and recovery than perfectly synchronized triangular sails. During bank, the inside wing folds more and the outside maintains spread. Upper and lower legs fold farther toward the belly in sustained forward flight. Existing dragon toggle and hitboxes are unchanged.
- **Video QA:** Close-up Paulo clip now records actual shoulder/elbow/wrist and leg angles and checks for nonrigid phase separation, visible wing stroke and tucked legs. Full exact-head five-video capture, in-motion visual review and browser regression must pass before release acceptance.
- **Preserved:** RC19 turbulence flame/smoke system, RC18 embers, fine debris, original dragon option, Skyfall waves, cinematic background and intentionally standing skyline, main and Building Explorer.
- **Scope:** This is a visual-art/kinematics prototype, not a professionally skin-weighted avian wing rig. Real GPU FPS still needs a Windows playtest.

## November 10 — motion-observed meteor plume adjustment (candidate, exact-head QA pending)

- Reviewed the five actual five-second gameplay videos from independent motion QA #5 (commit `52176a4b`). The dragon's sail-like wing silhouette, narrowly anchored skyline fire, broad road gust dust, and opaque meteor smoke shafts remain visible issues. Time-coded findings and fixed/untested statuses are in `qa/MOTION-VISUAL-REVIEW.md`.
- Changed only the appearance of **burning meteor exhaust**: the cinematic fire renderer now uses 3 flames and 4 smaller, dimmer smoke puffs per meteor, instead of the structure-fire pattern of 5 flames and 10 large soot sprites. Shorter advected smoke keeps descending fragments visible without black columns swallowing the horizon. Structural/house fires are unaffected; all existing instanced GPU budgets, physics, Skyfall waves, collisions and damage stay intact.
- Next independent video run must demonstrate the improvement; this source edit is **not yet visually verified**. Existing five-clip QA harness, offline frame-step player, main game, separate Building Explorer, and intentionally standing skyline remain unchanged.

## November 10 — RC19 skyline smoke and fire readability pass (exact-head QA pending)

- Increased the existing one-sprite-per-landmark flame's base width and vertical reach so active tower fires remain legible in the focused real-renderer close-up.
- Re-tinted the existing shared smoke-atlas sprite to darker ash, widened and raised its plume, and added bounded slow lateral/vertical drift and a small rotation. No new textures, sprites, lights, geometry, or draw calls; no per-frame allocations.
- Browser QA now checks smoke tint, density, and plume dimensions relative to the fire after an actual staged skyline meteor strike. Retains world-space impact anchoring, skyscraper preservation, cleanup, existing player-fired meteor tests, and mouth-anchored breath tests.
- **Unverified until exact-head browser QA and screenshot review.** Previous verified baseline: RC19 `5b4fecf`, [browser QA #434](https://github.com/erin6374/dragon-defense-play/actions/runs/42781950485), [Pages deployment #170](https://github.com/erin6374/dragon-defense-play/actions/runs/42783410845). Production, main and Building Explorer unchanged; real GPU FPS unknown.

## November 10 — v5.4.0-rc.19 realistic fluid-fire and smoke visual overhaul

- Replaced globally shared static orange flame bitmap and separate painted geometric flame tongues with an animated, deterministic, noise-advected combustion texture. Heat varies from a yellow-white core to irregular amber/red wisps, with a contour that changes shape over time rather than simply stretching.
- Smoke uses a second moving, eroded turbulence atlas instead of flat unchanging discs. Existing world-space drift, tint and suppression behavior remain.
- Reused the two streaming textures across the entire renderer: school/foreground fires, dragon/cinematic effects, vehicle/meteor effects, background rowhouses, health-driven burning rooftops and standing Philadelphia skyscrapers.
- Each atlas is created once: 128x192 fire updated at most 12 times per second, 96x128 smoke updated at most seven. No new per-fire textures, lights, geometric shards or draw calls. Existing pooled embers, damage effects and skyline escalation retain their caps.
- Added exact-frame QA for actual animated flame changes, texture sharing and limited atlas size. Full exact-head browser QA, screenshot visual comparison and Windows hardware FPS are still required before acceptance.
- This is a plausible procedural 2.5D fire approximation, not a photoreal fluid simulation. All meteor gameplay, North Broad reference setting, deliberately distant upright skyline, and separate Building Explorer are preserved. Production main untouched.

## November 10 — v5.4.0-rc.18 distant inferno / cinematic fire overhaul

- **House fires:** Replaced the dim, single blurred orange billboard with one shared 128×192 generated fire atlas featuring layered irregular orange-red flame tongues, a yellow-white core and ground-level glow. Enlarged house flames and deepened/tallened the existing smoke plume. Fire flicker and sway remain tied to the slow background destruction timeline and continue after debris settles.
- **Pooled glowing embers:** A single `THREE.Points` batch with a bounded 280-point buffer supplies ten upward-drifting gold/orange sparks per damaged house, for at most 28 simultaneous impacted homes. No per-ember meshes, collision bodies, allocations per impact or GPU lights. Evicted or reset fires free their reserved spark slots; one draw call while active.
- **Standing skyscrapers burn more dramatically:** One shared sharper flame atlas for landmark impact fire, widened/higher persistent flames, darker denser smoke, and stronger irregular flicker. Tower geometry, height and the intentionally fictionalized skyline placement stay unchanged. The <50% and <20% meteor impact escalations remain intact.
- **Citywide disaster progression:** As neighborhood health drops, every third existing distant smoke marker includes a flickering roof fire (maximum ten additional flame sprites); markers remove their flame when health recovers or the simulation resets. No health, collision, wave, or scoring changes.
- **QA:** Expanded browser regression coverage for fire size, pooled spark budget, persistent sparks after collapse, restart cleanup, and severe-health rooftop fires. Full exact-head QA and visual screenshot review must pass before RC18 is distributed; actual Windows hardware FPS is unknown.
- **Preserved:** RC17 masonry texture and layered dust, RC16 fine rubble point-cloud LOD, Skyfall splitting waves, original/Paulo model toggle, North Broad reference-driven neighborhood, standalone Building Explorer and unmerged production main.

## November 10 — v5.4.0-rc.17 masonry grain and layered collapse dust

- **Finer art without geometric inflation:** RC16's 10/9/8/7/6/5 persistent structural pieces and large/small GPU masonry flecks are retained. Chipped flying masonry and broken interiors now share one 128×128 deterministic, mipmapped, mottled mortar/brick texture, multiplied by per-building colors; no per-hit texture/material allocations.
- **A second dust layer:** One reusable `THREE.Points` cloud supplements the existing eight individual fading shock puffs. At most **96 soft dust points** are resident across all eight concurrent collapses, with distance LOD `12/11/10/9/7/5`. Dust spreads low over the street-facing wreckage, using the deliberately slower distant-collapse timeline; it disappears on settlement/restart. Adds exactly one draw call while active.
- **Performance caps:** Particle systems now have 656 masonry points + 96 secondary dust points across 8 slots, in three batched point-cloud draw calls. Structural geometry is still instanced by distance tier. Textures are produced once at scene setup. Existing 28-marker smoke/fire and 8-slot primary dust limits unchanged.
- **Visual QA:** Added browser assertions for the second dust layer while falling, its zero count once settled and after restart, single draw-call batch, 96-point capacity, and 128-pixel shared texture. Exact-head browser QA and screenshot review required; actual GPU FPS not yet measured.
- **Preserved:** Molten structural damage, Skyfall waves, original and Paulo dragons, standing distant skyline with 50%/20% escalating strikes, geographic reference-driven North Broad neighborhood, separate Building Explorer and production main.

## November 10 — v5.4.0-rc.16 GPU particle destruction pass

- **Art direction:** Distant rowhouse destruction now combines fewer, smaller structural chunks with a large number of screen-facing masonry flecks, so it resembles a chaotic material breakup instead of several rectangular blocks.
- **GPU particle pools:** One pooled `THREE.Points` system for large flecks and another for fine masonry dust/specks. Both share an irregular, transparent particle texture and vertex colors matched to the impacted brick façade. Two additional draw calls only while active, rather than meshes per particle.
- **Strict active budget:** Eight concurrent collapse slots. Across all eight slots the two preallocated buffers hold **656 particles total** (128 large + 528 small). Per-house particle LOD near-to-far: large `16/14/12/10/8/6`, small `66/56/48/38/30/22`.
- **Reduced bulky geometry:** Persistent structural chunks per house now `10/9/8/7/6/5` by distance tier; remaining chunks are narrower. Floor slab LOD is `4/4/3/3/2/1` and smaller façade panel LOD is `4/4/3/3/2/2`. The larger physical rubble survives the impact; GPU particles dissipate as the home settles. This deliberately preserves the performance-oriented LOD approach.
- **Simulation and QA:** Particle movement follows the existing intentionally slower background collapse timeline. Deterministic browser QA asserts large/small particles appear, pool slots release after settlement, restart clears all particles, and each particle class is batched. No new collision or gameplay physics added.
- **Scope:** RC15 molten structural damage, standing distant skyscrapers, background health thresholds, North Broad reference-driven scenery, dragon controls and Skyfall meteor waves preserved. Separate Building Explorer and released main untouched.
- **Release gate:** Source changes require passing exact-head browser QA, inspected airborne/settled screenshots, and Windows GPU playtesting before final visual acceptance.

## November 9 — v5.4.0-rc.15 opening molten structural force

- **Molten fragment correction:** Wave-3/4 molten descendants now apply their existing +35% heat multiplier to school structural damage and nearby buildings, not just ground fireballs, craters and vehicles. The normal molten impact profile remains intact; other meteor classes and the final boss retain their previous damage behavior.
- **Single shared rule:** The opening-molten multiplier is defined in `src/simulation/impact-profiles.js` and reused by ground effects and structural calculations. Roof-breach radius and the secondary large-impact neighborhood strike also scale with the same heat factor.
- **Deterministic regression:** Node assertions cover the multiplier and unaffected classes. Browser QA invokes the real `damage()` path on a neighboring building and the school and compares ordinary molten versus opening molten structural response at a 1.35 ratio.
- **Release status:** Development PR only; this change requires a new exact-head GitHub browser QA pass before any RC15 artifact can be described as verified. No production/Pages/Building Explorer change; real GPU FPS and public `/preview/` availability remain unverified.

## November 9 — v5.4.0-rc.14 exposed rowhouse floors and broken facade pass

- **More convincing structural breakup:** Rather than only shrinking a distant rectangular main building, failing houses now open their street-facing wall; the remaining core retreats into the lot while a dark interior cavity, horizontal floor slabs and separate masonry facade panels appear. The roof and RC13 airborne debris/dust sequence remain.
- **Distance-dependent interiors:** Six existing depth tiers have floor counts `3/3/2/2/1/1` and fracture-panel counts `2/2/2/1/1/1`. All three types share just **one new preallocated InstancedMesh per tier** with baked colors and stable per-house slots; no per-impact mesh, geometry, material or physics-object allocation.
- **Damage progression:** Intact buildings remain closed, damaged walls open progressively, surviving floors compress toward ground as the house collapses, and settled rubble retains partial masonry. Restart hides all exposed structures and restores original facades.
- **Performance:** Refactored repeating per-frame fragment-profile arrays into immutable per-scene caches; each falling house updates its own instanced slots. RC13's bounded eight-dust pool and one rubble batch per tier are preserved.
- **Verification:** Browser QA checks that interiors do not show while intact, become visible during failure, collapse into supported rubble and fully reset after restart. Examine `06c2-distant-building-debris-flight.png` alongside before/after screenshots before release.
- **Status:** Development branch only. Exact-head QA and screenshots required; real GPU performance, launch on a Windows workstation, and reference-image fidelity remain unverified. Standing distant skyscrapers, cinematic layout and <50%/<20% skyline impacts unchanged. Building Explorer and production main untouched.

## November 9 — v5.4.0-rc.13 demolition presentation / framing checkpoint

- Based on visual review of RC12 browser captures, the new airborne masonry was clipped by the **diagnostic close-up camera** and the expanding demolition dust was partly hidden inside the affected house.
- Revised the dedicated test capture to a wider, slightly elevated perspective aimed at the airborne debris arc; gameplay camera, aim, zoom, movement and collision are unchanged.
- Shifted dust toward the street-facing side of collapsing houses and widened its low-lying plume to read better above nearby rooftops. Retains the eight-slot bounded pool and post-collapse fade.
- RC12's shared irregular geometry, 6-tier rubble LOD, standing skyscrapers, North Philadelphia reference-based scenery and fire escalation retained.
- **Source changes committed, not yet accepted**: exact-head full browser QA plus inspection of `06c2-distant-building-debris-flight.png` required. Production main and Building Explorer untouched.

## November 9 — v5.4.0-rc.12 long-range structural destruction polish

- **Irregular debris geometry:** All six distant destruction tiers now share a single precomputed chipped-masonry geometry in their InstancedMeshes rather than perfect rectangular chunks. Brick/roof color variation and the existing parabolic launches remain. No new per-hit GPU geometry allocations or debris draw-call batches.
- **LOD detail:** Near-to-far pieces per building are now 12, 11, 10, 8, 7 and 6. A mix of large wall sections, black roofing, and small shards yields a more broken silhouette while remaining batched by distance.
- **Dust:** Added an eight-slot, scene-preallocated pool of tan dust billboards. Each building that fully fails gets a low expanding cloud, which fades after the collapse and clears on restart. Simultaneous active clouds cannot exceed eight; dust shares the already-initialized smoke atlas.
- **Visual QA:** A dedicated `06c2-distant-building-debris-flight.png` frame now captures airborne chunks and dust. Browser regression assertions check visibility during fracture, full fade afterward and restart cleanup.
- **Preserved:** RC11's independent standing skyline, 50%/20% meteor escalation, deliberately fictionalized distant towers, expanded North Broad tree cover, existing gameplay and controls, and the separate Building Explorer.
- **Status:** Source-level edits and preview labels committed to draft PR #2. Require passing full browser QA, inspect screenshots and test Windows GPU before calling this a final release. Production `main` not changed.

## November 9 — v5.4.0-rc.11 North Broad cinematic neighborhood revision

**User-approved visual direction:** The real North Philadelphia low-rise neighborhood is the geographic/architectural reference; the distant Philadelphia landmark skyline is intentionally fictionalized for cinematic readability.

- **Standing skyline:** Removed gameplay-triggered tower shrink, shear and rubble. Repeated skyline impacts retain the original tower height/silhouette; smoke, scorch, flickering windows and now preallocated persistent flame billboards convey damage instead.
- **Threshold-driven disaster:** Below 50% neighborhood health, faster flaming skyline meteors enter the background strike mix. Below 20%, additional high-energy pass-through bursts and more intense tower flames simulate the catastrophic phase. Uses the existing neighborhood-health calculation, independent of player-hit health.
- **Perspective:** Shifted landmark skyline behind the extended residential horizon (z=-740), rescaled to remain recognizable and intentionally visible; adjusted camera far plane and atmospheric haze to preserve depth.
- **North Broad reference pass:** Wider, denser rows extend to z=-565, with mixed two-to-four-story masonry/rowhouse masses, roof structures, instanced rear-yard and vacant-lot trees, and full-frame neighborhood coverage. Layout remains an approximate artistic reconstruction based on supplied Google Earth angles, not surveyed parcel geometry.
- **Multi-LOD housing debris:** Preallocated instanced roof and masonry fragments: 9/8/7/6/5/4 per building across six distance tiers. Chunks rise above rooflines on independent-looking arcs, rotate, spread, and settle into persistent grounded rubble. Distant collapse takes 1.35–2.70 seconds, progressively slower than foreground collapse. Partial hits bend roof and weaken trim before final collapse.
- **Performance safeguards:** No per-impact mesh/geometry allocation for the distant building fragments; foliage and debris share tier-level instancing, with deterministic index slots and restart cleanup.
- **QA update:** Skyline tests now assert standing tower silhouettes and fire persistence rather than collapse. Distant-building tests probe lofted debris, slower timing, and restart. **Source committed; exact-head browser QA and visual screenshot/hardware review must pass before a release is claimed.**
- Production main and the separate Building Explorer were not modified.

## November 9 — Skyfall development candidate (RC10)

- Added a full screen of vertical camera travel above the previous flight ceiling. Existing movement and attack inputs carry into the upper sky.
- Opening waves launch one, two, one and two meteors respectively. Waves 1–2 use size-8 stone roots. Waves 3–4 use size-11 flaming roots that split into molten descendants with stronger ground effects. A hit starts a two-way split, followed by two three-way generations. Waves wait for the last airborne descendant. Later wave rules and the final boss retain their existing pacing and damage model.
- Background meteors hit independently starting in wave 1. A falling neighborhood gauge makes strikes more frequent and gives them larger fireballs and more mushroom plumes.
- Extended the instanced distant neighborhood toward the horizon. Low rowhouses, taller commercial facades and occasional larger masonry silhouettes use simplified destructible shells. References include the Philadelphia Historical Commission nominations for [2101–07 North Broad](https://www.phila.gov/media/20211119091954/2101-07-N-Broad-St-nomination.pdf) and [2301–07 North Broad](https://www.phila.gov/media/20190401093021/2301-03-N-Broad-St-nomination.pdf).

## November 9 — RC9e breath-origin repair (exact-head QA pending)

- Wind and fire now start at animated muzzle sockets for both legacy and Paulo preview models. The gust source and visible cone follow completed head, flight, turn and movement poses every frame rather than freezing at release.
- Full 3D gust orientation matches gameplay direction; street-level dust remains intentional. No new draw calls or geometry for mouth sockets.
- Browser QA samples legacy hover/turn and Paulo hover/flight/bank, asserting muzzle, physics source and visible cone coincide. RC9d meteor shatter retained. Version 5.4.0-rc.9.4 / 5.4-fireball-mouth-anchor-rc09e.
- **Exact-head browser QA and preview verification required.** Main, production, Building Explorer and licensed European Dragon binaries unchanged.

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

## November 9 — Distant collapse silhouette refinement (QA pending)

- [Browser QA #348](https://github.com/erin6374/dragon-defense-play/actions/runs/42602631839) passed for previous head `26cffc2`; downloaded artifact showed no browser errors/warnings and confirmed roof fold, three facade fragments, and restart restoration. Its rendered collapsed building still looked like a broad smooth slab.
- Narrow visual revision: reduced the settled roof footprint further and made the existing three instanced wall fragments narrower, taller, more staggered, and more steeply tilted. No new geometry, draw calls, spawn points, collision changes, or per-frame allocations.
- Tightened browser assertions for the roof footprint and taller facade fragments. Exact-head browser QA and new `06d-distant-building-rubble.png` inspection pending. Real GPU FPS remains unverified.

## November 9 — Distant roof collapse silhouette (exact-head QA pending)

- [QA #347](https://github.com/erin6374/dragon-defense-play/actions/runs/42594805121) passed for `3c5f374`. Visual inspection of `06d-distant-building-rubble.png` showed the intact full-size black roof masking the three new facade fragments.
- During collapse the existing instanced roof now contracts in width/depth, shifts sideways, and cants into the debris; the intact and restart transforms remain unchanged. No new geometry, draw calls, coordinates, gameplay hitboxes or per-frame allocations.
- Browser QA now checks roof width, depth, tilt and restart alongside the existing rubble screenshot. **New exact-head QA and screenshot review required before certification.** Real GPU performance unverified.

## November 9 — Instanced distant facade debris (QA pending)

- Distant buildings now release three asymmetrical, facade-tinted wall fragments while collapsing, which settle beside the low shell and tilted roof. Debris uses one preallocated InstancedMesh per distance tier (five potential extra draw calls, zero new per-impact meshes), with deterministic slots and no ongoing animation after settling.
- The debris batches stay hidden before a collapse and are hidden again on restart. Browser QA checks intact/falling/settled/restarted debris counts, grounded fragment positions and variation, alongside the existing before/after screenshots. **Exact-head browser QA and visual inspection remain pending.** No gameplay damage, building coordinates, licensed FBX, main or Building Explorer changes.

## Gameplay experiment — Rally waves

- The radar shows a recap during the Rally break with player interceptions and school and block health lost that wave. The clear snapshot also appears in the session export.

- Rally highlights one incoming meteor on the radar, shows its intended destination and estimated impact time, and rings the impact site in the scene.
- Add `&recovery=choice` to Rally for a seven-second ordinary-wave break. Spend 25 support to queue a nine-second school shield for the next wave, or save the charge for Call the Block.
- Rally pays the block-saved bonus for foreground buildings after completed waves. Starting at a later wave begins at zero score. Session exports identify the loop variant.

- Opt in with `?loop=rally`. Scheduled foreground waves end after their airborne meteors resolve, followed by a four-second countdown on ordinary waves. Existing chapter transitions still apply.
- Player interceptions of live, intact meteors add six points to Call the Block. Use the same wave and difficulty to compare standard and Rally play.

## November 9 — Street-center batteries and neighborhood meteor barrage

- Military batteries deploy on the Broad Street center line, between the two inner civilian lanes.
- Every foreground meteor, including the fast flaming impact class, can be destroyed. Fast impacts still damage structures when they land.
- Background meteors descend onto actual near and far buildings. As the neighborhood gauge empties, larger volleys cause collapses with persistent fire and smoke. The barrage can continue behind the end screen at zero neighborhood health.

## November 9 — Physical collapse in the distant city rows

- Some distant strikes now land on actual background buildings. Repeated strikes collapse the instanced building and leave a low shell, tilted roof slab, and smoke until restart.
- Collapse reuses the existing facade batches and caps concurrent falls at eight. Impact and ambient smoke share the existing 28-marker limit.
- Browser QA captures the same building before and after collapse and verifies its rendered height, smoke, and restart behavior.
- The wave-13 placement check measures all three military battery hulls against the existing buildings, cross streets, and Broad Street sidewalk. A canvas-only screenshot shows the positions without the HUD.

## November 9 — Foreground impact meteor distinction

- Ordinary foreground meteors, including molten and flaming rocks and large splitters, remain interceptable. An occasional faster, bright orange impact meteor appears from wave 4, aims at foreground targets, and survives player fire and blast damage.
- The fast impact class leaves a denser ember trail using existing particle limits. Distant skyline streaks have a cooler core and retain their atmospheric tail.
- Browser QA stages the actual spawn and fire paths for the different classes, including an ordinary meteor near the edge of the playable area.

## November 9 — Distant disaster restart and browser coverage

- Restart resets distant meteor and background damage timers along with existing streak and skyline cleanup.
- Browser QA drives the live distant meteor scheduler at wave 1 with intact and damaged foreground buildings, then checks that restart clears active streaks and restores the timers.

## November 9 — Paulo flight silhouette

- Paulo draws all four claws closer to his belly during flight, glide and bank. The deeper fold blends into the existing takeoff and landing transitions and starts above the hover tuck.
- Browser QA measures claw-tip height relative to the torso and captures side views of flight and glide.
- The desktop interception status and compact hostile-aircraft warning have more clearance from the full HUD and menu at Windows browser font sizes.

## November 9 — Neighborhood-driven distant meteor escalation
- Distant meteor streaks and skyline strike cadence now scale with average foreground building damage (capped multiplier 2.15), in addition to chapter progression. Source-level QA guard added. Exact-head browser QA pending; no claim of visually tested release.

## 2026-11-09 — Paulo grounded rear-up turn (exact-head QA pending)
- QA #318 passed for `3ba3948` ([run](https://github.com/erin6374/dragon-defense-play/actions/runs/42561480882)). Added a distinct `ground-turn` animation intent when Paulo turns while perched or inactive; airborne turns still bank. The shared procedural rig now briefly rears up, raises forelegs, braces hind legs, pivots its torso and head toward the requested direction, then settles over 0.8 seconds. Actual facing and hitboxes remain game-controlled; the visual yaw is deliberately transient, not a second gameplay-facing controller.
- The dragon lab exposes the new pose, browser QA checks directional symmetry and leg articulation, and `17-paulo-ground-turn-side.png` captures the mid-pivot silhouette. **New exact-head browser QA and visual review are pending.** Original/new toggle and licensed European Dragon asset status unchanged; no production or Building Explorer changes.

## 2026-11-08 — Fix QA #317 banking-pitch expectation (browser QA pending)
- QA #317 failed at `qa/browser.mjs:1345`: an older lab assertion still demanded zero nose pitch, contradicting the deliberate shallow bank pitch introduced in `2e67ecf`. Updated the assertion to require a small nose-down pitch in both bank directions and mirrored magnitude; existing separate rig tests already cover signed yaw, head lead and roll. No production animation or gameplay logic changed. This fixes the identified test contradiction only; new exact-head browser QA must pass before release.

## 2026-11-08 — Paulo coordinated banking yaw and head lead (exact-head QA pending)
- Procedural Paulo now combines signed longitudinal bank roll with a directional body yaw, shallow nose-down pitch and head-leading yaw. The existing asymmetric wing articulation and tail steering remain. This is a visual-only change to the shared rig, preserving simulation-controlled facing, movement, hitboxes and attacks.
- Browser regression assertions check mirrored yaw/head lead and the symmetric pitch in both bank directions; existing orthographic bank screenshots remain the visual evidence. Prior commit `533ad4e` passed [QA #316](https://github.com/erin6374/dragon-defense-play/actions/runs/42550703490); this new head requires its own QA. Ground rear-up/pivot turning remains outstanding. No licensed European Dragon FBX or real-GPU FPS verification.

## 2026-11-08 — Paulo landing airbrake flare (exact-head QA pending)
- Procedural Paulo now spreads both wing shoulders, elbows and wingtips at the start of the landing pose, then relaxes the flare over the existing 0.6-second leg-extension interval. This is a visual-only eagle-inspired braking silhouette; it does not alter flight controls, hitboxes, or the original-model fallback.
- Browser QA adds landing-wing joint assertions and `16-paulo-landing-airbrake-side.png` alongside the existing tucked-flight screenshot. Exact-head QA and hardware GPU FPS are not yet verified. The licensed European Dragon FBX remains unavailable in the repository.

## 2026-11-08 — Paulo aerodynamic leg-tuck pass (exact-head QA pending)
- The shared procedural Paulo rig now folds all four legs rearward under the torso in flight, glide and bank poses; hover keeps a partial tuck. Takeoff folds and landing extends the legs over a 0.6-second pose envelope. Feet articulate with the knees rather than dangling in a standing pose.
- Banking now maintains a consistent directional body roll and adds coordinated tail steering. This is visual-only and preserves gameplay hitboxes, attacks, timing and original-model fallback. Ground rear-up/pivot turns and the licensed European Dragon FBX remain **not implemented**.
- Browser QA exercises all four legs through idle, hover, flight, takeoff and landing, and captures a deterministic side-view flight silhouette. QA and Windows GPU performance must be verified at the exact new commit before claiming acceptance.

## 2026-11-08 — Restore in-game dragon model comparison (QA pending)
- The original/experimental procedural Paulo model toggle is now visible in the normal full HUD, not gated behind `?paulo=1` or QA mode. Original dragon remains the default and is restored on toggle-off or preview-rig initialization failure. Gameplay root, attacks, score and physics are unchanged.
- Button labels distinguish the procedural Paulo preview from the **not-yet-integrated licensed European Dragon FBX**. QA exercises real button clicks and confirms original fallback.
- Cinematic HUD still hides low-priority buttons; switch to full HUD (H) to access the model toggle. Latest exact-head browser QA/screenshots pending. Flight leg-tuck, banked eagle-style turning and perched rear-up turning remain planned, not implemented.

## 2026-11-08 — Paulo’s street gale
- Strengthened the held-and-released wind attack. Oncoming buses and trucks slide backward, passenger cars rock onto their sides, and pedestrians tumble, skid and get back up.
- Street trees and foreground shrubs bend with the gust. Larger dust spirals and tumbling litter use the two existing instanced draw batches.
- Wind falls are separate from blast injuries and ambulance rescue scoring. Added browser regression checks for displacement, tilt, recovery, foliage, particle limits and unchanged score, health and wave.

## 2026-11-08 — Nearest swept 3D meteor interception (QA pending)
- Player fireballs now test the whole frame segment against meteor collision spheres and select the earliest 3D entry contact, rather than taking the first match in reverse meteor array order. Retains existing damage, shrapnel, scoring, fragment and blast effects.
- Added source-level QA guard; exact-head browser QA and visual/gameplay verification still required. Does not yet apply to wind, gas or helicopters.

## 2026-11-08 — Runtime QA for ordinary-wave Paulo position (pending exact-head QA)
- Added QA-only `advanceOrdinaryWave()` hook to advance a live non-chapter wave through the real `newWave()` path.
- Browser regression starts wave 2, moves Paulo to (31,23,15), advances to wave 3 and asserts x/y/z world coordinates preserved; restores wave 1 before existing QA.
- No gameplay changes, deployment or performance claims. Verify exact-head QA before acceptance.

## 2026-11-08 — Paulo retains free-flight position between waves (QA pending)
- Removed unconditional `perchDragon(false)` from `newWave()`; ordinary wave transitions no longer teleport Paulo to the school roof. Initial game reset and explicit chapter settlement perches remain.
- Added source-level browser QA assertions for the ordinary-wave function and initial reset. Requires exact-head browser QA and gameplay inspection; no real GPU performance claim.

## 2026-11-08 — RC9c high-wave QA toast timeout fix (new QA pending)
- QA #308 failed because a chapter announcement toast never cleared while the QA atmosphere-settle routine was controlling the simulation; the test's 10-second wait timed out.
- Record and clear only the screenshot DOM toast in Playwright instead of waiting for a gameplay timer; preserve game state, chapter logic and controls. Wave-15 screenshot remains subject to visual review after exact-head QA.
- No gameplay/renderer/source changes; development branch only. Real GPU FPS, licensed dragon, production and deployment remain untouched.

## 2026-11-08 — RC9c QA #307 chapter-announcement screenshot clearance (new QA pending)
- Verified exact-head [browser QA #307](https://github.com/erin6374/dragon-defense-play/actions/runs/42519919972) **passed** on `2400e1d`; downloaded its browser artifact and visually inspected the actual wave-15 screenshots. The cinematic is now hidden, but the separate 1.8-second **“A NEW CHAPTER BEGINS”** toast still blocks the skyline. Automated assertions did not check this overlay.
- In `qa/browser.mjs`, wait for the actual in-game `#toast` to clear before the high-wave screenshots, assert it is empty, and record the initial toast plus clearance in the QA report. Preserve chapter gameplay behavior and the wave-7 restore. No runtime source, physics, graphics, version or deployment change.
- **Do not certify the distant fire-glow appearance until fresh exact-head browser QA passes and both new screenshots are visually inspected.** Hardware GPU FPS, licensed European Dragon and new 3D combat features remain unverified.

## 2026-11-08 — RC9c QA high-wave capture fix (exact-head QA pending)
- Inspected [QA #306](https://github.com/erin6374/dragon-defense-play/actions/runs/42515153457): browser assertions, screenshots and packaging steps completed, but GitHub Actions cancelled while finalizing the **Windows preview artifact** after repeated upload-service JSON errors. Its QA artifact was retained; overall run is **cancelled, not passed**.
- Downloaded QA #306 screenshots and discovered that both purported wave-15 disaster-glow captures show the **chapter cinematic overlay**, not the actual game sky. The prior test verified the wave counter but did not dismiss the cutscene.
- Corrected QA to call the existing QA-only `closeCinematic()` immediately after staging wave 15, assert the overlay is hidden and gameplay unpaused, then capture both game and canvas screenshots; wave 7 restoration remains intact. This is test-only and does not change live chapter behavior.
- Corrected the Windows development-preview workflow's stale RC9b artifact/folder label to **RC9c**, matching `build-info.json` (5.4.0-rc.9.2). New exact-head QA and visual screenshot inspection required before certifying the glow. Hardware FPS and licensed European Dragon remain unverified.

## 2026-11-08 — RC9c skyline-glow visibility correction (QA pending)
- Exact-head [QA #305](https://github.com/erin6374/dragon-defense-play/actions/runs/42505013025) passed for `d0d519d`; visual review found the two new fire glows largely obscured by foreground roofs at their original vUv heights (.16 and .23).
- Raised and broadened both glows to y=.49/.55 in the existing full-screen sky shader, retaining restrained intensity and zero additional geometry, textures, lights or draw calls. The sky treatment is visual only; no gameplay or HUD logic changed.
- Added a real rendered wave-15 browser screenshot (`06b-high-wave-disaster-glow-scene.png`) plus wave-state assertions and wave-7 restoration before the remaining skyline tests. This screenshot is an evidence capture, **not** proof of visual fidelity until inspected.
- Version/build identity remains RC9c (5.4.0-rc.9.2); no release or production deployment. Verify fresh exact-head QA and inspect both game and skyline images before acceptance. Hardware GPU FPS and licensed dragon integration remain unverified.

## 2026-11-08 — RC9c: restrained skyline fire-glow atmosphere (new QA pending)
- Confirmed RC9b exact-head [browser QA #304](https://github.com/erin6374/dragon-defense-play/actions/runs/42500182720) passed before editing; branch still matched e793e38.
- Added two soft, distant orange impact glows to the existing full-screen sky shader. Their intensity gradually follows wave progression and skyline damage, with low-amplitude flicker; no new mesh, shadow light, texture, draw call, physics or collision change.
- Added deterministic bounds/escalation assertions for the shared sky-intensity helper and advanced both canonical build stamps to RC9c.
- **Pending:** exact-head browser QA and actual screenshot review; no hardware GPU FPS measurement. Preserve RC9b radar, attacks, main, Pages, Building Explorer and licensed dragon assets.

## 2026-11-08 — RC9b follow-up: radar clearance for full/touch HUD (new QA pending)
- Inspected actual [QA #303](https://github.com/erin6374/dragon-defense-play/actions/runs/42495308567) screenshots. Cinematic desktop controls clear radar, but full desktop radar obscures CALL THE BLOCK/performance buttons; compact full HUD radar covers FIRE/GAS touch buttons.
- Place radar at top right below health cards in full desktop and compact/coarse-pointer layouts. Preserve bottom-right radar in cinematic desktop, all attacks and HUD toggle.
- Add desktop full, compact full and compact cinematic Playwright overlap assertions and `02d-full-hud-radar.png` / `02e-compact-cinematic-synthetic-alerts.png` screenshots. Synthetic alerts are layout probes, not wave 15 gameplay.
- No simulation, build identity, production or asset change. New browser QA and screenshots must pass before certification.

## 2026-11-08 — RC9b: cinematic button/radar clearance (new browser QA pending)
- Reviewed the actual successful RC9 browser screenshot `02c-cinematic-hud.png`: top HUD is much clearer, but the persistent 160px radar at bottom right obscures Settings/Pause and part of the button row.
- Reserve right-side radar and left-side wind-meter footprints on desktop, reduce cinematic button padding, and allow wrapping within safe area. Keep mobile controls untouched.
- Give radar a stable DOM id and assert in Playwright that every visible cinematic game button is spatially clear of radar and breath meter. Existing on-screen toggle and H shortcut remain tested.
- RC9 [browser QA #42494350467](https://github.com/erin6374/dragon-defense-play/actions/runs/42494350467) passed with zero page errors/warnings before this refinement; RC9b must pass its own tests before being called verified.

## 2026-11-08 — v5.4.0 RC9: immersive cinematic HUD (new QA pending)
- Addressed real 1024×576 Chrome software-renderer screenshot review: multiple heavy header cards, development controls and permanent instructions obscure the Philadelphia and Paulo scene.
- Added reversible **Cinematic HUD / Full HUD** toggle (visible button or H key). Human gameplay defaults to cinematic mode; `?hud=full` opts into complete layout and `?qa=1` keeps original QA geometry unless toggled.
- Cinematic mode hides only nonessential developer controls/version labels and the permanent instruction plaque, shrinks health/status tiles, and leaves school/block health, lives, attack charge, radar, Call the Block, pause, settings and mobile attack controls accessible.
- New screenshot and interaction regressions verify that toggling is reversible and gameplay controls remain visible; desktop/full HUD assertions run afterward. No gameplay simulation or renderer change.
- No production/main/Building Explorer changes. Realistic licensed European Dragon binary integration remains pending; screen-space human acceptance and real GPU FPS not claimed.

## 2026-11-08 — v5.4.0 RC8: preserve Paulo's interception credit (QA pending)
- Military missiles or battery impacts no longer award player meteor intercepts, rapid-fire streaks, hunter shields, score or player accuracy. The government receives its own `militaryInterceptions` telemetry counter.
- Military-destroyed meteors remain removed using the existing blast and debris pathways, while real player interceptions and rewards are unchanged.
- Added a staged real-game meteor interception regression asserting unchanged player stats and shield, including a simulated special hunter meteor.
- Exact-head browser QA required before deployment; no graphics, production main, Building Explorer or European Dragon binary changes.

## 2026-11-08 — v5.4.0 RC7: Paulo's wind intercepts military rockets (new browser QA pending)
- Wind now bends incoming military missile trajectories when rockets enter the dragon's 3D gust cone, with lightweight deterministic bounded impulses and a visible gameplay message.
- Homing rockets temporarily lose guidance after an air blast, giving Paulo a defensive counter to military pursuit; regular missile collision and collateral damage remain enabled.
- Added pure regression checks for wind range, angle, frame-step bounding and re-acquisition delay, plus an in-game staged rocket velocity test through the real wind gameplay function.
- No extra render objects or dynamic GPU lights. Exact-head QA and live deployment must complete before visual acceptance; production main, Building Explorer and European Dragon asset stay untouched.

## 2026-11-08 — v5.4.0 RC6: cinematic military searchlight pursuit (QA pending)
- Chapter-three military missile batteries now carry pale volumetric-style searchlight cones, with reusable geometry/material and no extra shadow-casting GPU lights (maximum three active beams).
- Searchlights sweep smoothly and continuously toward Paulo, with a small imperfect tracking motion; their visuals don't affect targeting or damage.
- Added deterministic normalized/smoothed aim tests and a staged real-scene browser QA screenshot with beam-count/aim/distance assertions. Visual legibility and real GPU FPS remain to be reviewed, not claimed verified.
- Preserved military collateral, fire, meteor, wind systems, production main and Building Explorer. European Dragon mesh still awaiting hosted import.

## 2026-11-08 — RC5 wave/warning overlay separation (new exact-head QA pending)
- Verified [browser QA #291](https://github.com/erin6374/dragon-defense-play/actions/runs/42475844384) passed at `0cf3afa86c6f74f48652ce113bede2d896f14695`, with zero reported JS errors/warnings and RC5 Windows artifact. Inspected actual `02-playing.png` (1024×576) and `02b-compact-hud-synthetic-alerts.png` (848×480) from the QA ZIP.
- Visual defects: at 1024×576 the wave banner sits behind the interception status; at 848×480 the synthetic hostile-aircraft warning touches/overlaps the first menu-button row. Move desktop wave/warning lower and compact warning 12 px higher without modifying game simulation or controls.
- Add desktop wave/status bounding-box assertion and compact warning/visible-menu-button separation assertion. New browser QA and fresh screenshot review required; wave-15 warning remains synthetic, not real campaign evidence. No hardware FPS claim, deployment, main, Building Explorer or licensed European Dragon integration.

## 2026-11-08 — RC5 compact landscape HUD separation (new QA pending)
- Exact-head [browser QA #290](https://github.com/erin6374/dragon-defense-play/actions/runs/42471074050) **passed** at `9ee667f44849c82879af9f8fd4e000285d708e68`, including Windows preview packaging and nearest-target missile assertions.
- Address the previously observed overlapping wave announcement/status/HUD at 848×480 by giving compact layouts distinct vertical positions for power, model, chapter, wave and hostile-aircraft notices. Keep all controls and game simulation unchanged. Add 848×480 Playwright DOM-bounds assertions and a screenshot with **synthetic alert text**, not a real wave-15 gameplay capture.
- New CSS and regression assertions require exact-head browser QA before acceptance; mobile hardware, gameplay-wave visual fidelity and GPU FPS remain unverified. No production deployment or licensed dragon integration.

## 2026-11-08 — RC5 follow-up: deterministic first contact within rocket target classes (new QA pending)
- Exact-head [browser QA #289](https://github.com/erin6374/dragon-defense-play/actions/runs/42466717298) **passed** at `87ee68fd4c6408fadffeb05dd4b1afb007752e79`, including the prior swept rocket collision assertions and Windows preview packaging.
- Audited the swept missile loops: when several player shots or meteors intersected a rocket's movement in one frame, the first array entry won even if another target was physically closer. Resolve the minimum swept contact time **within** each class, preserving established shot > meteor > dragon > collateral class priority and existing effects. Added deterministic reversed-order, ineligible, miss and contact-position assertions.
- New commit requires fresh exact-head browser QA; no visual acceptance or hardware GPU FPS claim. Main, Pages deployment, Building Explorer and licensed European Dragon binaries unchanged.

## 2026-11-08 — RC5 follow-up: swept missile hits on active targets (new QA pending)
- Exact-head browser QA [#288](https://github.com/erin6374/dragon-defense-play/actions/runs/42463054731) **passed** on `977d021648ec71f849e8cefd17536621a8afcff6`, including the previous school/road swept-collateral regression and Windows preview packaging. This confirms software QA, not GPU FPS or final visual acceptance.
- Source audit identified the same frame-step tunneling risk in military missile contact with player shots, meteors and Paulo: each was tested only at the rocket's frame-end position. Added a pure swept segment/sphere helper, repositioning the rocket at contact while preserving the existing shot > meteor > dragon > collateral priority and effects.
- Added deterministic entry-face, near-miss, starting-inside, stationary and invalid-radius checks. The helper was independently checked with five Node assertions; **the integrated change remains unverified until new exact-head browser QA passes**. No production/main, deployment, Building Explorer or licensed European Dragon binary change.

## 2026-11-08 — RC5 follow-up: swept military rocket impacts (verification pending)
- Source audit after passing [browser QA #285](https://github.com/erin6374/dragon-defense-play/actions/runs/42460992019) found that RC5 checked only the rocket's final frame position. At low frame rates, fast missiles could jump entirely through a rowhouse or the street plane, suppressing the intended collateral impact.
- Added bounded segment-vs-AABB entry tests for school/rowhouses and Broad Street, choosing the earliest intersection and placing the visual missile at that hit point. Preserves existing arming delay, destroyed/distant exclusions, and hit precedence for dragon, player fire, and meteors.
- Added deterministic high-speed crossing, road descent, near-miss and arming regression assertions. **This follow-up is unverified until new exact-head browser QA completes.** Hardware FPS and European Dragon FBX integration remain unverified; no production/main/Building Explorer changes.

## 2026-11-08 — v5.4.0 RC5: Military missile collateral damage
- Missed missiles from the antagonist military batteries now collide with school/nearby building footprints or Broad Street rather than ghosting through structures or quietly disappearing at ground level.
- Collisions reuse the existing school/rowhouse damage, street crater, debris, fire and visual effects systems, with distinctive military-strike UI cues.
- Collision detector is bounded, supports launch-clearance arming, avoids destroyed/distant buildings, and has deterministic regression coverage.
- Existing Paulo, player fire/wind, and production main remain unchanged. European Dragon assets still need hosted integration.

## 2026-11-08 — v5.4.0 RC4: Dragon wind now visibly affects ground traffic
- Changed vehicle wind from tiny capped translation to mass-dependent once-per-gust velocity, skid and post-gust inertia.
- Added chassis roll/yaw, controlled tire dust and speed disturbance; bikes react most, sedans skid, buses resist.
- Lane-following and overtaking briefly yield to the gust, followed by gradual traffic recovery. Road bounds cap sideways drift.
- Reset vehicle rotation on spawn/reuse; preserved meteor, helicopter and pedestrian wind systems.
- Added deterministic wind regression checks plus in-game QA assertions. European Dragon integration remains separate; production main unchanged.

# Dragon Defense — Development Changelog

## RC2 exact-head QA and realistic Paulo asset audition handoff (November 8)

- Browser QA [#279](https://github.com/erin6374/dragon-defense-play/actions/runs/42454741049) **passed** on `96062397d9274ca975100ca731e6d0f78ae84248`, covering the Windows Python 3 fallback source-level guard. This is **not** an actual Windows batch-file launch test.
- Browser QA [#280](https://github.com/erin6374/dragon-defense-play/actions/runs/42456654546) **passed** on `e42f99831b18c2fb075b0570dfddc39f8b1a1337` and produced browser diagnostics plus an RC2 Windows preview. That commit adds only `PAULO-REALISTIC-ASSET-AUDIT.md`; it does **not** integrate either licensed source dragon into the game.
- The new audit documents two user-provided CC BY 4.0 dragon candidates, their rig/clip inventory and conversion blockers. In particular, the European Dragon FBX needs texture path cleanup, while the Three Motion Loops GLB needs specular-glossiness material conversion for Three.js r160. The latter conversion is approximate, not visually validated.
- **No asset selection or integration approval:** close-up appearance, wing/skin deformation, four-legged perch and flight transitions, material accuracy, attribution and Windows GPU performance still need independent validation. Existing RC2 legacy fallback remains authoritative; no production merge, deployment or Building Explorer changes.


## RC2 Windows launcher Python-version guard (November 8)

- [Exact-head browser QA #278](https://github.com/erin6374/dragon-defense-play/actions/runs/42450767263) **passed** on `3982dcd6622cd83b152654979d1a3277bfdd67ba`, including the RC2 README update; GitHub Actions uploaded the RC2 Windows preview artifact (119 visible files). This is browser/software-WebGL verification, not a physical Windows launch or hardware GPU test.
- Source audit found a specific launcher edge case: the `python --version` fallback accepted any installed Python version, including Python 2, even though the server uses Python 3's `http.server`. Changed the fallback to execute a Python major-version-3 assertion before selecting it. `py -3` remains preferred.
- Added a browser QA source-level regression assertion for that guard. **New guard is unverified until fresh PR-head browser QA passes; the Windows batch launcher still needs real-device validation.** No gameplay, production `main`, merge, deployment or Building Explorer change.

## RC2 exact-head QA and Windows package audit (November 8)

- Exact-head browser QA [run #275](https://github.com/erin6374/dragon-defense-play/actions/runs/42447703016) **passed** for commit `ef67361549c3bad9b60b6e3c2536174ee586bec3`; the QA report lists no JavaScript errors or WebGL/material warnings. This validates the RC2 rig, visual-only fallback tests, browser assertions and CI packaging on that commit, **not** physical Windows GPU performance.
- Downloaded the actual `DragonDefense_v5.4.0_RC2_Windows_Preview` artifact (29,911,589 bytes); ZIP integrity test passed for **119 entries**. Confirmed launcher, build-info, original game, shared Paulo rig/pose driver, standalone lab, vendor Three.js, and RC2 README are present. The embedded build identifies `5.4.0-rc.2` / `5.4-paulo-rc02` with legacy dragon as default.
- Inspected real `07d-paulo-gameplay-closeup.png`, `07e-legacy-gameplay-closeup.png`, lab and banking reference screenshots from run #275. The corrected opposing bank poses and wing membranes are visible. Paulo remains comparatively dark in the nighttime game view; this is an **art-review limitation**, not a proven gameplay or rendering regression. No hardware FPS or final visual approval is claimed.
- The Windows launcher requires Python 3, but the RC2 README previously omitted that prerequisite. Added a check/install instruction to `README_WINDOWS_V5.4_RC2.txt`; this **documentation-only follow-up requires its own exact-head browser QA** before the updated ZIP is distributed. Production `main`, deployment and Building Explorer remain untouched.

## v5.4 RC2 packaging and wing readability pass (November 8)

- **Release safety:** Preserved a real downloadable Windows preview **RC1** from passing browser QA [#42446279065](https://github.com/erin6374/dragon-defense-play/actions/runs/42446279065). The ZIP was integrity-tested and includes all game assets, `PLAY-PREVIEW.cmd`, vendor Three.js and an explicit release README. Pinned its exact source SHA `7edc9ad` on `release/v5.3.1-paulo-preview-rc1` so a working fallback exists even if newer artwork/tests fail. RC1's in-game version is correctly identified as v5.3.1.
- **More finished wing silhouette:** Expanded the shoulder and elbow patagium rearward to reduce the skeletal void between wing root and finger fan. Upgraded crimson membranes to **per-vertex radial tint** and warmer bronze ribs, preserving all 12 existing panels, 12-pose animation, rig joints and draw-call count. QA verifies that every panel has per-vertex colors and the outer span receives more light than the inner root. Visual confirmation in fresh in-game screenshots is still required.
- **Current RC2 identifiers:** Set `build-info.json`, `src/core/build-info.js`, and HTML title to `v5.4.0-rc.2` / `5.4-paulo-rc02`, keeping the gameplay base correctly disclosed as v5.2.3 with v5.3 wind features. Replaced outdated Windows instructions with `README_WINDOWS_V5.4_RC2.txt`, including the hidden-by-default Paulo preview URL `?paulo=1`, controls, rollback and known untested devices.
- Updated the browser QA workflow to package `DragonDefense_v5.4.0_RC2_Windows_Preview` **only after tests pass**, and to verify required Paulo rig and new README files before publishing the artifact.
- **Do not confuse RC2 with a tested release yet:** all new model, screenshot, timing and packaging changes must pass the exact-head GitHub browser QA before distributing the RC2 package. RC1 remains the tested downloadable fallback. Neither release modifies production `main` or the separate Building Explorer. Android APK and actual Windows GPU FPS remain unverified.


## Paulo v5.4 long-session hit recoil timing (November 8)

- Source audit found that Paulo's `hit` pose used `Math.exp(-t*2)` with `t` supplied by the **continuous wingbeat clock**, so recoil would be practically invisible after even a short gameplay session. The lab's reset-to-zero pose timeline had masked the problem.
- The reusable `applyPose(t,state,direction,poseElapsed=t)` now uses **pose-local elapsed time** for finite impact recoil, while global `t` still drives continuous wingbeats, breathing and tail sway. The optional fourth argument keeps standalone lab behavior compatible.
- `src/dragon/paulo-pose-driver.js` now supplies `poseTime` separately to the rig, resets it on state changes, and preserves continuous wingbeat time across attacks. This does not alter stun damage, health, invulnerability or projectile rules.
- Expanded browser QA to assert identical recoil after 0.1 and 120.0 seconds of wingbeat time, visible initial recoil and per-pose driver clock progress. An independent source simulation of **2,400 steps / 120 seconds** passed.
- **Full browser QA and visual acceptance for the latest combined scale/material/recoil head remain pending.** No production/main or Building Explorer changes.


## Paulo v5.4 in-game visibility and scale pass (November 8)

- [Browser QA #42446279065](https://github.com/erin6374/dragon-defense-play/actions/runs/42446279065) **passed** the previously added `captureDragonDetail()` and real-game preview round-trip tests; report recorded no JS errors or WebGL warnings. Downloaded the 12 MB QA artifact and inspected actual `07d-paulo-gameplay-closeup.png` and `07e-legacy-gameplay-closeup.png` at identical staging coordinates.
- **Visual finding:** the new procedural dragon was markedly smaller and almost black in the late-night school scene, obscuring its anatomical/wing-detail advantages; the original dragon remained more legible with a larger head and brighter silhouette.
- Changed only the **Paulo preview child root** scale from `0.50` to `0.68` in `src/game.js`; do not alter the authoritative gameplay dragon root, physics, controls, NPC targeting, projectiles, health or score. Added a QA-visible `visualScale` field and assertions that it is `0.68` while Paulo is mounted and `null` after returning to the original dragon.
- Improved Paulo's shared `src/dragon/paulo-rig.js` charcoal armor, plates and crimson wing/body palette with modest night-legibility emissive fills and a brighter eye. The material changes affect the shared design lab too.
- **New appearance unverified:** modified JS/QA scripts parsed; the current development branch requires a fresh browser run and direct inspection of its `07d` and `07e` screenshots before judging scale/lighting successful. Do not claim game-ready art, Windows hardware FPS, Android APK or final v5.4 release. Production main and Building Explorer remain untouched.


## Paulo v5.4 reusable rig extraction and pose driver (November 7–8)

- **Verified previous checkpoint:** [browser QA #42442263143](https://github.com/erin6374/dragon-defense-play/actions/runs/42442263143) passed the prior isolated-lab geometry/banking build. Its genuine screenshots were inspected: the corrected longitudinal axis yields opposite left/right front banking silhouettes. The procedural model is still a blockout; this is not a finished asset.
- Extracted the entire procedural anatomy and `applyPose(time,state,bankDirection)` from the standalone viewer into `src/dragon/paulo-rig.js` as `createPauloRig(THREE,{breathPreviewFactory})`. This module creates an **unparented scene group**, geometry and reusable poses with no DOM, renderer, camera or game-state ownership. `dragon-lab/paulo-lab.js` now imports the shared rig rather than duplicating model construction.
- The factory allows the lab to inject **preview-only** fire/wind/gas effects; the default game-ready factory does not generate them, avoiding duplication of existing gameplay attack effects.
- Added an idempotent `rig.dispose()` to detach the visual root and release each owned geometry and material once, supporting a reversible old-dragon fallback without lingering GPU buffers. Browser QA now constructs a **second detached rig** and verifies 12 poses, mirrored bank rolls/shoulders, 12 membrane panels, 7 tail segments, 24 instanced fangs, no preview breath, and repeat-safe resource disposal.
- Added `src/dragon/paulo-pose-driver.js`, a pure simulation-to-visual timing adapter. It keeps wingbeat phase continuous through attack state changes, caps a single visual update at 50ms, freezes transforms on pause, and resets without changing game variables. Expanded QA and passed **six direct source smoke-test checks**; full browser/WebGL verification of the newest modules is pending.
- Updated `dragon-lab/GAMEPLAY-INTEGRATION-NOTES.md` with the completed extraction and remaining gates. **No playable-game model swap, release package, production merge, or Building Explorer change.** Consolidated v5.4 remains gated on finished Paulo artwork, guarded integration, QA, Windows GPU benchmarks and Android device validation.


## Paulo v5.4 front-bank screenshot verification and framing guard (November 7)

- Downloaded and directly inspected the actual [browser QA run #236](https://github.com/erin6374/dragon-defense-play/actions/runs/42438685499) screenshot artifact for `2abd8670`. The paired `14-paulo-bank-front-left.png` and `14-paulo-bank-front-right.png` now show opposite wing-up/wing-down roll instead of the previous back/underside pitching error. Run #236 passed. This accepts the **bank-axis correction** visually, not the final dragon asset or gameplay integration.
- The report records symmetric longitudinal roll of approximately +0.274/-0.274 radians at 0.75 seconds. The front orthographic frame extents are (0.769, 0.481) right and (0.769, 0.498) left. Added a narrow browser assertion requiring comparable front-bank framing to catch future camera-fit regressions without imposing fragile screenshot pixel matching.
- Wing membranes remain very thin/edge-on from some front-bank angles. Further art review and real-GPU testing are still required. This is QA-only; no playable dragon, production main, deployment, or Building Explorer changes. New QA for the framing guard is pending.

## Paulo v5.4 longitudinal banking-axis correction (November 7)

- [Browser QA run #235](https://github.com/erin6374/dragon-defense-play/actions/runs/42433995673) **passed** the new matched front-bank captures at `d1b65f7`. Direct inspection of `14-paulo-bank-front-left.png` and `14-paulo-bank-front-right.png` showed the left bank exposing Paulo's back while the right bank exposed his underside: the pose was pitching about Z rather than rolling about his forward (+X) axis.
- In the **isolated Paulo lab only**, bank motion now rotates `root.rotation.x`; `root.rotation.z` remains reserved for the existing hit recoil. The read-only `rootRoll` QA field now reports the actual longitudinal roll, and a new assertion rejects any pitch during banking. This is a visual-rig correction, not gameplay integration or a performance claim.
- **Verification pending:** inspect the new current-head browser QA and both front-bank screenshots before accepting the corrected silhouette. Production main, v5.3.1 playable dragon, Building Explorer and deployment are unchanged.

## Paulo v5.4 front-bank visual QA (November 7)

- Reviewed actual front, side, top, rear and matched banking screenshots from successful browser QA [run #234](https://github.com/erin6374/dragon-defense-play/actions/runs/42429170223) at `9409c1f`. Top-down left/right bank images are visually similar because roll is difficult to judge overhead, despite opposite-sign rig assertions.
- Added deterministic **front orthographic** bank-right and bank-left screenshots at the same paused 0.75-second pose time, with direction and full-frame assertions. Original top-down captures and numeric checks remain. This adds visual evidence, not automatic visual acceptance.
- **QA-only change:** no Paulo rig, gameplay, collision or rendering changes. New browser QA is pending; no hardware performance claims.


## Paulo gameplay animation selector — integration staging (November 7)

- Added `src/dragon/paulo-animation-intent.js`, a **pure, side-effect-free, DOM/WebGL-independent** selector for the existing 12 Paulo pose names. It prioritizes stun/recovery, wind/gas, charging/fire, landing/banking, glide/flight and idle/hover, plus travel-sign-dependent banking. No in-game dragon is replaced or controlled by this module yet.
- Added deterministic selector regression cases in `qa/browser.mjs`, including state priority, left/right direction, and exact correspondence with the standalone lab's pose names.
- Added `dragon-lab/GAMEPLAY-INTEGRATION-NOTES.md`, documenting real hooks in `src/game.js` for movement, stun, wind, fire, gas, collision root and fallback; spells out a staged visual-only integration plan. Attack/collision behavior will remain owned by the original simulation.
- This is **pre-integration infrastructure**, not proof of a completed new dragon. Lab wing-panel/browser QA, gameplay adapter tests and hardware performance require verification on the current branch head. The consolidated release plan remains `RELEASE-PLAN-v5.4.md`.


## Paulo v5.4 proximal wing silhouette pass (November 7)

- Browser QA run `42428004854` passed the prior head-and-tail anatomy revision. I reviewed the actual front, side and top reference images: face and tapering tail render, but wing membrane coverage is concentrated near the tips, leaving the shoulder-to-elbow spans visually skeletal.
- Added one tessellated **shoulder-attached proximal wing patagium on each side**, complementing the existing central elbow panel and four distal finger fans. Each wing now has six panels; 12 total (previously ten), with unchanged shoulder/elbow/wrist rig, positional joints, wing fold/bank and pose state system.
- The panel meshes share existing geometry/material patterns and are allocated at initialization rather than during animation; the original per-frame vertex deformation still updates the preallocated buffers.
- Expanded browser QA to check the 2 proximal, 2 middle and 8 outer panels, at least 1,092 membrane vertices, and matched top-down images `13-paulo-bank-right.png` and `13-paulo-bank-left.png` at the same 0.75-second pose time.
- Source JS and QA syntax parsing passed. **Current-head browser QA, real screenshot inspection of the newly widened membranes, and Windows hardware measurements remain pending.** This is a procedural prototype; a final weighted/sculpted skinned dragon is not complete, and the existing gameplay dragon/production main/Building Explorer were not modified.


## Paulo v5.4 head and tail anatomy refinement (November 7)

- Reviewed the **passed** browser QA run `42427391118`: fitted front/side/top/rear orthographic cameras now show Paulo fully without cutting off the wing tips. This supersedes the previously cropped perspective reference views.
- The side screenshot exposed a tail silhouette defect: seven isolated ellipsoid forms looked like disconnected beads at the tip. Replaced them with seven overlapping, radius-tapered cylinder frustums that follow the same articulated chain; retained dorsal spines and animated pivots. QA checks the seven link lengths exceed joint spacing and progressively taper toward the tip.
- Improved the original dragon head blockout with a defined snout bridge, brow ridges, lower-jaw mass and two 12-fang instanced tooth rows following separate head/jaw transforms. QA checks 12 upper and 12 lower fangs; the 24 fangs use only two additional instance batches.
- These model details passed source JavaScript syntax checks. **Current-head browser render/visual QA and Windows GPU performance remain unverified**. The isolated lab is not yet a production-ready dragon; no changes to gameplay integration, production main or Building Explorer.


## Consolidated release directive and Paulo reference framing (November 7)

- User requested that the **finished new Paulo dragon trigger a combined Dragon Defense release** incorporating the recent graphics, wind, destruction, and gameplay improvements. Added `RELEASE-PLAN-v5.4.md` with an explicit integration audit, regression gates, Windows/Android delivery targets, rollback criteria, and distinctions among source QA, browser QA, actual GPU/device verification, and release status. **This does not authorize an immediate merge or deployment.**
- Inspected actual successful browser QA run `42424075239` screenshots: the front reference cropped both wing tips, and the camera labeled “orthographic” was actually perspective.
- `dragon-lab/paulo-lab.js` now selects a **real orthographic camera** for front/side/top/rear views and fits the full source-dragon bounds with a generous margin, while the regular three-quarter view keeps its perspective camera and mouse orbit. Scroll zoom works in both camera modes. Reference framing is recalculated only on view selection and resize, not each animation frame.
- QA records normalized projected bounds and asserts that the complete model stays inside all four reference frames. Added top/rear screenshots alongside the front/side screenshots. Clarified the viewer's labels and interaction instructions.
- The prior run `42424075239` passed the earlier code; **the new camera/framing commits remain unverified until a fresh current-head browser run succeeds**. No changes to existing playable dragon, production `main`, or separate Building Explorer.


## Paulo v5.4 two-way bank reference (November 7)

- The original bank state only expressed one direction despite the design specification requiring left and right turns. Added a direction selector to `dragon-lab/index.html` and applied its sign consistently to torso roll and mirrored shoulder articulation in `paulo-lab.js`.
- Extended the deterministic browser test: pause at 0.75 seconds, capture both bank directions with identical time, and assert equal-and-opposite body roll plus mirrored left/right shoulder angles. The existing twelve named animation states and normal-game controls remain unchanged.
- This is a **design-lab improvement**, not gameplay movement logic or a released dragon replacement. Changed JavaScript passed static syntax parsing; full browser/WebGL and hardware performance results for the new commits are pending.


## Paulo v5.4 wind pulse refinement and anatomy capture (November 7)

- Reviewed the real `08-paulo-dragon-lab.png` from successful browser QA run `42422806438`. The initial 24-ring wind preview overlapped into an unnaturally dense, bright cone, while the dragon's silhouette remains a stylized blockout.
- Refined the isolated wind emitter to **nine visible instances from the same 24-instance preallocated pool**, a thinner torus, lower opacity and a narrower expansion/wobble envelope. Fire and gas retain their original 24-instance capacities. QA now asserts the active draw instance count per effect; no gameplay breath/collision changes.
- Added repeatable `09-paulo-front-reference.png` and `10-paulo-side-reference.png` screenshots during the browser QA, alongside the wind preview. These are for inspecting wing proportions, joints and leg silhouette before any production dragon replacement.
- These refinements passed static parsing but **are not browser-verified until the newest workflow completes**; do not treat the earlier successful run as verification of these subsequent commits.


## Paulo v5.4 deterministic animation inspection (November 7)

- Added **Pause/Play**, **+1 frame** (1/60 second) and an eight-second **pose-time scrubber** to the isolated `dragon-lab/index.html` viewer.
- `dragon-lab/paulo-lab.js` now uses a single pose-time source for animation, scrubbing and frame stepping. Paused state stops advancing the rig or issuing continuous WebGL draws; camera orbit, view presets, zoom and joint-marker toggling still render while paused.
- QA checks the paused time remains unchanged, a frame step advances by exactly 1/60 second, and scrubbing sets an exact reference time. The wind preview screenshot is captured from a paused reference pose for repeatability.
- JavaScript source and test edits passed syntax parsing. **Full PR-head browser QA and Windows hardware inspection remain pending**. The gameplay dragon and separate Building Explorer were not modified.


## Paulo v5.4 breath preview and QA isolation (November 7)

- Previous Paulo Lab GitHub Actions browser QA failed while waiting for `DOMContentLoaded` after the lab and bundled Three.js returned HTTP 200. The QA navigation now waits for the response commit, and separately waits for the lab-ready interface (up to 90 seconds); this changes test readiness, not game performance.
- The game browser page is closed after its final assertions and before the standalone Paulo Lab test. This avoids two simultaneous software-WebGL animation loops and releases the gameplay renderer's resources during the isolated test.
- New `dragon-lab/breath-effects.js` uses exactly one visible preallocated 24-instance emission batch at a time: fiery cone-shaped sparks, translucent wind rings, or descending green gas clouds. The preview follows the articulated head and uses a shared temporary transform, with no mesh or geometry allocation per frame.
- The Paulo Lab test checks the fire, wind and gas emission selection, pooled count and absence of elemental emissions in the bank pose. A dedicated screenshot now captures the wind pose. These are illustrative lab visuals only; gameplay wind/fire/gas mechanics and Building Explorer are unchanged.
- Static JavaScript parse checks passed for the changed lab and test scripts. **Current PR-head browser QA, actual Windows playtest and hardware FPS are not yet verified.** This is an unmerged development preview; do not deploy or merge before review.


## Paulo v5.4 design laboratory — isolated animation and anatomy prototype (November 7)

- Added `dragon-lab/index.html` and `dragon-lab/paulo-lab.js`: a separate original procedural Three.js dragon with charcoal armor, crimson membrane wings, bronze horns and amber eyes. This is a **blockout**, not a production-ready skinned model.
- Articulated torso/chest, neck/head/jaw, two multi-joint wings with membrane fingers, four legs and seven tail segments. Includes perspective plus front, side, top and rear views, orbit/zoom, animation speed control and optional joint markers.
- Added 12 named movement/attack studies: idle, hover, forward flight, glide, bank, inhale, wind exhale, fire, gas, hit, land and takeoff. These are procedural pose studies, not imported copyrighted animation clips.
- Added `dragon-lab/DESIGN-SPEC.md` with original art direction, skeletal hierarchy, approximate motion timing and explicit acceptance criteria before replacing the current dragon.
- Added browser QA coverage for the isolated viewer's load, two wing chains, 12 states, wind/fire jaw movement, no page errors and a screenshot (`08-paulo-dragon-lab.png`).
- Follow-up: animation states now evaluate immediately on selection (rather than relying on the next animation frame), wind exhale braces wing joints differently from the narrower fire pose, and QA checks inhale chest expansion, bank asymmetry and actual renderer draw-call telemetry.
- Geometry pass: replaced each flat triangular wing wedge with a 7×13 tessellated membrane grid. Ten curved/scalloped panels now follow the articulated wing bones and preserve the original rig. Added 66 dorsal scale plates using one instanced draw call. QA checks the ten panels, 910 membrane vertices and 66 armor instances. This remains a prototype, not a production skinned mesh.
- Membrane motion pass: cached the original vertex buffers and applied bounded interior-vertex billow/flutter during animation without per-frame mesh creation. Refreshed membrane normals every fourth update. Added a live browser QA assertion that an interior wing vertex actually moves away from its rest position. Final production skeletal skinning and real GPU benchmarks are still pending.
- **QA pending.** No production gameplay, dragon physics, controls, or collision changes. The current v5.3.1 player dragon remains intact; production main stays v5.2.3.

# Dragon Defense v5.3.1 — Wind & Street Effects Preview

## Wind breath: ground targets, blowing debris, responsive smoke (November 7)

- Added pure bounded `groundWindWeight` and `groundWindStep` simulation helpers. Active dragon wind now gently displaces pedestrians and mobile road traffic in the projected street-level cone. Push strength decreases by vehicle class (pedestrian > bicycle/scooter > car > van/truck > bus/fire truck), has a capped per-target displacement per gust, and does not inflict new injury or knockdown.
- Added two preallocated instanced batches for up to 44 road dust particles and 16 lightweight scraps. Particles swirl along the gust, fade as the effect finishes, and require no per-gust mesh, material, or geometry allocation.
- Existing school-fire smoke in the pooled cinematic effects renderer now bends with nearby gusts and temporarily becomes more transparent. Existing street/explosion smoke puffs also drift and thin when within range. Distant smoke outside the gust is unchanged.
- Preserved meteor and helicopter deflection, school-fire suppression, short-click fireball, long-press wind, right-click gas, wind charge meter, and 4-second wind recharge.
- New deterministic browser QA covers weight ordering, cone bounds, gentle displacement, actual synthetic ground-vehicle/pedestrian movement, dust/litter instance budgets, and actual smoke-puff displacement and opacity.
- Bumped build identity to `5.3.1` / `5.3-wind-ground-01`, added `PREVIEW_v5.3.1_README.txt`, and added an Actions upload-artifact step to deliver a complete Windows preview folder with the launcher and assets after successful browser QA.
- Browser QA #166 **passed** and verified live temporary wind targets (pedestrian +0.137, bike +0.114, bus +0.007 world units in one simulated step), 38 ground dust instances, 13 scraps, and deflected/thinned street smoke. The complete Windows package was successfully created and inspected (110 files; required launcher, assets and game source present).
- QA #166 also reported a harmless Three.js material warning: `MeshBasicMaterial` does not have a `roughness` property. Removed the unsupported key and strengthened QA to fail on new console warnings. A fresh run is required before labeling the warning fix verified.
- Headless browser assertions do not establish real Windows GPU performance, aesthetic quality or the exact perceived force of the wind. No changes to production main or the separate Building Explorer.

# Dragon Defense v5.3.0 — North Broad Street

## Continuation — persistent skyline aftermath visual regression

- Reconciled the latest Work/scheduled development head `f861715` and confirmed GitHub browser QA run #138 **passed**. Its repeated-impact flash radius and six-strike contact checks are already present; no duplicate gameplay changes were made.
- Added browser regression coverage for the time *after* an impact flash finishes: the flash must disappear, while smoke, facade scorch marks and grounded rubble remain visible through the later simulated frames.
- Added a read-only smoke world-position probe and a bounded-drift check, ensuring the plume continues moving gently without jumping across the skyline. Browser QA now saves a separate `06-skyline-smoke-aftermath.png` capture after additional simulated time, separate from the earlier rubble frame.
- This is **QA-only coverage**, not a change in the visual simulation or a hardware performance improvement. A new browser run must pass before treating the extra check as verified. Production, deployment and Building Explorer remain unchanged.
- A second camera angle now captures `06-skyline-close-aftermath.png` from a point nearer the towers, in addition to the original wide shot. The closer QA-only camera is intended to expose facade and rubble that foreground streets obstruct; it is not a new gameplay camera, not a substitute scene, and must be visually inspected before claiming it succeeds.


## Continuation — repeat-impact flash radius reset (November 7)

- Verified that prior branch head `27ad3bf` passed complete GitHub browser QA run #133, including the six-strike world-space impact-position assertions. No concurrent branch changes were present before this edit.
- Found a source-confirmed visual timing defect: `update()` expands each impact sprite as it fades, but `strikeNearest()` did not restore the sprite's starting radius. A new strike could therefore briefly reuse an enlarged radius from the previous flash before the next animation frame.
- Each strike now resets its preallocated flash sprite to radius 5 immediately, retaining the existing expansion/fade curve, position, material budget, damage behavior and foreground health. Added a QA-only immediate-scale snapshot and a six-strike browser assertion to catch recurrence.
- Gameplay commit `a8610d4`, QA telemetry `5ad3602`, regression `5fe53e9`. **The new correction is not browser-verified until fresh PR-head QA passes.** This is a small visual consistency fix, not a measured performance improvement; no hardware FPS or fidelity claim. Main, deployment and Building Explorer unchanged.


## Continuation — six-strike meteor flash contact regression

- Previous branch head `092efaad` passed browser QA run #130, verifying the skyline-space impact flash correction.
- Strengthened the existing six-hit browser scenario to check **the actual visible flash position against the reported pre-collapse contact on every hit**, including late strikes that change the tower's transform. The previous suite checked initial flash position and a separate synchronous collapse but did not compare the flash with the contact on all six successive hits.
- Each hit also asserts that the flash stays attached to the stable skyline group, remains visible, and reports finite coordinates. This is a **QA-only change**, not a gameplay or performance optimization.
- The expanded regression is pending its own browser QA result. No production merge/deployment or Building Explorer changes.


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



## RC5 desktop interception HUD clearance — November 8, 2026

- Exact-head [browser QA #294](https://github.com/erin6374/dragon-defense-play/actions/runs/42480421784) passed on `02c39cf`, including Chrome browser checks and Windows preview packaging; inspected the actual `02-playing.png` and `02b-compact-hud-synthetic-alerts.png` artifacts. The previous wave/compact warning spacing is now clear in those captures.
- Found a separate **visible** desktop defect at 1024×576: the centered interception-status banner (`top=70`, `bottom=103`) covers the bottom of the top HUD (lives/health), while the HUD ends near 88px. Desktop-only CSS now moves status to 96px, wave toast to 144px, and hostile warning to 187px. Compact 848×480 CSS remains unchanged.
- Extended the real 1024×576 Playwright geometry assertion to require a gap between top HUD and interception status, plus status and wave toast. No simulation, controls, asset, camera, or render work changed. **New exact-head browser QA and screenshot review are required before this correction is verified.** No hardware FPS claims.
