# North Broad whole-scene cinematic review — November 11, 2026

## Visual contract

Use the user-supplied Street View and Google Maps images as visual references for the school, neighboring buildings, vacant lots, road corridors and vegetation scale. Use the disaster-movie mockup (`campaign/visual_target.png`) for mood, material richness, warm/cool separation, atmospheric layers and readable action. The mockup is an art target, not a surveyed street elevation. Do not texture geometry with Google screenshots or misrepresent illustrative lots as surveyed parcels.

Preserve the actual source-school geometry, five occupied floors, original dimensions/orientation, structural damage, dragon controls/model toggle, meteor depth rules and active campaign. The school is the hero building; avoid hiding it behind foliage or effects. Foreground bright meteors remain interceptable; cool distant streaks remain clearly separate.

## Whole-game audit

Observed baseline: actual RC17 browser artifact 13872821968, including full/cinematic gameplay, dusk, night, school and skyline images; current RC18 inherits these scene materials. Supplied mockup and street/aerial images were inspected in the conversation. RC18 fire work is retained independently. This is not a photogrammetric survey or a claim of photorealism.

| Area | Gap against references | RC19 implementation / remaining work |
|---|---|---|
| Lighting | Flat ambient fill; inadequate day/night contrast; broad daylight-like illumination at night | Lower fill, stronger night falloff, warm dusk key and cool night retained. Verify readable dragon/rocks at night. |
| Glass, vehicles, road | Glass and paint lack reflected surroundings; asphalt reads as a black slab | One 256×128 original analytic sky probe, prefiltered once; physically based materials receive sky/urban reflections, reduced at night. Moderate mapped asphalt roughness. No realtime reflection pass. |
| School | Tan opaque infill and dark frames differ from the reference's muted green-gray glazing and silver frames | Retune colors/transparency on original FBX components only. Existing brick coursing, holes, interior and geometry preserved. Sign/ornamental brick and reference-level interior detail still need work. |
| Neighboring buildings | Broad silhouettes/types present but repetitive reveals and weak masonry microdetail | Existing structural walls, cornices/storefronts retained; reflection/light pass applies. Exact storefront order/lot widths, roof equipment and masonry variation remain a separate geography/material pass. |
| Vegetation | Four tiny decorative trees and faceted background crowns; reference has mature canopies | Six larger street trees (~1.85× previous height), alpha-tested leaf/twig clusters with open sky gaps, existing gust bending preserved. Distant crowns gain one subdivision. Review school visibility and both pan edges. |
| Skyline | Large uninterrupted glowing window squares and plain luminous crown | Dark divisions within lit bays, subdued office colors, louvered crown texture. Existing profiles/positions and RC18 smoke maintained. Skyline is a cinematic composition, not the true east-facing local sightline. |
| Sky/depth | Saturated daytime blue; cloud blobs; nearly equal contrast across depth | Quieter day blue, lavender dusk, longer cloud bands/warm edges. Existing depth haze and cross-street gaps retained. More skyline/background variation remains. |
| Fire/destruction | Recent versions improve source placement/soot but remain below mockup's cinematic target | Preserve licensed RC18 plume and flame A/B; independently review full 30-second multi-tower capture. Do not mark MOT-03 accepted from technical metrics. |
| Dragon | Procedural shapes still stylized compared with mockup | Both models and flight animations preserved. More anatomical mesh/detail work remains; no claim that procedural Paulo is a licensed European dragon asset. |
| Meteors/explosions | Effects need convincing rock scale, luminous fissures and debris rather than luminous blobs | Existing splitting and bounded effects retained. Review five-scenario motion with new light/reflection balance before further geometry changes. |
| Traffic/people | Cars benefit from real highlights; pedestrians and some vehicles remain low-detail | Lighting/reflection pass applies; existing headlights, wheels, gusts, recovery remain. Model silhouettes/interior detail remain below mockup fidelity. |
| Camera/UI | Full diagnostic HUD hides street; cinematic HUD substantially clearer | Default cinematic HUD retained, full controls still toggleable with H. No camera/aim plane changes. Dedicated scene QA uses cinematic view at both map edges. |

## Verification and cost

RC19 adds one small prefiltered environment probe and two small canvas maps (shared leaf clusters and lantern louvers). It adds no per-frame reflection render pass, new dynamic lights or per-impact textures. Foliage remains three instanced draw batches; six trunks replace four; distant crowns have more triangles. This is a real GPU cost change; hardware FPS is untested. Alpha testing avoids transparent leaf sorting, but shadow/overdraw costs still require review.

Local JavaScript syntax and whitespace checks pass. Full local Chromium cannot launch in this host, so no local gameplay pass is claimed. New independent `cinematic-review.yml` captures actual production day/dusk/night/left/right views with the cinematic graphics preset and asserts night-light falloff, loaded source school, six trees and reflection probe setup. Existing full browser, five-video and 30-second VFX workflows remain required. Exact candidate screenshots and videos must be inspected before accepting the new look. No release or visual acceptance yet.

## RC19 first scene review and follow-up

Exact first candidate 4bc8637 cinematic review 43070202953 SUCCESS (artifact 13877556956; errors=[]). Inspected actual 1280x720 day/dusk/night PNGs: foliage is more open and mature; night now separates clearly but school/street shadows too dark, school masonry still flat, and foreground hedge still solid lumps. Follow-up retains ~0.55 night sun/~0.52 ambient, strengthens night reflections slightly, reuses leafy geometry for near-camera hedge, and preserves masonry variation at gameplay distance. Code inspection also found reflection intensity compounding on material rescans; fixed by preserving immutable base intensities in WeakMap. Actual Three 20-rescan and day/night/reset/removal regression passes. New scene QA asserts stable expected reflection strength at every view. First candidate five-view stats: 706–997 draw calls with cinematic/shadow preset; NOT comparable with mobile motion suite and NOT hardware FPS. Fresh exact-head results required; no visual/release acceptance.
