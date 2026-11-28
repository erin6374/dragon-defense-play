# AI agent operating contract — 0.1.0
For ChatGPT, Codex and Google Antigravity. Read this and requirements.json first; open only relevant master sections, live handoff and exact source files. GitHub issue #5 remains coordination board. Do not read entire repeated histories by default.

## Ownership
- Product owner: requirement conflicts, art, human play, release approval. ChatGPT technical lead/independent QA and scoped gameplay on feature/north-broad-graphics. Codex implements only assigned scope on isolated branch. Antigravity gameplay/physics/visual specialization on independent agent/google-* branches/draft PRs; do not concurrently touch same files. Broad Street Viewer owns architecture source in separate repo; European Dragon studio owns independent rig/animation source. Integration branches accept reviewed exports only. Master workstream edits only docs/master-spec/ on docs/master-development-spec.
- No force push, main/production/Pages deployment, automatic merge, original school FBX mutation or Building Explorer edits. No branch reset. Never overwrite independent agent work. Use separate worktrees/branches and exact base SHA.
- Live progress remains in AI-HANDOFF, handoff/state.json and relevant QA docs. Keep them concise and synchronized with substantive changes. This master contains stable requirements and contracts, not hourly logs. Consult build-info at resolved SHA, not mutable URL from stale chat.
- Architecture roundtrip: use ANTIGRAVITY-HANDOFF.md and tools/export-antigravity-handoff.py OUTPUT --architecture-base PRIOR_COMMIT [--revision COMMIT]. Extract source ZIP into new folder or use binary-safe broad-street-only patch against known base; git apply --check then review; bridge separately in integration; no blind source ZIP overwrite. Return branch/commit or patch against recorded base, manifest and test evidence. Stock RC174 needs adapter.
 
## Start task / finish task
1. Resolve branch heads and record owner, base SHA, requirement IDs, intended files and acceptance. Read relevant evidence and avoid duplicated changes. If blocked, record exact missing input and do not fake progress.
2. One bounded change per owner; batch related small changes. Preserve existing working paths and source assets. Prefer pure deterministic rules and targeted instrumentation over speculative rebuild. Before integration, compare exact source paths and version provenance; review conflicts deliberately.
3. Execute relevant tests by stage; reuse prior results ONLY for same immutable source/artifact/environment and same test scope. Clearly mark other-source evidence historical; do not restart long recording runs unnecessarily.
4. Return structured handoff (example JSON below). Commit once coherent, not hourly no-op status. No release claim until all gates approved.
 
```json
{"spec_version":"0.1.0","agent":"<ChatGPT|Codex|Antigravity>","workstream":"<name>","branch":"<isolated>","base_sha":"<40 hex>","candidate_sha":"<40 hex>","build":"<version+id>","requirements":["DD-000"],"changed_paths":[],"tests":[{"id":"T00","tested_sha":"<40 hex>","scope":"<targeted|assisted|human|native|art>","result":"<pass|fail|not_run>","artifact":"<URI or null>","sha256":null}],"blockers":[],"next_action":"<one bounded step>","report_time":"<ISO8601 with offset>","release_certified":false}
```
 
## Efficiency and environmental impact
Use issue #5 staged testing. Compare accepted changes rather than counts of commits, avoid repeated long context replay, use file/line slices, cache deterministic evidence with SHA/seed/environment, regenerate assets only when source hash changes, reuse template instances and shared geometry, don't parallelize competing edits. Track per batch: number of AI calls (tokens when exposed), test wall time, CI run/cancellation count, changed files, imported bytes, duplicate work, regressions and human acceptance. Track energy/carbon only if actual measured power or provider data and documented method available; do not invent carbon savings or estimate from tokens alone. Seven-day/three candidate PR evaluation already defined in issue #5. Human reviewer can prioritize costly full suite only when necessary.
 
## Spec versioning
Semantic version proposed: patch typo/link/evidence corrections; minor added/clarified requirement without incompatible approved change; major owner-approved breaking requirement. Stable DD IDs never reused. Add explicit supersedes/conflict links and decision date; update requirements.json, change log and impacted regression contracts together. New requirement not supported by owner => proposed. If agent finds source contradicting spec, log discrepancy, do not silently change behavior or spec. 
