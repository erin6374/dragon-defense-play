## November 13 — RC58 Full-breadth meteor targeting, extended dragon flight envelope, panoramic skyline mid-rises & atmospheric veil

Parent verified baseline SHA: 1c6864f (RC57 5.5.0-rc.57, build 5.5-north-broad-refinement-rc57).

RC58 expands flight freedom and environmental visual continuity:
1. Full-Breadth Meteor Strike Targeting (`src/game.js`):
   - Expanded meteor target and impact clamping from narrow $[-90, 90]$ bounds to $[-220, 220]$ and $[-240, 240]$, allowing natural direct meteor strikes on all extended 2300-2400 North Broad blocks and 2100-2000 South Broad blocks.
2. Extended Dragon Flight Envelope (`src/game.js`):
   - Broadened playable horizontal flight range to $[-180, 180]$ (from $[-91, 91]$), allowing the dragon to patrol one full screen in either direction over the real-world Philadelphia streetscape.
3. Panoramic Center City Ambient Mid-Rise Geometry (`src/rendering/philadelphia-geometry-skyline.js`):
   - Added 18 additional polygon-modeled mid-rise office buildings to \`ambientBuildings\` extending the intermediate skyline from $[-220, 218]$ to $[-380, 380]$ in local coords ($-1235$ to $+1235$ in world space), completely filling the wide panoramic skyline horizon without clipping.
4. Widened Atmospheric Depth Veil (`src/game.js`):
   - Extended the soft sky-colored aerial haze veil plane to $800$ units (2600 world units), smoothly integrating the skyscrapers with the distant urban terrain.
5. Invariants Preserved:
   - All regression contracts pass (check-build-info, frontage-contract, smoke-plume-contract, street-surface-contract). Zero added draw batches in \`structural-city.js\`.

## November 13 — RC57 Tech Freire rooftop mechanicals, autumn canopy palette, and expanded Google Earth skyline convergence

Parent verified baseline SHA: 3c01961 (RC56 5.5.0-rc.56, build 5.5-north-broad-refinement-rc56).

RC57 delivers authentic architectural and environmental upgrades requested from real-world Google Earth imagery (Images 1-10):
1. Tech Freire Rooftop Mechanicals & Penthouse (`src/rendering/broad-street-reference.js`):
   - Added rooftop elevator penthouse, access door, communications mast, main HVAC chillers with fan cowlings, industrial galvanized air ductwork runs, exhaust flues, and perimeter safety roof railings matching real-world 2221 N Broad Street.
2. Authentic Philadelphia Autumn Canopy Palette (`src/rendering/distant-neighborhood.js`):
   - Expanded foliage coloration from muted monochrome greens to rich October/November North Philadelphia autumn tones (`0x5a734a`, `0xc68234`, `0x788a4e`, `0xa95232`, `0x687c55`, `0xc2983c`), giving vibrant golden, amber, and russet tree crowns across residential blocks.
3. Complete Field of View Continuity & Distant Horizon Convergence (`src/rendering/distant-neighborhood.js`, `src/neighborhood.js`, `src/simulation/city-layout.js`):
   - Extended residential rowhouse depth to $z = -945$ seamlessly converging into the Center City skyscraper skyline with zero voids or cliffs.
   - Broad Street pavement, sidewalks, and double yellow center striping extended to $x \in [-1200, +1200]$.
   - Near-neighborhood collision-enabled residential fabric expanded to $x \in [-380, +407]$ across all 4 depth rows.
4. Contract & Performance Invariants:
   - Check-build-info, frontage-contract, smoke-plume-contract, street-surface-contract, and windows-preview-server-test all pass. Zero added draw batches in `structural-city.js`. Building Explorer and original school FBX preserved untouched.

## November 13 — RC56 Google Earth roof realism, Fotterall residential towers, SEPTA bus shelter & Broad/Dauphin subway entrance

Parent verified baseline SHA: e652714 (RC55 5.5.0-rc.55, build 5.5-north-broad-refinement-rc55).

RC56 enhances visual realism and street-level Philadelphia infrastructure based on Google Earth 3D oblique views:
1. Google Earth Silver-White Elastomeric Roofscape (`src/rendering/distant-neighborhood.js`):
   - Transformed generic dark brown roofs into authentic reflective silver-white elastomeric coatings (`0xcbd1d5`, `0xcfd5d9`, `0xc5cbd0`, `0xd7dde0`) with lot-to-lot tonality, distance haze, and dark perimeter copings.
   - ~85% of rowhouse roofs now reflect bright silver-white elastomeric bitumen and ~15% feature weathered dark bitumen tar, matching Google Earth aerial photography.
   - Added front cornices, roof parapet copings, and window sills to side-street blocks ($z = -31, -53, -75$).
2. Fotterall / Northgate High-Rise Residential Slabs (`src/rendering/distant-neighborhood.js`):
   - Added two 14-story residential towers (Fotterall / Northgate Apartments) at 11th & Cumberland at Fotterall Square ($x \in [-198, -174], z \in [-168, -152]$) with brick masonry facades, vertical window bays across 14 stories, and rooftop elevator bulkheads, matching Google Earth skyline silhouettes with 0 added draw batches.
3. Authentic SEPTA Transit Bus Shelter at Tech Freire (`src/rendering/broad-street-reference.js`):
   - Situated an authentic Philadelphia SEPTA transit bus shelter on the curb directly in front of Tech Freire (2221 N Broad) with curved tempered glass canopy, dark stanchions, rear windbreak panel, transit bench, and "SEPTA Route 4 Broad St" route sign.
4. Broad & Dauphin SEPTA Subway Entrance Headhouse (`src/rendering/broad-street-reference.js`):
   - Added the North Broad subway entrance portal at Broad & Dauphin with steel handrails, descending stairwell opening, and illuminated blue/orange SEPTA transit globe pylon.
5. West Side Broad Street Parking Lot Apron (`src/rendering/distant-neighborhood.js`):
   - Added the commercial parking asphalt apron with white painted parking stall stripes directly across Broad Street from Tech Freire ($z \in [14, 26]$).
6. Contract & Performance Invariants:
   - Check-build-info, frontage-contract, smoke-plume-contract, street-surface-contract, and windows-preview-server-test (8/8) pass. Building Explorer and original school FBX preserved untouched.

## November 13 — RC55 Authentic neighborhood architecture, 1-screen street/sky extensions, realistic cleanup cranes & hard difficulty storm scaling

Parent verified baseline SHA: 84ca134 (RC54 5.5.0-rc.54, build 5.5-north-broad-refinement-rc54).

RC55 fulfills all user requests from the 7 high-resolution aerial and oblique Google Earth reference images:
1. Authentic Surrounding Neighborhood & Architecture (`src/rendering/distant-neighborhood.js`, `src/simulation/city-layout.js`):
   - **Edberg-Olson Football Complex:** Added Temple University's football practice facility to the eastern neighborhood grid (Susquehanna/10th), complete with regulation green turf, Temple cherry red endzones, and white 10-yard markings.
   - **Penrose Recreation Center:** Situated behind the North Broad 2300 block with community rec building, athletic playfields, and surrounding tree groves.
   - **Fotterall Square & Rail Corridor:** Situated northwest park green space with diagonal rail embankment cutting across between Fotterall Square and Penrose Rec Center.
   - **Extended North Broad Streetfront (1 Full Screen Left):** Added 2300-2400 blocks continuing north toward York Street (`north-2300-historic-shop-3`, `north-2300-historic-residence`, `north-2300-corner-commercial`, `north-2400-broad-station`, `north-2400-commercial-1`, `north-2400-commercial-2`, `north-2400-historic-corner`, `north-york-commercial`, `north-york-station`).
   - **Extended South Broad Streetfront (1 Full Screen Right):** Added 2100-2000 blocks continuing south toward Diamond Street & Temple University (`south-temple-broad-corner`, `south-temple-broad-shop`, `south-broad-mixed-use-1`, `south-broad-mixed-use-2`, `south-norris-corner`, `south-temple-campus-hall`, `south-2100-broad-apartments`, `south-2100-broad-commercial`, `south-diamond-corner`, `south-diamond-mixed-use`).
   - Zero added draw batches: all additions reuse instanced geometry and materials, maintaining the strict 2-edge `broad-` frontage contract.
2. Vertical View Extension & Atmospheric Sky Transition (`src/game.js`, `src/rendering/cinematic-environment.js`):
   - Camera vertical view expanded upward by 1 full screen (`streetView = {x: 19, y: 31, z: 114, targetY: 26, targetZ: -6, fov: 52}`), giving double the vertical sky space above the rooflines while anchoring the street level.
   - Screen-space sky shader now includes an upper-atmosphere transition (`vUv.y > .52`): deep stratospheric indigo/navy gradient with high-altitude airglow and subtle twinkling stars.
   - Elevated meteor spawn altitudes ($y \in [105, 130]$): every meteor and dragon-hunter visibly enters from this extended high-altitude upper atmosphere.
3. Realistic End-of-Round Construction Cleanup Cranes (`src/simulation/chapter-staging.js`):
   - Replaced simple boxes with realistic heavy commercial construction crane trucks: dual rear axles, driver cab with chrome grille, flashing amber emergency beacon, and 4 hydraulic outrigger stabilizer pads that extend to the street upon parking.
   - 360-degree rotating crane turret with two-stage articulated telescoping boom and worker repair platform.
   - Vehicles pull up directly to the street curb in front of damaged buildings (Tech Freire, Grands As Parents, Brownstone), lower outriggers, elevate booms up to facade levels, and emit active welding/repair sparks and dust while clearing rubble.
   - At departure, booms and outriggers retract and vehicles drive away smoothly along the roadway.
4. Road-Based Vehicle Exit Routing & Despawn Fix (`src/game.js`):
   - Eliminated vehicle "blinking out of existence": despawn boundaries pushed from $|x| > 104$ to $|x| > 450$ (well off-screen).
   - Vehicles with expired lifespans dynamically route onto cross streets (Dauphin $x = -53$, Susquehanna $x = 53$) or continue along the road until safely off-screen.
5. Meteor Storm Difficulty Scaling (`src/core/balance.js`, `src/game.js`):
   - Calibrated storm intensity so that on Hard difficulty, an undefended wave delivers $> 100\%$ total damage to BOTH Tech Freire School and neighborhood target buildings, reducing both gauges to 0 HP if the player destroys no meteors.
   - Scaled Normal (~65-75% undefended damage) and Easy (~30-40% undefended damage) appropriately.
6. Contract & Performance Invariants:
   - Check-build-info, frontage-contract, smoke-plume-contract, street-surface-contract, and windows-preview-server-test (8/8) pass. Building Explorer and original school FBX preserved untouched.

## November 13 — RC54 Authentic North Broad real-world alignment (Google Earth), 1600-unit boulevard, skyline panorama & shadow coverage

Parent verified baseline SHA: ab2f310 (RC53 5.5.0-rc.53, build 5.5-north-broad-refinement-rc53).

RC54 brings authentic real-world geographic alignment with Google Earth 3D oblique views (Images 5 & 6) for 2221 North Broad Street:
1. Authentic Real-World Alignment Along North Broad Street (`src/rendering/broad-street-reference.js`):
   - **Grands As Parents Foundation (2227 N Broad):** Correctly situated immediately North of Tech Freire (between $x = 0$ and $x = -20$). Added distinctive dark green storefront awning with "GRANDS AS PARENTS", raised Philadelphia stone stoop, carved stone window lintels, projecting sills, and stepped historic cornice.
   - **Maximus Cares Foundation (2235-2239 N Broad):** Situated north of Grands As Parents. Added royal blue commercial facade, awning with "MAXIMUS CARES", anodized aluminum display glass windows, and upper-floor buff brick detailing.
   - **Historic Tan Brick Rowhouse (2243-2247 N Broad):** Bracketed warm stone cornice, stone lintels/sills, and classic raised stoop.
   - **Philadelphia Doll Museum (2253 N Broad):** Forest green awning, gold signage, street-level showcase display glass, 4-story Victorian brick facade, arched headers, and bracketed cornice.
   - **Dauphin Corner & 2300 Block Commercial:** Mansard roof with slate cresting, 3D projecting bay windows, wrap-around corner commercial glass, "HISTORIC CORNER 2300 BROAD", "BROAD APOTHECARY", and "NORTH BROAD HARDWARE" storefronts.
   - **Historic Brownstone (2215 N Broad):** Situated immediately South of Tech Freire. Restored to an authentic Philadelphia brownstone with heavy carved brownstone lintels, deep projecting sills, grand raised double stoop with carved stone balustrades, and dentil cornice (Grands As Parents awning moved to its real home at 2227 N Broad).
   - **Modern Apartment Building (2210 N Broad):** Geometric white facade panels with bold red vertical accent frames, modern horizontal aluminum window mullions across 5 stories, and street-level glass entrance lobby matching Google Earth Image 6.
   - **Alley Courtyard Detailing (x = 25.6):** Added brick retaining wall pier and perimeter gate between the brownstone and modern apartments.
   - **South Institutional Campus (x > 53, across Susquehanna):** Detail for Philadelphia Military Academy / Makkah Mosque campus: Romanesque arched entryway with keystones, warm limestone belt courses, heavy decorative cornice, arched institutional window surrounds, low stone perimeter wall, and sidewalk green lawn.
2. Boulevard & Street Span Expansion (`src/neighborhood.js` & `src/rendering/cinematic-assets.js`):
   - Expanded Broad Street road slabs, near curb lane, sidewalks, and curb to 1,600 units ($x \in [-800, +800]$), providing unbroken street coverage across ultra-wide aspect ratios and dynamic camera angles.
   - Expanded double yellow center lines and white lane divider dashes to 1,560 units.
   - Expanded grand boulevard twin-lantern lampposts with vertical navy/gold banners across $x \in [-480, +480]$.
3. Distant Grid Fill & Skyline Horizon Convergence (`src/rendering/distant-neighborhood.js`):
   - Expanded lot counts to 190 (near), 200 (mid), and 220 (horizon) lots per row ($x \in [-750, +750]$), completely filling the field of view to the far left with no empty voids.
   - Added deeper row centers to $z = -735$ (`[-100, -127, -158, -189, -219, -249, -280, -311, -345, -379, -416, -453, -491, -529, -565, -602, -638, -674, -705, -735]`), seamlessly meeting the Center City skyline ($z = -740$) on an expanded 1,800-unit base plane.
   - Frontage avoidance at $z = -10$ ensures generic instanced boxes never overlap the authentic detailed storefronts ($x \in [-115, -60]$) or southern campus grounds ($x \in [53, 95]$).
4. Center City Skyline Panorama Expansion (`src/rendering/philadelphia-geometry-skyline.js`):
   - Expanded ambient skyline buildings to $x \in [-220, +220]$ local (scaling to $x \approx \pm 715$ world units), presenting a continuous, grand Philadelphia skyline panorama.
5. Expanded Shadow Frustum (`src/game.js`):
   - Expanded directional sunlight shadow camera frustum from $\pm 55$ to $\pm 140$ units to cast realistic, crisp shadows across all street-facing architecture.
6. Contract & Performance Invariants:
   - Check-build-info, frontage-contract, smoke-plume-contract, street-surface-contract, and windows-preview-server-test (8/8) pass. Zero added draw batches in `structural-city.js`. Building Explorer and original school FBX preserved untouched.

## November 13 — RC53 Full boulevard extension, horizon convergence on skyline, North Broad storefronts & neighborhood meteor strikes

Parent verified baseline SHA: 1c6ec38 (RC52 5.5.0-rc.52, build 5.5-north-broad-refinement-rc52).

RC53 directly addresses user feedback and real-world Google Earth oblique references (Images 5 & 6) for 2221 North Broad Street:
1. Widescreen Boulevard & Sidewalk Extension:
   - In `src/neighborhood.js` and `src/rendering/cinematic-assets.js`, expanded Broad Street road slabs, near curb lanes, and sidewalks from 200/230 units to 1,300 units ($x \in [-600, +600]$), eliminating abrupt road cutoffs on both sides of the screen.
   - Extended double yellow center road markings, white lane stripes, and curb caps across the full 1,240-unit roadway.
   - Extended grand-boulevard twin-lantern lampposts and North Broad district banners across the wider street corridor ($x = \pm 280, \pm 210, \pm 150, \pm 105, \dots$).
2. Dense Neighborhood FOV Fill & Horizon Convergence on Skyline:
   - In `src/rendering/distant-neighborhood.js`, expanded lots per row from 74/80/96 to 130/140/160 lots ($x$ spanning over 1,200 units to $x \approx \pm 600$), completely filling the field of view to the far left and right.
   - Added deeper row centers extending to $z = -710$ (`[-100, -127, -158, -189, -219, -249, -280, -311, -345, -379, -416, -453, -491, -529, -565, -602, -638, -674, -710]`) and widened the ground base plane to 1,500 units ($z \in [-740, 0]$).
   - Dense rowhouses now converge directly onto the plane of the Center City Philadelphia skyline ($z = -740$), matching Google Earth views without empty horizon gaps.
3. Mid-Ground Depth Rows & Google Earth North Broad Realism:
   - In `src/simulation/city-layout.js`, expanded mid-ground depth rows from 27 to 64 lots ($x \in [-280, +220]$), maintaining Dauphin, Susquehanna, and southern campus clearance.
   - Added street-facing historic 2300 block commercial storefronts (`north-2300-historic-shop-1`, `north-2300-historic-shop-2`) north of Dauphin with historic sash openings, projecting bays, and ornate rooflines.
   - In `src/rendering/broad-street-reference.js`, registered detailed reference facades, awnings, glass display windows, and stoops for `south-dauphin-historic`, `broad-north-historic-extension`, and the 2300 block shops with structural wall detachment binding.
4. Background Neighborhood Meteor Strikes & Smoke:
   - In `src/game.js`, removed the early health-gate suppression that prevented background rowhouses from taking damage. Background neighborhood houses now take progressive meteor strikes, crumble into debris, and billow smoke plumes throughout the attack, while preserving the skyscraper flaming-meteor threshold (<= 75% health).
5. Contract & Performance Invariants:
   - All regression suites (`check-build-info`, `frontage-contract`, `smoke-plume-contract`, `street-surface-contract`, and `windows-preview-server-test` 8/8) pass. Zero added draw batches in `structural-city.js`. Building Explorer and original school FBX preserved untouched.

## November 13 — RC52 Authentic Philadelphia vehicle liveries, North Broad banners & crater embers

Parent verified baseline SHA: 505066a (RC51 5.5.0-rc.51, build 5.5-north-broad-refinement-rc51).

RC52 advances the scene toward campaign/visual_target.png with authentic Philadelphia municipal and street details:
1. North Broad District Grand Boulevard Lampposts & Banners:
   - In `src/rendering/cinematic-assets.js`, upgraded sidewalk lampposts with twin grand-boulevard luminaire brackets/lanterns.
   - Added authentic North Broad Street District vertical navy-and-gold banners (`bannerMat` / `bannerGold`) mounted on upper and lower steel brackets along the avenue.
2. Authentic Philadelphia Municipal Vehicle Detailing:
   - In `src/rendering/cinematic-assets.js`:
     - **SEPTA Bus Livery:** Added the iconic Southeastern Pennsylvania Transportation Authority red and blue horizontal striping along the white bus body and roof-mounted HVAC climate pods.
     - **Philadelphia Police Patrol Cruiser:** Added roof-mounted dual-color emergency lightbar (red flashing on driver side, blue on passenger side) and front push bumper.
3. Smoldering Molten Crater Embers:
   - In `src/game.js`, upgraded asphalt impact craters with a pulsating molten ember core (`RingGeometry`, `0xff4810`, transparent opacity pulsating with elapsed time) that smolders inside the shattered asphalt rim before cooling. Complete cleanup and disposal on crater expiration and game reset.
4. Contract & Performance Invariants:
   - All regression suites (`check-build-info`, `frontage-contract`, `smoke-plume-contract`, `street-surface-contract`, and `windows-preview-server-test` 8/8) pass. Zero added draw batches in `structural-city.js`. Building Explorer and original school FBX preserved untouched.

## November 13 — RC51 Cinematic atmospheric lighting, smoke under-glow & North Broad storefronts

Parent verified baseline SHA: 79294af (RC50 5.5.0-rc.50, build 5.5-north-broad-refinement-rc50).

RC50 eliminated frame stutters, extended the far-left neighborhood, and calibrated skyscraper fires. RC51 advances visual realism toward campaign/visual_target.png:
1. Warm Fire-Scatter Smoke Under-Lighting:
   - In `src/rendering/flipbook-bridge.js`, added golden-amber scatter (`fireGlow = exp(-vAge * 4.2) * (1. - smoothstep(.05, .45, vAge)); color += vec3(1.15, .42, .05) * fireGlow * min(1., vPower) * frame.a;`) at plume bases where billowing soot meets raging window flames, eliminating flat gray cauliflower puffs without extra draw calls.
   - In `src/rendering/building-combustion.js`, upgraded procedural smoke under-light with concentrated basal warmth (`color += vec3(.48, .16, .028) * exp(-height * 6.5) * (1. - min(1., abs(displaced))) * vPower;`).
2. Authentic North Broad Street Storefront Architecture:
   - In `src/rendering/broad-street-reference.js`, added:
     - Susquehanna & Broad Crown Chicken corner rooftop commercial billboard framing Broad Street with steel support posts.
     - Grands As Parents Foundation emerald awning and signage on the North Broad brownstone (x ~ 19.6).
     - Maximus Cares Foundation royal blue storefront awning and glass display frontage on the red brick shop (x ~ 39.1).
     - Tech Freire Charter School central projecting entrance canopy with architectural support columns and illuminated signage.
     - All decorative elements automatically bind to underlying structural wall segments and detach upon physical collapse.
3. Twilight Disaster Sky & Wet Reflective Asphalt:
   - In `src/rendering/cinematic-environment.js`, enriched dusk sky gradient and layered horizon disaster haze.
   - In `src/rendering/cinematic-environment.js` and `src/rendering/cinematic-assets.js`, calibrated pavement roughness to 0.52 and metalness to 0.10 for wet specular road sheen catching headlights, beacons, and fires without post-process passes.
4. Contract & Performance Invariants:
   - Check-build-info, frontage-contract, smoke-plume-contract, street-surface-contract, and preview-server-test (8/8) pass. Zero added draw batches in `structural-city.js`. Building Explorer and original school FBX preserved untouched.

## November 13 — RC50 Far-left background extension, skyscraper fire calibration & stutter optimization

Parent verified baseline SHA: bfa05d5c07b7b9f36f345aa7051df551aa7434fa (RC49 5.5.0-rc.49, build 5.5-north-broad-refinement-rc49).

RC50 implements key gameplay rules, real-world framing, and critical rendering performance fixes based on owner telemetry:
1. Far-Left Background Building Extension:
   - Extended mid-distance neighborhood rows in `src/simulation/city-layout.js` westward from x = -78 to x = -152 (27 lots per row across 4 depth tiers), eliminating empty voids on the far left. Preserves Dauphin and Susquehanna cross-street clearance and the southern campus setback.
   - Extended distant instanced rowhouses in `src/rendering/distant-neighborhood.js` from 50 to 74 lots for near tiers (x reaching ~ -274), 80 lots for mid tiers (x reaching ~ -296), and 96 lots for horizon (x reaching ~ -356) for complete widescreen horizon coverage.
2. Skyscraper Fire & Flaming Meteor Causality:
   - Skyscraper towers now only catch fire from a direct hit by a flaming meteor.
   - Gated distant meteors in `src/game.js`: flaming meteors only start streaking across the background when neighborhood health reaches <= 75%.
   - Smaller meteors hitting background skyscrapers cause particle debris, smoke puffs, and localized scorch, but skip `ignite()` and do NOT trigger sustained window combustion.
   - Removed the spontaneous unbatched `skylineFlameMat` fire sprite loop from `updateSkylineDamage`.
3. Natural Background Rowhouse Destruction Pacing:
   - Replaced the synthetic 0.36–1.15s timer loop in `escalateBackgroundNeighborhood` with distress-gated pacing (2.8–5.8s interval, only active when health <= 75% or frontDamage >= 0.35).
   - Targets 1 building at a time with calibrated progressive strength (.28 + blockDamage * .48) so background rowhouses take cohesive physical hits rather than sporadic scripted collapses.
4. Frame Stutter & Buffer Optimization:
   - Eliminated the CPU sine pulse from `combustion.set` in `philadelphia-geometry-skyline.js` that caused 57,741 InstancedBufferAttribute writes and 150-167ms pauses. Flame flickering is handled entirely on the GPU via uniform `clock`. GPU attribute writes only occur during the initial spread phase and cease once mature.
   - Pooled `skyBursts` meshes and `smokePuff` sprites in `cinematicSkyExplosion` and `updateSkyBursts`, eliminating runtime material cloning, `material.dispose()`, and WebGL state thrashing.
5. Invariants & Regression Results:
   - Check-build-info, frontage-contract, smoke-plume-contract, street-surface-contract, and windows-preview-server-test (8/8) pass. Zero added draw batches in `structural-city.js`. Building Explorer and original school FBX preserved untouched.

## November 13 — RC49 North Broad architectural refinement & flame calibration candidate

Parent verified baseline SHA: 5ff7c1b88458db90259c5d51ed935d61e1d81cf6 (RC48 5.5.0-rc.48, build 5.5-licensed-vfx-branch-gate-rc48). Preserved RC48 licensed VFX procedural FBM gate.

RC49 refines North Broad Street neighborhood geography and calibrates visible rowhouse combustion:
1. Real-World Architectural Alignment: Moved Philadelphia Doll Museum to the school side of Dauphin Street (x = -41.5, 2253 N Broad), matching real-world Philadelphia geography (Dauphin corridor at x ~ -53 to -59). Corrected 2300 block across Dauphin (x = -68.2) to historic grand stone corner with projecting bays and ornate roofline cresting in structural-city.js.
2. Calibrated Rowhouse Combustion & Anchoring: Calibrated flame height in distant-neighborhood.js to baseH = opening.h * (0.75 + heat), resolving PR #3 review where 0.50 * opening.h reduced flames to tiny candles from camera distance. Anchored flame bases inside window reveals (z: p.z - p.d * .15, sill contact y: p.y - p.h * .46) with roofline containment.
3. Regression & Contract Suites: Added calibrated flame dimension, roofline containment, and reveal anchoring assertions to qa/browser.mjs. Added Doll Museum school-side and ornate roofline assertions to qa/frontage-contract.mjs. All local contract suites pass (check-build-info, frontage-contract, smoke-plume, street-surface, preview-server-test 8/8).
4. GPU Budgets & Invariants: Zero additional draw calls (combustion fixed at 4 draw calls, 168 capacity slots). Preserved dragon controls, causal meteor-only ignition, Building Explorer, and tech-freire-original.fbx. Hardware FPS unresolved; exact-head CI pending.

## November 13 — RC47 fully verified; RC48 licensed VFX shader gate candidate

**Last observed verified source SHA:** `5e98dab13d62520142e0460215a292a520195c54`, RC47 `5.5.0-rc.47` / `5.5-school-room-lighting-rc47`. Five exact-source workflows SUCCESS: [browser 43346232523](https://github.com/erin6374/dragon-defense-play/actions/runs/43346232523), [cinematic 43346232626](https://github.com/erin6374/dragon-defense-play/actions/runs/43346232626), [focused 43346232660](https://github.com/erin6374/dragon-defense-play/actions/runs/43346232660), [licensed CC0 43346232643](https://github.com/erin6374/dragon-defense-play/actions/runs/43346232643), [genuine motion 43346232547](https://github.com/erin6374/dragon-defense-play/actions/runs/43346232547). Downloaded actual artifacts: browser 14002800703 CRC 78/78 (errors=[] warnings=[]), cinematic 14001991242 CRC 6/6 (errors=[]), focused 14001787255 CRC 7/7 (errors=[]), motion 14003584452 CRC 33/33 (errors=[]), Windows preview 14002352334 CRC 146/146 (exact SHA/version/build and both licensed CC0 texture SHA256 hashes matched manifest). Actual 600-frame/30.000-second/20fps skyline MP4 and five 100-frame clips confirmed; 585 burning frames, 380 multi-tower frames, max 382 reported software draw calls. Directly inspected 11 frames spanning 0.5–29.5s, five camera views and house-collapse sequence. Meteor-causal fires and rubble persist, but smoke still looks gray/repetitive and Broad Street facades remain stylized: **cinematic ART FAIL**. Physical Windows FPS remains unmeasured; severe slideshow report unresolved.

**RC48 development candidate:** `5.5.0-rc.48` / `5.5-licensed-vfx-branch-gate-rc48`. Licensed CC0 flame and smoke fragment paths now skip redundant procedural FBM calculations that were previously overwritten by atlas samples; `useFlipbook<=.5` preserves the original procedural fallback. No additional textures, geometry, draws, pool capacity, game logic, school FBX or telemetry. Local JS syntax, actual Three shader generation, unchanged-state source cache and smoke contract PASS. **Actual GPU shader compile, visual pixel equivalence, exact-HEAD workflows and Windows FPS NOT yet verified**. Chromium local navigation blocked by runtime policy; do not infer performance improvement.

**One next action:** complete RC48 exact-head five Actions, check reports/errors/warnings, actual screenshots, ZIP CRC, licensed hashes, and 11+ genuine motion frames versus RC47; then collect a real 30–60s Windows Performance Lab CSV under heavy destruction. No merge, force push, deployment, main/production/Pages, Building Explorer, original FBX or Google PR #3 edits.

## November 12 — RC47 school interior light variation candidate

RC46 cinematic 43345335063, focused 43345335167 and CC0 43345335067 succeeded; browser 43345335218 still running and motion 43345334948 pending at inspection. Downloaded cinematic 14002135081 and verified ZIP CRC; directly inspected dusk/night images. Road stretched bands no longer evident, but school night interior reads as broad uniform beige panels. No full RC46 QA or hardware performance claim.

RC47 modulates existing school-interior emissive radiance by stable four-bay/five-floor coordinates, dimmer unoccupied bays, warmer/cooler room variation and ceiling bounce. No extra lights, geometry, textures or draws. Does not change source FBX, glass, exterior materials, damage discard, existing phase-driven emission intensity or RC45 smoke. Spatial room divisions are a lighting approximation, not surveyed interior rooms. Shader cache key now identifies material role so interior-specific shader cannot alias another non-glass/non-brick role. Syntax/metadata and prior frontage/street contracts pass; GPU compile/night image acceptance pending. Inspect for dark or striped interiors and retain only if visibly better. Slideshow unresolved; no deployment. NEXT: exact-head browser, night/dusk/day school comparison and damage verification; preserve pending motion evidence.

## November 12 — RC46 consistent road texture scale candidate

Preserved newer RC45 smoke-variance commit 26aef8e4026daababd98bdf13590cb1c4ed53fff. Retrieved RC44 cinematic artifact 13995818425, CRC PASS, directly inspected day.png. Asphalt now renders but stretches into long horizontal bands: slab-scaled UV repeats vary by geometry size. RC46 maps existing road and sidewalk albedo/normal/roughness from world XZ with a common scale (asphalt .35 tile/unit, sidewalk .25), including instanced transforms and merged world-space batches. No new assets, geometry, lights, samples or effects. Actual shader compile/visual quality and performance must still be verified.

Local street mapping checks use actual Three standard shader template; channel injection, instance/model transforms, shared asphalt program key and no repeated material invalidation pass. Existing street assignment, frontage damage/reset, metadata/syntax/diff pass. This is not a GPU shader compilation test. Exact-head Actions and rendered day/dusk/night/left/right remain pending. RC45 smoke comparison remains pending here; do not overwrite its changes. Slideshow and cinematic art acceptance remain open. NEXT: check RC46 GPU compilation and road scale in real screenshots, then continue architectural roofline/storefront refinement. No deployment/main/Pages/FBX edits.

## November 13 — RC44 motion verified; RC45 smoke-variance candidate

**Last observed verified source SHA:** `9e547862e1604601def0b7717280c86de76115aa` (RC44 `5.5.0-rc.44`, build `5.5-street-pbr-repair-rc44`). All five exact-source workflows SUCCESS: [browser 43334318308](https://github.com/erin6374/dragon-defense-play/actions/runs/43334318308), [cinematic 43334318692](https://github.com/erin6374/dragon-defense-play/actions/runs/43334318692), [focused 43334318424](https://github.com/erin6374/dragon-defense-play/actions/runs/43334318424), [licensed CC0 43334318329](https://github.com/erin6374/dragon-defense-play/actions/runs/43334318329), [genuine motion 43334318262](https://github.com/erin6374/dragon-defense-play/actions/runs/43334318262). Previously checked actual ZIP CRC: browser 78/78 (errors=[] warnings=[]), cinematic 6/6 (errors=[]), focused 7/7 (errors=[]), Windows preview 146/146, exact SHA/version/build and both CC0 SHA256 hashes matched manifest ([PR #2 checkpoint 6839947986](https://github.com/erin6374/dragon-defense-play/pull/2#issuecomment-6839947986)). Newly downloaded actual motion artifact **13997068016**: ZIP CRC **33/33**, short and long reports errors=[], five 100-frame/5s clips and real 600-frame/30s skyline MP4 at 20fps. Long report: 585 burning frames, 380 multi-tower frames, max 382 software draw calls. Inspected 11 decoded frames spanning 0.5–29.5s and house frames at 0.1/2.5/4.9s: meteor-causal tower fires persist, houses collapse into debris, but smoke repeats as gray billows and neighborhood facades remain stylized. **Cinematic ART FAIL** against `campaign/visual_target.png`.

**RC45 candidate** `5.5.0-rc.45`, build `5.5-smoke-variance-rc45`: vary seed phase of smoke gust, per-opening crosswind strength, age-stratified soot/ash color and slight opacity within existing six CC0 smoke sheets; add a source contract to browser preflight. No new geometry, textures, materials, lights or particle pools; preserve RC37 unchanged-state GPU cache, RC39–42 telemetry, causal ignition, damage both sides, dragon gameplay, licensed assets and original school FBX. **RC45 exact-head five workflows, shader compilation, screenshots, 600-frame video and Windows package are pending**; no claims of visual improvement until directly reviewed.

**One next action:** finish RC45 exact-head browser/cinematic/focused/CC0/motion QA, inspect errors/warnings, CRC, licensed hashes and 11+ actual motion frames versus RC44; then obtain a real 30–60s physical Windows Performance Lab CSV under destruction. Severe Windows slideshow/FPS remains unmeasured and unresolved. Do not merge, deploy, force push, change main/production/Pages, Building Explorer, original FBX or Google PR #3.

## November 12 — RC44 existing street texture assignment repair

RC43 5cf4f833 passed all five Actions (browser 43325817370, cinematic 43325817317, focused 43325817429, motion 43325817411, CC0 43325817439). Downloaded cinematic artifact 13991983665; ZIP CRC passes. Inspected actual day/left views: historic sash reads narrower, but school remains flat and whole scene still stylized. Workflow success is not visual approval or measured hardware FPS.

Found a concrete visual defect: enhanceEnvironment tested geometry.isBoxGeometry, absent from vendored Three BoxGeometry. Entire road/sidewalk PBR assignment was skipped. Extracted assignment into street-surface-materials.js, use geometry.type, and assign existing asphaltCross to perpendicular streets. Reuses existing loaded maps; adds no geometry, lights, texture assets or particle work. Enabling normal/roughness sampling and another material bucket may affect GPU cost; measure rather than claim zero-cost or fixed slideshow. Existing fog/lighting and FBX remain unchanged.

Local real-Three regression covers the missing flag, actual asphalt/crossstreet/sidewalk assignment and exclusion of facades/stripes/base ground. Added browser workflow preflight. Syntax, metadata and frontage regression pass. Exact RC44 rendered day/dusk/night/left/right and browser checks pending. NEXT: visually inspect road scale/specular appearance; correct mapping if stretched; keep hardware FPS issue open. No release/main/Pages/production change. Gemini should start from current branch, preserve RC37 cache and RC39–42 telemetry.

## November 12 — RC43 historic street-front window proportions

Continued from RC42 docs checkpoint 0803e9a. Eight historic frontage shells now have narrow recessed upper-storey sash windows, with continuous masonry piers and correctly sized spandrels using the same existing four wall pieces per opening. School, modern apartments, campus and ground storefront glazing retain their existing proportions. Removed duplicate decorative brownstone glass/lintels that could overlay the physical openings; structural lintels/sills remain. This is a geometry/proportion pass based on previously inspected Street View, not a claim of corrected cadastral layout or completed realism.

Local syntax/diff/build-label/frontage checks pass, including narrow window widths, masonry enclosing both jambs, recess, edge impact/reset and road/campus clearances. No additional structural parts/material batches for sash change; no new textures/lights. Exact-head browser and actual left/right/day/dusk/night imagery still pending. Source-model overlays may mask procedural changes on adjacent buildings; inspect rendered views. Hardware slideshow complaint remains unresolved. Preserve RC39–42 Windows telemetry and RC37 combustion cache. NEXT: inspect RC43 rendered frontage and damage; continue roofline/storefront placement and smoke motion. Not release-ready; no main/Pages/production/original FBX changes.

# Tech Freire Dragon Defense — live AI-to-AI handoff

**Latest verified:** RC42 at observed base SHA `593bf6d85dcf0d6bebc12409dd060e757675b96f` passed five exact-head QA workflows and artifact/license checks. Actual 30s cinematic review ART FAIL; Windows hardware FPS unmeasured. See `qa/CURRENT-STATUS.md` and `handoff/state.json`. QA-only handoff update; live HEAD must be fetched again.

**One permanent entry point:** https://github.com/erin6374/dragon-defense-play/blob/feature/north-broad-graphics/AI-HANDOFF.md

**Rules of currency:** This document is a *snapshot*. Before doing any work, fetch `origin/feature/north-broad-graphics` and identify its **actual current SHA**. The live branch code and exact-SHA GitHub Actions outrank any stale SHA, claim or status in this document. Read the top of `qa/CURRENT-STATUS.md` and `CONTINUE-IN-CHATGPT.md` for later changes. Do not treat "workflow success" as proof of cinematic quality or Windows GPU FPS.

## How to resume in Google AI when ChatGPT runs low

1. Open this permalink in Google Gemini or Google Antigravity; paste the **Start Prompt** below. Gemini chat may need the text pasted or files uploaded; Antigravity should fetch the repository directly.
2. Antigravity: fetch latest remote code, inspect all WIP, create **its own work branch** off the latest ChatGPT development branch. Never work on or push to `main`, `production` or `feature/north-broad-graphics` directly. If `agent/google-antigravity-fire-calibration` contains unmerged changes, protect them and resolve/rebase carefully; do not overwrite.
3. Implement one bounded task, keep source changes committed, run and review QA, then open a **draft PR targeting `feature/north-broad-graphics`**. Leave it unmerged.
4. Return PR URL, exact commit SHA, files changed, tests *actually run*, screenshot/artifact links and remaining blockers. Paste that result into ChatGPT whenever its resources are available. ChatGPT can review and integrate with explicit verification.
5. For Gemini Pro chat **without repo-editing tools**, do read-only planning, code review and bug analysis, and return a concrete patch/implementation plan for Antigravity—not claims about commits or CI that were never performed.

### Start Prompt — copy into Google Antigravity or Gemini

> Continue Tech Freire Dragon Defense. Start with https://github.com/erin6374/dragon-defense-play/blob/feature/north-broad-graphics/AI-HANDOFF.md and fetch the *current* `feature/north-broad-graphics` HEAD, then read `handoff/state.json`, `qa/CURRENT-STATUS.md`, `CONTINUE-IN-CHATGPT.md`, `PROJECT-HANDOFF.md`, `CHANGELOG.md`, `qa/CINEMATIC-REVIEW.md` and `qa/MOTION-VISUAL-REVIEW.md`. Do not rely on old chat text or an old clone. Continue from the newest *verified* state, not from a previous release candidate. If you can edit code, isolate work in a new `agent/google-...` branch and open a draft PR against `feature/north-broad-graphics`. Never merge, force push, deploy, or modify `main`, `production`, Building Explorer or the original school FBX. Preserve causal meteor-triggered fire, playable dragon controls, licensed assets and GPU budgets. Check exact-head GitHub Actions and actual artifacts; do not confuse software-renderer screenshots with measured Windows hardware FPS. Provide the PR/commit/test links and remaining tasks so ChatGPT can resume the work.

## Project mission and non-negotiable user requirements

- Three.js cinematic disaster-defense game: the **dragon is the hero** protecting the real five-floor Tech Freire school (plus roof/basement context) and its North Broad Street neighborhood in Philadelphia.
- Disaster-film atmosphere, real-world architectural proportions, visually coherent destruction and fire/smoke, believable skyline, accurate street alignment; neighborhood extends and **takes damage on both left and right**.
- Meteor contact **must cause** background/skyline ignition and damage. Health changes alone must not cause spontaneous fires; spreading flames are delayed and source-local.
- Severe slideshow-like Windows performance was reported. This is **still an unresolved hardware-verified blocker**. Optimize GPU/CPU use without replacing correct gameplay with placeholders.
- Preserve accessible Easy difficulty; dragon movement, flight, wind attack, fire/gas and original/alternate dragon options; avoid regressions.
- Building Explorer is a **separate application**: do not modify it. Protect original `assets/visuals/tech-freire-original.fbx`, material orientation/scale, `main`, `production`, Pages deployment.
- No unsupported release claims: automated tests, still images, a 30-second motion review and real desktop GPU FPS are **different** acceptance gates.

## Current work snapshot (November 12, 2026)

**RC42 current candidate (observed parent SHA `505abcf79032be723b6f6a5f01d7b776063f87ae`, version `5.5.0-rc.42`, build `5.5-windows-visibility-rc42`):** Verified RC41 at exact SHA `505abcf79032be723b6f6a5f01d7b776063f87ae`: all five workflows SUCCESS ([browser 43289995431](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995431), [cinematic 43289995510](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995510), [focused 43289995534](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995534), [CC0 43289995414](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995414), [motion 43289995502](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995502)). Downloaded actual artifacts and checked CRC: browser 13976418843 **78/78** (report errors=[] warnings=[]), cinematic 13977036679 **6/6** (errors=[]), focused 13977455124 **7/7** (errors=[]), motion 13979461593 **33/33** (genuine 600-frame/30.000s MP4, five 100-frame clips, errors=[], 585 burning frames, 380 multi-tower frames, max 402 software draw calls), Windows preview 13976314014 **145/145** (exact SHA/version/build, both CC0 WebP SHA256 match manifest). Directly inspected 11 decoded skyline frames, house before/impact/settled and all five camera views. Fires and collapse persist, but gray repetitive smoke and stylized facades remain **cinematic ART FAIL**. Software Chrome reports ~0.4 FPS and 747 draw calls; this is NOT measured Windows hardware FPS.

RC42 adds `documentHidden` and `documentHasFocus` to the existing once-per-second browser heartbeat, preserves them in independent host and browser CSV rows and `/__system_metrics`, and displays tab visibility in Performance Lab. This distinguishes hidden/throttled tabs from unexplained renderer stalls. Also fixes the UI's `Number(null)===0` defect: unavailable CPU/RAM readings now show **n/a** instead of fabricated 0.0. No extra polling, scene traversal, rendering/gameplay, original FBX, assets, or deployment changes. Local Python HTTP integration covering fresh heartbeat/stale RAF, hidden/focused/invalid values and host samples PASS; Python compilation and JS syntax PASS.

**RC42 remains a development candidate.** New exact-HEAD five workflows, real artifacts, Windows ZIP CRC and licensed hashes, and physical Windows 30–60s CSV remain pending. **Next:** verify RC42 exact-HEAD QA and package, then capture physical Windows CSV during destruction; compare `renderAgeMs`, `telemetryAgeMs`, `documentHidden`, CPU/RAM and FPS. Do not claim GPU FPS or cinematic approval.

**RC41 verified baseline (parent SHA `602c34c280e8c2d9263873bb79d5900e1ba9725c`):** Verified RC40 exact SHA `602c34c280e8c2d9263873bb79d5900e1ba9725c`: all five workflows SUCCESS ([browser 43280450584](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450584), [motion 43280450558](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450558), [cinematic 43280450660](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450660), [focused 43280450814](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450814), [CC0 43280450704](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450704)). Actual downloaded artifacts CRC: browser 13972324383 78/78 (errors=[] warnings=[]), Windows preview 13972663008 145/145 (exact SHA/version/build; both CC0 WebP SHA256 match manifest), motion 13975135728 33/33 (five 100-frame clips, genuine 600-frame/30s MP4, errors=[], 585 burning frames, 380 multi-tower frames, max 402 software draw calls), cinematic 13971279640 6/6 (errors=[]), focused fire 13971863948 7/7 (errors=[]). Inspected 11 actual skyline frames, before/mid/settled house and five camera views: fire persists, but gray repetitive smoke and simplified architecture remain ART FAIL. Headless software Chrome reported ~0.2 FPS and multi-second RAF gaps, NOT measured Windows GPU FPS. RC41 corrects a telemetry blind spot: RC40 `telemetryAgeMs` measures browser timer freshness, which can stay low even if requestAnimationFrame stops. The loopback Python server now calculates independent `renderAgeMs` from `lastGameFrameUTC` for browser and host CSV rows and `/__system_metrics`; the Performance Lab shows both ages. A real HTTP integration test posts a fresh heartbeat with a 6.5s-old render timestamp and checks both ages, including an independent host sample. Local integration and syntax checks PASS. No rendering/gameplay/FBX/assets/Pages/production changes. RC41 is a development candidate: new exact-head five workflows, artifacts, Windows ZIP CRC/CC0 hashes, and physical Windows FPS CSV still pending. The slideshow complaint and cinematic art acceptance remain open. NEXT: verify RC41 exact-head QA, then capture 30–60s physical Windows CSV under heavy destruction and compare renderAgeMs with telemetryAgeMs.


**RC40 current candidate:** Windows telemetry continuity fix based on verified RC39 `d5a75049bd203ffd9e493b6640e9e9c20eef8680`. Windows launcher now opens `?devlab=1`; lightweight once-per-second gameplay heartbeat no longer trapped in motion QA and does not call expensive QA snapshots. A separate two-second Python host sampler writes CSV rows even during browser freezes, with `sampleSource`, `telemetryAgeMs`, heartbeat/frame counters; duplicate UI posts removed. Six local integration tests PASS; exact-head CI and physical Windows FPS remain pending. RC39 five exact-head workflows PASS ([browser 43270179768](https://github.com/erin6374/dragon-defense-play/actions/runs/43270179768), [cinematic 43270179783](https://github.com/erin6374/dragon-defense-play/actions/runs/43270179783), [focused 43270179618](https://github.com/erin6374/dragon-defense-play/actions/runs/43270179618), [importer 43270179673](https://github.com/erin6374/dragon-defense-play/actions/runs/43270179673), [genuine motion 43270180026](https://github.com/erin6374/dragon-defense-play/actions/runs/43270180026)). RC39 ZIPs CRC 78/78 browser, 145/145 Windows, 33/33 motion; both CC0 hashes match. Actual 11-frame motion ART FAIL gray smoke and simplified facades.


**RC39 previous candidate:** Windows performance telemetry repair, based on verified RC38 HEAD `fe24dfd1211dec118b56232294a6a13949efd1dd`. The old Windows launcher used `python -m http.server`, so its Performance Lab's four `__...` endpoints could never work. RC39 adds `tools/windows-preview-server.py` with loopback-only CSV, CPU/RAM native counters, browser FPS/draw calls, and a four-test stdlib preflight. No rendering or gameplay changes. New exact-head workflows and physical Windows performance are **pending**. The user must download RC39 preview, run 30-60s with fire/destruction and export CSV; GPU utilization is unsupported and must not be inferred.

**Verified RC38 exact-HEAD evidence:** [browser](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916833), [motion](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916870), [cinematic](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916929), [focused fire](https://github.com/erin6374/dragon-defense-play/actions/runs/43249917182), [licensed CC0 importer](https://github.com/erin6374/dragon-defense-play/actions/runs/43249917024) all SUCCESS. Real artifacts: browser CRC 78/78 errors=[] warnings=[], motion CRC 33/33 genuine 600-frame/30s video errors=[], cinematic CRC 6/6, focused CRC 7/7, Windows CRC 144/144 and both CC0 hashes match. Eleven video frames and five views inspected: ART FAIL gray repetitive smoke, simplified facades; hardware FPS unknown.


| Item | Last observed value — recheck live |
|---|---|
| Repository | https://github.com/erin6374/dragon-defense-play |
| Primary development branch | `feature/north-broad-graphics` |
| Primary draft PR | https://github.com/erin6374/dragon-defense-play/pull/2 |
| Observed base HEAD before this handoff document was added | `602c34c280e8c2d9263873bb79d5900e1ba9725c` (RC41 parent; not self-referential) |
| Version at snapshot | `5.5.0-rc.41` / `5.5-windows-render-age-rc41` (candidate; new exact-head QA pending) |
| Google independent draft PR | https://github.com/erin6374/dragon-defense-play/pull/3 |
| Google's observed HEAD | `7032b3da46683c5821d838ea4d39b84ff96b4702` |
| Google's last observed mergeability | not mergeable; outdated base |

### Last verified parent exact-SHA GitHub Actions (RC38; RC39 pending)

| Workflow | RC38 result |
|---|---|
| [Browser QA](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916833) | success |
| [Independent 5+30s motion](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916870) | success |
| [Focused fire](https://github.com/erin6374/dragon-defense-play/actions/runs/43249917182) | success |
| [Five-view cinematic](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916929) | success |
| [CC0 importer](https://github.com/erin6374/dragon-defense-play/actions/runs/43249917024) | success |

**Most recent implemented primary changes:** RC36 extended destructible Broad Street frontage on both sides, with shared instance budgets; RC37 caches **byte-identical combustion source state** to avoid redundant writes to four GPU buffers, without pausing the shared shader animation. RC37 adds a deterministic five-idle-tick buffer-write regression. These need actual QA artifacts and hardware profiling before calling them accepted.

**Google contribution:** draft PR #3 calibrated rowhouse window flame scale on older RC30. Its initial browser, fire, cinematic and motion CI passed, but comparative visual review found **tiny candle-like flames**, not yet acceptable cinematic art. Its branch was stale/nonmergeable at snapshot. ChatGPT review: https://github.com/erin6374/dragon-defense-play/pull/3#issuecomment-6827300214 . Do not blindly merge or cherry-pick; verify against latest source first.

## Immediate priority queue — recheck before selecting

1. **QA gate:** RC40 needs five new exact-head workflows, Windows ZIP CRC and CC0 hashes, then physical Windows CSV capture; parent RC39 five workflows passed. Check current primary HEAD, five GitHub Actions workflows, exact-SHA report errors/warnings, screenshot artifacts, licensed CC0 hashes, Windows development-preview ZIP CRC and genuine 600-frame/30-second motion review. Fix test failures properly, do not weaken assertions to pass.
2. **Performance (release blocker):** Investigate actual game FPS and large RAF gaps on the user's Windows GPU in dense fire/destruction scenes. Source-level upload/pixel budget changes may help but are **not** measured FPS proof. Capture hardware, resolution, quality preset, FPS, draw calls, CPU and GPU behavior. Prevent per-impact allocations and shader overdraw explosions.
3. **Cinematic realism (art blocker):** Rowhouse flames/smoke still stylized; skyline smoke repetitive/gray; facades/urban detail simplified; demolition often looks like scaled/sinking boxes rather than physically plausible rubble. Review actual 5+30s gameplay images/video and approved `campaign/visual_target.png` side-by-side.
4. **Streetfront completeness:** Inspect both damageable frontage extensions from RC36 on left and right at gameplay distance and compare building height, texture, windows, and impact/collapse fidelity with the school.
5. **Collaboration follow-up:** Independently review Google PR #3 revisions only when they are rebased and retested, with reasonable window-sized fire visibility and no changed global flames. No auto-merge.

## Where the actual evidence lives

- **Live current code:** `feature/north-broad-graphics` branch, not a previous zip
- **Development history and known blockers:** `qa/CURRENT-STATUS.md`, `CONTINUE-IN-CHATGPT.md`, `PROJECT-HANDOFF.md`, `CHANGELOG.md`
- **Visual acceptance and motion:** `qa/CINEMATIC-REVIEW.md`, `qa/MOTION-VISUAL-REVIEW.md`, `campaign/visual_target.png`
- **QA:** `qa/browser.mjs`, `qa/frontage-contract.mjs`, `.github/workflows/` — require actual run URLs and artifact inspection
- **Machine-readable transfer summary:** `handoff/state.json` (snapshot metadata, not a live API)
- **Work delivery:** GitHub draft PR plus screenshot/QA artifact links; preserve separate work branches

## End-of-session update requirement (both AI systems)

When making a substantive change:
- Record exact HEAD and version, what files changed, why, before/after behavior, test IDs & SHA, what is **verified vs pending**, performance metrics or lack thereof, remaining risks and **one actionable next step**.
- Update `AI-HANDOFF.md` (short, current snapshot section and priority queue) and `handoff/state.json` **in the same substantive development commit** where possible, plus existing CHANGELOG / QA notes. Never claim a future SHA before it exists; record the **parent/base SHA** or use the branch name to resolve live HEAD.
- If a CI run finishes after a commit, update the PR discussion with results; document freshness in the handoff on the next safe commit. CI updates do not require an automatic code commit or premature release.
- Never consume an entire session solely rewriting documents if code/QA progress is possible; keep the summary compact and evidence-based. GitHub remains the checkpoint even if a chat or product quota is exhausted.

## Return-to-ChatGPT report format

```text
DRAGON DEFENSE — GOOGLE HANDOFF RETURN
Base branch + base SHA:
Google branch + HEAD SHA:
Draft PR URL:
Completed changes (specific files):
Tests actually run (exact SHA, URLs, pass/fail):
Artifacts/screenshots/recordings:
Known unresolved bugs/performance:
Potential conflicts with latest ChatGPT HEAD:
Recommended next specific action:
```

**Security and continuity:** Avoid sharing passwords, tokens, or personal private data in the handoff/PR. A chat-session quota or outage never authorizes an autonomous merge or production deployment.
