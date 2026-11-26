# Broad Street Viewer v21.1.13 — 2228 N Park Avenue FBX fixture

The fixture exports the modeled 2228 N Park Avenue building from the pinned
viewer source. The FBX uses meter units and separate meshes for the wall, roof,
window relief, door, trim and other details. Keep the included procedural brick
base-color PNG beside the FBX. The roof has a plain material. Opening locations,
trim and masonry finish are schematic.

Blender 4.2.3 exported and re-imported 155 meshes and 1,940 triangles. The
verification report records source hashes, axes, bounds and the round-trip
checks. Unity HDRP import, collision, destruction, LODs and native performance
remain open. The off-center door is a reference point for checking for mirrored
imports. In the viewer it is on the negative-X side of the local pivot and faces
the negative-Z street direction.

## Reproduce from the Broad Street Viewer development branch

Use Node.js 24 and Blender 4.2 with the v21.1.13 source files listed in the
verification report. The collector checks their Git blob hashes before export.
Run these commands from the repository root in a shell that can find Blender.

```powershell
node viewer/studio/collect-park-fixture.mjs work/park-2228
blender --background --factory-startup --python-exit-code 1 --python diagnostics/export-park-fixture.py -- work/park-2228 output/park-2228
```
