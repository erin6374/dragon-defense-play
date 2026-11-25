# Paulo — realistic dragon asset audition (2026-11-08)

## Status and scope
This is an **asset evaluation only**. The production game and existing Dragon Defense RC2 remain unchanged; no third-party dragon has been substituted for the playable creature. Target: approved **C2 balanced heroic Western dragon**, four legs grounded when perched, semi-upright hovering/attacking, streamlined flight, with close-up-capable realistic skin/wing deformation.

The user provided two Sketchfab source ZIPs in ChatGPT. Their original binary assets are not committed to this GitHub repository. An independent Windows asset-audition archive has been generated in the conversation with those original sources, appropriately licensed credits, a texture-remapped FBX preview, and a compatible glTF material-conversion preview.

## Actual ZIP / rig audit

| Asset | European Dragon — Regina Cachoa | Animated Dragon Three Motion Loops — LasquetiSpice |
|---|---|---|
| Original | https://sketchfab.com/3d-models/european-dragon-82f393a2e6c048ad80c171ce3b3a7b87 | https://sketchfab.com/3d-models/animated-dragon-three-motion-loops-eca98cf6cd084c1596cecf716e110c29 |
| License | CC BY 4.0; required attribution/modification notice | CC BY 4.0; required attribution/modification notice |
| Source | Nested ZIP containing 7.08MB binary FBX v7400 and 2K/4K textures | 35.24MB glTF 2.0 binary GLB and duplicate extracted texture images |
| Geometry | 42.3k triangles per creator; 5 mesh parts | 19,544 triangles, 12,270 accessor vertices, one skinned mesh |
| Rig | 168 FBX skeletal limbs | 219 glTF skin joints (223 total nodes) |
| Clips | 5 stacks: Fly 3.29s, Walk 0.625s, Run 0.625s, Idle Stand 6.625s, Idle Sit 2.458s | 3: idle 12.43s, running 9.97s, flying 13.13s |
| Textures | 2K and 4K base-color, normal, roughness, cavity, separate eyes and teeth | Four embedded 2K images for diffuse, spec/gloss, normal and occlusion |
| Initial fit | Better ground-pose animation coverage and separate facial mesh components; hand-painted stylized palette needs upgrading | Lighter mesh, more detailed joint hierarchy; lacks an explicit sit/perch animation, requires material conversion |

### Integration blockers found

1. **European FBX texture file paths are creator-specific absolute Windows paths**, so the FBX must use Three.js `LoadingManager.setURLModifier` and/or be cleaned/re-exported from Blender. The audition package remaps them to bundled 2K textures; retain the original 4K masters for close-up tests. FBX-to-GLB conversion is still recommended before game integration.
2. **Three Motion Loops GLB declares `KHR_materials_pbrSpecularGlossiness` as required**, and Three.js removed that extension in r147. Dragon Defense uses Three.js r160. We created a separate **approximate conversion** to modern metallic/roughness GLB: nonmetallic material, base color preserved, roughness = 1 - original glossiness, original skin and all three animations preserved. This is not an exact colorimetric spec/gloss conversion; compare appearance with the source.
3. The approved hybrid posture needs **additional attack, hover, land, takeoff, rearing, hit, and wing-fold transition animations**. Neither source comes complete with those states. Free base ≠ fully finished cinematic Paulo.
4. Facial anatomy, wing skinning, weight maps and true close-up skin detail need visual examination on real hardware. Existing source images, textures and joint counts do not establish photorealistic appearance or animation deformation quality.
5. The local ChatGPT runtime could parse both ZIPs and scripts, but the Chromium WebGL smoke attempt failed GPU/display initialization. **No actual viewer-render pass or Windows GPU FPS has been verified.**

## Comparison viewing package

`Paulo_Realistic_Dragon_Asset_Audition_Windows.zip` is attached in the corresponding chat. Extract all, run `LAUNCH_VIEWER.cmd` (local URL http://127.0.0.1:8772/), switch model/clip, inspect front/side/top, mouth/wing/tail deformation, and evaluate lighting. European viewer can work offline with bundled Three.js; the three-motion candidate imports its `GLTFLoader` addon from jsDelivr and needs a live internet connection. **This is not an integrated game release.**

## Next milestone and acceptance gates

1. Run visual audition of both assets; compare realistic close-up appearance, the four-foot perched pose, wing topology and root deformation, jaw/eye animation, silhouette and performance.
2. Pick **one** foundation based on observed quality, not solely rig size or clip count. European Dragon is the preliminary favorite because of ground/sit and facial mesh coverage, but the result is not yet approved.
3. Use Blender (automated command line where possible) to clean topology, rig, texture assignment and retarget/reanimate the C2 postures; export optimized GLB with metallic/roughness material maps, full skin/animations, normal maps and LOD.
4. Integrate the new creature as **optional visual-only** child of the authoritative gameplay dragon root with a runtime fallback to the existing procedural model. Preserve existing wind, fire, gas, collision, score, camera and physics.
5. Run actual visual game screenshots and animation QA, Windows GPU benchmarking, then package a new candidate. No production-main merge/Android APK without separate acceptance.

## Required source credits
- \"European Dragon\" by Regina Cachoa, licensed CC BY 4.0; source link above; modification notice required.
- \"Animated Dragon Three Motion Loops\" by LasquetiSpice, licensed CC BY 4.0; source link above; material-conversion notice required.
- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
