# Antigravity integration task

Integrate this asset pack into the current Dragon Defense release candidate on a feature branch. Use the active game's build and asset conventions. Keep the Tech Freire Revit/FBX school in place.

1. Import the 11 GLBs marked replacement in manifest.json. Match by studio footprint ID or verified street address. Each file has its own local origin at grade on the Broad Street wall. Units are meters, Y points up and local +Z faces Broad. Placement vectors use the studio coordinate frame. If the game uses another frame, align two known parcel anchors and verify a third before placing the batch. Preserve alleys, gaps and setbacks. Replace each matched visual once its asset loads successfully. Retain the existing fallback for load failures.
2. Apply the game's environment reflections to the PBR glass, preserve alpha blending and verify depth sorting at the normal gameplay angle. Rowhouse and commercial interiors have simplified floor slabs and interior back walls. Use the game's existing light cycle. Sign images are embedded.
3. Bind the imported visual groups to the existing parcel health, impact and collapse system. Map named floor, facade, cornice, roof and sign groups to damage stages. Hide the previous visual during normal play and after collapse. The church has grouped exterior geometry and needs a game-side interior or rubble proxy when opened. Preserve existing collision proxies unless re-alignment is needed.
4. Keep watts-example.glb out of automatic placement. It is an unlocated rear-addition study with a projecting upper bay. Match a specific rear footprint and its yard setback before using it. Its +Z points toward Watts. The other files face Broad.
5. Verify the entire strip in the browser at day and night, then damage a rowhouse, a shop and the church. Check console/network errors, duplicate geometry, transparent windows, foundation alignment, frame time and disappearance of the intact visual at collapse. Update the game's offline cache and build ID as applicable. Provide a playable browser preview, the address-to-game-ID mapping and a list of unresolved matches.

## Visual acceptance checks

- 2217 and 2219 have two upper openings per floor and entrances on the outer edges of the pair. 2227 has a right-hand entrance, two adjacent ground-floor windows and a green sign.
- 2231 and 2233 have two windows on each upper floor and distinct green and blue storefront signs. 2239 and 2241 have opposing stoops and rounded entry canopies.
- 2251 and 2253 carry the PCs for People and Philadelphia Doll Museum signs. The museum has a shuttered storefront.
- 2309–13 has three glazed bays with three vertical divisions per bay, pale fluted piers, a central entrance and the Philadelphia Electric Company inscription.
- Berean has a faceted roof, corner star window and red entrance, plus a secondary red entrance and ramp facing the restaurant lot.

The visible Broad elevations are based on supplied photographs. Measurements, occluded surfaces, interior arrangements, signs and colors are approximations. Footprint depth represents the mapped outline; exterior height transitions behind the photographed front are simplified. The footprint ID wins over the Street View camera address. The package supplies visual assets and placement metadata. Gameplay bindings and in-engine testing are part of the integration task.
