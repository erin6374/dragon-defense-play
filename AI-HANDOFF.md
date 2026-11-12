## November 12 — RC43 historic street-front window proportions

Continued from RC42 docs checkpoint 0803e9a. Eight historic frontage shells now have narrow recessed upper-storey sash windows, with continuous masonry piers and correctly sized spandrels using the same existing four wall pieces per opening. School, modern apartments, campus and ground storefront glazing retain their existing proportions. Removed duplicate decorative brownstone glass/lintels that could overlay the physical openings; structural lintels/sills remain. This is a geometry/proportion pass based on previously inspected Street View, not a claim of corrected cadastral layout or completed realism.

Local syntax/diff/build-label/frontage checks pass, including narrow window widths, masonry enclosing both jambs, recess, edge impact/reset and road/campus clearances. No additional structural parts/material batches for sash change; no new textures/lights. Exact-head browser and actual left/right/day/dusk/night imagery still pending. Source-model overlays may mask procedural changes on adjacent buildings; inspect rendered views. Hardware slideshow complaint remains unresolved. Preserve RC39–42 Windows telemetry and RC37 combustion cache. NEXT: inspect RC43 rendered frontage and damage; continue roofline/storefront placement and smoke motion. Not release-ready; no main/Pages/production/original FBX changes.

# Tech Freire Dragon Defense — live AI-to-AI handoff

**Latest verified:** RC42 at observed base SHA `593bf6d85dcf0d6bebc12409dd060e757675b96f` passed five exact-head QA workflows and artifact/license checks. Actual 30s cinematic review ART FAIL; Windows hardware FPS unmeasured. See `qa/CURRENT-STATUS.md` and `handoff/state.json`. QA-only handoff update; live HEAD must be fetched again.

**One permanent entry point:** https://github.com/erin6374/dragon-defense-play/blob/feature/north-broad-graphics/AI-HANDOFF.md

**Rules of currency:** This document is a *snapshot*. Before doing any work, fetch `origin/feature/north-broad-graphics` and identify its **actual current SHA**. The live branch code and exact-SHA GitHub Actions outrank any stale SHA, claim or status in this document. Read the top of `qa/CURRENT-STATUS.md` and `CONTINUE-IN-CHATGPT.md` for later changes. Do not treat "workflow success" as proof of cinematic quality or Windows GPU FPS.

## How to resume in Google AI when ChatGPT runs low

1. Open this permalink in Google Gemini or Google Antigravity; paste the **Start Prompt** below. Gemini chat may need the text pasted or files uploaded; Antigravity should fetch the repository directly.
2. Antigravity: fetch latest remote code, inspect all WIP, create **its own work branch** off the latest ChatGPT development branch. Never work on or push to `main`, `production` or `feature/north-broad-graphics` directly. If `agent/google-antigravity-fire-calibration` contains unmerged changes, protect them and resolve/rebase carefully; do not overwrite.
3. Implement one bounded task, keep source changes committed, run and review QA, then open a **draft PR targeting `feature/north-broad-graphics`**. Leave it unmerged.
4. Return PR URL, exact commit SHA, files changed, tests *actually run*, screenshot/artifact links and remaining blockers. Paste that result into ChatGPT whenever its resources are available. ChatGPT can review and integrate with explicit verification.
5. For Gemini Pro chat **without repo-editing tools**, do read-only planning, code review and bug analysis, and return a concrete patch/implementation plan for Antigravity—not claims about commits or CI that were never performed.

### Start Prompt — copy into Google Antigravity or Gemini

> Continue Tech Freire Dragon Defense. Start with https://github.com/erin6374/dragon-defense-play/blob/feature/north-broad-graphics/AI-HANDOFF.md and fetch the *current* `feature/north-broad-graphics` HEAD, then read `handoff/state.json`, `qa/CURRENT-STATUS.md`, `CONTINUE-IN-CHATGPT.md`, `PROJECT-HANDOFF.md`, `CHANGELOG.md`, `qa/CINEMATIC-REVIEW.md` and `qa/MOTION-VISUAL-REVIEW.md`. Do not rely on old chat text or an old clone. Continue from the newest *verified* state, not from a previous release candidate. If you can edit code, isolate work in a new `agent/google-...` branch and open a draft PR against `feature/north-broad-graphics`. Never merge, force push, deploy, or modify `main`, `production`, Building Explorer or the original school FBX. Preserve causal meteor-triggered fire, playable dragon controls, licensed assets and GPU budgets. Check exact-head GitHub Actions and actual artifacts; do not confuse software-renderer screenshots with measured Windows hardware FPS. Provide the PR/commit/test links and remaining tasks so ChatGPT can resume the work.

## Project mission and non-negotiable user requirements

- Three.js cinematic disaster-defense game: the **dragon is the hero** protecting the real five-floor Tech Freire school (plus roof/basement context) and its North Broad Street neighborhood in Philadelphia.
- Disaster-film atmosphere, real-world architectural proportions, visually coherent destruction and fire/smoke, believable skyline, accurate street alignment; neighborhood extends and **takes damage on both left and right**.
- Meteor contact **must cause** background/skyline ignition and damage. Health changes alone must not cause spontaneous fires; spreading flames are delayed and source-local.
- Severe slideshow-like Windows performance was reported. This is **still an unresolved hardware-verified blocker**. Optimize GPU/CPU use without replacing correct gameplay with placeholders.
- Preserve accessible Easy difficulty; dragon movement, flight, wind attack, fire/gas and original/alternate dragon options; avoid regressions.
- Building Explorer is a **separate application**: do not modify it. Protect original `assets/visuals/tech-freire-original.fbx`, material orientation/scale, `main`, `production`, Pages deployment.
- No unsupported release claims: automated tests, still images, a 30-second motion review and real desktop GPU FPS are **different** acceptance gates.

## Current work snapshot (November 12, 2026)

**RC42 current candidate (observed parent SHA `505abcf79032be723b6f6a5f01d7b776063f87ae`, version `5.5.0-rc.42`, build `5.5-windows-visibility-rc42`):** Verified RC41 at exact SHA `505abcf79032be723b6f6a5f01d7b776063f87ae`: all five workflows SUCCESS ([browser 43289995431](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995431), [cinematic 43289995510](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995510), [focused 43289995534](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995534), [CC0 43289995414](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995414), [motion 43289995502](https://github.com/erin6374/dragon-defense-play/actions/runs/43289995502)). Downloaded actual artifacts and checked CRC: browser 13976418843 **78/78** (report errors=[] warnings=[]), cinematic 13977036679 **6/6** (errors=[]), focused 13977455124 **7/7** (errors=[]), motion 13979461593 **33/33** (genuine 600-frame/30.000s MP4, five 100-frame clips, errors=[], 585 burning frames, 380 multi-tower frames, max 402 software draw calls), Windows preview 13976314014 **145/145** (exact SHA/version/build, both CC0 WebP SHA256 match manifest). Directly inspected 11 decoded skyline frames, house before/impact/settled and all five camera views. Fires and collapse persist, but gray repetitive smoke and stylized facades remain **cinematic ART FAIL**. Software Chrome reports ~0.4 FPS and 747 draw calls; this is NOT measured Windows hardware FPS.

RC42 adds `documentHidden` and `documentHasFocus` to the existing once-per-second browser heartbeat, preserves them in independent host and browser CSV rows and `/__system_metrics`, and displays tab visibility in Performance Lab. This distinguishes hidden/throttled tabs from unexplained renderer stalls. Also fixes the UI's `Number(null)===0` defect: unavailable CPU/RAM readings now show **n/a** instead of fabricated 0.0. No extra polling, scene traversal, rendering/gameplay, original FBX, assets, or deployment changes. Local Python HTTP integration covering fresh heartbeat/stale RAF, hidden/focused/invalid values and host samples PASS; Python compilation and JS syntax PASS.

**RC42 remains a development candidate.** New exact-HEAD five workflows, real artifacts, Windows ZIP CRC and licensed hashes, and physical Windows 30–60s CSV remain pending. **Next:** verify RC42 exact-HEAD QA and package, then capture physical Windows CSV during destruction; compare `renderAgeMs`, `telemetryAgeMs`, `documentHidden`, CPU/RAM and FPS. Do not claim GPU FPS or cinematic approval.

**RC41 verified baseline (parent SHA `602c34c280e8c2d9263873bb79d5900e1ba9725c`):** Verified RC40 exact SHA `602c34c280e8c2d9263873bb79d5900e1ba9725c`: all five workflows SUCCESS ([browser 43280450584](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450584), [motion 43280450558](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450558), [cinematic 43280450660](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450660), [focused 43280450814](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450814), [CC0 43280450704](https://github.com/erin6374/dragon-defense-play/actions/runs/43280450704)). Actual downloaded artifacts CRC: browser 13972324383 78/78 (errors=[] warnings=[]), Windows preview 13972663008 145/145 (exact SHA/version/build; both CC0 WebP SHA256 match manifest), motion 13975135728 33/33 (five 100-frame clips, genuine 600-frame/30s MP4, errors=[], 585 burning frames, 380 multi-tower frames, max 402 software draw calls), cinematic 13971279640 6/6 (errors=[]), focused fire 13971863948 7/7 (errors=[]). Inspected 11 actual skyline frames, before/mid/settled house and five camera views: fire persists, but gray repetitive smoke and simplified architecture remain ART FAIL. Headless software Chrome reported ~0.2 FPS and multi-second RAF gaps, NOT measured Windows GPU FPS. RC41 corrects a telemetry blind spot: RC40 `telemetryAgeMs` measures browser timer freshness, which can stay low even if requestAnimationFrame stops. The loopback Python server now calculates independent `renderAgeMs` from `lastGameFrameUTC` for browser and host CSV rows and `/__system_metrics`; the Performance Lab shows both ages. A real HTTP integration test posts a fresh heartbeat with a 6.5s-old render timestamp and checks both ages, including an independent host sample. Local integration and syntax checks PASS. No rendering/gameplay/FBX/assets/Pages/production changes. RC41 is a development candidate: new exact-head five workflows, artifacts, Windows ZIP CRC/CC0 hashes, and physical Windows FPS CSV still pending. The slideshow complaint and cinematic art acceptance remain open. NEXT: verify RC41 exact-head QA, then capture 30–60s physical Windows CSV under heavy destruction and compare renderAgeMs with telemetryAgeMs.


**RC40 current candidate:** Windows telemetry continuity fix based on verified RC39 `d5a75049bd203ffd9e493b6640e9e9c20eef8680`. Windows launcher now opens `?devlab=1`; lightweight once-per-second gameplay heartbeat no longer trapped in motion QA and does not call expensive QA snapshots. A separate two-second Python host sampler writes CSV rows even during browser freezes, with `sampleSource`, `telemetryAgeMs`, heartbeat/frame counters; duplicate UI posts removed. Six local integration tests PASS; exact-head CI and physical Windows FPS remain pending. RC39 five exact-head workflows PASS ([browser 43270179768](https://github.com/erin6374/dragon-defense-play/actions/runs/43270179768), [cinematic 43270179783](https://github.com/erin6374/dragon-defense-play/actions/runs/43270179783), [focused 43270179618](https://github.com/erin6374/dragon-defense-play/actions/runs/43270179618), [importer 43270179673](https://github.com/erin6374/dragon-defense-play/actions/runs/43270179673), [genuine motion 43270180026](https://github.com/erin6374/dragon-defense-play/actions/runs/43270180026)). RC39 ZIPs CRC 78/78 browser, 145/145 Windows, 33/33 motion; both CC0 hashes match. Actual 11-frame motion ART FAIL gray smoke and simplified facades.


**RC39 previous candidate:** Windows performance telemetry repair, based on verified RC38 HEAD `fe24dfd1211dec118b56232294a6a13949efd1dd`. The old Windows launcher used `python -m http.server`, so its Performance Lab's four `__...` endpoints could never work. RC39 adds `tools/windows-preview-server.py` with loopback-only CSV, CPU/RAM native counters, browser FPS/draw calls, and a four-test stdlib preflight. No rendering or gameplay changes. New exact-head workflows and physical Windows performance are **pending**. The user must download RC39 preview, run 30-60s with fire/destruction and export CSV; GPU utilization is unsupported and must not be inferred.

**Verified RC38 exact-HEAD evidence:** [browser](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916833), [motion](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916870), [cinematic](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916929), [focused fire](https://github.com/erin6374/dragon-defense-play/actions/runs/43249917182), [licensed CC0 importer](https://github.com/erin6374/dragon-defense-play/actions/runs/43249917024) all SUCCESS. Real artifacts: browser CRC 78/78 errors=[] warnings=[], motion CRC 33/33 genuine 600-frame/30s video errors=[], cinematic CRC 6/6, focused CRC 7/7, Windows CRC 144/144 and both CC0 hashes match. Eleven video frames and five views inspected: ART FAIL gray repetitive smoke, simplified facades; hardware FPS unknown.


| Item | Last observed value — recheck live |
|---|---|
| Repository | https://github.com/erin6374/dragon-defense-play |
| Primary development branch | `feature/north-broad-graphics` |
| Primary draft PR | https://github.com/erin6374/dragon-defense-play/pull/2 |
| Observed base HEAD before this handoff document was added | `602c34c280e8c2d9263873bb79d5900e1ba9725c` (RC41 parent; not self-referential) |
| Version at snapshot | `5.5.0-rc.41` / `5.5-windows-render-age-rc41` (candidate; new exact-head QA pending) |
| Google independent draft PR | https://github.com/erin6374/dragon-defense-play/pull/3 |
| Google's observed HEAD | `7032b3da46683c5821d838ea4d39b84ff96b4702` |
| Google's last observed mergeability | not mergeable; outdated base |

### Last verified parent exact-SHA GitHub Actions (RC38; RC39 pending)

| Workflow | RC38 result |
|---|---|
| [Browser QA](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916833) | success |
| [Independent 5+30s motion](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916870) | success |
| [Focused fire](https://github.com/erin6374/dragon-defense-play/actions/runs/43249917182) | success |
| [Five-view cinematic](https://github.com/erin6374/dragon-defense-play/actions/runs/43249916929) | success |
| [CC0 importer](https://github.com/erin6374/dragon-defense-play/actions/runs/43249917024) | success |

**Most recent implemented primary changes:** RC36 extended destructible Broad Street frontage on both sides, with shared instance budgets; RC37 caches **byte-identical combustion source state** to avoid redundant writes to four GPU buffers, without pausing the shared shader animation. RC37 adds a deterministic five-idle-tick buffer-write regression. These need actual QA artifacts and hardware profiling before calling them accepted.

**Google contribution:** draft PR #3 calibrated rowhouse window flame scale on older RC30. Its initial browser, fire, cinematic and motion CI passed, but comparative visual review found **tiny candle-like flames**, not yet acceptable cinematic art. Its branch was stale/nonmergeable at snapshot. ChatGPT review: https://github.com/erin6374/dragon-defense-play/pull/3#issuecomment-6827300214 . Do not blindly merge or cherry-pick; verify against latest source first.

## Immediate priority queue — recheck before selecting

1. **QA gate:** RC40 needs five new exact-head workflows, Windows ZIP CRC and CC0 hashes, then physical Windows CSV capture; parent RC39 five workflows passed. Check current primary HEAD, five GitHub Actions workflows, exact-SHA report errors/warnings, screenshot artifacts, licensed CC0 hashes, Windows development-preview ZIP CRC and genuine 600-frame/30-second motion review. Fix test failures properly, do not weaken assertions to pass.
2. **Performance (release blocker):** Investigate actual game FPS and large RAF gaps on the user's Windows GPU in dense fire/destruction scenes. Source-level upload/pixel budget changes may help but are **not** measured FPS proof. Capture hardware, resolution, quality preset, FPS, draw calls, CPU and GPU behavior. Prevent per-impact allocations and shader overdraw explosions.
3. **Cinematic realism (art blocker):** Rowhouse flames/smoke still stylized; skyline smoke repetitive/gray; facades/urban detail simplified; demolition often looks like scaled/sinking boxes rather than physically plausible rubble. Review actual 5+30s gameplay images/video and approved `campaign/visual_target.png` side-by-side.
4. **Streetfront completeness:** Inspect both damageable frontage extensions from RC36 on left and right at gameplay distance and compare building height, texture, windows, and impact/collapse fidelity with the school.
5. **Collaboration follow-up:** Independently review Google PR #3 revisions only when they are rebased and retested, with reasonable window-sized fire visibility and no changed global flames. No auto-merge.

## Where the actual evidence lives

- **Live current code:** `feature/north-broad-graphics` branch, not a previous zip
- **Development history and known blockers:** `qa/CURRENT-STATUS.md`, `CONTINUE-IN-CHATGPT.md`, `PROJECT-HANDOFF.md`, `CHANGELOG.md`
- **Visual acceptance and motion:** `qa/CINEMATIC-REVIEW.md`, `qa/MOTION-VISUAL-REVIEW.md`, `campaign/visual_target.png`
- **QA:** `qa/browser.mjs`, `qa/frontage-contract.mjs`, `.github/workflows/` — require actual run URLs and artifact inspection
- **Machine-readable transfer summary:** `handoff/state.json` (snapshot metadata, not a live API)
- **Work delivery:** GitHub draft PR plus screenshot/QA artifact links; preserve separate work branches

## End-of-session update requirement (both AI systems)

When making a substantive change:
- Record exact HEAD and version, what files changed, why, before/after behavior, test IDs & SHA, what is **verified vs pending**, performance metrics or lack thereof, remaining risks and **one actionable next step**.
- Update `AI-HANDOFF.md` (short, current snapshot section and priority queue) and `handoff/state.json` **in the same substantive development commit** where possible, plus existing CHANGELOG / QA notes. Never claim a future SHA before it exists; record the **parent/base SHA** or use the branch name to resolve live HEAD.
- If a CI run finishes after a commit, update the PR discussion with results; document freshness in the handoff on the next safe commit. CI updates do not require an automatic code commit or premature release.
- Never consume an entire session solely rewriting documents if code/QA progress is possible; keep the summary compact and evidence-based. GitHub remains the checkpoint even if a chat or product quota is exhausted.

## Return-to-ChatGPT report format

```text
DRAGON DEFENSE — GOOGLE HANDOFF RETURN
Base branch + base SHA:
Google branch + HEAD SHA:
Draft PR URL:
Completed changes (specific files):
Tests actually run (exact SHA, URLs, pass/fail):
Artifacts/screenshots/recordings:
Known unresolved bugs/performance:
Potential conflicts with latest ChatGPT HEAD:
Recommended next specific action:
```

**Security and continuity:** Avoid sharing passwords, tokens, or personal private data in the handoff/PR. A chat-session quota or outage never authorizes an autonomous merge or production deployment.
