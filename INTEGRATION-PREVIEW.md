# Dragon Defense — Integration Preview 3

Build `5.5.0-integration.3` uses Antigravity RC174 and the Broad Street Viewer
v21.1.33 candidate. Exact source revisions and the unchanged Tech Freire
Revit FBX hash are in `build-info.json`.

## Play

Extract the Windows ZIP and double-click `PLAY-INTEGRATION-PREVIEW.cmd`. The
launcher uses Python 3 and opens the game on a free loopback port. Leave its
window open while playing. Start **Defend Philadelphia** or use **Director
Sandbox** to inspect the layout and trigger subway, basement, and water-main
effects.

## What changed

- Gameplay builds all 122 district and frontage parcels from the Viewer snapshot.
  The original school FBX remains separate. The game uses the Viewer road,
  curb, junction, and parcel geometry, plus the game-specific traffic and transit
  simulation. Collision and damage volumes follow the imported parcels.
- A direct strike selects one footprint. Shockwaves still produce visual effects,
  while the former forced demolition of adjacent parcels is removed. A fire can
  still spread after sustained burning.
- Opaque facade relief is batched, intact duplicate collision geometry is hidden,
  fragments and detailed subway cavities have bounded budgets, and a fixed light
  pool prevents cave lighting from changing the shader light count. The adaptive
  renderer can reduce resolution after sustained foreground frame stalls.

## Verification scope

Chromium smoke checks cover startup, keyboard movement, the original FBX, parcel
ownership, a localized strike, subway train derailment, warning/exit geometry,
basement and subway camera transitions, independent water-main activation and
rising water, repair, traffic and crowd controls, and Sandbox exit.

The upstream v21.1.33 district-contact audit timed out. Native Windows GPU
performance and a full campaign playthrough remain to be verified.
