# Dragon Defense — Integration Preview 6

Build `5.5.0-integration.6`.
Antigravity RC174 and Broad Street Viewer v21.1.33 remain the source baselines.
Exact source
revisions, the unchanged Tech Freire FBX hash, and the development snapshot
commit are recorded in `build-info.json`.

## Play locally

From the repository or extracted snapshot, double-click
`PLAY-INTEGRATION-PREVIEW.cmd`. It uses Python 3 and opens an isolated local
server. Start **Defend Philadelphia** or **Director Sandbox**. Exiting Sandbox
now starts a clean defense session; it does not preserve a prior campaign.

## Run Windows browser QA

1. Check out the `integration/combined-preview` branch, or extract its current
   snapshot in a new directory.
2. Install Node.js 20 or newer if needed. Microsoft Edge is the preferred
   browser for the visible GPU test.
3. Double-click `RUN-INTEGRATION-QA.cmd`. On first use, approve the local
   Playwright installation. The utility uses a private loopback server and
   opens a separate browser window. Keep it in the foreground.
4. Return the newest directory in `integration-qa-results`, especially
   `report.json` and screenshots. The report includes the exact Git commit
   when Git is available, build ID, renderer, nine functional checks and
   a 30-second sustained bombardment measurement. Critical asset failures and shader errors fail the report; the report is explicitly not a release certification.
5. If Edge is unavailable, install Playwright Chromium using
   `npx --prefix tools/.integration-qa-runtime playwright install chromium`.
   The runner can also be invoked with `--headless --software` for software
   smoke testing, but that is not native GPU performance verification.

## Development changes

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
retained. Work toward Preview 6 includes localized and bounded meteor damage,
continuous roof/side collision, reconstruction optimizations, updated mapped
traffic and responder routes, independent water-main rupture, crater and
camera cleanup, parcel-local damage masks, function-specific interiors, original FBX interior restoration, spatial source batching, and regression tests. The repeatable source-level suite is
`node tests/integration-preview-regressions.mjs`.

## Verification limits

The source-level regression suite checks all 122 parcel roof ownership cases,
original FBX interior retention, and cleanup of damage and pooled resources.
Native Windows GPU performance, full-campaign play and the upstream Viewer
district contact audit remain pending.
