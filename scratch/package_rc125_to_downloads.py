"""Package RC125 to H:/Downloads/1.Dragons Defence"""
import shutil, os, zipfile

SRC = "C:/Users/Tech-Erin/dragon-defense-repo"
DST = "H:/Downloads/1.Dragons Defence/Dragon-Defense-Antigravity-RC125-Preview"
ZIP = DST + ".zip"

print("Copying RC125 to preview directory...")
if os.path.exists(DST):
    shutil.rmtree(DST)
shutil.copytree(SRC, DST, ignore=shutil.ignore_patterns(
    ".git", "node_modules", "*.pyc", "__pycache__", "scratch",
    "ci-artifacts", "rc60-artifacts", "rc61-artifacts", "rc74-ci-artifacts",
    "rc61-cinematic-artifact", "tools/__pycache__"
))

count = sum(len(files) for _, _, files in os.walk(DST))
print(f"Copied {count} files")

print("Creating zip...")
with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk(DST):
        dirs[:] = [d for d in dirs if d not in ['.git']]
        for f in files:
            fp = os.path.join(root, f)
            zf.write(fp, os.path.relpath(fp, os.path.dirname(DST)))
zip_mb = os.path.getsize(ZIP) / 1024 / 1024
print(f"ZIP: {ZIP} ({zip_mb:.1f} MB)")

bi = open(DST + "/build-info.json").read()
print("build-info:", bi.strip())
print("PACKAGE RC125 DONE")
