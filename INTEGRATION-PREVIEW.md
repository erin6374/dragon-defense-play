# Dragon Defense — Integration Preview 2

Extract the Windows ZIP and double-click `PLAY-INTEGRATION-PREVIEW.cmd`. The
launcher uses Python 3 to open the game in your default browser on a free
loopback port. Leave its window open while playing. Choose **Defend Philadelphia**
for combat or **Director Sandbox** to inspect the combined scene. The startup
screen links to the full Broad Street Viewer layout.

## Sources and compatibility

- Antigravity RC174 supplies the game, controls, traffic, physics, school
  reconstruction, shockwave and destruction systems. The original Tech Freire
  Revit FBX is byte-identical to the RC174 upload.
- Broad Street Viewer v21.1.33 supplies 19 Broad Street buildings and 17 Park
  Avenue buildings, including 2428–2432 N. Park Ave. Broad buildings are fitted
  to RC174's existing parcels to keep gameplay collision and demolition
  registered. Park parcels use the Viewer footprint positions translated
  from the school anchor. Overlapping generated rear-row slots are skipped.
- The full Viewer remains available for comparison. Existing game roads and
  traffic lanes were kept, so this is a partial district layout integration.
  Building collisions use RC174 structural proxies. The complete road-grid
  conversion, hardware performance, full-campaign QA, and a native Windows
  launcher run remain open.
- The Viewer input is a candidate. Its upstream district contact audit
  timed out. Source commit, archive hash, and the original school FBX hash
  are recorded in `build-info.json`.
