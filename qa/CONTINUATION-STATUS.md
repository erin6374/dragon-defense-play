# Graphics continuation — November 6, 2026

## Repository and deployment audit

- Original local checkout: clean `main`, `9442ada`, behind GitHub.
- GitHub main: `edc333709757933903c70e2bef93c2e439507059` (v5.2.3 QA dashboard merge).
- Existing graphics branch: `feature/north-broad-graphics`, `9f950c471245b5b8b328aefa14fb539ec250e275`.
- Existing draft: https://github.com/erin6374/dragon-defense-play/pull/2 . Continued this branch; no duplicate PR was created.
- Existing branch browser workflow succeeded: https://github.com/erin6374/dragon-defense-play/actions/runs/42323159350 .
- Latest main Pages workflow succeeded: https://github.com/erin6374/dragon-defense-play/actions/runs/42271832963 . Direct live build-file retrieval was unavailable through the web reader, so this is deployment-workflow evidence rather than an independent live-file comparison.
- Referenced chat contains no attached mockup or Street View files. Earlier branch notes describe those references, but this continuation could not independently inspect the original uploads.

## Changes in this continuation

Moving vehicle headlights brighten after dusk, with a feathered road pool following chassis position and yaw. Pools remain hidden in daylight and on parked cars; no dynamic light slots were added. Bikes retain their existing appearance.

Distant streak impacts now transform their skyline-local location into scene coordinates before creating flashes. Expiring flashes retain the shared geometry rather than disposing buffers still used by other flashes. These fixes do not change local meteor collision or school destruction.

The existing perspective camera, fixed world-space city blocks, near-foreground decorative offset, Philadelphia landmark geometry and original school FBX are retained. Building Explorer was not edited.

## Local verification

The complete Playwright suite passed twice on Microsoft Edge 156.0.4314.58, using software WebGL and the mobile graphics preset at 1024 × 576. The final run recorded zero browser errors and zero warnings. All changed JavaScript files passed syntax checks; `git diff --check` passed.

Coverage includes startup, actual source/game school geometry comparisons, both camera pans, anchored streets, localized school impact, terminal collapse, settled rubble, restart, dusk, and daylight/night headlight visibility. Real PNGs and full diagnostics are in `qa-output/` locally. The final run's road-light check returned daylight hidden, night visible, strength 0.24.

The final performance sample recorded 721 draw calls, 1,028,048 triangles and render scale 1. Its reported 0.8 FPS is a headless software-rendering result, not a hardware or mobile benchmark. Traffic and damage evolve during the suite; counts from different runs are not controlled before/after comparisons. No frame-rate improvement is claimed.

## Verified versus incomplete

| Priority | Evidence and remaining work |
| --- | --- |
| Real 3D midground | Retained existing geometry; browser pan assertions confirm anchored world positions. |
| Near foreground | Retained decorative offset; both pan assertions pass. |
| Philadelphia skyline | Recognizable Liberty Place, Comcast and City Hall silhouettes visible in actual captures. Still stylized; semi-photorealism is not achieved. |
| School facade | Source/game bounds and triangle counts match; exterior probes, impact, collapse and restart pass. Reference-photo fidelity cannot be rechecked without original uploads. |
| Atrium | Existing interpreted double-height structure remains. Intact facade glazing does not demonstrate the interior; accurate atrium presentation remains incomplete. |
| Geography | Existing compressed game grid retained. Individual parcels and landmark bearings are not independently verified here. |
| Camera/depth | Perspective and fixed-world pan checks pass. Screenshots reviewed; exhaustive occlusion testing remains open. |
| Materials and lighting | Dusk/night state and vehicle headlight behavior checked. Scene remains stylized; realistic facade reflection and interior lighting remain work. |
| Distant disaster | Corrected coordinate conversion and shared-flash resource lifetime. Sustained cinematic composition and impact appearance need further visual review. |
| Performance | Software counters recorded. Hardware/mobile performance is unverified. |

## Release status

No production deployment or merge. Keep the existing PR in draft until the remaining visual targets and device performance are reviewed. Windows allowed shell copying into the project after a security adjustment, but Node screenshot writes there were blocked again; the user was notified before retrying.
