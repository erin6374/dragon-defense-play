# Preview 11 — candidate acceptance and packaging gate

This is a QA policy, not a release certification. Work remains on integration/preview-11-park13; draft PR #7 is QA only, never merge. The existing Preview 10 and independent source branches remain intact. Keep Park13 opt-in until all required acceptance evidence is reviewed.

## Evidence collection

Check out the exact candidate SHA on a clean working tree. Run the Park13 integration pilot workflow from draft PR #7 (or manually on its branch). The workflow checks out the PR head rather than the synthetic merge commit. The artifact contains source-audit.log, source-audit.json, report.json, paired baseline and expansion captures, and server logs. Do not treat a workflow ID alone as a pass. All acceptance records must carry the same 40-character candidate SHA.

Run `node qa/park13-release-check.mjs <candidate-sha> <evidence-directory>`. Nonzero exit means blocked. The gate consumes source-audit.json, report.json, native.json, visual.json, and package.json. The policy unit tests are synthetic and cannot substitute for actual evidence.

## Native paired baseline and expansion protocol

Use the target Windows RTX 3060 hardware, native Chrome/Edge ANGLE D3D11 (not SwiftShader), Balanced preset, 45 FPS cap, 1280×720 viewport, same display and power state. Use the same checked-out candidate server for both park13=0 and park13=1; QA benchmark mode is `?qa=1&benchmark=1&park13=0` or `=1`. Do not add motion=1 or force dt: those bypass live frame timing. Keep the page visible and focused. Verify actual WebGL renderer, benchmark preset and cap. Warm up at least 10 seconds before each sample. Start and stop the existing window.__DD_BENCHMARK capture around the same two paired workloads: traversal across full playable block and sustained matched sandbox bombardment. For each capture retain the original benchmark report including frame samples and scene/settings; compare the same locations, target schedule, duration and seed. At least 300 focused samples per case; no context loss. Repeat questionable runs rather than discarding bad samples silently.

Native evidence shape: source, passed, renderer, preset, fpsCap, viewport {width,height}, cases [{name, expansion, averageFPS, p95FrameMs, samples, contextLost, focused, completed}]. Four cases: traverse and bombardment, each expansion false and true. Report raw data separately. Initial engineering acceptance thresholds are at least 40 average FPS in both configurations, expansion p95 <=40ms, expansion FPS >=90% of paired baseline and p95 <=120% of paired baseline. These are proposed project thresholds, not measurements; motivated by the previously documented Preview 10 Balanced 45 FPS / 33.5ms p95 result. Do not mark native passed on a software renderer.

## Visual review

Review north, central, south, campus, street seams and damage/repair on the exact candidate. Compare against baseline, actual game capture and pinned architecture references as appropriate. Record each named view with approved true/false, evidence file/link and reviewer in visual.json. Flag visible seams, floating facade, missing buildings, duplicate context, roads, lighting, unexplained interior or destruction anomalies. Source polygon clipping is necessary but not visual approval.

## Packaging

After source, browser, native and visual checks pass, prepare the candidate archive from the exact tested tree, include version and source provenance, calculate SHA-256, test one-click Windows launcher on a clean extraction and verify rollback to the baseline configuration. Record source, passed, archive, sha256, launcherSmoke, version (5.5.0-integration.11), rollbackVerified in package.json. Retain the archive and its actual hash; this JSON is an evidence manifest, not a cryptographic signature. Do not send a download or enable Park13 by default before release gate success. No package has been produced by this checkpoint.
