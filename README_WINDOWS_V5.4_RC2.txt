TECH FREIRE DRAGON DEFENSE — v5.5.0 RC39 DEVELOPMENT PREVIEW
================================================================
Video-driven graphics candidate. Paulo now has unsynchronized shoulder/elbow/
wrist motion, folding inner wing on banks, deeper scalloped leathery membranes
with 3D camber and less vivid pink, plus more tightly tucked legs in flight.
The standing city skyline and the smoke-lightening for meteors remain.
Full browser QA, five motion videos and visual inspection are required
before treating RC20 as a verified release. Production main and the
Building Explorer remain unchanged. GPU hardware frame rate is not verified.

WINDOWS PREREQUISITES
- Python 3 must be installed and available as `py -3` or `python`.
  Check in Command Prompt with `py -3 --version` or `python --version`.
  If neither works, install Python 3 from https://www.python.org/downloads/windows/
  (enable the PATH option if offered), then reopen Command Prompt.
- Use a current Chrome or Edge browser with WebGL enabled.
- The launcher runs a local-only HTTP server; no cloud account is required.

PLAY ON WINDOWS
1. Extract the ENTIRE ZIP into a normal folder (do not run inside the ZIP).
2. Double-click PLAY-PREVIEW.cmd; let it start the local HTTP server.
3. The game opens at http://127.0.0.1:8769/
4. To test the NEW Paulo dragon, open http://127.0.0.1:8769/?paulo=1
   and use the "Try Paulo" / "Original Dragon" toggle while playing.
5. The existing dragon is the default, and switching is visual-only:
   gameplay collision, health, scoring, controls, firing, gas and wind are shared.
6. Keep the launcher command window open until you are finished playing.

IMPORTANT: Double-clicking index.html directly will fail in modern browsers:
the game imports JavaScript modules over HTTP.

RECENT GRAPHICS / DESIGN
- North Broad Street building geometry, Philadelphia skyline and distant
  cinematic meteor impacts, lighting, street activity and damage effects.
- Paired aerodynamic wing membranes, original sculpted dragon muzzle,
  articulated tail, jaw and eyes; 12 pose animation states.
- More readable Paulo body/wing colors for night scenes, fuller wing webbing,
  individually shaded wing membrane vertices, brighter anatomical ribs.
- Readable Paulo scale via a VISUAL-ONLY scene child. Does not increase hitboxes.
- Buffered animation clock separate from local hit-recoil damping.

CONTROLS
- Fly: A/D or Left/Right; W/S or Up/Down.
- Shoot: quick left-click or Space.
- Wind: hold LEFT mouse for at least 0.7 seconds and release.
- Gas: right-click, F, or GAS button.
- F3: performance diagnostics; Settings/Performance Lab for quality and scene tests.
- Touch: press and hold the FIRE control to use wind.

LIMITATIONS
- This is a development preview, NOT a finished production v5.4 release.
- Paulo is still an original procedural model, not a final artist-skinned GLB.
- No physical Windows GPU benchmark or installed Android APK is claimed.
- GitHub software WebGL QA is not a hardware FPS result.
- Some screenshots and model design require further visual review.
- No main/production branch merge and no edits to Building Explorer.

SOURCE / QA
https://github.com/erin6374/dragon-defense-play/pull/2
See RELEASE-PLAN-v5.4.md and CHANGELOG.md for the release gates and detailed changes.

RC39 WINDOWS PERFORMANCE CAPTURE (NEW; HARDWARE RESULT NOT YET VERIFIED)
- Extract the new exact-commit Windows preview ZIP and double-click PLAY-PREVIEW.cmd.
- The launcher now uses tools/windows-preview-server.py, not plain http.server.
- Open Settings > Performance Lab > System Monitor while playing at normal resolution.
- Record 30-60 seconds of active gameplay, including fire/destruction, then click the
  System CSV download control. Save the CSV with the game build and Windows GPU model.
- CSV records game FPS, frame gaps, draw calls, wave and Windows CPU/RAM when supported.
- GPU utilization, GPU timing and browser memory are explicitly unsupported by this
  stdlib server; do not interpret missing GPU counters as zero GPU load.
- The CSV is written to the OS temporary folder and served only on 127.0.0.1:8769.
- This instrumentation does not fix low FPS; it makes the reported slideshow measurable.
