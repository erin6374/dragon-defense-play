"""Build and verify an offline-playable integration ZIP from a clean checkout.

This is a packaging gate, not a release authorization.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RUNTIME_DIRS = {"assets", "broad-street", "campaign", "dragon-lab", "src", "vendor"}
ROOT_FILES = {
    "index.html", "build-info.json", "model-inspector.html",
    "manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png",
    "PLAY-INTEGRATION-PREVIEW.cmd", "INTEGRATION-PREVIEW.md",
}
TOOL_FILES = {"tools/launch-integration-preview.py"}
REQUIRED = ROOT_FILES | TOOL_FILES | {
    "src/game.js", "src/core/build-info.js",
    "vendor/three/build/three.module.js",
    "broad-street/mapped-data.json",
    "assets/tech-freire-original.fbx",
    "assets/tech-freire-play-mesh-v1.bin",
    "campaign/chapter1.html", "campaign/chapter2.html",
    "campaign/chapters3-4.html",
}

def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def included(name):
    return name in ROOT_FILES or name in TOOL_FILES or name.split("/", 1)[0] in RUNTIME_DIRS

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--extract", required=True, type=Path)
    args = parser.parse_args()
    output, extract = args.output.resolve(), args.extract.resolve()
    if git("status", "--porcelain", "--untracked-files=no").strip():
        raise SystemExit("Tracked checkout must be clean")
    commit = git("rev-parse", "HEAD").decode().strip()
    info = json.loads((ROOT / "build-info.json").read_text(encoding="utf-8"))
    version = info["version"]
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+-integration\.[0-9]+", version):
        raise SystemExit("Unexpected integration version")
    files = sorted(n.decode("utf-8") for n in git("ls-files", "-z").split(b"\0") if n and included(n.decode("utf-8")))
    if REQUIRED - set(files):
        raise SystemExit(f"Missing required runtime files: {sorted(REQUIRED - set(files))}")
    for key in ("schoolFBX", "schoolPlayMesh"):
        source = info["sources"][key]
        if sha((ROOT / source["path"]).read_bytes()) != source["sha256"]:
            raise SystemExit(f"Source asset hash mismatch: {key}")
    output.mkdir(parents=True, exist_ok=True)
    extract.mkdir(parents=True, exist_ok=True)
    if any(extract.iterdir()):
        raise SystemExit("Extraction directory must be empty")
    archive = output / f"Dragon-Defense-{version}-{commit[:12]}.zip"
    prefix = f"Dragon-Defense-{version}/"
    manifest = {"version": version, "build": info["build"], "commit": commit,
                "status": "candidate packaging evidence; not release certification", "files": {}}
    def put(z, name, data):
        entry = zipfile.ZipInfo(prefix + name, date_time=(2026, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        z.writestr(entry, data, compresslevel=6)
    with zipfile.ZipFile(archive, "w") as z:
        for name in files:
            rel = PurePosixPath(name)
            path = ROOT / name
            if rel.is_absolute() or ".." in rel.parts or path.is_symlink() or not path.is_file():
                raise SystemExit(f"Unsafe or missing runtime path: {name}")
            data = path.read_bytes()
            if data.startswith(b"version https://git-lfs.github.com/spec/v1"):
                raise SystemExit(f"Unresolved Git LFS pointer: {name}")
            manifest["files"][name] = {"bytes": len(data), "sha256": sha(data)}
            put(z, name, data)
        put(z, "PACKAGE-MANIFEST.json", (json.dumps(manifest, indent=2, sort_keys=True)+"\n").encode())
    with zipfile.ZipFile(archive) as z:
        if z.testzip() is not None:
            raise SystemExit("ZIP integrity failure")
        if set(z.namelist()) != {prefix + n for n in files + ["PACKAGE-MANIFEST.json"]}:
            raise SystemExit("ZIP inventory differs from manifest")
        z.extractall(extract)
    game = extract / prefix
    for name, expected in manifest["files"].items():
        data = (game / name).read_bytes()
        if len(data) != expected["bytes"] or sha(data) != expected["sha256"]:
            raise SystemExit(f"Extracted asset mismatch: {name}")
    result = {"archive": archive.name, "sha256": sha(archive.read_bytes()),
              "bytes": archive.stat().st_size, "files": len(files), "version": version,
              "build": info["build"], "commit": commit, "extractedRoot": str(game),
              "integrityPassed": True, "releaseCertified": False}
    (output / "package-report.json").write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(result))

if __name__ == "__main__":
    main()
