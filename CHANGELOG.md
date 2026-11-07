# Dragon Defense v5.3.0 — North Broad Street

## Continuation — vehicle lighting and distant impact alignment

- Continued the existing `feature/north-broad-graphics` branch and draft PR #2, rather than repeating its world-space neighborhood and camera changes. Main remains at `edc3337`; its Pages workflow succeeded. No production rollout is included here.
- Added dusk-sensitive vehicle headlight emission and feathered road illumination that follows the chassis through turns. Road pools use one transparent draw per lit moving vehicle and no additional dynamic lights. Daylight and parked vehicles do not draw road pools.
- Convert skyline-local meteor positions to world coordinates before placing distant impact flashes. This keeps explosions aligned with the visible descending streaks as the camera follows the player.
- Retain the shared distant-flash geometry when individual flashes expire, avoiding repeated disposal and GPU re-upload of geometry still used by other flashes.
- Added browser checks for daylight/night road illumination, clean canvas captures, and a local QA launcher that starts and closes its own preview server.

Verification and remaining visual limitations are documented in `qa/CONTINUATION-STATUS.md`. Building Explorer remains separate; no files in its project were changed.

This release builds on v5.2.3 (`edc333709757933903c70e2bef93c2e439507059`).

- Switched the gameplay view to a perspective camera. Streets, neighboring buildings and the school stay in fixed world coordinates while the camera follows the dragon. Only the distant skyline and low foreground planting use decorative offsets.
- Restored depth testing for the dragon and added a transition from the rooftop perch to the street flight lane. The school still uses the original FBX geometry and its existing localized damage and collapse paths.
- Reworked the Broad Street lane markings, crosswalks and vacant lot. Connected the two cross streets to the deeper street grid and extended the geometry visible past both intersections.
- Tuned school brick and window colors against the Street View frontage. Added world-space masonry courses to the source façade. Reframed the Liberty Place, Comcast and City Hall silhouettes against a deeper sky with varied façade lighting.
- Suppressed empty broken-building batches until they contain debris. Distant neighborhood batches can now be culled as the camera pans.

## Reference decisions

The eight supplied Street View screenshots were used for the window-bank proportions, contrasting adjoining buildings, vacant lot and street markings. The supplied cinematic mockup guided the camera height, distant landmark order, dusk palette and foreground planting. Philadelphia's [address geocoder](https://api.phila.gov/ais/v1/search/2221%20N%20BROAD%20ST) and [building footprints](https://opendataphilly.org/datasets/building-footprints/) confirm the site and the approximate school height (89 ft, about 27 m). The [project architect's photographs](https://cicadaphiladelphia.squarespace.com/education/tech-freire) document the high front lobby and glazing. The [Comcast campus photographs](https://www.visitphilly.com/things-to-do/attractions/comcast-center-campus/) informed the two tower silhouettes.

The district uses a compressed game-space street grid. The far skyline is a composed landmark view and the west-side planting is set dressing. The source geometry still provides the main façade and original openings. The visual fidelity of the double-height interior, vehicle lighting and individual parcels requires separate visual verification.

## School glazing follow-up

The neutral source materials now use rough masonry, metallic trim, and translucent glazing. Actual source interior geometry is visible through the windows. Source geometry, exterior probes, localized damage, collapse, restart, camera pans and night lighting passed the full local Playwright suite. Atrium fidelity to the original photographs remains unverified.


## Distant meteor lighting

Warm incandescent meteor heads replace blue-gray cores while retaining the atmospheric smoke trail. Full local browser QA passed; cinematic composition remains subject to visual review.


## Atmospheric sky refinement

Five cloud-noise scales replace the coarse cloud pattern, with softer coverage and restrained warm dusk edges. No additional scene geometry. Full local Playwright QA passed; actual dusk capture is in qa/review/sky-dusk.png. Carry-over context is in CONTINUE-IN-CHATGPT.md.

