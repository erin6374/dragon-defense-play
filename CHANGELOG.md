## 2026-11-08 — Restore in-game dragon model comparison (QA pending)
- The original/experimental procedural Paulo model toggle is now visible in the normal full HUD, not gated behind `?paulo=1` or QA mode. Original dragon remains the default and is restored on toggle-off or preview-rig initialization failure. Gameplay root, attacks, score and physics are unchanged.
- Button labels distinguish the procedural Paulo preview from the **not-yet-integrated licensed European Dragon FBX**. QA exercises real button clicks and confirms original fallback.
- Cinematic HUD still hides low-priority buttons; switch to full HUD (H) to access the model toggle. Latest exact-head browser QA/screenshots pending. Flight leg-tuck, banked eagle-style turning and perched rear-up turning remain planned, not implemented.

## 2026-11-08 — Paulo’s street gale
- Strengthened the held-and-released wind attack. Oncoming buses and trucks slide backward, passenger cars rock onto their sides, and pedestrians tumble, skid and get back up.
- Street trees and foreground shrubs bend with the gust. Larger dust spirals and tumbling litter use the two existing instanced draw batches.
- Wind falls are separate from blast injuries and ambulance rescue scoring. Added browser regression checks for displacement, tilt, recovery, foliage, particle limits and unchanged score, health and wave.

## 2026-11-08 — Nearest swept 3D meteor interception (QA pending)
- Player fireballs now test the whole frame segment against meteor collision spheres and select the earliest 3D entry contact, rather than taking the first match in reverse meteor array order. Retains existing damage, shrapnel, scoring, fragment and blast effects.
- Added source-level QA guard; exact-head browser QA and visual/gameplay verification still required. Does not yet apply to wind, gas or helicopters.

## 2026-11-08 — Runtime QA for ordinary-wave Paulo position (pending exact-head QA)
- Added QA-only `advanceOrdinaryWave()` hook to advance a live non-chapter wave through the real `newWave()` path.
- Browser regression starts wave 2, moves Paulo to (31,23,15), advances to wave 3 and asserts x/y/z world coordinates preserved; restores wave 1 before existing QA.
- No gameplay changes, deployment or performance claims. Verify exact-head QA before acceptance.

## 2026-11-08 — Paulo retains free-flight position between waves (QA pending)
- Removed unconditional `perchDragon(false)` from `newWave()`; ordinary wave transitions no longer teleport Paulo to the school roof. Initial game reset and explicit chapter settlement perches remain.
- Added source-level browser QA assertions for the ordinary-wave function and initial reset. Requires exact-head browser QA and gameplay inspection; no real GPU performance claim.

## 2026-11-08 — RC9c high-wave QA toast timeout fix (new QA pending)
- QA #308 failed because a chapter announcement toast never cleared while the QA atmosphere-settle routine was controlling the simulation; the test's 10-second wait timed out.
- Record and clear only the screenshot DOM toast in Playwright instead of waiting for a gameplay timer; preserve game state, chapter logic and controls. Wave-15 screenshot remains subject to visual review after exact-head QA.
- No gameplay/renderer/source changes; development branch only. Real GPU FPS, licensed dragon, production and deployment remain untouched.

## 2026-11-08 — RC9c QA #307 chapter-announcement screenshot clearance (new QA pending)
- Verified exact-head [browser QA #307](https://github.com/erin6374/dragon-defense-play/actions/runs/42519919972) **passed** on `2400e1d`; downloaded its browser artifact and visually inspected the actual wave-15 screenshots. The cinematic is now hidden, but the separate 1.8-second **“A NEW CHAPTER BEGINS”** toast still blocks the skyline. Automated assertions did not check this overlay.
- In `qa/browser.mjs`, wait for the actual in-game `#toast` to clear before the high-wave screenshots, assert it is empty, and record the initial toast plus clearance in the QA report. Preserve chapter gameplay behavior and the wave-7 restore. No runtime source, physics, graphics, version or deployment change.
- **Do not certify the distant fire-glow appearance until fresh exact-head browser QA passes and both new screenshots are visually inspected.** Hardware GPU FPS, licensed European Dragon and new 3D combat features remain unverified.

## 2026-11-08 — RC9c QA high-wave capture fix (exact-head QA pending)
- Inspected [QA #306](https://github.com/erin6374/dragon-defense-play/actions/runs/42515153457): browser assertions, screenshots and packaging steps completed, but GitHub Actions cancelled while finalizing the **Windows preview artifact** after repeated upload-service JSON errors. Its QA artifact was retained; overall run is **cancelled, not passed**.
- Downloaded QA #306 screenshots and discovered that both purported wave-15 disaster-glow captures show the **chapter cinematic overlay**, not the actual game sky. The prior test verified the wave counter but did not dismiss the cutscene.
- Corrected QA to call the existing QA-only `closeCinematic()` immediately after staging wave 15, assert the overlay is hidden and gameplay unpaused, then capture both game and canvas screenshots; wave 7 restoration remains intact. This is test-only and does not change live chapter behavior.
- Corrected the Windows development-preview workflow's stale RC9b artifact/folder label to **RC9c**, matching `build-info.json` (5.4.0-rc.9.2). New exact-head QA and visual screenshot inspection required before certifying the glow. Hardware FPS and licensed European Dragon remain unverified.

## 2026-11-08 — RC9c skyline-glow visibility correction (QA pending)
- Exact-head [QA #305](https://github.com/erin6374/dragon-defense-play/actions/runs/42505013025) passed for `d0d519d`; visual review found the two new fire glows largely obscured by foreground roofs at their original vUv heights (.16 and .23).
- Raised and broadened both glows to y=.49/.55 in the existing full-screen sky shader, retaining restrained intensity and zero additional geometry, textures, lights or draw calls. The sky treatment is visual only; no gameplay or HUD logic changed.
- Added a real rendered wave-15 browser screenshot (`06b-high-wave-disaster-glow-scene.png`) plus wave-state assertions and wave-7 restoration before the remaining skyline tests. This screenshot is an evidence capture, **not** proof of visual fidelity until inspected.
- Version/build identity remains RC9c (5.4.0-rc.9.2); no release or production deployment. Verify fresh exact-head QA and inspect both game and skyline images before acceptance. Hardware GPU FPS and licensed dragon integration remain unverified.

## 2026-11-08 — RC9c: restrained skyline fire-glow atmosphere (new QA pending)
- Confirmed RC9b exact-head [browser QA #304](https://github.com/erin6374/dragon-defense-play/actions/runs/42500182720) passed before editing; branch still matched e793e38.
- Added two soft, distant orange impact glows to the existing full-screen sky shader. Their intensity gradually follows wave progression and skyline damage, with low-amplitude flicker; no new mesh, shadow light, texture, draw call, physics or collision change.
- Added deterministic bounds/escalation assertions for the shared sky-intensity helper and advanced both canonical build stamps to RC9c.
- **Pending:** exact-head browser QA and actual screenshot review; no hardware GPU FPS measurement. Preserve RC9b radar, attacks, main, Pages, Building Explorer and licensed dragon assets.

## 2026-11-08 — RC9b follow-up: radar clearance for full/touch HUD (new QA pending)
- Inspected actual [QA #303](https://github.com/erin6374/dragon-defense-play/actions/runs/42495308567) screenshots. Cinematic desktop controls clear radar, but full desktop radar obscures CALL THE BLOCK/performance buttons; compact full HUD radar covers FIRE/GAS touch buttons.
- Place radar at top right below health cards in full desktop and compact/coarse-pointer layouts. Preserve bottom-right radar in cinematic desktop, all attacks and HUD toggle.
- Add desktop full, compact full and compact cinematic Playwright overlap assertions and `02d-full-hud-radar.png` / `02e-compact-cinematic-synthetic-alerts.png` screenshots. Synthetic alerts are layout probes, not wave 15 gameplay.
- No simulation, build identity, production or asset change. New browser QA and screenshots must pass before certification.

## 2026-11-08 — RC9b: cinematic button/radar clearance (new browser QA pending)
- Reviewed the actual successful RC9 browser screenshot `02c-cinematic-hud.png`: top HUD is much clearer, but the persistent 160px radar at bottom right obscures Settings/Pause and part of the button row.
- Reserve right-side radar and left-side wind-meter footprints on desktop, reduce cinematic button padding, and allow wrapping within safe area. Keep mobile controls untouched.
- Give radar a stable DOM id and assert in Playwright that every visible cinematic game button is spatially clear of radar and breath meter. Existing on-screen toggle and H shortcut remain tested.
- RC9 [browser QA #42494350467](https://github.com/erin6374/dragon-defense-play/actions/runs/42494350467) passed with zero page errors/warnings before this refinement; RC9b must pass its own tests before being called verified.

## 2026-11-08 — v5.4.0 RC9: immersive cinematic HUD (new QA pending)
- Addressed real 1024×576 Chrome software-renderer screenshot review: multiple heavy header cards, development controls and permanent instructions obscure the Philadelphia and Paulo scene.
- Added reversible **Cinematic HUD / Full HUD** toggle (visible button or H key). Human gameplay defaults to cinematic mode; `?hud=full` opts into complete layout and `?qa=1` keeps original QA geometry unless toggled.
- Cinematic mode hides only nonessential developer controls/version labels and the permanent instruction plaque, shrinks health/status tiles, and leaves school/block health, lives, attack charge, radar, Call the Block, pause, settings and mobile attack controls accessible.
- New screenshot and interaction regressions verify that toggling is reversible and gameplay controls remain visible; desktop/full HUD assertions run afterward. No gameplay simulation or renderer change.
- No production/main/Building Explorer changes. Realistic licensed European Dragon binary integration remains pending; screen-space human acceptance and real GPU FPS not claimed.

## 2026-11-08 — v5.4.0 RC8: preserve Paulo's interception credit (QA pending)
- Military missiles or battery impacts no longer award player meteor intercepts, rapid-fire streaks, hunter shields, score or player accuracy. The government receives its own `militaryInterceptions` telemetry counter.
- Military-destroyed meteors remain removed using the existing blast and debris pathways, while real player interceptions and rewards are unchanged.
- Added a staged real-game meteor interception regression asserting unchanged player stats and shield, including a simulated special hunter meteor.
- Exact-head browser QA required before deployment; no graphics, production main, Building Explorer or European Dragon binary changes.

## 2026-11-08 — v5.4.0 RC7: Paulo's wind intercepts military rockets (new browser QA pending)
- Wind now bends incoming military missile trajectories when rockets enter the dragon's 3D gust cone, with lightweight deterministic bounded impulses and a visible gameplay message.
- Homing rockets temporarily lose guidance after an air blast, giving Paulo a defensive counter to military pursuit; regular missile collision and collateral damage remain enabled.
- Added pure regression checks for wind range, angle, frame-step bounding and re-acquisition delay, plus an in-game staged rocket velocity test through the real wind gameplay function.
- No extra render objects or dynamic GPU lights. Exact-head QA and live deployment must complete before visual acceptance; production main, Building Explorer and European Dragon asset stay untouched.

## 2026-11-08 — v5.4.0 RC6: cinematic military searchlight pursuit (QA pending)
- Chapter-three military missile batteries now carry pale volumetric-style searchlight cones, with reusable geometry/material and no extra shadow-casting GPU lights (maximum three active beams).
- Searchlights sweep smoothly and continuously toward Paulo, with a small imperfect tracking motion; their visuals don't affect targeting or damage.
- Added deterministic normalized/smoothed aim tests and a staged real-scene browser QA screenshot with beam-count/aim/distance assertions. Visual legibility and real GPU FPS remain to be reviewed, not claimed verified.
- Preserved military collateral, fire, meteor, wind systems, production main and Building Explorer. European Dragon mesh still awaiting hosted import.

## 2026-11-08 — RC5 wave/warning overlay separation (new exact-head QA pending)
- Verified [browser QA #291](https://github.com/erin6374/dragon-defense-play/actions/runs/42475844384) passed at `0cf3afa86c6f74f48652ce113bede2d896f14695`, with zero reported JS errors/warnings and RC5 Windows artifact. Inspected actual `02-playing.png` (1024×576) and `02b-compact-hud-synthetic-alerts.png` (848×480) from the QA ZIP.
- Visual defects: at 1024×576 the wave banner sits behind the interception status; at 848×480 the synthetic hostile-aircraft warning touches/overlaps the first menu-button row. Move desktop wave/warning lower and compact warning 12 px higher without modifying game simulation or controls.
- Add desktop wave/status bounding-box assertion and compact warning/visible-menu-button separation assertion. New browser QA and fresh screenshot review required; wave-15 warning remains synthetic, not real campaign evidence. No hardware FPS claim, deployment, main, Building Explorer or licensed European Dragon integration.

## 2026-11-08 — RC5 compact landscape HUD separation (new QA pending)
- Exact-head [browser QA #290](https://github.com/erin6374/dragon-defense-play/actions/runs/42471074050) **passed** at `9ee667f44849c82879af9f8fd4e000285d708e68`, including Windows preview packaging and nearest-target missile assertions.
- Address the previously observed overlapping wave announcement/status/HUD at 848×480 by giving compact layouts distinct vertical positions for power, model, chapter, wave and hostile-aircraft notices. Keep all controls and game simulation unchanged. Add 848×480 Playwright DOM-bounds assertions and a screenshot with **synthetic alert text**, not a real wave-15 gameplay capture.
- New CSS and regression assertions require exact-head browser QA before acceptance; mobile hardware, gameplay-wave visual fidelity and GPU FPS remain unverified. No production deployment or licensed dragon integration.

## 2026-11-08 — RC5 follow-up: deterministic first contact within rocket target classes (new QA pending)
- Exact-head [browser QA #289](https://github.com/erin6374/dragon-defense-play/actions/runs/42466717298) **passed** at `87ee68fd4c6408fadffeb05dd4b1afb007752e79`, including the prior swept rocket collision assertions and Windows preview packaging.
- Audited the swept missile loops: when several player shots or meteors intersected a rocket's movement in one frame, the first array entry won even if another target was physically closer. Resolve the minimum swept contact time **within** each class, preserving established shot > meteor > dragon > collateral class priority and existing effects. Added deterministic reversed-order, ineligible, miss and contact-position assertions.
- New commit requires fresh exact-head browser QA; no visual acceptance or hardware GPU FPS claim. Main, Pages deployment, Building Explorer and licensed European Dragon binaries unchanged.

## 2026-11-08 — RC5 follow-up: swept missile hits on active targets (new QA pending)
- Exact-head browser QA [#288](https://github.com/erin6374/dragon-defense-play/actions/runs/42463054731) **passed** on `977d021648ec71f849e8cefd17536621a8afcff6`, including the previous school/road swept-collateral regression and Windows preview packaging. This confirms software QA, not GPU FPS or final visual acceptance.
- Source audit identified the same frame-step tunneling risk in military missile contact with player shots, meteors and Paulo: each was tested only at the rocket's frame-end position. Added a pure swept segment/sphere helper, repositioning the rocket at contact while preserving the existing shot > meteor > dragon > collateral priority and effects.
- Added deterministic entry-face, near-miss, starting-inside, stationary and invalid-radius checks. The helper was independently checked with five Node assertions; **the integrated change remains unverified until new exact-head browser QA passes**. No production/main, deployment, Building Explorer or licensed European Dragon binary change.

## 2026-11-08 — RC5 follow-up: swept military rocket impacts (verification pending)
- Source audit after passing [browser QA #285](https://github.com/erin6374/dragon-defense-play/actions/runs/42460992019) found that RC5 checked only the rocket's final frame position. At low frame rates, fast missiles could jump entirely through a rowhouse or the street plane, suppressing the intended collateral impact.
- Added bounded segment-vs-AABB entry tests for school/rowhouses and Broad Street, choosing the earliest intersection and placing the visual missile at that hit point. Preserves existing arming delay, destroyed/distant exclusions, and hit precedence for dragon, player fire, and meteors.
- Added deterministic high-speed crossing, road descent, near-miss and arming regression assertions. **This follow-up is unverified until new exact-head browser QA completes.** Hardware FPS and European Dragon FBX integration remain unverified; no production/main/Building Explorer changes.

## 2026-11-08 — v5.4.0 RC5: Military missile collateral damage
- Missed missiles from the antagonist military batteries now collide with school/nearby building footprints or Broad Street rather than ghosting through structures or quietly disappearing at ground level.
- Collisions reuse the existing school/rowhouse damage, street crater, debris, fire and visual effects systems, with distinctive military-strike UI cues.
- Collision detector is bounded, supports launch-clearance arming, avoids destroyed/distant buildings, and has deterministic regression coverage.
- Existing Paulo, player fire/wind, and production main remain unchanged. European Dragon assets still need hosted integration.

## 2026-11-08 — v5.4.0 RC4: Dragon wind now visibly affects ground traffic
- Changed vehicle wind from tiny capped translation to mass-dependent once-per-gust velocity, skid and post-gust inertia.
- Added chassis roll/yaw, controlled tire dust and speed disturbance; bikes react most, sedans skid, buses resist.
- Lane-following and overtaking briefly yield to the gust, followed by gradual traffic recovery. Road bounds cap sideways drift.
- Reset vehicle rotation on spawn/reuse; preserved meteor, helicopter and pedestrian wind systems.
- Added deterministic wind regression checks plus in-game QA assertions. European Dragon integration remains separate; production main unchanged.

# Dragon Defense — Development Changelog

## RC2 exact-head QA and realistic Paulo asset audition handoff (November 8)

- Browser QA [#279](https://github.com/erin6374/dragon-defense-play/actions/runs/42454741049) **passed** on `96062397d9274ca975100ca731e6d0f78ae84248`, covering the Windows Python 3 fallback source-level guard. This is **not** an actual Windows batch-file launch test.
- Browser QA [#280](https://github.com/erin6374/dragon-defense-play/actions/runs/42456654546) **passed** on `e42f99831b18c2fb075b0570dfddc39f8b1a1337` and produced browser diagnostics plus an RC2 Windows preview. That commit adds only `PAULO-REALISTIC-ASSET-AUDIT.md`; it does **not** integrate either licensed source dragon into the game.
- The new audit documents two user-provided CC BY 4.0 dragon candidates, their rig/clip inventory and conversion blockers. In particular, the European Dragon FBX needs texture path cleanup, while the Three Motion Loops GLB needs specular-glossiness material conversion for Three.js r160. The latter conversion is approximate, not visually validated.
- **No asset selection or integration approval:** close-up appearance, wing/skin deformation, four-legged perch and flight transitions, material accuracy, attribution and Windows GPU performance still need independent validation. Existing RC2 legacy fallback remains authoritative; no production merge, deployment or Building Explorer changes.


## RC2 Windows launcher Python-version guard (November 8)

- [Exact-head browser QA #278](https://github.com/erin6374/dragon-defense-play/actions/runs/42450767263) **passed** on `3982dcd6622cd83b152654979d1a3277bfdd67ba`, including the RC2 README update; GitHub Actions uploaded the RC2 Windows preview artifact (119 visible files). This is browser/software-WebGL verification, not a physical Windows launch or hardware GPU test.
- Source audit found a specific launcher edge case: the `python --version` fallback accepted any installed Python version, including Python 2, even though the server uses Python 3's `http.server`. Changed the fallback to execute a Python major-version-3 assertion before selecting it. `py -3` remains preferred.
- Added a browser QA source-level regression assertion for that guard. **New guard is unverified until fresh PR-head browser QA passes; the Windows batch launcher still needs real-device validation.** No gameplay, production `main`, merge, deployment or Building Explorer change.

## RC2 exact-head QA and Windows package audit (November 8)

- Exact-head browser QA [run #275](https://github.com/erin6374/dragon-defense-play/actions/runs/42447703016) **passed** for commit `ef67361549c3bad9b60b6e3c2536174ee586bec3`; the QA report lists no JavaScript errors or WebGL/material warnings. This validates the RC2 rig, visual-only fallback tests, browser assertions and CI packaging on that commit, **not** physical Windows GPU performance.
- Downloaded the actual `DragonDefense_v5.4.0_RC2_Windows_Preview` artifact (29,911,589 bytes); ZIP integrity test passed for **119 entries**. Confirmed launcher, build-info, original game, shared Paulo rig/pose driver, standalone lab, vendor Three.js, and RC2 README are present. The embedded build identifies `5.4.0-rc.2` / `5.4-paulo-rc02` with legacy dragon as default.
- Inspected real `07d-paulo-gameplay-closeup.png`, `07e-legacy-gameplay-closeup.png`, lab and banking reference screenshots from run #275. The corrected opposing bank poses and wing membranes are visible. Paulo remains comparatively dark in the nighttime game view; this is an **art-review limitation**, not a proven gameplay or rendering regression. No hardware FPS or final visual approval is claimed.
- The Windows launcher requires Python 3, but the RC2 README previously omitted that prerequisite. Added a check/install instruction to `README_WINDOWS_V5.4_RC2.txt`; this **documentation-only follow-up requires its own exact-head browser QA** before the updated ZIP is distributed. Production `main`, deployment and Building Explorer remain untouched.

## v5.4 RC2 packaging and wing readability pass (November 8)

- **Release safety:** Preserved a real downloadable Windows preview **RC1** from passing browser QA [#42446279065](https://github.com/erin6374/dragon-defense-play/actions/runs/42446279065). The ZIP was integrity-tested and includes all game assets, `PLAY-PREVIEW.cmd`, vendor Three.js and an explicit release README. Pinned its exact source SHA `7edc9ad` on `release/v5.3.1-paulo-preview-rc1` so a working fallback exists even if newer artwork/tests fail. RC1's in-game version is correctly identified as v5.3.1.
- **More finished wing silhouette:** Expanded the shoulder and elbow patagium rearward to reduce the skeletal void between wing root and finger fan. Upgraded crimson membranes to **per-vertex radial tint** and warmer bronze ribs, preserving all 12 existing panels, 12-pose animation, rig joints and draw-call count. QA verifies that every panel has per-vertex colors and the outer span receives more light than the inner root. Visual confirmation in fresh in-game screenshots is still required.
- **Current RC2 identifiers:** Set `build-info.json`, `src/core/build-info.js`, and HTML title to `v5.4.0-rc.2` / `5.4-paulo-rc02`, keeping the gameplay base correctly disclosed as v5.2.3 with v5.3 wind features. Replaced outdated Windows instructions with `README_WINDOWS_V5.4_RC2.txt`, including the hidden-by-default Paulo preview URL `?paulo=1`, controls, rollback and known untested devices.
- Updated the browser QA workflow to package `DragonDefense_v5.4.0_RC2_Windows_Preview` **only after tests pass**, and to verify required Paulo rig and new README files before publishing the artifact.
- **Do not confuse RC2 with a tested release yet:** all new model, screenshot, timing and packaging changes must pass the exact-head GitHub browser QA before distributing the RC2 package. RC1 remains the tested downloadable fallback. Neither release modifies production `main` or the separate Building Explorer. Android APK and actual Windows GPU FPS remain unverified.


## Paulo v5.4 long-session hit recoil timing (November 8)

- Source audit found that Paulo's `hit` pose used `Math.exp(-t*2)` with `t` supplied by the **continuous wingbeat clock**, so recoil would be practically invisible after even a short gameplay session. The lab's reset-to-zero pose timeline had masked the problem.
- The reusable `applyPose(t,state,direction,poseElapsed=t)` now uses **pose-local elapsed time** for finite impact recoil, while global `t` still drives continuous wingbeats, breathing and tail sway. The optional fourth argument keeps standalone lab behavior compatible.
- `src/dragon/paulo-pose-driver.js` now supplies `poseTime` separately to the rig, resets it on state changes, and preserves continuous wingbeat time across attacks. This does not alter stun damage, health, invulnerability or projectile rules.
- Expanded browser QA to assert identical recoil after 0.1 and 120.0 seconds of wingbeat time, visible initial recoil and per-pose driver clock progress. An independent source simulation of **2,400 steps / 120 seconds** passed.
- **Full browser QA and visual acceptance for the latest combined scale/material/recoil head remain pending.** No production/main or Building Explorer changes.


## Paulo v5.4 in-game visibility and scale pass (November 8)

- [Browser QA #42446279065](https://github.com/erin6374/dragon-defense-play/actions/runs/42446279065) **passed** the previously added `captureDragonDetail()` and real-game preview round-trip tests; report recorded no JS errors or WebGL warnings. Downloaded the 12 MB QA artifact and inspected actual `07d-paulo-gameplay-closeup.png` and `07e-legacy-gameplay-closeup.png` at identical staging coordinates.
- **Visual finding:** the new procedural dragon was markedly smaller and almost black in the late-night school scene, obscuring its anatomical/wing-detail advantages; the original dragon remained more legible with a larger head and brighter silhouette.
- Changed only the **Paulo preview child root** scale from `0.50` to `0.68` in `src/game.js`; do not alter the authoritative gameplay dragon root, physics, controls, NPC targeting, projectiles, health or score. Added a QA-visible `visualScale` field and assertions that it is `0.68` while Paulo is mounted and `null` after returning to the original dragon.
- Improved Paulo's shared `src/dragon/paulo-rig.js` charcoal armor, plates and crimson wing/body palette with modest night-legibility emissive fills and a brighter eye. The material changes affect the shared design lab too.
- **New appearance unverified:** modified JS/QA scripts parsed; the current development branch requires a fresh browser run and direct inspection of its `07d` and `07e` screenshots before judging scale/lighting successful. Do not claim game-ready art, Windows hardware FPS, Android APK or final v5.4 release. Production main and Building Explorer remain untouched.


## Paulo v5.4 reusable rig extraction and pose driver (November 7–8)

- **Verified previous checkpoint:** [browser QA #42442263143](https://github.com/erin6374/dragon-defense-play/actions/runs/42442263143) passed the prior isolated-lab geometry/banking build. Its genuine screenshots were inspected: the corrected longitudinal axis yields opposite left/right front banking silhouettes. The procedural model is still a blockout; this is not a finished asset.
- Extracted the entire procedural anatomy and `applyPose(time,state,bankDirection)` from the standalone viewer into `src/dragon/paulo-rig.js` as `createPauloRig(THREE,{breathPreviewFactory})`. This module creates an **unparented scene group**, geometry and reusable poses with no DOM, renderer, camera or game-state ownership. `dragon-lab/paulo-lab.js` now imports the shared rig rather than duplicating model construction.
- The factory allows the lab to inject **preview-only** fire/wind/gas effects; the default game-ready factory does not generate them, avoiding duplication of existing gameplay attack effects.
- Added an idempotent `rig.dispose()` to detach the visual root and release each owned geometry and material once, supporting a reversible old-dragon fallback without lingering GPU buffers. Browser QA now constructs a **second detached rig** and verifies 12 poses, mirrored bank rolls/shoulders, 12 membrane panels, 7 tail segments, 24 instanced fangs, no preview breath, and repeat-safe resource disposal.
- Added `src/dragon/paulo-pose-driver.js`, a pure simulation-to-visual timing adapter. It keeps wingbeat phase continuous through attack state changes, caps a single visual update at 50ms, freezes transforms on pause, and resets without changing game variables. Expanded QA and passed **six direct source smoke-test checks**; full browser/WebGL verification of the newest modules is pending.
- Updated `dragon-lab/GAMEPLAY-INTEGRATION-NOTES.md` with the completed extraction and remaining gates. **No playable-game model swap, release package, production merge, or Building Explorer change.** Consolidated v5.4 remains gated on finished Paulo artwork, guarded integration, QA, Windows GPU benchmarks and Android device validation.


## Paulo v5.4 front-bank screenshot verification and framing guard (November 7)

- Downloaded and directly inspected the actual [browser QA run #236](https://github.com/erin6374/dragon-defense-play/actions/runs/42438685499) screenshot artifact for `2abd8670`. The paired `14-paulo-bank-front-left.png` and `14-paulo-bank-front-right.png` now show opposite wing-up/wing-down roll instead of the previous back/underside pitching error. Run #236 passed. This accepts the **bank-axis correction** visually, not the final dragon asset or gameplay integration.
- The report records symmetric longitudinal roll of approximately +0.274/-0.274 radians at 0.75 seconds. The front orthographic frame extents are (0.769, 0.481) right and (0.769, 0.498) left. Added a narrow browser assertion requiring comparable front-bank framing to catch future camera-fit regressions without imposing fragile screenshot pixel matching.
- Wing membranes remain very thin/edge-on from some front-bank angles. Further art review and real-GPU testing are still required. This is QA-only; no playable dragon, production main, deployment, or Building Explorer changes. New QA for the framing guard is pending.

## Paulo v5.4 longitudinal banking-axis correction (November 7)

- [Browser QA run #235](https://github.com/erin6374/dragon-defense-play/actions/runs/42433995673) **passed** the new matched front-bank captures at `d1b65f7`. Direct inspection of `14-paulo-bank-front-left.png` and `14-paulo-bank-front-right.png` showed the left bank exposing Paulo's back while the right bank exposed his underside: the pose was pitching about Z rather than rolling about his forward (+X) axis.
- In the **isolated Paulo lab only**, bank motion now rotates `root.rotation.x`; `root.rotation.z` remains reserved for the existing hit recoil. The read-only `rootRoll` QA field now reports the actual longitudinal roll, and a new assertion rejects any pitch during banking. This is a visual-rig correction, not gameplay integration or a performance claim.
- **Verification pending:** inspect the new current-head browser QA and both front-bank screenshots before accepting the corrected silhouette. Production main, v5.3.1 playable dragon, Building Explorer and deployment are unchanged.

## Paulo v5.4 front-bank visual QA (November 7)

- Reviewed actual front, side, top, rear and matched banking screenshots from successful browser QA [run #234](https://github.com/erin6374/dragon-defense-play/actions/runs/42429170223) at `9409c1f`. Top-down left/right bank images are visually similar because roll is difficult to judge overhead, despite opposite-sign rig assertions.
- Added deterministic **front orthographic** bank-right and bank-left screenshots at the same paused 0.75-second pose time, with direction and full-frame assertions. Original top-down captures and numeric checks remain. This adds visual evidence, not automatic visual acceptance.
- **QA-only change:** no Paulo rig, gameplay, collision or rendering changes. New browser QA is pending; no hardware performance claims.


## Paulo gameplay animation selector — integration staging (November 7)

- Added `src/dragon/paulo-animation-intent.js`, a **pure, side-effect-free, DOM/WebGL-independent** selector for the existing 12 Paulo pose names. It prioritizes stun/recovery, wind/gas, charging/fire, landing/banking, glide/flight and idle/hover, plus travel-sign-dependent banking. No in-game dragon is replaced or controlled by this module yet.
- Added deterministic selector regression cases in `qa/browser.mjs`, including state priority, left/right direction, and exact correspondence with the standalone lab's pose names.
- Added `dragon-lab/GAMEPLAY-INTEGRATION-NOTES.md`, documenting real hooks in `src/game.js` for movement, stun, wind, fire, gas, collision root and fallback; spells out a staged visual-only integration plan. Attack/collision behavior will remain owned by the original simulation.
- This is **pre-integration infrastructure**, not proof of a completed new dragon. Lab wing-panel/browser QA, gameplay adapter tests and hardware performance require verification on the current branch head. The consolidated release plan remains `RELEASE-PLAN-v5.4.md`.


## Paulo v5.4 proximal wing silhouette pass (November 7)

- Browser QA run `42428004854` passed the prior head-and-tail anatomy revision. I reviewed the actual front, side and top reference images: face and tapering tail render, but wing membrane coverage is concentrated near the tips, leaving the shoulder-to-elbow spans visually skeletal.
- Added one tessellated **shoulder-attached proximal wing patagium on each side**, complementing the existing central elbow panel and four distal finger fans. Each wing now has six panels; 12 total (previously ten), with unchanged shoulder/elbow/wrist rig, positional joints, wing fold/bank and pose state system.
- The panel meshes share existing geometry/material patterns and are allocated at initialization rather than during animation; the original per-frame vertex deformation still updates the preallocated buffers.
- Expanded browser QA to check the 2 proximal, 2 middle and 8 outer panels, at least 1,092 membrane vertices, and matched top-down images `13-paulo-bank-right.png` and `13-paulo-bank-left.png` at the same 0.75-second pose time.
- Source JS and QA syntax parsing passed. **Current-head browser QA, real screenshot inspection of the newly widened membranes, and Windows hardware measurements remain pending.** This is a procedural prototype; a final weighted/sculpted skinned dragon is not complete, and the existing gameplay dragon/production main/Building Explorer were not modified.


## Paulo v5.4 head and tail anatomy refinement (November 7)

- Reviewed the **passed** browser QA run `42427391118`: fitted front/side/top/rear orthographic cameras now show Paulo fully without cutting off the wing tips. This supersedes the previously cropped perspective reference views.
- The side screenshot exposed a tail silhouette defect: seven isolated ellipsoid forms looked like disconnected beads at the tip. Replaced them with seven overlapping, radius-tapered cylinder frustums that follow the same articulated chain; retained dorsal spines and animated pivots. QA checks the seven link lengths exceed joint spacing and progressively taper toward the tip.
- Improved the original dragon head blockout with a defined snout bridge, brow ridges, lower-jaw mass and two 12-fang instanced tooth rows following separate head/jaw transforms. QA checks 12 upper and 12 lower fangs; the 24 fangs use only two additional instance batches.
- These model details passed source JavaScript syntax checks. **Current-head browser render/visual QA and Windows GPU performance remain unverified**. The isolated lab is not yet a production-ready dragon; no changes to gameplay integration, production main or Building Explorer.


## Consolidated release directive and Paulo reference framing (November 7)

- User requested that the **finished new Paulo dragon trigger a combined Dragon Defense release** incorporating the recent graphics, wind, destruction, and gameplay improvements. Added `RELEASE-PLAN-v5.4.md` with an explicit integration audit, regression gates, Windows/Android delivery targets, rollback criteria, and distinctions among source QA, browser QA, actual GPU/device verification, and release status. **This does not authorize an immediate merge or deployment.**
- Inspected actual successful browser QA run `42424075239` screenshots: the front reference cropped both wing tips, and the camera labeled “orthographic” was actually perspective.
- `dragon-lab/paulo-lab.js` now selects a **real orthographic camera** for front/side/top/rear views and fits the full source-dragon bounds with a generous margin, while the regular three-quarter view keeps its perspective camera and mouse orbit. Scroll zoom works in both camera modes. Reference framing is recalculated only on view selection and resize, not each animation frame.
- QA records normalized projected bounds and asserts that the complete model stays inside all four reference frames. Added top/rear screenshots alongside the front/side screenshots. Clarified the viewer's labels and interaction instructions.
- The prior run `42424075239` passed the earlier code; **the new camera/framing commits remain unverified until a fresh current-head browser run succeeds**. No changes to existing playable dragon, production `main`, or separate Building Explorer.


## Paulo v5.4 two-way bank reference (November 7)

- The original bank state only expressed one direction despite the design specification requiring left and right turns. Added a direction selector to `dragon-lab/index.html` and applied its sign consistently to torso roll and mirrored shoulder articulation in `paulo-lab.js`.
- Extended the deterministic browser test: pause at 0.75 seconds, capture both bank directions with identical time, and assert equal-and-opposite body roll plus mirrored left/right shoulder angles. The existing twelve named animation states and normal-game controls remain unchanged.
- This is a **design-lab improvement**, not gameplay movement logic or a released dragon replacement. Changed JavaScript passed static syntax parsing; full browser/WebGL and hardware performance results for the new commits are pending.


## Paulo v5.4 wind pulse refinement and anatomy capture (November 7)

- Reviewed the real `08-paulo-dragon-lab.png` from successful browser QA run `42422806438`. The initial 24-ring wind preview overlapped into an unnaturally dense, bright cone, while the dragon's silhouette remains a stylized blockout.
- Refined the isolated wind emitter to **nine visible instances from the same 24-instance preallocated pool**, a thinner torus, lower opacity and a narrower expansion/wobble envelope. Fire and gas retain their original 24-instance capacities. QA now asserts the active draw instance count per effect; no gameplay breath/collision changes.
- Added repeatable `09-paulo-front-reference.png` and `10-paulo-side-reference.png` screenshots during the browser QA, alongside the wind preview. These are for inspecting wing proportions, joints and leg silhouette before any production dragon replacement.
- These refinements passed static parsing but **are not browser-verified until the newest workflow completes**; do not treat the earlier successful run as verification of these subsequent commits.


## Paulo v5.4 deterministic animation inspection (November 7)

- Added **Pause/Play**, **+1 frame** (1/60 second) and an eight-second **pose-time scrubber** to the isolated `dragon-lab/index.html` viewer.
- `dragon-lab/paulo-lab.js` now uses a single pose-time source for animation, scrubbing and frame stepping. Paused state stops advancing the rig or issuing continuous WebGL draws; camera orbit, view presets, zoom and joint-marker toggling still render while paused.
- QA checks the paused time remains unchanged, a frame step advances by exactly 1/60 second, and scrubbing sets an exact reference time. The wind preview screenshot is captured from a paused reference pose for repeatability.
- JavaScript source and test edits passed syntax parsing. **Full PR-head browser QA and Windows hardware inspection remain pending**. The gameplay dragon and separate Building Explorer were not modified.


## Paulo v5.4 breath preview and QA isolation (November 7)

- Previous Paulo Lab GitHub Actions browser QA failed while waiting for `DOMContentLoaded` after the lab and bundled Three.js returned HTTP 200. The QA navigation now waits for the response commit, and separately waits for the lab-ready interface (up to 90 seconds); this changes test readiness, not game performance.
- The game browser page is closed after its final assertions and before the standalone Paulo Lab test. This avoids two simultaneous software-WebGL animation loops and releases the gameplay renderer's resources during the isolated test.
- New `dragon-lab/breath-effects.js` uses exactly one visible preallocated 24-instance emission batch at a time: fiery cone-shaped sparks, translucent wind rings, or descending green gas clouds. The preview follows the articulated head and uses a shared temporary transform, with no mesh or geometry allocation per frame.
- The Paulo Lab test checks the fire, wind and gas emission selection, pooled count and absence of elemental emissions in the bank pose. A dedicated screenshot now captures the wind pose. These are illustrative lab visuals only; gameplay wind/fire/gas mechanics and Building Explorer are unchanged.
- Static JavaScript parse checks passed for the changed lab and test scripts. **Current PR-head browser QA, actual Windows playtest and hardware FPS are not yet verified.** This is an unmerged development preview; do not deploy or merge before review.


## Paulo v5.4 design laboratory — isolated animation and anatomy prototype (November 7)

- Added `dragon-lab/index.html` and `dragon-lab/paulo-lab.js`: a separate original procedural Three.js dragon with charcoal armor, crimson membrane wings, bronze horns and amber eyes. This is a **blockout**, not a production-ready skinned model.
- Articulated torso/chest, neck/head/jaw, two multi-joint wings with membrane fingers, four legs and seven tail segments. Includes perspective plus front, side, top and rear views, orbit/zoom, animation speed control and optional joint markers.
- Added 12 named movement/attack studies: idle, hover, forward flight, glide, bank, inhale, wind exhale, fire, gas, hit, land and takeoff. These are procedural pose studies, not imported copyrighted animation clips.
- Added `dragon-lab/DESIGN-SPEC.md` with original art direction, skeletal hierarchy, approximate motion timing and explicit acceptance criteria before replacing the current dragon.
- Added browser QA coverage for the isolated viewer's load, two wing chains, 12 states, wind/fire jaw movement, no page errors and a screenshot (`08-paulo-dragon-lab.png`).
- Follow-up: animation states now evaluate immediately on selection (rather than relying on the next animation frame), wind exhale braces wing joints differently from the narrower fire pose, and QA checks inhale chest expansion, bank asymmetry and actual renderer draw-call telemetry.
- Geometry pass: replaced each flat triangular wing wedge with a 7×13 tessellated membrane grid. Ten curved/scalloped panels now follow the articulated wing bones and preserve the original rig. Added 66 dorsal scale plates using one instanced draw call. QA checks the ten panels, 910 membrane vertices and 66 armor instances. This remains a prototype, not a production skinned mesh.
- Membrane motion pass: cached the original vertex buffers and applied bounded interior-vertex billow/flutter during animation without per-frame mesh creation. Refreshed membrane normals every fourth update. Added a live browser QA assertion that an interior wing vertex actually moves away from its rest position. Final production skeletal skinning and real GPU benchmarks are still pending.
- **QA pending.** No production gameplay, dragon physics, controls, or collision changes. The current v5.3.1 player dragon remains intact; production main stays v5.2.3.

# Dragon Defense v5.3.1 — Wind & Street Effects Preview

## Wind breath: ground targets, blowing debris, responsive smoke (November 7)

- Added pure bounded `groundWindWeight` and `groundWindStep` simulation helpers. Active dragon wind now gently displaces pedestrians and mobile road traffic in the projected street-level cone. Push strength decreases by vehicle class (pedestrian > bicycle/scooter > car > van/truck > bus/fire truck), has a capped per-target displacement per gust, and does not inflict new injury or knockdown.
- Added two preallocated instanced batches for up to 44 road dust particles and 16 lightweight scraps. Particles swirl along the gust, fade as the effect finishes, and require no per-gust mesh, material, or geometry allocation.
- Existing school-fire smoke in the pooled cinematic effects renderer now bends with nearby gusts and temporarily becomes more transparent. Existing street/explosion smoke puffs also drift and thin when within range. Distant smoke outside the gust is unchanged.
- Preserved meteor and helicopter deflection, school-fire suppression, short-click fireball, long-press wind, right-click gas, wind charge meter, and 4-second wind recharge.
- New deterministic browser QA covers weight ordering, cone bounds, gentle displacement, actual synthetic ground-vehicle/pedestrian movement, dust/litter instance budgets, and actual smoke-puff displacement and opacity.
- Bumped build identity to `5.3.1` / `5.3-wind-ground-01`, added `PREVIEW_v5.3.1_README.txt`, and added an Actions upload-artifact step to deliver a complete Windows preview folder with the launcher and assets after successful browser QA.
- Browser QA #166 **passed** and verified live temporary wind targets (pedestrian +0.137, bike +0.114, bus +0.007 world units in one simulated step), 38 ground dust instances, 13 scraps, and deflected/thinned street smoke. The complete Windows package was successfully created and inspected (110 files; required launcher, assets and game source present).
- QA #166 also reported a harmless Three.js material warning: `MeshBasicMaterial` does not have a `roughness` property. Removed the unsupported key and strengthened QA to fail on new console warnings. A fresh run is required before labeling the warning fix verified.
- Headless browser assertions do not establish real Windows GPU performance, aesthetic quality or the exact perceived force of the wind. No changes to production main or the separate Building Explorer.

# Dragon Defense v5.3.0 — North Broad Street

## Continuation — persistent skyline aftermath visual regression

- Reconciled the latest Work/scheduled development head `f861715` and confirmed GitHub browser QA run #138 **passed**. Its repeated-impact flash radius and six-strike contact checks are already present; no duplicate gameplay changes were made.
- Added browser regression coverage for the time *after* an impact flash finishes: the flash must disappear, while smoke, facade scorch marks and grounded rubble remain visible through the later simulated frames.
- Added a read-only smoke world-position probe and a bounded-drift check, ensuring the plume continues moving gently without jumping across the skyline. Browser QA now saves a separate `06-skyline-smoke-aftermath.png` capture after additional simulated time, separate from the earlier rubble frame.
- This is **QA-only coverage**, not a change in the visual simulation or a hardware performance improvement. A new browser run must pass before treating the extra check as verified. Production, deployment and Building Explorer remain unchanged.
- A second camera angle now captures `06-skyline-close-aftermath.png` from a point nearer the towers, in addition to the original wide shot. The closer QA-only camera is intended to expose facade and rubble that foreground streets obstruct; it is not a new gameplay camera, not a substitute scene, and must be visually inspected before claiming it succeeds.


## Continuation — repeat-impact flash radius reset (November 7)

- Verified that prior branch head `27ad3bf` passed complete GitHub browser QA run #133, including the six-strike world-space impact-position assertions. No concurrent branch changes were present before this edit.
- Found a source-confirmed visual timing defect: `update()` expands each impact sprite as it fades, but `strikeNearest()` did not restore the sprite's starting radius. A new strike could therefore briefly reuse an enlarged radius from the previous flash before the next animation frame.
- Each strike now resets its preallocated flash sprite to radius 5 immediately, retaining the existing expansion/fade curve, position, material budget, damage behavior and foreground health. Added a QA-only immediate-scale snapshot and a six-strike browser assertion to catch recurrence.
- Gameplay commit `a8610d4`, QA telemetry `5ad3602`, regression `5fe53e9`. **The new correction is not browser-verified until fresh PR-head QA passes.** This is a small visual consistency fix, not a measured performance improvement; no hardware FPS or fidelity claim. Main, deployment and Building Explorer unchanged.


## Continuation — six-strike meteor flash contact regression

- Previous branch head `092efaad` passed browser QA run #130, verifying the skyline-space impact flash correction.
- Strengthened the existing six-hit browser scenario to check **the actual visible flash position against the reported pre-collapse contact on every hit**, including late strikes that change the tower's transform. The previous suite checked initial flash position and a separate synchronous collapse but did not compare the flash with the contact on all six successive hits.
- Each hit also asserts that the flash stays attached to the stable skyline group, remains visible, and reports finite coordinates. This is a **QA-only change**, not a gameplay or performance optimization.
- The expanded regression is pending its own browser QA result. No production merge/deployment or Building Explorer changes.


## Continuation — stable meteor impact flash during skyline collapse

- Fixed a visual anchoring inconsistency: the short-lived skyline meteor impact flash was still parented to the damaged tower, so an impact that triggered structural collapse could cause the visible flash to shrink or move with the facade. The explosion's reported contact point and persistent smoke were already world-space anchored.
- Reparented the preallocated flash sprite to the stable skyline group, retaining its existing shared effect material, opacity fade and geometry budget. The original local facade contact point is cached separately for later strikes and scorch marks. At strike time, a copy of its pre-collapse world contact point is converted into skyline-local sprite coordinates before the tower changes transform.
- Updated existing world-position QA probes to use the unchanged local facade contact, and added browser assertions that the flash coincides with the returned meteor contact and remains fixed in world space across a synchronous tower collapse. The smoke/scorch mechanics, school gameplay and collision rules are unchanged.
- This change is on draft PR #2 only. New browser QA, subjective appearance and hardware performance remain unverified.


## Continuation — stable meteor contact point during skyline collapse

- Corrected a source-confirmed coordinate ordering issue: `strikeNearest` previously calculated the world-space explosion position *after* `setDamage` shrank or tilted the struck skyscraper. The meteor burst could therefore appear at a displaced facade location on the very strike that caused collapse.
- Capture the world-space contact point before applying tower damage, and return that preserved position for the existing cinematic explosion. Smoke/scorch placement, collapse behavior, object counts and foreground health are unchanged.
- Added a deterministic six-strike browser regression: for each subsequent strike, the returned explosion position must equal the pre-damage facade contact point. The test also requires at least one impact to actually move the facade, so the check cannot pass vacuously.
- Prior head `f5fcb28` passed browser QA run #119. **New code remains unverified until its own browser QA completes.** This is a coordinate-correctness fix, not a hardware performance claim. No merge/deploy or Building Explorer edits.


## Continuation — immediate smoke and stable-position regression

- Moved the skyline smoke sprite's visibility toggle into the meteor strike handler. The plume appears in the impact event itself, without waiting for a subsequent animation update; damaged towers no longer repeat that visibility assignment every frame.
- The smoke still drifts in its existing skyline-space coordinates, uses the same one-sprite budget, and is hidden on restart.
- Browser QA now checks visibility **before** the next update and compares smoke world positions immediately before and after a forced tower collapse in one synchronous probe. This closes a coverage gap: checking parent identity and world scale alone could miss unwanted translation.
- Previous head `f136f6c` passed GitHub browser QA run #114. This new change remains unverified until a fresh PR-head run passes. No measured hardware performance or cinematic-fidelity claim; production and Building Explorer unchanged.


## Continuation — damage-triggered skyline smoke updates

- Removed redundant per-frame smoke `Sprite.scale.set` and `SpriteMaterial.opacity` writes from `philadelphia-geometry-skyline.js`. The width/opacity depend only on the accumulated strike damage, so they are now assigned once in `strikeNearest`; per-frame animation still updates the floating smoke position.
- All nine skyline towers retain the same one-sprite-per-landmark budget, damage intensity curve, wind-like drift and reset behavior. No additional textures or lights.
- Expanded the existing six-hit meteor cascade browser regression to confirm the plume grows with early additional impacts, its size/opacity never decrease as hits accumulate, and the foreground health remains unchanged.
- This is a source-level per-frame work reduction only. Actual CPU/GPU performance and visual similarity have not been measured; fresh browser QA is pending. Production and the separate Building Explorer were not changed.


## Continuation — independent post-impact skyline smoke

- Corrected a visual hierarchy issue: persistent skyscraper smoke had been parented to the tower group, so a collapsing facade's vertical scale also compressed the smoke plume.
- Smoke remains one preallocated sprite per landmark, but is now parented to the stable skyline group. On each strike, its origin is resolved once from the facade's world transform into skyline coordinates. Subsequent subtle smoke drift uses that stable origin while the tower collapses.
- Added a browser regression that checks smoke remains visible and that its world-space scale does not change when the tower shrinks. This does not change local meteor collisions, gameplay, school destruction or production.
- Latest software-WebGL QA is pending. Actual visual quality and hardware FPS remain unverified.


## Continuation — freeze fully settled skyline rubble (November 7)

- Confirmed `feature/north-broad-graphics` was identical to previous handoff `90194fc`; browser QA **run #101 passed**, verifying the earlier intact-skyline flicker change.
- The skyline `update()` path kept advancing `fallElapsed` and recalculating rotations, matrices and ground support heights for every facade slab **indefinitely after landing**. This is avoidable per-frame CPU work when several distant towers have collapsed.
- Each tower now tracks `fallSettled`, set only after all three slabs have completed rotation and reached their supported ground heights. Once settled, subsequent frames skip the slab transform loop. `fallActive` remains true to preserve the semantic "collapse occurred" state; restart clears both flags and restores the initial slab poses. No materials, physics trajectories or geometry were changed.
- Added browser regression that advances the already-settled skyline by another two simulated seconds and asserts `fallElapsed` and slab heights remain unchanged. Gameplay source commit `20f8757`, regression commit `f1be956`. **Fresh QA must pass for this change to be verified.** This is a source-level optimization only; no measured CPU time, hardware FPS, GPU gains or screenshot fidelity claims. No production main, Building Explorer, merge, deployment or packaging changes.


## Continuation — skip intact skyline electrical flicker work (November 7)

- Before editing, confirmed branch was identical to `7e2805d` and GitHub browser QA run #96 had **passed**, verifying the previous touch-aiming regression. No competing commits were present.
- In `src/rendering/philadelphia-geometry-skyline.js`, the per-frame skyline update evaluated a `Math.sin` and `Math.pow` flicker pulse for **every tower**, even though an intact tower has `collapse=0` and therefore cannot visually flicker. The update now skips the pulse calculation for intact towers, retaining the exact original formula for damaged towers. Nine skyline landmarks exist in the current geometry configuration; this reduces unnecessary work on intact frames, but **no CPU time, GPU time, hardware FPS or power savings have been measured**.
- Added a reversible, QA-only emissive sampling probe and browser assertions that intact dusk-window emission stays steady while a damaged tower retains varying electrical flicker. The probe restores the live animation time and does not advance fall physics.
- Source optimization commit `9851093`, QA probe `239aa25`, regression assertions `000543c`. **Await full browser QA for the latest PR head**; source review alone is not verification. No main, Building Explorer, merge, deployment or package changes.


## Continuation — single-pass pointer aiming and touch regression (November 7)

- Confirmed GitHub browser QA run #90 passed for the prior lighting optimization; the development branch had not advanced beyond `5c82a5b` before these edits.
- Fixed a redundant `pointermove` registration: the universal pointer listener already processes touch drags, but a second touch-specific handler called `aim(e)` again on every pressed touch move. Removed the duplicate while retaining touch `pointerdown` aiming.
- Reused two scratch vectors for normalized pointer coordinates and the ray-plane intersection instead of constructing a new `THREE.Vector2` and `THREE.Vector3` on each pointer event. Intended aiming clamp and plane are unchanged.
- Added read-only `snap().aim` telemetry and browser QA coverage that dispatches left/right touch pointer moves, checks finite/clamped coordinates and directional response, and asserts there is exactly one pointermove registration.
- Gameplay source commit `7bc274a`; QA telemetry `9ab44c6`; regression check `1253e06`, corrected static regex `18e29c2`. **Current change awaits fresh PR-head browser QA.** No claim of measured hardware FPS or touchscreen-device verification; no merge, deployment, or Building Explorer changes.


## Continuation — remove per-frame lighting color allocations (November 7)

- Audited `updateNight(dt)`, which runs on the game animation path. Its unused `hazeColor` computation allocated two `THREE.Color` objects per call without affecting the scene. Removed that dead blend.
- Replaced three other `new THREE.Color(...)` calls in the sun/ambient color interpolation with immutable palette colors initialized once. The original hex values and `setHex().lerp()` order are preserved, so the intended daytime/dusk/night colors are unchanged.
- This eliminates **up to five JavaScript color-object constructions per lighting update**; it is a source-level allocation reduction, **not** a measured FPS or garbage-collection improvement. Existing browser QA includes dusk and night scene captures and vehicle-lighting checks. Await the latest PR-head workflow before treating this change as browser-verified.
- Commit `e8da884`. No changes to `main`, Building Explorer, gameplay mechanics, or deployment.


## Continuation — distant helicopter patrol wrap (November 7)

- Corrected a long-session skyline animation defect: the westbound decorative helicopter's JavaScript remainder became negative after approximately five minutes, allowing it to leave its intended 170-unit patrol interval. The orbit remainder is now normalized to a nonnegative value before applying the helicopter's x-offset.
- Added a QA-only, reversible helicopter-position sampler for 0, 300, 600, and 1,200 simulated seconds; browser QA checks all three distant helicopter positions stay finite and within their original patrol bounds. The sampler restores the current animation time and does not simulate foreground combat.
- This is a cosmetic background-traffic correction, not a gameplay, camera, GPU optimization, or real-world flight-path change. New browser QA is **pending**; no hardware FPS or cinematic fidelity claim.


## Continuation — skyline aftermath restart regression (November 7)

- Extended the existing read-only skyline QA state snapshot to expose strike damage, collapse fraction, height scale, and the visibility of meteor flash, smoke, and scorch effects.
- After the six-hit distant meteor cascade, browser QA now starts a new level and asserts that accumulated damage, falling rubble, impact flash, smoke, and scorch have all reset. Captures a dedicated `06-skyline-after-restart.png` renderer screenshot.
- No gameplay, rendering or production behavior was changed; this closes a missing automated check for the newly added cumulative disaster effect.
- Commits `8c8b7ac` and `7a8b004`. Full browser QA for this addition **pending**; no hardware FPS or visual-fidelity claim.


## Continuation — distant disaster independent of foreground health

- Cumulative distant meteor impacts now contribute **0.07** local structural damage per strike (capped at **0.90**) to their targeted skyline landmark, rather than **0.018** capped at **0.28**. Repeated impacts can therefore trigger facade breakup and persistent rubble even if the school and neighborhood are unharmed.
- A hit immediately reevaluates the existing landmark collapse state; no new meshes, physics systems, or foreground gameplay damage were introduced.
- Browser QA now stages six consecutive hits on Comcast Technology Center, verifies visible rubble and active facade fall, and asserts that the foreground health does not change. A dedicated skyline screenshot is captured.
- **Verification:** QA run #68 failed an existing release-height assertion because the new six-hit test had already started a tower fall before the pre-existing forced-collapse scenario. The test was moved after the existing collapse/reset checks in commit `dd40f11`, isolating both scenarios. Run #71 then caught an off-by-one test setup: the reset had cleared the first hit, so the isolated test was staging only five impacts (0.35) while expecting six (0.42). Commit `b0d9f37` corrects the loop. The full browser QA **passed** on run #74 (commit `b0d9f37`) and again on run #76 (commit `f8e2f52`, then-current PR head). These are software-WebGL checks, not hardware performance or an independent visual fidelity assessment. This is a stylized background-disaster effect, not surveyed geographic realism or measured GPU performance.


## QA regression fix — malformed startup script

- GitHub QA run #61 failed its final `report.errors` assertion with `SyntaxError: Invalid or unexpected token`. The cause was literal `\\n` sequences accidentally inserted *between JavaScript statements* while revising the `index.html` launch warning. The HTML has been corrected to real statement line breaks, while message text still uses valid escaped newlines inside its string literals.
- Added a fast Node `vm.Script` syntax preflight for inline `index.html` scripts to catch this class of error immediately, before launching the expensive software-WebGL browser suite.
- The regression was real; earlier v5.3 QA success does not cover the broken commit. Fresh workflow verification is required for the fix. No changes were made to main or Building Explorer.


## Continuation — facade debris material batching

- Optimized the reusable distant skyscraper facade slab geometry: a stock box with six material groups now has its indexed triangles arranged into one five-face side-material group and one textured-front group.
- The same six faces and existing UVs remain, preserving the material distinction while reducing group/draw submission from six to two for each displayed facade slab. With three fragments on each of nine landmarks, that is a theoretical maximum reduction of 108 draw submissions when all nine towers have visible debris.
- Added browser QA assertions that the three debris sections each retain 36 indices and use exactly two geometry/material groups. This is a rendering optimization only, not a new effect or a measured FPS gain; hardware testing remains pending.


## Continuation — accurate startup diagnostics

- Corrected the on-screen startup failure message. The current v5.3 import map loads a vendored local Three.js module, not `cdn.jsdelivr.net`; the old warning incorrectly blamed CDN access and referred to a nonexistent diagnostics text file.
- When the game is opened directly using `file://`, the panel now explains the exact `PLAY-PREVIEW.cmd` and `http://127.0.0.1:8769/` workflow. For HTTP startup failures, it points to the local server directory, `src/game.js` and bundled Three.js files.
- Verified the referenced `vendor/three/build/three.module.js` and FBX loader files exist in the development branch. Browser behavior of the newly worded error path remains untested; normal browser QA is in progress.


## Continuation — reliable Windows preview startup

- Updated `PLAY-PREVIEW.cmd` to launch the v5.3 game over HTTP rather than opening `index.html` under the blocked `file://` protocol. The launcher now checks for Python 3 (`py -3` or `python`) and explains missing-runtime errors.
- Detects an already occupied port 8769 and refuses to silently display a potentially different copy of the game. Starts the server from the launcher's own folder and opens the default browser only after an HTTP 200 response.
- No gameplay, rendering, school geometry or production code changed. This is a Windows batch-file change; a Windows interactive end-to-end test has not yet been run. GitHub browser QA validates the web game but does not execute this batch file.


## Continuation — unobstructed skyline visual QA

- Reviewed run #45's actual screenshots and report. Browser QA passed without errors or warnings; the release/mid-fall/settling probes show correct numerical positions. The existing 1024 × 576 gameplay screenshots, however, place the original school and foreground buildings over the skyscrapers and cannot independently establish the skyline's appearance.
- Added a QA-only orthographic camera that renders the existing scene from in front of the distant skyline without altering the production gameplay camera or creating a substitute visual scene.
- Browser QA now captures five real PNGs: `06-skyline-intact.png`, `06-skyline-strike.png`, `06-skyline-release.png`, `06-skyline-falling.png`, and `06-skyline-rubble.png`.
- This improves evidence, not gameplay. New screenshots still require inspection and the latest workflow must pass. Hardware/mobile FPS remains unverified.


## Continuation — continuous facade release (no upward teleport)

- Corrected the first-frame collapse transition: preallocated facade slabs previously sat at ground level until the first simulation update teleported them to their high release positions. Slabs now start at their planned release heights while their rubble parent is hidden, so activation and falling are visually continuous.
- Reset restores release-height transforms as well as hiding rubble and clearing fall timers. The existing staggered fall and grounded settling are unchanged.
- Browser QA now checks release height at collapse activation, intermediate falling, settled ground contact, and restart cleanup. Visual screenshot and hardware performance verification are still pending.


## Continuation — falling skyline facade sections

- The three preallocated large facade slabs per landmark now descend in staggered gravity-like arcs once collapse begins, before settling permanently in the independent ground-level rubble group.
- The simulation clamps each falling slab to its ground elevation and advances with bounded frame delta. No runtime debris geometry is allocated.
- Game reset now restores fragment positions, rotations, fall timers, and rubble visibility.
- Added deterministic browser QA assertions for triggered collapse, mid-fall positions, settled sections and restart cleanup, plus an actual browser collapse screenshot.
- This is a stylized collapse transition, not a full structural or rigid-body simulation. The change is in draft PR #2 only; new QA results and hardware performance are unverified.


## Continuation — grounded skyline rubble and fallen facade sections

- Fixed an architectural hierarchy problem: skyline rubble was a child of the collapsing tower and therefore inherited its translation and scale. Rubble now sits in the fixed skyline group at ground elevation.
- Each of the nine landmarks now has three recognizable fallen facade slabs using one shared box geometry and existing facade-side material; the preexisting 32 instanced small rubble pieces are retained.
- The collapse update changes the slab profiles based on damage severity, without spawning objects during impacts.
- Browser QA now stages a distant skyscraper collapse, verifies the rubble remains detached and grounded, counts three slabs, and captures a real renderer screenshot.
- This is still a visual approximation, not physical rigid-body simulation. Fresh browser QA and hardware benchmark verification remain pending. No merge/deployment to production.


## Continuation — skyline facade impact marks

- Meteor hits now leave a visible scorch-and-crack overlay at the individual skyscraper impact location, persisting after the flash fades. The mark grows more pronounced as repeated strikes accumulate.
- Reuses a single 128 × 128 procedural texture and one preallocated sprite per landmark. No new meshes or textures are created per hit; at most nine mark sprites exist.
- The mark is attached to its landmark and cleared on restart. The browser QA strike test now asserts that flash, persistent smoke, and facade damage are all visible.
- Visual screenshot inspection and hardware performance remain unverified. This is a development-branch change only; production and Building Explorer are untouched.


## Continuation — persistent meteor aftermath on landmarks

- A targeted distant meteor hit now leaves a persistent, soft smoke plume on the struck skyline tower after the immediate impact flash disappears.
- Each of the nine landmarks preallocates a single smoke sprite; all share one small canvas texture, with no per-hit material or geometry allocation. Smoke intensity and width reflect accumulated strikes.
- Smoke resets when the game restarts. The deterministic Chrome QA scene now asserts both the impact flash and smoke are visible after a staged skyscraper strike.
- Automated QA, actual browser screenshot review, and hardware FPS results remain unverified for this checkpoint; no changes were deployed to main.


## Continuation — landmark-targeted distant meteor strikes

- Distant meteor streaks now trigger a strike effect on the nearest Philadelphia skyline landmark instead of always exploding in empty space at a uniform altitude.
- Each of the nine modeled landmarks has one dormant impact sprite; all sprites use a shared procedural glow atlas. Impact flashes fade in simulated time, with no per-strike GPU texture or mesh allocations.
- Each strike adds a small, capped contribution to that landmark's visual damage; existing skyline destruction progression and foreground gameplay remain separate.
- Corrected impact alignment to use each tower's fully transformed facade position, including collapse transforms.
- Added a deterministic browser QA hook to stage a strike on Comcast Technology Center, assert that tower-specific damage and the flash are active, and capture `qa-output/06-landmark-strike.png` from the running renderer. The new test outcome and hardware performance are not yet confirmed.


## Continuation — damaged skyline electrical flicker

- Damaged Philadelphia landmark facades now show irregular intermittent window illumination after dark, suggesting electrical failures during citywide meteor strikes.
- Fixed cumulative emission darkening caused by multiplying the existing material intensity on every incremental damage update. Intensity is now recomputed deterministically from current nighttime, damage and animation state.
- Uses existing tower materials and nine lightweight calculations per skyline update; no new geometry, dynamic lights or textures.
- Browser QA and actual visual review for this change remain pending. This does not change school damage, local meteor impacts, gameplay mechanics or the live production build.

## Continuation — distant rooftop architecture

- Added simple HVAC units and stair-access housings to selected rows of distant residential and commercial buildings. Geometry remains fixed to each building's roof.
- Reused the distant neighborhood's existing InstancedMesh architecture; the new rooftop material adds at most one draw batch per populated depth tier, with no per-building draw calls or per-frame update logic.
- Visual composition and browser QA are pending confirmation. Gameplay, school source geometry, collisions and the released version were not changed.

## Continuation — soft distant smoke

- Replaced the distant neighborhood's rigid black damage cones with translucent layered smoke sprites drawn from one shared 64 × 128 procedural atlas.
- Retained the same 28-marker cap and existing health-driven placement; no additional smoke objects or draw calls at an equivalent damage level.
- All smoke sprites share one texture and material. This is a visual pass only; fire damage, gameplay collisions, and school destruction remain unchanged.
- Browser screenshot review and benchmark results for these new changes are pending GitHub Actions verification.


## Continuation — baked atmospheric depth variation

- Farther residential blocks now blend their existing instanced facade colors slightly toward a muted atmospheric palette; deterministic parcel-level tonal variation reduces repeated identical fronts.
- Reuses the existing building geometry, materials, and draw batches. No additional draw calls or per-frame work are introduced by this change.
- This is an artistic distance cue, not a claim of surveyed parcel colors or geographic accuracy. Browser visual QA and hardware performance remain to be reviewed for this change.


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


## Skyline curtain-wall materials

Comcast, Liberty Place and glass towers use larger glazing panels, restrained pane variation and broad baked sky reflections. No extra textures or draw calls. Full local browser QA passed; skyline-day.png and skyline-report.json record the result.


## Interior night lighting

Night emission now emphasizes retained source interior surfaces while glass emission is subdued. No new geometry or lights. Full local browser QA passed; actual capture is qa/review/interior-night.png. This is a presentation improvement, not a verified atrium reconstruction.


## Grounded tower collapse and playable preview

All collapsing landmarks now shorten above the ground datum; tilted profiles lift their lower corner rather than sinking below the street. Full local QA passed and the rubble screenshot was inspected. PLAY-PREVIEW.cmd serves the development build on localhost:8769 using Python.


## Falling facade panels

Fragments now use upright architectural proportions and the tower facade material, rotating toward a resting pose. Ground support uses the full rotated box extent. Full local browser regression passed. Hardware cost remains unverified.



## RC5 desktop interception HUD clearance — November 8, 2026

- Exact-head [browser QA #294](https://github.com/erin6374/dragon-defense-play/actions/runs/42480421784) passed on `02c39cf`, including Chrome browser checks and Windows preview packaging; inspected the actual `02-playing.png` and `02b-compact-hud-synthetic-alerts.png` artifacts. The previous wave/compact warning spacing is now clear in those captures.
- Found a separate **visible** desktop defect at 1024×576: the centered interception-status banner (`top=70`, `bottom=103`) covers the bottom of the top HUD (lives/health), while the HUD ends near 88px. Desktop-only CSS now moves status to 96px, wave toast to 144px, and hostile warning to 187px. Compact 848×480 CSS remains unchanged.
- Extended the real 1024×576 Playwright geometry assertion to require a gap between top HUD and interception status, plus status and wave toast. No simulation, controls, asset, camera, or render work changed. **New exact-head browser QA and screenshot review are required before this correction is verified.** No hardware FPS claims.
