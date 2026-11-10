# v5.5 RC1 — building combustion replacement

## Scope

Replaces the neighborhood primary flame/smoke sprites, secondary window quads,
old ember point cloud, ambient roof sprites, and all persistent skyline fire
sprites with `building-combustion.js`. Meteor exhaust, dragon fire, foreground
school fire, destruction physics, scoring, and the separate Building Explorer
retain their existing paths. Skyscrapers remain standing.

The repository's `campaign/visual_target.png` was inspected for compact
window-origin flames and rising smoke. The new chat did not contain the
mentioned attachment and its acceptance sentence was truncated. This is a
playable rendering candidate, not a claim of matching an unseen reference.

## Implementation

- Three intersecting procedural flame sheets per opening, individually seeded
  and advected on the GPU. No shared animated flame bitmap for building fires.
- Up to six buoyant smoke volumes per opening, each integrating six density
  samples through a noisy sphere. Puffs expand, curl and fade in optical depth.
- Up to five glowing embers per opening and a surface-aligned opening/soot/glow
  pass. Illumination and smoke scattering are approximations, not shadowed
  fluid simulation or additional physical light sources.
- Distant rowhouses derive sources from actual window instance dimensions;
  roofs use horizontal breach marks. During destruction, sources descend into
  separated rubble locations. Near-background structural buildings use their
  actual window parts and follow detached pieces.
- Tower sources snap to the facade texture's window grid below roof setbacks.
  Repeated impacts preserve the existing source phases.
- Two fixed pools: 168 neighborhood opening slots and 36 skyline slots.
  Each pool uses four draw batches and no textures. Near/far per-source budgets
  fall from 3/6/5 to 2/2/1 flame/smoke/ember instances. No impact-time GPU resource
  creation; restart clears slots for reuse.

## Verification

Browser regression includes resource reuse, capacity rejection, LOD budgets,
source stability under animation, collapse anchoring, and reset checks.
Motion capture records all five existing gameplay scenarios and captures shader
console errors as failures. Final results and observed limitations are recorded
in the delivered release notes.

An existing 848x480 radar/menu overlap found during local QA is corrected by
moving the radar eight pixels upward. The app title and runtime build metadata
now identify this release candidate consistently.

Hardware GPU frame pacing, Windows launcher interaction, and final art approval
remain separate from automated software-renderer verification.

## Local results — November 10, 2026

Full browser suite passed: no failure, zero console/page errors and warnings.
Pool tests verified near/far counts 3/6/5 versus 2/2/1, slot clearing, overflow
rejection, stable GPU resource identities across 100 reuse cycles, and fixed
source transforms under the animation clock. Integration checks passed for
building collapse, standing towers, near-building hits, restart, and gameplay.

All five 100-frame motion scenarios passed with no captured errors. These local
captures ran from the working checkout before its final source commit; the SHA
inside the original motion report is the base revision, not a certification of
an exact committed tree. The house and skyline scenarios loaded the final fire
renderer. Exact-head CI is the independent committed-source check.

Reviewed actual house/skyline video frames at 1.2, 2.4, 3.4 and 4.8 seconds:
window sources stay attached; house flames descend to rubble; towers remain
upright. Smoke visibly changes shape and position. Remaining art limitations:
flame tips remain narrow/conical, smoke lobes are individually legible, facade
illumination is a local overlay, and surrounding architecture remains stylized.
Do not describe this as photorealistic or final visual acceptance.
