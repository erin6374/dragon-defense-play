# Tech Freire Dragon Defense — live AI-to-AI handoff

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

| Item | Last observed value — recheck live |
|---|---|
| Repository | https://github.com/erin6374/dragon-defense-play |
| Primary development branch | `feature/north-broad-graphics` |
| Primary draft PR | https://github.com/erin6374/dragon-defense-play/pull/2 |
| Observed base HEAD before this handoff document was added | `5c387e37038996ee6dc35509c6ee4717b4a24cc8` |
| Version at snapshot | `5.5.0-rc.38` / `5.5-reference-frontage-rc38` |
| Google independent draft PR | https://github.com/erin6374/dragon-defense-play/pull/3 |
| Google's observed HEAD | `7032b3da46683c5821d838ea4d39b84ff96b4702` |
| Google's last observed mergeability | not mergeable; outdated base |

### Last-observed exact-SHA GitHub Actions (not timeless results)

| Workflow | Status when snapshot was written |
|---|---|
| [Dragon Defense motion review](https://github.com/erin6374/dragon-defense-play/actions/runs/43249736147) | pending |
| [Dragon Defense browser QA](https://github.com/erin6374/dragon-defense-play/actions/runs/43249736530) | in_progress |
| [Dragon Defense focused fire review](https://github.com/erin6374/dragon-defense-play/actions/runs/43249736378) | in_progress |
| [Dragon Defense cinematic scene review](https://github.com/erin6374/dragon-defense-play/actions/runs/43249736541) | in_progress |
| [Import licensed CC0 flame and smoke flipbooks](https://github.com/erin6374/dragon-defense-play/actions/runs/43249736173) | success |

**Most recent implemented primary changes:** RC36 extended destructible Broad Street frontage on both sides, with shared instance budgets; RC37 caches **byte-identical combustion source state** to avoid redundant writes to four GPU buffers, without pausing the shared shader animation. RC37 adds a deterministic five-idle-tick buffer-write regression. These need actual QA artifacts and hardware profiling before calling them accepted.

**Google contribution:** draft PR #3 calibrated rowhouse window flame scale on older RC30. Its initial browser, fire, cinematic and motion CI passed, but comparative visual review found **tiny candle-like flames**, not yet acceptable cinematic art. Its branch was stale/nonmergeable at snapshot. ChatGPT review: https://github.com/erin6374/dragon-defense-play/pull/3#issuecomment-6827300214 . Do not blindly merge or cherry-pick; verify against latest source first.

## Immediate priority queue — recheck before selecting

1. **QA gate:** Check current primary HEAD, five GitHub Actions workflows, exact-SHA report errors/warnings, screenshot artifacts, licensed CC0 hashes, Windows development-preview ZIP CRC and genuine 600-frame/30-second motion review. Fix test failures properly, do not weaken assertions to pass.
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
