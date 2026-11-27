# Dragon Defense and Antigravity

The integration branch is `integration/combined-preview` in
`erin6374/dragon-defense-play`. The Windows playtest ZIP and the Antigravity
Source ZIP are built from the same integration revision.

## Open the whole integrated game

Extract the **Antigravity Source** ZIP into a new folder and open that folder
as a project in Antigravity. It includes editable game code, Broad Street
models and layout, the original school FBX, the derived play mesh, tests,
and the Windows launcher. The ZIP has no Git working history. If Antigravity
already has a clone of the repository, it can start a new branch from the
integration commit recorded in `handoff/antigravity-exchange.json`.

## Update an existing Antigravity branch

Keep working from the Antigravity branch and bring updates into a separate
merge branch or worktree. For a branch that already uses the integration
adapter, the **Broad Street Exchange** ZIP carries the model/layout snapshot,
a binary-safe Git patch, and a manifest. The patch contains changes only under
`broad-street/`. It can be used without copying the source ZIP over the
working folder.

From the target checkout, inspect the manifest's `architecturePatchBase` and
`integrationCommit`, then run `git apply --check /path/to/architecture.patch`.
If the check passes, run `git apply /path/to/architecture.patch`. If it fails
because both teams changed the same files, use `git apply --3way` in the
merge worktree with the source objects fetched, then review any conflicts
before committing. A stock RC174 checkout needs the integration adapter to
use these models. Start from the integrated source or port the adapter with
review before using architecture-only patches there.

If an architecture update changes the viewer/game interface, review the bridge
separately before promoting the patch. The principal bridge files are
`src/neighborhood.js`, `src/simulation/viewer-parcels.js`,
`src/rendering/viewer-building-fit.js`, and `src/rendering/viewer-city-models.js`.
The game entry point also wires the bridge into play. Keep independent dragon,
gameplay, and physics edits from Antigravity on their own branch until reviewed.

## Return Antigravity changes to integration

Return a Git branch and commit, or a patch against the recorded starting
commit. Include a short change summary and the browser/Windows test results.
The integration branch can then bring in those changes and validate them
against the latest accepted architecture. Uploaded rig ZIPs should be reviewed
in their own branch before either team imports them.

## Export the next exchange

Run `python tools/export-antigravity-handoff.py OUTPUT --architecture-base PRIOR_COMMIT`
from the accepted integration revision. Choose the model revision already
present on the recipient branch as the patch base. Use `--revision COMMIT`
to export a particular committed integration snapshot. The exporter reads Git
objects, so uncommitted edits and temporary QA files are excluded.
