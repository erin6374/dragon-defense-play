TECH FREIRE DRAGON DEFENSE — v5.4.0 RC17 WINDOWS DEVELOPMENT PREVIEW
==================================================================
Status: unmerged RC17 development candidate. Browser QA is tied to the exact
commit recorded in PREVIEW-BUILD.txt when distributed via GitHub Actions.
Compared with RC16, broken masonry and exposed interiors share a mottled,
mipmapped brick-and-mortar finish rather than flat colors. Eight concurrent
collapses also share a second 96-point low dust-cloud pool (one draw call);
the RC16 large/small masonry particle batches, slow distant motion and
persistent structural rubble are retained.
Standing skyscrapers continue to burn without collapsing, with stronger
flaming background strikes below 50% and 20% neighborhood health. The dense
North Broad blocks reflect reference images; the distant Center City skyline
is deliberately fictionalized for dramatic visibility. Production untouched.

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
