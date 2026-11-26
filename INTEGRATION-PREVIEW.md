# Dragon Defense — Integration Preview 1

## Play on Windows

Extract the ZIP and double-click `PLAY-INTEGRATION-PREVIEW.cmd`. The launcher
uses Python 3 to start a loopback server on a free port and opens your default
browser. Leave its window open while playing. Choose **Defend Philadelphia**
for combat or **Director Sandbox** for scene inspection.

The title screen links to the Broad Street Viewer layout for street and parcel
comparison. Exact build IDs, upstream archive hashes, and the school FBX hash
are in `build-info.json`.

## Integration boundaries

- Antigravity RC174 supplies the game, controls, traffic, collision, school
  reconstruction, shockwave and destruction systems. The school FBX is
  byte-identical to the original file in the RC174 archive.
- Nineteen mapped Broad Street buildings use Viewer v21.1.7 visuals fitted
  to RC174's gameplay parcels. This keeps visual replacements registered with
  the existing structural components and crossroads. The 2228 N Park Avenue
  fixture comes from v21.1.13. Its parcel is registered against the Viewer
  school anchor and replaces overlapping generated rear-row slots.
- The bundled Viewer shows the full v21.1.7 neighborhood with the original GIS
  layout, including street alignments outside the combat retrofit. The full
  road-grid remap and district-wide collision conversion are still open.
- Later Viewer revisions, including v21.1.32, were available as review images.
  The matching runnable model source was unavailable for this snapshot.
- An approximate fit can change a facade's proportions. Park and Broad
  collisions still use RC174 structural proxies. Detailed mesh-level
  collision, hardware performance, full-campaign QA, and a native Windows
  launcher run are open.
