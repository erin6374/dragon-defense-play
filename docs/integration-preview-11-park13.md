# Integration Preview 11 — Park-to-13th pilot

Base: delivered Preview 10 source 9603dcd0ff83867d25d435749354ca1681a0834b and acceptance tracker 94d113df42cb43c93371d8a04f381996d1a8d687. Independent branch integration/preview-11-park13. Source BSV 21.1.69, 8c101b70d6771ac50a0a9f7dc70af6696ff94f9e, standard native evidence 4945b4225c01f3c7d655f4c3416bbaf511131b1b, dedicated expansion browser QA reported four RTX 3060 cases. Source renderer and eight data/helper blobs are byte-identical to the pinned Viewer. The original detailed Park frontage modules already present in Preview 10 are retained; upstream shared-primitives/FBX exporter is tooling, not a new massing model. No import of locally generated FBX files claimed.

Opt in with ?park13=1. Uses the same source callbacks in a new material-batched background group, applies established viewer-to-game offsets, preserves original 122 mapped targets and school. 165 additional building records, expected 2,893 components, 44,260 architecture triangles and 80 architecture draws. 332 provisional-width road strips, 664 sidewalk strips plus joints/seams and 9 southern pedestrian paths imported; campus links beyond the replacement zones deferred. Suppress synthetic homes with margin and clip legacy procedural road/walk strips to the outside of the pilot/southern replacement zones. No new damage targets; this first pass is a visual integration candidate. Current source includes unresolved corridor exceptions; do not invent missing heights or photo-exact facades. No production release or native game performance claim. Audit exact GIS overlaps, source geometry, old parcel inventory, rollback and actual browser render before default activation. Inspect seams and direct visual comparison, then measure on native hardware.

## Weighted completion — checkpoint 2, 2026-11-28 04:09 EST

Score is a fixed-weight engineering estimate for Preview 11, not the completed Preview 10. Stage 0 unstarted, 25 audit/design, 50 partially implemented, 75 principal implementation and targeted source tests pass, 100 integrated acceptance. Keep weights fixed unless scope explicitly changes.

| Area | Weight | Stage | Weighted points |
|---|---:|---:|---:|
| Source provenance and import | 15 | 100 | 15.00 |
| Building geometry and world placement | 20 | 75 | 15.00 |
| Streets, terrain and procedural replacement | 15 | 50 | 7.50 |
| Destruction and gameplay integration | 15 | 0 | 0.00 |
| Visual and browser acceptance | 10 | 25 | 2.50 |
| Native performance and regression acceptance | 15 | 25 | 3.75 |
| Release QA and packaging | 10 | 0 | 0.00 |
| **Total** | **100** | | **43.75** |

Initial pilot 9763fe371bb28266623d07fddac54a9eda93a0e6 workflow 46128933420: exact-source/regression/architecture step passed; browser comparison still running when checked. Source-level audit constructs all 165 records with actual Three.js, asserts 2,893 components, 44,260 triangles, 80 architecture draw objects, original 122 mapped non-school parcels and no positive-area overlaps between new polygons, baseline parcels and school. Existing three detailed North Park frontages already present in Preview 10; new upstream exporter/refactor not treated as extra geometry. Test-only b49aa580fdf6cffc40bf1b88e993fb48f44fab92 adds pavement/footprint intersection checks for every imported surface against all game footprints; workflow 46129090530 pending. No new gameplay/damage or geometry changes in checkpoint 2. Next inspect exact browser output, correct any conflicts, review seam and procedural replacement evidence, then integrate remaining campus public realm and plan efficient parcel-local destruction. No native performance acceptance yet; expansion opt-in, new buildings non-damageable. Prior Preview 10 branch unchanged. Report score every session pause.
