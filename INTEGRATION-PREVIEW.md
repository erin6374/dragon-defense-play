# Dragon Defense — Integration Preview 9

Build `5.5.0-integration.9`.
Antigravity RC174 and Broad Street Viewer v21.1.33 remain the source baselines.
Exact source
revisions, the unchanged Tech Freire FBX hash, and the development snapshot
commit are recorded in `build-info.json`.

## Play locally

From the repository or extracted snapshot, double-click
`PLAY-INTEGRATION-PREVIEW.cmd`. It uses Python 3 and opens an isolated local
server. Start **Defend Philadelphia** or **Director Sandbox**. Exiting Sandbox
now starts a clean defense session; it does not preserve a prior campaign.

## Run the Windows hardware test

1. Use the current complete `integration/combined-preview` checkout. Do not
   use the earlier Preview 9 copy or an incomplete archive missing Git LFS assets.
2. Install Node.js 22 LTS if needed; the launcher requires at least Node.js 20.
   Microsoft Edge must be installed and hardware acceleration enabled.
3. Double-click **RUN-HARDWARE-TEST.cmd** in the game folder. Confirm start.
   On the first run, approve the local Playwright dependency installation if prompted.
4. Keep the automated Edge window in the foreground. Do not play, switch tabs,
   minimize, record the screen, or run other demanding applications.
5. When the console finishes, press a key as prompted. The results folder opens.
   Send the newest timestamped folder's `report.json`, even if the test fails.
   Screenshots are useful if the report identifies visual issues.

The test serves the current checkout on its own private loopback port.
It exercises eleven functional browser checks and a sustained bombardment
sample. The report includes Git commit (when available), runtime build ID,
unmasked renderer, raw frame samples, settings, and provisional hardware
performance gate. Failure is diagnostic, not a reason to repeat until it passes.
Software WebGL, hidden or headless sessions are not eligible for hardware
acceptance. The launcher has a 15-minute watchdog; hardware certification
still requires independent review and matched baseline comparison.

Advanced: `RUN-INTEGRATION-QA.cmd --require-hardware` runs the same gate.
For ordinary diagnostic testing, `RUN-INTEGRATION-QA.cmd` retains its existing
behavior. `--headless --software` is only for software smoke testing.

## Development changes

Sandbox flight uses the projected Viewer map bounds and continues past the
southernmost surveyed buildings. The map also gains illustrative residential
context beyond Cumberland. Swept meteor contacts retain their assigned parcel
at façade edges, and smaller floor sections fit irregular building footprints.
Church and auditorium interiors keep their open single-volume layout. Tech
Freire retains its dedicated FBX-derived school path.

Camera follow and zoom recover gradually after a missed frame, and Balanced
mode shades at most 1152 by 648 pixels. The long frame gaps reported on Windows
still require native playtesting.


Baked vehicle meshes now use their computed bounds, letting the renderer
skip bodywork outside the camera view. Traffic simulation and vehicle
lighting continue to use the existing game systems. See
[Antigravity handoff](ANTIGRAVITY-HANDOFF.md) for the editable snapshot and
the separate architecture-only exchange.


Pedestrians retain their original meshes, pose hierarchy, and simulation.
The renderer submits visible limbs through three shared instance batches.
In a matched Wave 1 Chromium check with capture off and 38 pedestrians, the
change removed 272 draw calls per frame. Frame-time and freeze improvements
still require a sustained native Windows playtest.


Normal play loads a 173,317-triangle mesh derived from the original Tech Freire
FBX. Walls, floors, glazing, doors and roof geometry retain their source
triangles. Detailed fixtures use simpler geometry and dense decorative rails
are omitted. The source FBX remains bundled and available in the model
inspector. The full source comparison can be loaded with
`?qa=1&schoolSource=full`. Regenerate the play mesh with
`node tools/build-school-play-mesh.mjs` on Node 24 or later. The neighborhood
uses one opaque relief batch per parcel and retains parcel-local damage masks.
The game page no longer requests the optional install manifest.


The surveyed Broad Street parcels and the original school asset share the
map with the RC174-style residential grid beyond Park Avenue and Liacouras
Walk. Contextual streets continue from the Viewer endpoints. These outer blocks
are illustrative, with fewer instances in the far distance. Distant houses
use RC174's progressive roof, floor, debris and combustion effects. Mapped
buildings retain parcel-owned damage and use smaller independently supported
masonry sections. The settings panel now registers each button once, and its
meteor dropper transfers the selected size and material into Sandbox.


The 122 mapped building parcels and the separate original school FBX are
retained. Work toward Preview 9 includes localized and bounded meteor damage,
continuous roof/side collision, reconstruction optimizations, updated mapped
traffic and responder routes, independent water-main rupture, crater and
camera cleanup, parcel-local damage masks, function-specific interiors, original FBX interior restoration, spatial source batching, and regression tests. The repeatable source-level suite is
`node tests/integration-preview-regressions.mjs`.

## Verification limits

The source-level regression suite checks all 122 parcel roof ownership cases,
original FBX interior retention, and cleanup of damage and pooled resources.
Native Windows GPU performance, full-campaign play and the upstream Viewer
district contact audit remain pending.
