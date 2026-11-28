# Dragon Defense — Integration Preview 10 candidate

Version `5.5.0-integration.10` · build `combined-preview.10-rc174-bsv21.1.33`

This is the combined browser-based preview of Antigravity RC174 gameplay and
Broad Street Viewer 21.1.33 architecture. It is not a replacement for either
independent development branch, a standalone Windows EXE, or a Unity port.
Exact asset hashes, source provenance and earlier acceptance evidence are
recorded in `build-info.json`. The packaged `PACKAGE-MANIFEST.json` identifies
the exact source revision and the hash of every included runtime file.

## Play on Windows

1. Extract the entire archive into a new folder, separate from your existing
   development installations.
2. Install Python 3 if it is not already available.
3. Double-click **PLAY-INTEGRATION-PREVIEW.cmd** inside the extracted folder.
4. Keep the console window open while playing. The launcher starts an isolated
   loopback server and opens your default browser.
5. Choose Flight Academy, Defend Philadelphia, or Director Sandbox.

The launcher does not install or overwrite other game versions. Do not open
index.html directly as a file; the browser needs the local HTTP server for
modules and assets. Sandbox exit starts a fresh defense session rather than
restoring the preceding campaign.

## What changed since Preview 9

- Continuous map-bound flight, responsive camera follow, and improved training
  framing on landscape and portrait viewport sizes.
- Original FBX-derived school mesh retained with localized, progressive
  structural damage and repair. Integrated preview contains 122 non-school
  mapped parcels; residential and assembly interiors retain distinct typologies.
- Optimized scene submission and rendering without removing required source
  geometry; bounded damage and particle effects.
- Clearer foreground/background meteor distinction, radar warnings and pickup
  markers; traffic lane discipline, helicopter heading correction, actual gas
  responder immobilization/recovery, and pedestrian evacuation rather than
  pre-impact knockdowns.
- Actual embedded cinematic playback, natural completion, pause, skip, choice
  endings, and campaign chapter transitions.

## Verification and limitations

Native Windows verification on the user's RTX 3060, Microsoft Edge, Balanced
preset and a 45 FPS cap passed all 11 checks on the unchanged gameplay revision
`24259ef62a1e6970d09eb6fe068191daccce9513`. The measured 30-second assisted
bombardment averaged 44.97 FPS, p95 33.5 ms, and zero frames above 50 ms. Real-time
keyboard full-map sandbox flight and vertical response passed.

Input-driven academy acceptance passed five checks using real input and assisted
positioning/accelerated simulation. The assisted campaign runner verified all 15
waves, chapter boundaries 2/5/10/14, both endings, defeat and replay. Neither is
a complete unassisted human playthrough; difficulty balance and sustained full
campaign feel are not certified.

The integrated architecture is not a surveyed photo-accurate replica of every
parcel; approximate non-school interiors, illustrative peripheral blocks and a
schematic subway/basement remain. Upstream Viewer district-contact validation
remains separate. No guarantee of 60 FPS, other graphics presets, other
hardware, physical mobile performance, or standalone Windows executable support
is made.

The candidate remains subject to extracted-package browser acceptance and final
release review. The separate native hardware utility requires a clean Git
checkout and is not included in the standalone playable archive.
