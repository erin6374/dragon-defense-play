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
