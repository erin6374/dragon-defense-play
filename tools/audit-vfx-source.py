#!/usr/bin/env python3
"""Audit an original CC0 Unity Labs VFX ZIP before any conversion or inclusion.

Usage: python3 tools/audit-vfx-source.py path/to/Flame02-flipbooks.zip
This does not download, alter, redistribute, or implicitly license any files.
The official source page states CC0, but archive identity must be established
from the downloaded bytes; no SHA is trusted until measured.
"""
import argparse
import hashlib
import json
import pathlib
import zipfile

def digest(data):
    return hashlib.sha256(data).hexdigest()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("archive",type=pathlib.Path)
    p.add_argument("--output",type=pathlib.Path,help="optional JSON audit output")
    a=p.parse_args()
    raw=a.archive.read_bytes()
    if not zipfile.is_zipfile(a.archive):
        raise SystemExit("Not a valid ZIP archive; reject this download")
    entries=[]
    with zipfile.ZipFile(a.archive) as z:
        for entry in z.infolist():
            if entry.is_dir():
                continue
            if entry.file_size>300_000_000:
                raise SystemExit("Oversized archive member: "+entry.filename)
            name=entry.filename.replace("\\","/")
            if name.startswith("/") or ".." in name.split("/"):
                raise SystemExit("Unsafe archive path: "+name)
            data=z.read(entry)
            entries.append({"name":name,"bytes":len(data),"sha256":digest(data),
                            "extension":pathlib.PurePosixPath(name).suffix.lower()})
    report={"archive":a.archive.name,"archive_bytes":len(raw),
            "archive_sha256":digest(raw),
            "source_page":"https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks",
            "claimed_license":"CC0 (official Unity Labs source page; verify original archive identity)",
            "entries":entries,
            "status":"AUDITED_ONLY_NOT_CONVERTED_OR_INTEGRATED"}
    serialized=json.dumps(report,indent=2)
    if a.output:
        a.output.write_text(serialized+"\n",encoding="utf-8")
    print(serialized)
if __name__=="__main__":
    main()
