## November 10 ~22:40 ET — ACTUAL Unity Labs CC0 media imported; exact-head visual QA pending

- [GitHub Action 42953704688](https://github.com/erin6374/dragon-defense-play/actions/runs/42953704688) successfully **downloaded the ORIGINAL Unity Labs ZIP archives**, audited each by SHA256 and member, converted their image sequences, and guarded-fast-forwarded the development branch to `5aae17466f597231bbe24e5ca825ea34d74444a3`. Flame03 source is `Flame03_16x4.tga` (64 frames), WispySmoke03 is `WispySmoke03_8x8.tga` (64); both repacked into **8x8 1024x1024 RGBA WebP flipbooks**. Actual archive hashes, member hashes, converted hashes, grid/dimensions and CC0 source are in `assets/vfx/manifest.json`, not invented or assumed. Packed WebP sizes 333694 and 354794 bytes.
- `src/rendering/flipbook-config.js` was automatically enabled only AFTER successful conversion. The new shaders actually sample the licensed flame and smoke sequences with GPU frame interpolation in the existing 168+36 building-source pools. The original procedural material still exists as an A/B toggle `window.__DD_FIRE_VFX.setMode('procedural'|'flipbook')` and via `?firevfx=procedural`.
- **QA gap:** the import was committed by github-actions[bot], so its immediate PR-run check suites were reported `action_required` with no jobs. A follow-up user-owned expected-SHA CAS docs/CI-idempotence commit must trigger **fresh exact-head browser and five+30-second motion QA**; any prior passed RC4 runs are not valid for the imported renderer. Do not claim new texture animation looks good or has been visually accepted until actual videos are examined. Authorized Pages seven-file check required before public certification.
- Import workflow is now idempotent: when assets are already packaged, it skips redundant downloads/commits rather than failing. No main/production/Building Explorer or main-owned Pages workflow changes. PR stays draft, no merge/forced deployment.
- Geographic left-side rebuilding and consistent main-street destruction remain unimplemented separately.

## November 10 ~22:25 ET — v5.5 RC5 licensed-flipbook renderer/import candidate (NOT RELEASED)

- **User directive implemented at source level:** use a production-style flipbook VFX pipeline rather than incremental hand-written fire/smoke shaders. `src/rendering/flipbook-bridge.js` adds frame-blended 8×8 atlas sampling to the existing capped GPU fire/smoke batches, without changing damage anchors, 168 neighborhood/36 skyline sources, four draw calls, ember/soot materials, game rules or production. Two scene pools share two texture objects once loaded. A/B switch is `window.__DD_FIRE_VFX.setMode('procedural'|'flipbook')` and `?firevfx=procedural` forces the baseline.
- **Important pending asset gate:** verified official [Unity Labs CC0 Flame03 and WispySmoke03](https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks) originals must be downloaded and audited before their textures are committed. The initial RC5 code holds `PACKAGED_FLIPBOOKS=false`: it does **NOT** attempt unavailable media requests and displays the existing procedural fire as a safe fallback. Added a PR-only `.github/workflows/import-cc0-flipbooks.yml` and `tools/import-unity-flipbooks.py` to download originals using GitHub-hosted runner networking, verify ZIP structure, 8×8 sheet membership/alpha and hashes, convert to two 1024² RGBA WebP atlases, write provenance, and fast-forward to a guarded branch head. A failed download leaves the branch unchanged. This importer is a separate step, **not evidence that licensed textures are already integrated**.
- Browser QA now explicitly checks the two-asset active mode and procedural A/B fallback *if and only if* both validated assets were imported. Without import, it checks the zero-texture baseline. Runtime/JSON version `5.5.0-rc.5` / `5.5-licensed-flipbook-pipeline-rc5` is synchronized.
- **DO NOT CERTIFY** until importer commit and exact SHA browser QA, independent five-video + thirty-second skyline real gameplay recordings and human visual comparison versus the North Broad mockup, and authorized automatic Pages seven-file byte check all pass. The last verified art issue MOT-03 remains OPEN; matching successful numerical tests alone is insufficient. Do not claim real GPU FPS or APK.
- Current draft PR #2 branch is isolated. Never modify main, production, Building Explorer or the main-owned Pages workflow; no merge/force. Left-side geographically verified North Broad infill and universal main-street structural collapse still pending separately.

## November 10 ~22:18 ET — licensed flipbook pivot + 30-second fire QA (NEW SHA NOT VERIFIED)

- **User direction:** stop procedural fire shader micro-tuning. Research confirms Unity Labs official 2016 Flame02/03 and WispySmoke01/02/03 assets are expressly **CC0**. Exact ZIP URLs, EmberGen/Niagara flipbook technique, conversion/integrity requirements and A/B acceptance are documented in [qa/VFX-FLIPBOOK-IMPLEMENTATION.md](qa/VFX-FLIPBOOK-IMPLEMENTATION.md). Download of original ZIPs is currently blocked by DNS in this runtime; no unverified binary, fake SHA or proprietary game asset has been committed. **Visible material replacement is pending.**
- **Actual RC3 vs RC4 videos inspected:** downloaded motion artifacts RC3 13821435104 and RC4 13823304397; compared houses and skyline at **0.6, 1.2, 2.4, 3.4, 4.8s**. RC4 keeps two attached house window fires, low separated rubble fires and four horizontal tower-window fires, but smoke is thinner/less visible and flame silhouettes still look like small candles. **MOT-03 remains visually OPEN.** RC4 exact-head browser [42946449558](https://github.com/erin6374/dragon-defense-play/actions/runs/42946449558) and motion [42946449589](https://github.com/erin6374/dragon-defense-play/actions/runs/42946449589) passed. RC4 same-SHA public seven-file gate is not established here; RC3 2003ead remains the last proven public fallback.
- **QA-only candidate:** added `qa/long-fire.mjs`, run after existing five clips in independent `motion-qa.yml`, to record **600 real gameplay frames at 20fps = 30s** (`skyline-long.mp4`, snapshots, `long-fire-report.json`, offline review HTML). Motion job timeout raised to 45 minutes. Added `tools/audit-vfx-source.py` for ZIP SHA-256/member integrity; source assets are NOT imported yet. This new commit requires its own exact-head browser and independent motion checks; a long video is not automatically a cinematic pass.
- **Concurrency/release:** feature branch updates must use expected-SHA CAS, never overwrite other sessions. Do not merge, touch main/production/Building Explorer/main-owned Pages workflow, or claim GPU FPS/APK. Geography-grounded North Broad infill and destruction parity remain pending.

## November 10 ~21:35 ET — RC3 VERIFIED public; RC4 continuous-plume candidate UNVERIFIED

- **Verified public RC3:** exact SHA `2003ead582afa91403b43ee49d144960ac99dbe3`; browser [42939279410](https://github.com/erin6374/dragon-defense-play/actions/runs/42939279410) succeeded, artifact 13820097222 `report.json.errors=[]`, `warnings=[]`. Independent motion [42939279474](https://github.com/erin6374/dragon-defense-play/actions/runs/42939279474) succeeded, artifact 13821435104: exact SHA, `errors=[]`, five genuine 100-frame 20fps MP4s. Authorized automatic Pages [42940569797](https://github.com/erin6374/dragon-defense-play/actions/runs/42940569797) deployed from exact checkout `2003ead` and its **seven unauthenticated public `curl` + `cmp -s` comparisons passed** (deploy job 130263964159). [Play RC3](https://erin6374.github.io/dragon-defense-play/preview/). Technical public provenance is established, but **MOT-03 art acceptance remains OPEN**.
- **Actual RC2 vs RC3 recordings inspected:** `houses.mp4` and `skyline.mp4` at **0.6, 1.2, 2.4, 3.4, 4.8 seconds** and consecutive 0.1-second frame steps from 1.2–2.0s. RC3 has slightly broader facade flames and smoke; rowhouse retains two upper-window origins and multiple low rubble flames at 3.4–4.8s without a falling rigid torch. Four skyline windows burn while the tower remains standing. However the skyline still reads as four small candle fires and discrete cotton-like smoke heads with insufficient continuous ascent. The source-level change is not an art pass.
- **RC4 narrow shader candidate:** replace six independently rising, age-resetting smoke billboards per origin with six continuously anchored, tall, overlapping smoke sheets. Independent slow lateral sway, upward-advected turbulent density, widening with height, fade at top, off-white/gray smoke. The original flame shader, surface contact glow, embers and structural anchors remain unchanged. Fixed pools **168 neighborhood + 36 skyline**, four draw batches per pool, six smoke sheets/source, **no new textures, geometry, per-impact allocations, or gameplay changes**. RC4 `5.5.0-rc.4` / `5.5-continuous-plumes-rc4` is **UNVERIFIED** until its own exact-head browser, independent motion MP4 review, and automatic Pages seven-file byte gate.
- **RC4 visual risks:** sheets may appear like flat translucent rectangles or excessive haze; check upper-window attachment, 1.2–4.8s smoke movement, sudden pops, and separate low rubble vents. Do not declare MOT-03 fixed solely because automated QA passes. Keep PR #2 draft; no main/production/Building Explorer/main Pages workflow edits. Geography-grounded left-side North Broad infill and universal building collapse remain unimplemented.

## November 10 ~20:27 ET — v5.5 RC3 skyline window breadth / plume diffusion (UNVERIFIED)

- **Exact parent RC2** `6530efe559e478c256ad698411527bca2b5e5b20`: [browser QA 42936690422](https://github.com/erin6374/dragon-defense-play/actions/runs/42936690422) and [independent motion QA 42936692176](https://github.com/erin6374/dragon-defense-play/actions/runs/42936692176) passed. Actual RC1 and RC2 `houses.mp4`/`skyline.mp4` reviewed at **0.6, 1.2, 2.4, 3.4, 4.8 seconds**. RC2 broadens house flames and smoke while preserving low separated rubble fires, but tower smoke still forms narrow vertical streaks and the four flames read as tiny candles. Automatic RC2 Pages run **42938296166 was in progress at this checkpoint**; do not call RC2 publicly verified until its seven-file check succeeds.
- **RC3 change:** cap tower opening width below 2.0 while broadening window-origin flames and slightly shortening their height; globally expand and laterally shear the existing six-layer smoke sheets with lighter optical opacity. Same 168 neighborhood and 36 skyline source pools, four draw batches each, no textures, no per-impact GPU allocations, no structural or gameplay changes. Version `5.5.0-rc.3` / `5.5-window-breadth-rc3`.
- **Required gate:** exact-head RC3 browser errors=[]/warnings=[], five genuine 100-frame MP4s at 20fps, compare `houses.mp4`/`skyline.mp4` at the same timestamps with RC2, and authorized automatic Pages seven-file unauthenticated byte verification at RC3 SHA. The source-only change is **NOT** visual acceptance. Watch for overly wide house smoke, smoke-loop pops, or flame overlap with intact windows; revert if worse. No real GPU FPS or APK claim.
- **Next separate project scope (NOT implemented):** evidence-grounded left-of-screen North Broad infill and destruction coverage for currently static flanking skins. Preserve main/production/Building Explorer and main-owned Pages workflow, keep PR #2 draft, no merge/force deploy.

## November 10 ~18:20 ET — RC25 skyline window-band art candidate (UNVERIFIED)

- Verified public fallback remains RC24 `01696438ab04707cee9603fb432bbb76fb3288e0` (browser 42917909399, motion 42917909365, automatic Pages 42919539127 seven-file byte verification). Live head and PR #2 were checked before editing; no competing PR workflow was running.
- RC25 replaces the two widely separated secondary tower burns with **four small, horizontally distributed broken-window origins** per struck skyscraper. Each uses an independently phased short flame, off-white rising smoke that expands and fades before loop reset, and a warm radial facade-contact glow. The original large central flame and soot are reduced, while towers stay standing.
- Bounded at 36 flame + 36 smoke + 36 glow instances over nine landmarks, three instanced draw calls, no new textures, no impact-time GPU allocations. Existing rowhouse window/rubble fire and dragon/meteor gameplay remain untouched.
- Browser QA now asserts four window-band origins, horizontal spread, bounded vertical separation, smoke tint and fixed resource budgets. **Must not certify RC25 until exact-head browser QA, independent five-MP4 motion QA and authorized automatic Pages seven-file verification pass; watch skyline.mp4 at 0.75, 1.2, 2.4, 3.4, 4.8 s against RC24.**

## November 10 ~17:25 ET — RC23 VERIFIED; RC24 window-fire smoke candidate (QA PENDING)

- **RC23 public provenance:** exact-head `db8d5d6b5ecf7b59800716b636b9421a7354398d` passed [browser QA 42906842324](https://github.com/erin6374/dragon-defense-play/actions/runs/42906842324) and [motion QA 42906842154](https://github.com/erin6374/dragon-defense-play/actions/runs/42906842154), artifact 13807421331, five 100-frame clips, `report.json.errors=[]`. [Automatic Pages 42908745545](https://github.com/erin6374/dragon-defense-play/actions/runs/42908745545) checked out exact `db8d5d6`, deployed and passed seven-file unauthenticated comparison. RC23 is technically verified playable, but MOT-01/MOT-03 remain visually open.
- **RC22→RC23 real MP4 comparison:** inspected `houses.mp4` and `skyline.mp4` at 0.5, 1.2, 2.4, 3.4, 4.8 seconds. RC23 roof flame is shorter at 1.2–2.4s but still perched above the window band; two low fires survive collapse at 3.4–4.8s (MOT-02 improved). Tower has three separated burns but the central yellow patch and dark soot still dominate.
- **RC24 candidate:** move two preallocated rowhouse flame origins to upper-floor windows and blend down to rubble, reuse existing soft dust atlas for one new fixed 56-instance gray smoke batch (one draw call), shrink central house smoke and lower its flame. Soften central skyline soot and lighten two existing facade smoke regions, keeping 18+18 skyline instances and standing tower rule. No impact-time allocations, new textures, gameplay changes, main, production, Building Explorer or Pages workflow changes.
- **RC24 verification REQUIRED:** exact-head browser QA including smoke pool assertions, five-MP4 review at 1.2/2.4/3.4/4.8s, and authorized automatic Pages seven-file comparison. RC23 is verified public fallback until then. Do not claim real GPU FPS/APK or close visual issues without inspecting motion.

## November 10 ~16:25 ET — RC23 distributed fire refinement (NEW QA REQUIRED)

- **Verified public predecessor RC22:** `259b379a9cedc94994781de959c0b8353f09b2fb` passed exact-head [browser QA 42897172037](https://github.com/erin6374/dragon-defense-play/actions/runs/42897172037) (errors=[] warnings=[]), independent [motion QA 42897171682](https://github.com/erin6374/dragon-defense-play/actions/runs/42897171682) (artifact 13803566010, five 100-frame MP4s, errors=[]), and [automatic Pages 42898782914](https://github.com/erin6374/dragon-defense-play/actions/runs/42898782914). Deploy job 130123128689 checked out exactly `259b379a9cedc94994781de959c0b8353f09b2fb` and the unauthenticated seven-file public comparison succeeded. RC22 is technically playable, but MOT-01 and MOT-03 remain visually open.
- **Actual RC21 vs RC22 footage:** watched side-by-side `houses.mp4` and `skyline.mp4` at 0.5, 1.2, 2.4, 3.4, 4.8 seconds. RC22 still has a single prominent rooftop torch at 1.2–2.4s; two separated low rubble vents remain at 3.4–4.8s (MOT-02 improved). Tower secondary burns are visible at 1.2–4.8s, but a dominant central flame and dark smoke patch remain.
- **RC23 candidate:** `distant-neighborhood.js` reduces the central roof flame from 1.20×1.86 to .82×1.08 times source size, making two existing independently animated instanced vents the primary visible fire; smoke footprint now varies slowly in width/height/position. `philadelphia-geometry-skyline.js` caps central tower fire at width 7.8 instead of 10.5, retains two secondary facade fires at 4.0–4.6 units, and bounds main smoke width to 12.9–14.8 with .69–.78 opacity. No additional sprites, textures, particle slots, draw calls, impact allocations, tower collapse or gameplay changes. Browser assertions tighten roof source and tower flame/smoke bounds. Both build identifiers synchronized to `5.4.0-rc.23` / `5.4-distributed-fire-rc23`.
- **Required next:** exact-head RC23 browser QA and independent five-MP4 motion review (especially houses/skyline at 1.2/2.4/3.4/4.8s), inspect close skyline screenshots, then authorized automatic Pages seven-file comparison. Do not certify RC23 or close visual issues until recordings show improvement. No Windows GPU FPS or APK claims. Keep PR draft, main/production/Building Explorer/Pages workflow unchanged.

## November 10 ~15:30 ET — RC21 real-motion review, RC22 target

**Evidence:** RC21 [motion run 42884814107](https://github.com/erin6374/dragon-defense-play/actions/runs/42884814107), artifact 13795739780, SHA `e5a442fa54b75995e4bc038e8ee867931bbf7012`, five 100-frame clips and report errors=[]. Compared to RC20 artifact 13792297801 at 0.5, 1.2, 2.4, 3.4, 4.8s.

- **MOT-03 still open:** `skyline.mp4` 1.2–4.8s: small secondary facade flames visible, but oversized persistent central flame still dominates and smoke reads as one dark patch. RC22 caps main flame size and smoke opacity and enlarges the existing two burn regions, without adding instances.
- **MOT-01 still open:** `houses.mp4` 1.2–2.4s: bright roof column oversized relative to the house. RC22 shrinks primary sprite by ~19% height and ~23% width; independent vents remain.
- **MOT-02 improved:** `houses.mp4` 3.4–4.8s: tall column no longer descends intact; separated rubble fires persist, though still stylized.
- **Next acceptance:** review exact-head RC22 MP4s and browser screenshots. Numeric tests alone cannot close the visual issues.

## November 10 — RC21 pre-change comparison and required motion gate

Downloaded and inspected **actual** five-clip `b7a2fe3` motion artifact 13792297801 from [successful motion run 42871663277](https://github.com/erin6374/dragon-defense-play/actions/runs/42871663277), with `report.json.errors=[]`. Compared sampled frames at **0.5, 1.2, 2.4, 3.4, 4.8 seconds** against the earlier `52176a4` recording. The `skyline.mp4` flame remains one concentrated stationary-looking patch at 1.2–4.8s, despite two staged strikes. The `houses.mp4` rooftop flame remains tall at 1.2–2.4s; after 3.4s the earlier two small rubble fires remain instead of a single descending torch. MOT-03 and MOT-01 are still visually open; MOT-02 is improved but not photorealistic.

**New RC21 candidate, not visually certified:** two additional pooled, independently animated facade fire/smoke origins per skyline tower. Acceptance: after repeated impacts, at least two vertically separated burning floor regions are visible, their flame shapes and smoke do not pulse or drift in lockstep, and the tower stays standing; smoke should visibly rise without an abrupt teleport or broad opaque rectangle. Fixed rendering budget: 18 flame + 18 smoke instances in two draw calls. Inspect new `skyline.mp4` at **0.8–4.8s** and close real-renderer browser screenshots. Keep the rowhouse 1.2–2.4s roof flame on the follow-up list. Numeric QA alone cannot close these visual issues.

# Dragon Defense — motion-based graphics review

## November 10 — verified five-clip motion review (new baseline)

**Exact observed commit:** `52176a4b1d02608e1e714f4d4785bd225183b62c`. The independent
[Motion review #5](https://github.com/erin6374/dragon-defense-play/actions/runs/42855689843)
and [browser QA #450](https://github.com/erin6374/dragon-defense-play/actions/runs/42855689599)
both passed, with four original scenarios **plus the new close-up dragon**.
The video report records 100 frames per 5-second clip, 960×540 at 20fps,
and zero scenario errors. Contact sheets were assembled from sixteen
time-spaced frames per clip and full 100-frame recordings were recovered.

**Observations from moving footage (not inferred from single screenshots):**

| ID | Time | Clip | Evidence / next decision |
| --- | --- | --- | --- |
| MOT-08 | 0.00–4.80 s | `dragon.mp4` | Paulo remains readable at close range, but the membrane wings look like two large red triangular sails throughout turns, rather than articulating like large bird wings. Side-to-side direction changes move the body but don't produce convincing banking/feathered wing-shape changes. Its legs still look conspicuous below the body in flight. **Open visual art issue**; inspect shoulder/elbow/wrist sweep and leg tuck in rig before modifying. |
| MOT-09 | 0.60–2.56 s | `houses.mp4` | The building fire still reads as a narrow bright-yellow roof column even after the recent source-level secondary vent work. After collapse (3.20–4.80s) two small ground flames remain, which is an improvement over a single large descending torch but still doesn't look like a distributed rubble fire. **Partially improved, not resolved.** |
| MOT-10 | 0.96–4.80 s | `skyline.mp4` | The Comcast-side fire appears as a very similar narrow vertical patch throughout two impacts, with smoke behind it. The tower correctly stays intact; fire needs more attachment points and richer rising soot. |
| MOT-11 | 1.28–3.52 s | `skyfall.mp4` | Two meteor fragments leave dark vertical shafts as they descend, strongly obscuring the distant city. **Targeted correction committed after this recording:** thinner, shorter, less opaque meteor-specific plumes (four smoke puffs versus ten structural fire puffs); do not claim visual success until the next motion run is inspected. |
| MOT-12 | 1.28–2.56 s | `traffic.mp4` | Close camera now makes the white vehicle's lift/roll clearly visible around 1.9–2.3s. The dust still arrives as a wide fairly uniform tan band. Vehicle is upright again by ~2.9s. **Camera gap resolved; dust graphics still open.** |

**New implementation under test:** `src/rendering/cinematic-effects.js`
distinguishes fast meteor exhaust from building fire, reducing the meteor
smoke sprites per burning rock from 10 to 4, reducing size and opacity,
and shortening the plume's age envelope. `src/game.js` selects this lighter
style only for burning meteors. This change preserves all collision, scoring,
meteor wave logic, fire on buildings and the standing skyscraper rule.

**Next visual gate:** Compare `skyfall.mp4` at 1.28–3.52 seconds before and
after the meteor plume change. If the trail no longer dominates while meteors
remain trackable, mark MOT-11 resolved; otherwise adjust smoke size/contrast
from observed footage only. Follow with dragon wing articulation and more
localized wind-driven traffic dust.

---


**Evidence:** Five-second, 20 fps browser-captured MP4s from commit
`92e2a6bef0689e5ac2beb23cd39237295cbfdff5`, GitHub browser QA
run [#445](https://github.com/erin6374/dragon-defense-play/actions/runs/42841175848),
motion artifact `dragon-defense-motion-qa`.
All four original clips contain **100 actual rendered frames** and a complete
matching `report.json` with no motion scenario errors. The parent GitHub
workflow was cancelled when the branch advanced, so the video files existed
but the run was not a full green exact-head gate. That cancellation is not a
visual test failure.

Reviewed sequential frames of all four recorded clips, including 16
uniformly sampled frames per recording. Findings below concern only observable
graphics and composition; time markers refer to **seconds of recorded video**.
Physical realism and actual hardware FPS require a separate playtest.

## Current correction candidate — verification pending

The latest development candidate adds two pooled, independently phased flame vents per struck house, fades the unsupported tall rooftop flame during collapse, and broadens/lower the smoke. It must be compared with the recorded baseline at MOT-01 0.35–2.10s and MOT-02 2.30–4.95s using the **new** exact-head `houses.mp4`. No visual pass is claimed yet.

## Observed issues and priority

| ID | Priority | Clip / time | Visible issue | Recommended correction |
| --- | --- | --- | --- | --- |
| MOT-01 | High | `houses.mp4` 0.35–2.10 | The flames appear as one tall, high-contrast yellow-white column at the top of a single rowhouse, with little visible variation in where combustion emerges | Use several smaller attachment points / localized vents on damaged surfaces, brighter near the source, varied height and staggered flame timing; keep total GPU budget bounded |
| MOT-02 | High | `houses.mp4` 2.30–4.95 | As the wall shell collapses, the entire flame column moves downward almost as a unit and persists as a narrow street-level bonfire; fire/smoke do not clearly redistribute across the remaining wreckage | Retarget surviving fires to multiple rubble patches; blend fire origins, suppress elevated source flames as support disappears |
| MOT-03 | High | `skyline.mp4` 0.75–4.95 | After repeated skyscraper hits, a small, similarly shaped flame patch stays in approximately one position on the tower; the dark smoke remains centered and lacks a convincing expanding turbulent silhouette | Use staggered vertically separated burn regions, layered transparent rising soot and side drift, retain **standing skyscraper** rule |
| MOT-04 | Medium | `skyfall.mp4` 1.30–3.65 | Two flaming fragments emit large, nearly vertical black trails that merge into dense columns and obscure substantial sections of the skyline | Lower opacity and lifetime of dark trails with distance, add thinner turbulent taper / sideways drift instead of persistent straight columns |
| MOT-05 | Medium | `traffic.mp4` 1.25–1.65 | The gust creates a broad, fairly uniform band of tan roadside dust rather than clearly localized gust-driven vortices | Vary dust source, density, velocities and lifetime per vehicle/street object |
| MOT-06 | Testing gap | `traffic.mp4` 0–5.0 | Wide diagnostic camera makes the tracked car only a few pixels tall, preventing confident inspection of wheel motion, roll, collision and settling despite numeric roll telemetry | **Addressed in source:** reposition traffic motion camera close to the tracked car; verify on the next video run |
| MOT-07 | Testing gap | `skyfall.mp4` 0–5.0 | Paulo appears small in wide composition; individual wing and leg movements cannot be evaluated reliably | **Addressed in source:** added an independent close-up `dragon.mp4` recording with scripted acceleration and direction reversals; verify on the next run |

## What passed in the original recording

- **Skyfall:** A single descending parent meteor splits into two observed
  children around 1.2–1.3 seconds; the recorded dragon crosses the scene
  and changes horizontal direction. This is an event-continuity observation,
  **not** a judgment that the split/fire trail looks correct.
- **House demolition:** Three staged hits occur; damage reaches 100%, debris
  launches above the roof, and solid rubble persists with active fire afterward.
- **Landmarks:** Repeated impacts ignite fire and smoke, and the tower remains
  standing. The stationary-looking fire **shape** is the graphics concern.
- **Wind:** A tracked vehicle moves, rolls under the gust, and returns upright
  by the end; large dust briefly spreads across the near road.

## Review protocol going forward

1. Review the wide `skyfall.mp4` for city-scale continuity and the new
   `dragon.mp4` for actual Paulo flight mechanics.
2. Watch each scene at full speed, then scrub slowly around its staged event.
3. Log concrete video time ranges for anything that pops, teleports, floats,
   disappears, repeats unnaturally, or obscures the primary action.
4. Compare the new clips with these baseline sequences before approving any
   fire, smoke, debris, wind, or animation revisions.
5. Keep videos independent of the cancellable main browser-QA workflow.
   **Passing software-WebGL motion checks does not verify hardware FPS**.

The next motion workflow also includes a generated `review-guide.md`.
