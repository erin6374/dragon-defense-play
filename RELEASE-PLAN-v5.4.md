# Dragon Defense — consolidated v5.4 release plan

Status: **Planning / unmerged preview.** User requested on November 7, 2026: **once the new Paulo dragon is finished, incorporate all recent changes into a new release.** This is approval to pursue an integrated release after completion, **not** permission to merge untested work immediately.

## Version and branches

- Target release candidate: **v5.4.0** (adjust semver if the final scope requires it).
- Released production `main` currently remains v5.2.3. The existing development PR #2 on `feature/north-broad-graphics` holds the v5.3 graphics/gameplay work and isolated Paulo v5.4 animation lab.
- Preserve the separate Building Explorer unchanged.
- Do not ship the isolated Paulo Lab as though it is already the in-game replacement.

## All recent changes to integrate and audit

1. **Graphics / geography:** North Broad Street perspective scene, school FBX alignment, architectural glazing and materials, dusk/night lighting, Philadelphia skyline, nearby traffic and city-detail improvements. Keep verified fixes for sky/camera parallax, grounded skyline collapse, falling façade panels, and source-school destruction.
2. **Disaster spectacle:** background meteor activity, cumulative distant skyscraper impacts, persistent smoke/scorch/rubble and reworked cinematic effects; retain local-player health isolation where existing code specifies it.
3. **Gameplay effects:** v5.3.1 charged-wind deflection of meteors/helicopters, ground pedestrians/vehicles, lightweight dust/scraps and smoke interaction; preserve attack mapping and fire-suppression behavior if already implemented and verified.
4. **Paulo:** complete an original production-ready dragon visual, articulated wings/body, responsive attack poses, flight/hover/bank/takeoff/land motion, distinct fire/wind/gas visuals. The procedural `/dragon-lab/` is currently a **reference prototype** only; build the actual gameplay integration separately.
5. **Robustness/performance:** startup launcher fixes, deterministic reference captures, CI regressions, cached materials/geometries and long-session patrol/damage-reset corrections. Audit the full branch change log and source diff against `main`; do not assume an item is finished merely because it appears in notes.

## Acceptance gates

- [ ] Paulo anatomy approved after front/side/top/rear views visibly show complete silhouette; no clipping, detached membrane, inverted bank, joint snapping, or obvious intersections.
- [ ] Both left and right bank, 12 animation modes and transition blends function in the actual game camera, not just the lab.
- [ ] Integrate Paulo behind a **selectable old-dragon fallback** and preserve effective collision radius, aim/fire/charged-wind/gas behavior, cooldowns, health, scoring and mobile input.
- [ ] Test complete gameplay through later levels, full meteor waves, school and neighborhood destruction, background city impacts, day/night changes, restart, sound and browser fullscreen.
- [ ] Confirm previous graphics/wind releases were actually incorporated; compare changes against production `main` and list any intentionally omitted features.
- [ ] Full GitHub browser QA green for exact final candidate head and visually inspect relevant screenshots.
- [ ] Measure frame pacing/FPS and visual quality on actual Windows GPU and mobile hardware (software-WebGL browser CI is not a hardware performance benchmark); compare to last playable build at equivalent settings.
- [ ] Package full **Windows runnable ZIP** with offline bundled vendor assets, validated `PLAY-PREVIEW.cmd`, version/changelog and the full QA/benchmark instructions. Ensure single-click launch on a real Windows machine.
- [ ] **Android playable build** is a requested distribution target; confirm Android packaging/signing and touch performance are possible with the available build pipeline. Do not advertise an APK until one has actually been built and installed/tested.
- [ ] Confirm production rollback point, save compatibility and release version labels. Keep the separate Building Explorer unmodified.
- [ ] Only after these gates, publish the completed integrated release and provide precise downloads and a verified list of changes.

## Verification language

Use **implemented**, **source-tested**, **browser-QA passed**, **visually reviewed**, **Windows-tested**, and **Android-tested** as different statuses. A passing unit or headless browser test does not prove visual fidelity, hardware performance or release readiness.

## Current near-term development focus

Fix cropped front-reference wing tips with true auto-framed orthographic views, strengthen reference screenshot QA, inspect the actual captures, finish Paulo art/rig, then integrate into the existing game with a fallback and run end-to-end gameplay/hardware tests. Keep the existing draft PR and development branch until release acceptance.
