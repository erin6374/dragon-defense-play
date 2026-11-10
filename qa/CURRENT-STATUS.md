# Dragon Defense — current verification and next actions

**Snapshot:** November 10, 2026, ~14:20 Eastern. This file must be updated after meaningful commits, QA and release changes; live GitHub state takes precedence.

- Repository: `erin6374/dragon-defense-play`. Development branch: `feature/north-broad-graphics`. Draft PR: https://github.com/erin6374/dragon-defense-play/pull/2
- Verified development baseline before RC21: `b7a2fe3179b9697c392c6cff1eb49daf89e3a79b`, [browser QA 42871663280](https://github.com/erin6374/dragon-defense-play/actions/runs/42871663280) **success**, [motion QA 42871663277](https://github.com/erin6374/dragon-defense-play/actions/runs/42871663277) **success**, motion artifact `13792297801`, five 100-frame clips, zero motion errors.
- Last **independently documented** successful public preview: `a5672e4` via [Pages run 42866763994](https://github.com/erin6374/dragon-defense-play/actions/runs/42866763994). This is a conservative historical checkpoint, **not a claim about what the public URL currently serves**. Check newer Pages runs and unauthenticated seven-file byte results.
- RC21 candidate: pooled two additional facade flame/smoke sites per landmark (18+18 instances, two fixed draw calls), browser assertions and QA telemetry. **UNVERIFIED** until its own exact-head browser QA, five-video motion review, and automatic Pages byte verification all pass.
- Open visual issues: MOT-03 stationary single-patch skyscraper fire (RC21 target); MOT-01 oversized rooftop fire before collapse; MOT-02 rubble fire improved but still stylized; MOT-05 uniform roadside gust dust; MOT-08 Paulo flight pose quality. Preserve meteor exhaust improvement, RC20 wing articulation and all gameplay regressions.
- Next: (1) inspect RC21 exact-head QA and fix only demonstrated failures; (2) watch RC21 `skyline.mp4` at 0.8–4.8s, compare to b7 and inspect close screenshots; (3) verify authorized automatic Pages seven-file public snapshot, document release or continue with narrower visual corrections.

No merge, production edits, Building Explorer edits, main-owned Pages workflow changes, forced deployment, unlicensed dragon asset, hardware GPU FPS or APK claims.
