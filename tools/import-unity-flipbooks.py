#!/usr/bin/env python3
"""Validate official Unity Labs CC0 originals and build two bounded 8x8 WebP atlases."""
import hashlib, io, json, pathlib, sys, urllib.request, zipfile
from PIL import Image, ImageOps
SOURCE="https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks"
ROOT="https://unity3d.com/files/labs/downloads/vfx/assets01/"
DEST=pathlib.Path("assets/vfx"); DEST.mkdir(parents=True,exist_ok=True)
records=[]
for asset,out in [("Flame03","flame03.webp"),("WispySmoke03","wispy-smoke03.webp")]:
    url=f"{ROOT}{asset}/{asset}-flipbooks.zip"
    request=urllib.request.Request(url,headers={"User-Agent":"DragonDefense-CC0-VFX-Importer/1.0"})
    with urllib.request.urlopen(request,timeout=75) as response:
        original=response.read(160*1024*1024+1)
    if len(original)>160*1024*1024 or not zipfile.is_zipfile(io.BytesIO(original)):
        raise RuntimeError(f"Missing or oversized original ZIP: {asset}")
    members=[]
    with zipfile.ZipFile(io.BytesIO(original)) as z:
        for member in z.infolist():
            if member.is_dir():continue
            if member.file_size>120*1024*1024 or '..' in pathlib.PurePosixPath(member.filename).parts:
                raise ValueError("Unsafe ZIP member")
            if pathlib.PurePosixPath(member.filename).suffix.lower() in (".tga",".png"):
                members.append(member)
        if not members:raise ValueError(f"No supported atlas in {asset} ZIP")
        options=[m for m in members if "8x8" in m.filename.lower()]
        if not options:raise ValueError(f"No verified 8x8 flipbook in {asset}: {[x.filename for x in members]}")
        member=max(options,key=lambda x:x.file_size)
        raw=z.read(member)
        image=Image.open(io.BytesIO(raw))
        image.load()
        if image.width!=image.height or image.width%8 or image.width<512:
            raise ValueError(f"Invalid 8x8 atlas dimensions: {image.size}")
        rgba=image.convert("RGBA")
        alpha=rgba.getchannel('A')
        if alpha.getextrema()[0]==alpha.getextrema()[1]:
            # Some Unity TGA exports encode translucent emission over black.
            luma=ImageOps.grayscale(rgba.convert("RGB"))
            rgba.putalpha(luma.point(lambda v:max(0,min(255,int(v*1.45)))))
        if rgba.getchannel('A').getextrema()[1]==0:raise ValueError("Empty alpha atlas")
        rgba=rgba.resize((1024,1024),Image.Resampling.LANCZOS)
        destination=DEST/out
        rgba.save(destination,"WEBP",quality=91,method=6)
        records.append(dict(asset=asset,source=url,zip_sha256=hashlib.sha256(original).hexdigest(),
            member=member.filename,member_sha256=hashlib.sha256(raw).hexdigest(),
            native_dimensions=list(image.size),grid=[8,8],frames=64,converted=out,
            converted_bytes=destination.stat().st_size,
            converted_sha256=hashlib.sha256(destination.read_bytes()).hexdigest()))
manifest=dict(license="CC0-1.0",original_publisher="Unity Labs Paris / Thomas Iche",
    source_page=SOURCE,conversion="Pillow 1024x1024 8x8 WEBP RGBA",assets=records)
(DEST/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf8")
print(json.dumps(manifest,indent=2))
