# Dragon Defense — motion-based graphics review

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
