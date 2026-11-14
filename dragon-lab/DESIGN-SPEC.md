# Paulo — original realistic mascot hybrid / v5.4 design specification

**Status:** Concept-to-blockout; not approved for gameplay integration. The standalone `dragon-lab/index.html` is an original procedural Three.js rig and animation timing reference, **not** a finished sculpt, textured model, GLB export or a direct recreation of any HBO dragon.

## Artistic intent

- **Silhouette:** strong chest, compact armored skull, long tapering tail, broad batlike wings, two hind legs and two forelegs; original identity and school mascot personality.
- **Palette:** charcoal #24272d armor, crimson #9b2430 dorsal scales, deep red #7e1d2b wing membranes, warm bronze horns, amber #ffc04c eyes.
- **Reference categories:** naturalistic membrane tension, wing mass and joint mechanics, cinematic bank/recovery, recognizable facial expression. The *Game of Thrones* franchise is **motion/anatomy reference**, not a source of copied meshes, textures, sounds, or animation clips.
- **Readability:** silhouette must remain clear in the angled, zoomed-out gameplay camera. At game scale, large wing and head gestures take priority over micro-detail.
- **Scale:** relative to Dragon Defense's current collision and camera system; do **not** treat the concept poster's proposed 72–80 m wingspan as final game dimensions. Establish scale against the existing school and helicopters before integration.

## Hierarchy and joints (blockout)

`root → torso → chest → neck → head → jaw`; tail: seven serial segments; legs: four hip/knee/foot assemblies; wings: two mirrored shoulder/elbow/wrist chains, with radial membrane fingers. Markers can be toggled in the viewer.

**Production rig recommendation:** use a skinned GLB with physically weighted membranes and wing fingers. The current procedural blockout uses separate mesh pivots; its polygon count, UV layout and topology are **not** production-ready. Retarget all gameplay actions to an animation state machine rather than independent oscillations.

## Animation timing targets (initial, subject to playtest)

| State | Loop / duration | Primary pose intent |
|---|---:|---|
| Idle / breathe | 3–5 s loop | torso respiration, head scanning |
| Hover | 1.0–1.5 s wingbeat | forceful downstroke and body lift |
| Forward flight | 1.2–2.0 s wingbeat | streamlined chest and tail |
| Glide | 2–4 s hold | spread wings, subtle fingertip correction |
| Bank | 0.5–0.9 s transition | roll and asymmetrical wing posture |
| Inhale | 0.7 s anticipation | chest expansion, retract neck |
| Wind exhale | 0.85 s | braced wings, extended head, recoil |
| Fire | 0.15 s startup + hold | head thrust and open jaw |
| Gas | 0.25 s startup + hold | abdominal compression, lowered head |
| Hit | 0.4–0.7 s recovery | wing correction and recoil |
| Landing | 1.2–1.8 s | legs extend, wings brake |
| Takeoff | 0.8–1.3 s | crouch, spring, large first downstroke |

**Transitions:** preserve current aim/attack responsiveness. Blend the jaw/chest attack layers over the active flight locomotion; avoid interrupting wind charge, meteor targeting or fireball cooldown.

## Acceptance gates before integration

1. **Orthographic review:** front/side/top/rear show matching proportions and no mirrored-wing inversion.
2. **Animation review:** 12 states play without detached membranes, wing intersections or snapped joints; test both directions of bank.
3. **Performance:** measure frame times and draw calls on the actual Windows target GPU against v5.3.1 at equivalent settings.
4. **Gameplay readability:** fire/wind/gas are visibly different at normal play zoom; player can still aim and see incoming meteors.
5. **Collision and rollback:** match the existing dragon's effective hitbox and movement constraints; preserve original dragon as a selectable fallback.
6. **Rights and provenance:** original model/texture/animation work only; no extracted show assets or copyrighted franchise character likeness.

## Preview

Start the normal Windows preview launcher and open **http://127.0.0.1:8769/dragon-lab/** in a second browser tab. The lab is isolated; it does not modify the active game or save files.
