"""Bump Dragon Defense to RC147"""
import json, re

# 1. build-info.json
binfo = {
    "version": "5.5.0-rc.147",
    "build": "5.5-soot-smoke-subway-boiling-steam-electrical-audio-rc147",
    "date": "2026-11-24",
    "releaseName": "5.5-soot-smoke-subway-boiling-steam-electrical-audio-rc147"
}
with open("build-info.json", "w", encoding="utf-8") as f:
    json.dump(binfo, f, indent=2)
print("Updated build-info.json to RC147")

# 2. src/core/build-info.js
with open("src/core/build-info.js", "w", encoding="utf-8") as f:
    f.write(f'''// Dragon Defense Build Information
// Auto-generated during build/packaging process

export const BUILD_INFO = {{
  version: "{binfo['version']}",
  build: "{binfo['build']}",
  date: "{binfo['date']}",
  releaseName: "{binfo['releaseName']}"
}};

export const GAME_VERSION = BUILD_INFO.version;
export const BUILD_ID = BUILD_INFO.build;
export const BUILD_NUMBER = "{binfo['build']}";
''')
print("Updated src/core/build-info.js to RC147")

# 3. index.html
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

html = re.sub(
    r'<title>Tech Freire: Dragon Defense v5\.5 RC\d+ [^<]+</title>',
    '<title>Tech Freire: Dragon Defense v5.5 RC147 — Structural Soot Plumes, Subterranean Boiling Steam & Conduit Audio</title>',
    html
)
with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Updated index.html to RC147")
