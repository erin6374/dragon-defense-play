import json

binfo = {
  "version": "5.5.0-rc.146",
  "build": "5.5-tech-freire-material-effects-hooks-structural-audio-rc146",
  "date": "2026-11-24",
  "releaseName": "5.5-tech-freire-material-effects-hooks-structural-audio-rc146"
}
with open("build-info.json", "w", encoding="utf-8") as f:
    json.dump(binfo, f, indent=2)

bjs = """// Dragon Defense Build Information
// Auto-generated during build/packaging process

export const BUILD_INFO = {
  version: "5.5.0-rc.146",
  build: "5.5-tech-freire-material-effects-hooks-structural-audio-rc146",
  date: "2026-11-24",
  releaseName: "5.5-tech-freire-material-effects-hooks-structural-audio-rc146"
};

export const GAME_VERSION = BUILD_INFO.version;
export const BUILD_ID = BUILD_INFO.build;
export const RELEASE_NAME = BUILD_INFO.releaseName;
"""
with open("src/core/build-info.js", "w", encoding="utf-8") as f:
    f.write(bjs)

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

old_title = "Tech Freire: Dragon Defense v5.5 RC145 — Firestorm Spread, Interactive Igniter Tool & Neighborhood Consumption"
new_title = "Tech Freire: Dragon Defense v5.5 RC146 — Material Destruction Hierarchy, Glass Shatter Glitter & Structural Audio"

if old_title in html:
    html = html.replace(old_title, new_title)
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Updated index.html title!")
else:
    print("Warning: old title not found in index.html")

print("Build info updated to RC146 successfully!")
