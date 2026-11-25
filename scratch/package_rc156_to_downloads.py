import os, shutil, zipfile

SOURCE_DIR = r"C:\Users\Tech-Erin\dragon-defense-repo"
TARGET_DIR = r"H:\Downloads\1.Dragons Defence\Dragon-Defense-Antigravity-RC156-Preview"
ZIP_PATH = r"H:\Downloads\1.Dragons Defence\Dragon-Defense-Antigravity-RC156-Preview.zip"

EXCLUDE_DIRS = {
    ".git", "node_modules", "ci-artifacts", "rc60-artifacts", "rc61-artifacts",
    "rc61-cinematic-artifact", "rc74-ci-artifacts", "scratch", "__pycache__"
}

ALLOWED_EXTENSIONS = (
    '.png', '.wav', '.glb', '.fbx', '.jpg', '.jpeg', '.json',
    '.html', '.js', '.css', '.mjs', '.md', '.bat', '.cmd', '.txt', '.ico'
)

def copy_tree(src, dst):
    if os.path.exists(dst):
        shutil.rmtree(dst)
    os.makedirs(dst, exist_ok=True)
    count = 0
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        rel_root = os.path.relpath(root, src)
        dest_root = os.path.join(dst, rel_root)
        os.makedirs(dest_root, exist_ok=True)
        for f in files:
            if f.endswith(ALLOWED_EXTENSIONS):
                shutil.copy2(os.path.join(root, f), os.path.join(dest_root, f))
                count += 1
    return count

print("Copying RC156 to preview directory...")
copied = copy_tree(SOURCE_DIR, TARGET_DIR)
print(f"Copied {copied} files to {TARGET_DIR}")

# Verify launcher batch files are present
launchers = ['PLAY-GAME.bat', 'START-GAME.bat', 'PLAY-PREVIEW.bat', 'PLAY-PREVIEW.cmd']
for l in launchers:
    p = os.path.join(TARGET_DIR, l)
    if os.path.exists(p):
        print(f"Verified launcher: {l} ({os.path.getsize(p)} bytes)")
    else:
        print(f"WARNING: missing {l} in {TARGET_DIR}")

print("Creating zip...")
if os.path.exists(ZIP_PATH):
    os.remove(ZIP_PATH)

with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(TARGET_DIR):
        for f in files:
            full_p = os.path.join(root, f)
            rel_p = os.path.relpath(full_p, TARGET_DIR)
            zipf.write(full_p, rel_p)

size_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)
print(f"Package created: {ZIP_PATH} ({size_mb:.2f} MB)")
