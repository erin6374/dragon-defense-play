"""Export editable integration source and a separate Broad Street Git patch."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def write_zip(destination, contents):
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name, content in sorted(contents.items()):
            z.writestr(name, content)
    with zipfile.ZipFile(destination) as z:
        if z.testzip() is not None:
            raise RuntimeError(f"CRC verification failed for {destination}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--revision", default="HEAD")
    parser.add_argument("--architecture-base", required=True,
                        help="Previously imported revision in the integration repository")
    args = parser.parse_args()
    revision = git("rev-parse", "--verify", args.revision + "^{commit}").decode().strip()
    base = git("rev-parse", "--verify", args.architecture_base + "^{commit}").decode().strip()
    args.output.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(io.BytesIO(git("archive", "--format=zip", revision))) as archive:
        source = {item.filename: archive.read(item) for item in archive.infolist()
                  if not item.is_dir()}

    build = json.loads(source["build-info.json"])
    metadata = {
        "build": build["build"],
        "version": build["version"],
        "integrationCommit": revision,
        "architecturePatchBase": base,
        "architectureScope": ["broad-street/"],
        "sources": build["sources"],
    }

    def manifest(contents):
        data = dict(metadata, sha256={p: hashlib.sha256(content).hexdigest()
                                     for p, content in sorted(contents.items())})
        return json.dumps(data, indent=2).encode() + b"\n"

    version = build["version"].split("integration.", 1)[1]
    title = f"Dragon-Defense-Integration-Preview-{version}"

    # Include a normal, editable checkout with every tracked runtime dependency.
    source["handoff/antigravity-exchange.json"] = manifest(source)
    write_zip(args.output / f"{title}-Antigravity-Source.zip", source)

    # A data/model patch never changes the game, bridge, physics, or dragon.
    architecture = {p: content for p, content in source.items() if p.startswith("broad-street/")}
    architecture["architecture.patch"] = git("diff", "--binary", "--full-index", "--no-ext-diff",
                                              "--no-textconv", "--no-renames", base, revision, "--", "broad-street/")
    architecture["ANTIGRAVITY-HANDOFF.md"] = source["ANTIGRAVITY-HANDOFF.md"]
    architecture["architecture-exchange.json"] = manifest(architecture)
    write_zip(args.output / f"{title}-Broad-Street-Exchange.zip", architecture)


if __name__ == "__main__":
    main()
