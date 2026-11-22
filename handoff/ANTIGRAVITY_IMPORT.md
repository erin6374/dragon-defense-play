# Dragon Defense — ChatGPT → Antigravity patch handoff

**Status:** QA candidate only; NOT a playable release, NOT permission to merge.
**Prepared:** 2026-11-22
**Repository:** erin6374/dragon-defense-play
**Exact source base:** `fdc244cd1877cd19d270d1cf630457c7b22dc148` (Antigravity RC120)
**Exact candidate head:** `7cc1ef9aaff2a37dcdd30122bc2f69fbcb7950ad` (ChatGPT isolated draft PR #6)
**Patch:** `handoff/dragon-defense-rc120-chatgpt.patch` in this export branch.
**Scope:** 6 text source/test files. No FBX, GLB or binary asset changes.

## Goal
Please integrate this bounded patch into your OWN Antigravity development branch,
inspect the results in the actual browser, resolve conflicts, and retain release
authority. Do not replace your current project with an old full build. Compare
the patch to latest Antigravity HEAD first.

## Safe integration procedure
1. Commit/stash your own unrelated work so the working tree is clean.
2. Check the latest Antigravity branch/HEAD and verify whether these 6 files
   diverged since RC120. Create a **new integration branch** from your own HEAD.
3. Fetch this export branch, then extract the frozen patch **without a browser
   download and without changing the game source**:

```bash
git fetch origin agent/chatgpt-rc120-patch-export-20261122
git show "origin/agent/chatgpt-rc120-patch-export-20261122:handoff/dragon-defense-rc120-chatgpt.patch" > chatgpt-rc120.patch
git apply --check chatgpt-rc120.patch
```

4. If `git apply --check` succeeds, apply and inspect:

```bash
git apply chatgpt-rc120.patch
git diff --check
git diff --stat
```

If it fails because your branch has advanced, **do not force apply, overwrite
files, reset, rebase or merge unrelated branches**. Have Antigravity port the
intent of each hunk into its latest files and document the resolutions. You can
also compare PR #6 directly in GitHub. Do not include `chatgpt-rc120.patch`
in the committed game source.

## What this patch actually changes
- `src/simulation/city-layout.js`: reserves mapped parcel footprints before
  generated background rowhouses are placed; eliminates self-intersections and
  keeps cross-street corridors clear.
- `src/rendering/structural-city.js`: removes the unintended top-down partial
  school demolition caused by school-health reconciliation, while preserving
  100% full collapse; restores two unmodeled historical rowhouses which were
  incorrectly hidden as though replacement GLBs existed.
- `src/rendering/north-broad-models.js` plus
  `src/simulation/model-footprint-audit.js`: caches the actual imported
  geometry's world-space bounding box and exposes per-model parcel overhangs,
  missing-load errors, and 3D overlap warnings via
  `window.__DD_QA.northBroadModels()`. This is diagnosis, **not** automatic
  repositioning; do not treat a shared party wall or decorative protrusion as
  conclusive erroneous placement without comparing screenshots.
- `qa/frontage-contract.mjs`: stronger checks for generated rowhouse
  geometry, historic model fallbacks, 15/30/100% school damage behavior,
  reset, and GLB footprint calculations.
- `qa/browser.mjs`: refreshes stale RC120 test fixtures for meteor tiers,
  chapter opening, and zero-glow pristine atmosphere. These are assertions,
  **not** changes to actual meteor or chapter behavior.

## Targeted tests (run from repo root)
```bash
node qa/check-build-info.mjs
node qa/frontage-contract.mjs
node qa/street-surface-contract.mjs
node qa/smoke-plume-contract.mjs
python3 qa/windows-preview-server-test.py
```
Run your full project browser/cinematic/focused-fire/motion GitHub Actions at
the **integrated exact HEAD**. CI checks on ChatGPT's isolated branch alone are
not integration approval.

## Visual acceptance gate — REQUIRED before RC release
1. Inspect North Broad from York through Diamond. Check actual loaded GLB
   world-space boxes, all X/Z parcel boundaries, school flanks, historical
   fronts, side/rear masses, cross streets, parking gaps and the Berean lot.
2. Explicitly resolve the **remaining mapped frontage proxy collisions**:
   school/United Fund, school/2217–19 brownstone, and tan rowhouses/Doll
   Museum. The current patch does NOT claim those have been fixed.
3. Verify progressive local destruction on the original school FBX and
   adjacent buildings: single small, medium, and massive meteor contacts,
   accumulation with repeated hits, fire spread, and 100% collapse. No single
   5–15% school hit should peel away an entire roof or floor band.
4. Confirm all foreground meteors actually strike visible architecture/road
   before triggering blasts or ignition. Confirm the initial chapter tutorial
   eases in, can be skipped, and never takes away Paulo control.
5. Run real Windows hardware heavy-destruction pacing test; inspect FPS, freezes
   and 60-second performance capture. A GitHub CI WebGL run alone is not proof.

## Preserve
- Original Tech Freire school FBX and imported GLB asset files.
- Full campaign, existing Dragon model/toggle intent, cinematic pipeline.
- Independently maintained Google and ChatGPT PRs, no automatic merges.
- User's standing instruction: **do not release a build with these core
  placement, damage and gameplay problems unresolved.**

## Important distinction
A patch is a source-code handoff, not a playable zip. Antigravity owns
integration tests, visual review, packaging and eventual release. If your branch
has advanced, integrate selectively instead of overwriting recent work.
