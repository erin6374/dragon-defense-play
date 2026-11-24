"""Package RC146 to H:/Downloads/1.Dragons Defence"""
import shutil, os, zipfile

SRC = "C:/Users/Tech-Erin/dragon-defense-repo"
DST = "H:/Downloads/1.Dragons Defence/Dragon-Defense-Antigravity-RC146-Preview"
ZIP = DST + ".zip"

print("Copying RC146 to preview directory...")
if os.path.exists(DST):
    shutil.rmtree(DST)
shutil.copytree(SRC, DST, ignore=shutil.ignore_patterns(
    ".git", "node_modules", "*.pyc", "__pycache__", "scratch",
    "ci-artifacts", "rc60-artifacts", "rc61-artifacts", "rc74-ci-artifacts",
    "rc61-cinematic-artifact", "tools/__pycache__"
))

count = sum(len(files) for _, _, files in os.walk(DST))
print(f"Copied {count} files to {DST}")

print("Creating zip...")
with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk(DST):
        dirs[:] = [d for d in dirs if d not in ['.git']]
        for f in files:
            fp = os.path.join(root, f)
            zf.write(fp, os.path.relpath(fp, os.path.dirname(DST)))
zip_size = os.path.getsize(ZIP) / (1024 * 1024)
print(f"Package created: {ZIP} ({zip_size:.2f} MB)")
