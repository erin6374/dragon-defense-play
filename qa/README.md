# Dragon Defense browser QA

Open **Actions → Dragon Defense browser QA → Run workflow** for an on-demand run. Pull requests run the same suite. A push to `main` runs it before the Pages deployment, then checks that Pages serves the release files. Download **dragon-defense-browser-qa** from the run summary. GitHub retains it for 30 days, including failure diagnostics.

The artifact contains startup and gameplay PNGs, camera pans, both school side elevations, and matched front, corner, and side views before impact, after a localized impact, and after total collapse. The comparison PNGs use the same orthographic camera and lighting per view for the full raw FBX, the unbatched school selection, and the model rendered by the game. `report.json` records camera offsets, draw calls, triangle counts, bounds, damage, browser messages, and software-rendered frame timings.

## Motion review

The motion recordings now run under the **separate [Dragon Defense motion review](../.github/workflows/motion-qa.yml) workflow**, instead of sharing the main browser QA's cancel-on-new-commit setting. This is essential: hourly development commits previously cancelled motion runs after their recordings finished. The motion workflow permits an active recording to complete and queues subsequent exact-head captures. Pull requests trigger it automatically; manual workflow dispatch is available once GitHub recognizes the workflow on the selected branch.

Download **dragon-defense-motion-qa**, extract it and open `index.html` to play five 960 × 540 MP4s, including a newly added close-up Paulo flight sequence. The artifact contains three reference PNGs per clip, `review-guide.md` and a JSON report with the exact commit, seed, timeline and per-frame scene counters.

Each five-second clip uses a fresh seeded browser context and 100 rendered frames, with three production simulation steps per frame. `skyfall.mp4` records the wide meteor split and dragon movement. `dragon.mp4` tracks Paulo closely through wing beats and direction reversals so the flight animations can actually be judged. `houses.mp4` and `skyline.mp4` capture multiple real impacts from diagnostic cameras. `traffic.mp4` now uses a closer road camera for visible wheel/vehicle roll and gust recovery. Video playback cadence is simulation time, **not measured real-time GPU FPS**.

A time-coded, manually inspected baseline is maintained at [MOTION-VISUAL-REVIEW.md](MOTION-VISUAL-REVIEW.md). The recorder validates events and produces MP4s; it does not automatically certify physical plausibility. Review the motion itself before claiming graphical quality.

To reproduce locally, serve the repo over HTTP, install Playwright Core and FFmpeg with libx264, set `PLAYWRIGHT_MODULE` to Playwright Core's absolute `index.mjs` path, and set `QA_BROWSER_CHANNEL=chrome` or `QA_BROWSER_EXECUTABLE` to a compatible Chromium binary. Run `node qa/motion.mjs http://127.0.0.1:8765/`. Outputs go to `qa-output/motion/`. Software rendering and browser versions can affect pixels across machines.

## v5.2.2 source fidelity

The three matched views each reported 592,298 triangles for the source school and the game model. The axis-aligned bounds differed by less than 0.001 game units. Batching reduced the school from 3,420 draw calls to 8 in isolation. The v5.2.1 matched renders showed a reconstructed grid of window bays and a simplified flat roof, while v5.2.2 shows the source's two main window banks, front doors and rails, and rooftop volumes.

- The original FBX is shipped byte-for-byte. The school uses one axis correction and uniform scale. Its entry doors, glazing, mullions, façade bands, and roof structures come from the retained source meshes. A brick, glass, and metal palette makes the details legible in play because the FBX exports them in neutral gray.
- The school selection excludes non-school masses, interior furnishings, and overlapping Revit reference volumes. The full raw FBX is in the comparison to show what was filtered. The model is validated against that asset, with no field survey or texture-color reference.
- During normal impacts the game cuts a local opening and adds scorch shading in the FBX surface. The existing physical simulation still detaches structural pieces and drops debris. At terminal collapse the game hands off to the reconstructed structure. Detached pieces and the final collapse use the simulation's approximate geometry.
- The staged meteor goes through the production collision and impact routines. The suite also verifies the collapse handoff and restart. Frame timings are from headless software WebGL. Use them to detect stalls and compare controlled runs. Hardware and mobile frame rates require device testing.

Rollback point: [v5.2.1](https://github.com/erin6374/dragon-defense-play/tree/rollback/v5.2.1).

## v5.2.3 school repair and collapse

The side checks probe the restored exterior masonry at four locations and verify that the rear stair opening stays clear. The staged iron meteor must change a limited area of the front render and detach glass and façade pieces while the main structure remains standing. The total-loss check waits for all parts to settle, verifies that the front and side silhouettes have no standing shell, checks that the rubble stays below one game unit and persists, then restarts the game.

Rollback point for this release is [v5.2.2](https://github.com/erin6374/dragon-defense-play/tree/rollback/v5.2.2).
