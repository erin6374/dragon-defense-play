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

## Checkpoint 3 — 57.50% (+13.75 points), 2026-11-28 04:15 EST

Exact pilot 46128933420 and stricter audit/browser run 46129090530 at b49aa580fdf6cffc40bf1b88e993fb48f44fab92 both passed. Actual Three.js 165 records, 330 volumes + 2563 details = 2893 components, 44260 architecture triangles, 80 architecture draw objects plus 3 public-realm draw objects. 33825 footprint pair checks and 300096 surface-to-building intersection checks, zero positive-area conflicts. Browser opt-in comparison zero errors, original 122 mapped targets and school preserved, context buildings 2008 -> 1678 (330 fewer, 331 registration attempts excluded), procedural rubble capacity 12967 -> 10111 and interior capacity 11480 -> 8738. This is not native FPS or manual screenshot approval. Source geometry/placement stage 75 -> 100; streets 50 -> 75; browser/visual 25 -> 75. New source commit 660ed5483faa9c155e9aee503793989fee981eda adds byte-identical pinned campus-link manifest (blob 1dd6a650c770048b648530f6a1e6b6417dc6b04e), 11 roads, 22 sidewalks, 3 joints, 42 pedestrian paths (78 surfaces). Totals 343 roads, 686 sidewalks, 51 pedestrian paths, plus joints and seams. Local bounding-envelope clipping suppresses synthetic context at these links without wholesale campus clearance; pavement triangulation now supports polygon rings and holes. Expanded source/browser QA updated; new revision pending, manual seam and legacy-surface overlap inspection still open. No new damage targets. Preview 10 branch unchanged.

| Area | Weight | Stage | Weighted points |
|---|---:|---:|---:|
| Source provenance and import | 15 | 100 | 15.00 |
| Building geometry and world placement | 20 | 100 | 20.00 |
| Streets, terrain and procedural replacement | 15 | 75 | 11.25 |
| Destruction and gameplay integration | 15 | 0 | 0.00 |
| Visual and browser acceptance | 10 | 75 | 7.50 |
| Native performance and regression acceptance | 15 | 25 | 3.75 |
| Release QA and packaging | 10 | 0 | 0.00 |
| **Total** | **100** | | **57.50** |

Next verify campus workflow, inspect before/after captures, measure exact surface/legacy seams and plan parcel-owned damage for expansion while retaining material batching and existing campaign health semantics. Geometry stage acceptance refers to the integrated pilot record placement, not photographic fidelity of every facade. Opt-in only until damage/performance and release acceptance.

## Checkpoint 4 — 61.25% (+3.75 points), 2026-11-28 05:16 EST (session start)

Campus workflow 46129643427 passed at 660ed5483faa9c155e9aee503793989fee981eda: 322560 pavement/building checks with zero conflicts, 33825 building checks, zero browser errors, 165 expansion buildings, 122 original mapped parcels and school retained, 1678 remaining procedural buildings. Campus geometry confirmed in runtime; manual seam review remains outstanding. New commits 5fbc2b39a37a05e75015ef0d1acc39c872bd4d35 and 62ab843c8e2dd8dcb450ff25843f268aaf9b36c8 implement parcel-owned vertex ranges and instance slots, a reversible progressive vertical deformation prototype and source test for exact restoration and unchanged draw count. This is not yet gameplay damage: collision, impact routing, visual fracture, campaign reset integration and browser verification remain open. New tests pending. Destruction stage 0 -> 25 (prototype/design); other stages unchanged. Fixed weighted total 61.25 (15+20+11.25+3.75+7.5+3.75+0). Next check workflow, wire exact polygon hit routing and repair, improve deformation visuals, verify performance. No native GPU claim or release.
