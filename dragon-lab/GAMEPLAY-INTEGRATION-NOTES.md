# Paulo Dragon Lab → playable Dragon Defense integration contract

**Status:** Pre-integration engineering notes. The playable dragon in `src/game.js` has NOT been replaced. The artist's procedural lab prototype is still isolated, and production `main` remains unchanged.

## Verified source-level integration seams

- `src/game.js` creates `dragon` as a scene-level `THREE.Group` (near lines 484–534), adds meshes, and stores the two legacy `wings` pivots. The game intentionally uses this same root for positioning, orientation, visibility, collision testing, aiming and downstream NPC targeting.
- `perchDragon()` resets root pose, perch position, attack timers and legacy wing pivots. The game tick (near lines 1820–1840) updates movement, `facing`, `turnTime`, root scale/orientation, hit-recovery and wingbeats.
- `gasAttack()` starts `gasPose` for a short interval; `releaseWind()` uses a charged `holdStart` and starts `gustTime`; `shoot()` produces fireballs with a cooldown. Keep those **real simulation systems**; the replacement is visual only.
- `dragonStun` and `recoveryLift` drive fall/impact/takeoff; `dragon.visible` includes damage blink/invulnerability, and `dragon.scale.x` is used to turn the old mesh.
- The independent `dragon-lab/paulo-lab.js` builds an original procedural anatomical rig, but also constructs its own renderer, camera, scene and DOM. **Do not import the entire lab into `src/game.js`**; extract a renderer-agnostic rig factory first.

## Pure animation adapter

`src/dragon/paulo-animation-intent.js` now defines the shared 12-state vocabulary and `choosePauloPose(signals)`/`choosePauloBankDirection({horizontal,facing})`. Pure functions: no DOM, rendering, input, timers or hitbox side effects. QA verifies the state priority and exact agreement with the lab's twelve pose names.

Approximate signals to bind when ready:

| Playable game signal | Paulo input | Pose intent |
|---|---|---|
| `dragonStun > 0` | `stunned` | hit (highest priority) |
| `recoveryLift > 0` | `recovering` | takeoff |
| `gustTime > 0` | `windGust` | wind |
| `gasPose > 0` | `gasAttack` | gas |
| `holdStart > 0` with eligible charged wind | `windCharging` | inhale |
| a just-fired shot event, not simply any remaining cooldown | `fireAttack` | fire |
| `turnTime > 0` | `turning` | bank; sign from movement/facing |
| `move !== 0 || rise !== 0` | `moving/rising` | flight |
| on the school roof before takeoff | `perched` | idle |
| airborne with no input | no special flag | hover |
| future explicit glide/land state | `gliding/landing` | glide / land |

The selector only chooses intent. **Pause must freeze pose time** without changing state; smooth transition blending and attack overlays still need implementation. Do not infer attack state from a general keypress if shooting was disabled by stun or water.

## Safe integration sequence

1. Extract `createPauloRig(THREE)` and `updatePauloRig(rig, pose, time, direction)` from the lab **without** copying its camera, renderer, DOM, or standalone scene into the game.
2. Place the new rig under a *visual-only* child of the existing `dragon` root. Preserve the root's coordinates, ray/aim interactions, health/collision bounds, invulnerability visibility and camera tracking.
3. Keep the entire old dragon as a selectable fallback; use a development-only toggle defaulting to legacy until accepted. Switching must not reset health, cooldowns, score, level, or movement.
4. Normalize Paulo's model scale/orientation against the existing 1.20-scaled mesh. Check negative-X facing, independent of the model's local coordinate frame; avoid double-mirroring wing articulation when the game turns.
5. Use the game's existing `shoot()`, `releaseWind()` and `gasAttack()` for collision and gameplay effects. The lab particle systems are illustrative preview visuals only; prevent duplicate gameplay projectiles, smoke and wind.
6. Verify 12 states, both banks, a realistic transition/crossfade, full-screen/mobile controls, level start/reset, rooftop perch, frozen/stunned dragon, attack priorities and timing under high simulation load.
7. Benchmark identical graphics settings on the target Windows GPU and an Android device before enabling Paulo by default or packaging the combined v5.4 release.

**Release gating:** See `RELEASE-PLAN-v5.4.md`. The user requested that **all recent game changes be consolidated once Paulo is finished**, not that an unfinished laboratory model immediately replace the existing dragon.
