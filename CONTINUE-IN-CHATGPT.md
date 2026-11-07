# Dragon Defense — carry-over bookmark

Continue the Tech Freire Dragon Defense graphics overhaul. Do not start over.

- Repository: https://github.com/erin6374/dragon-defense-play
- Working branch: `feature/north-broad-graphics`
- Existing draft PR: https://github.com/erin6374/dragon-defense-play/pull/2
- Latest verified checkpoint before the sky pass: `2fed106`.
- Live production remains on main; the draft overhaul has NOT been merged or deployed.
- Local project: `C:\Users\Tech-Erin\Documents\ChatGPT\TECH FREIRE Building Projects\dragon-defense-play`.
- Interim ZIP: `Dragon-Defense-5.3-preview.zip` in the parent project folder. Refresh it at the end; it is not the final release.

## Already implemented

Perspective camera with fixed 3D city blocks; subtle foreground offsets; depth-tested dragon; Philadelphia landmark geometry; original school FBX and damage/collapse paths; translucent school glazing and physical material settings; dusk vehicle headlight road pools; aligned distant meteor impacts, warm meteor cores, and shared flash-geometry lifetime fix.

Full local Playwright checks passed for the last saved checkpoint. Reports and actual screenshots are committed under `qa/review/`. Performance counts are software-renderer observations, NOT verified hardware FPS. Read `CHANGELOG.md` and `qa/CONTINUATION-STATUS.md`; inspect newer commits and current PR checks before making changes.

## Remaining priorities

Improve city and skyline realism, sky/cloud appearance and cinematic disaster staging. Verify the actual atrium and geography against reference images. Original uploaded mockup and Street View screenshots were not accessible from referenced chat `6aed7042-35c8-83e9-9ce5-1e37429a8d45`; ask the user to reattach them when needed. Do not invent surveyed accuracy or claim photorealism is complete. Preserve separate Building Explorer.

## User preferences and release policy

Keep working without repeated continuation prompts. Budget remaining session resources and reserve time to test, update this bookmark, and package ALL latest verified changes near the end. The earlier ZIP was created prematurely and is only a checkpoint. Publish/deploy only after checks pass; keep unfinished visual work clearly labeled as a preview. If Windows Security blocks a file edit or screenshot write, ASK THE USER to clear that specific block rather than repeatedly working around it.

## Local QA

`qa/local.mjs` starts a local server and runs `qa/browser.mjs`. Set `PLAYWRIGHT_MODULE` to the bundled playwright-core `index.mjs`, and `QA_BROWSER_EXECUTABLE` to installed Microsoft Edge. Local networking requires the approved execution mode. Use a writable TEMP/TMP folder for the browser profile. Existing runtime: `C:\Users\Tech-Erin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright-core\index.mjs`. Edge: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.

Regular ChatGPT may not have filesystem or GitHub execution access. Use the linked PR and this file as context; request the ZIP/reference images if needed, and do not claim code execution without tools.

## Latest session checkpoint

The atmospheric sky pass is now implemented and passed the complete local browser suite. See qa/review/sky-report.json and sky-dusk.png. The latest branch commit includes this bookmark; use the current PR head as the definitive revision.


The subsequent skyline curtain-wall material pass also passed full local browser QA. Latest evidence: qa/review/skyline-day.png and skyline-report.json. The scene remains stylized and the original reference uploads are still needed for fidelity review.


## References recovered November 7

User supplied the cinematic mockup at H:\Downloads\1.Dragons Defence\Archive\Dragon Defense on North Broad Street.png. User does not have Street View screenshots and explicitly asked us to research 2221 North Broad Street ourselves. Stop requesting those uploads. Architect's public exterior/interior photographs: https://cicadaphiladelphia.squarespace.com/education/tech-freire . Address and project documentation: https://www.architectmagazine.com/project-gallery/tech-freire-charter-school/ . These document the real school; the supplied mockup is the cinematic appearance target, not surveyed geography. Photo geometry and nearby parcels still require inspection before claiming accuracy.


Latest follow-up: source interior night emission increased and glass emission reduced; full browser QA passed. Evidence: qa/review/interior-night.png and interior-report.json. PROJECT-HANDOFF.md remains the architecture guide; consult newer changelog entries for current state.


## Combined development checkpoint

Integrated remote skyline work through 78e4262 with local source-interior night lighting f5f8400. Full combined local browser QA passed. Reviewed dedicated falling/rubble screenshots: some tilted tower geometry extends below the apparent ground and slabs read as thin floating strips. Correct the collapse ground/clipping and fragment presentation next; do not treat numerical position tests as visual acceptance. Evidence is qa/review/06-skyline-*.png and integration-report.json. No production rollout.


Latest correction: collapsing tower bodies now stay above ground; full local QA passed. See grounded-collapse.png and grounded-report.json. PLAY-PREVIEW.cmd launches a local server at http://127.0.0.1:8769/. Public production is still unchanged.

