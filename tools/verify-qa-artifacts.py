#!/usr/bin/env python3
"""Independently verify five Dragon Defense QA ZIPs from one exact source commit.

Usage: python tools/verify-qa-artifacts.py --sha <40-hex> --browser B.zip
  --cinematic C.zip --focused F.zip --motion M.zip --windows W.zip
Requires ffprobe. Does NOT establish physical Windows FPS, art approval, or
GitHub workflow conclusions; check the CC0 importer workflow separately.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

def require(ok, message):
    if not ok:
        raise ValueError(message)

def report(z, name):
    require(name in z.namelist(), f'{name}: missing')
    return json.loads(z.read(name))

def video(z, name, frames, fps, seconds):
    require(name in z.namelist(), f'{name}: missing')
    require(shutil.which('ffprobe'), 'ffprobe is required for real video verification')
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / Path(name).name
        path.write_bytes(z.read(name))
        output = subprocess.run(
            ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
             '-show_entries', 'stream=nb_frames,avg_frame_rate,duration',
             '-of', 'json', str(path)],
            capture_output=True, text=True, check=True)
        streams = json.loads(output.stdout).get('streams', [])
        require(len(streams) == 1, f'{name}: expected one video stream')
        stream = streams[0]
        rate = stream.get('avg_frame_rate', '0/1').split('/')
        require(int(stream.get('nb_frames', -1)) == frames,
                f'{name}: frame count mismatch')
        require(len(rate) == 2 and int(rate[1]) != 0
                and abs(int(rate[0]) / int(rate[1]) - fps) < .001,
                f'{name}: frame rate mismatch')
        require(abs(float(stream.get('duration', -1)) - seconds) < .02,
                f'{name}: duration mismatch')

def verify(args):
    sha = args.sha.lower()
    require(len(sha) == 40 and all(c in '0123456789abcdef' for c in sha),
            'SHA must be 40 hexadecimal characters')
    archives = {}
    try:
        for name in ('browser', 'cinematic', 'focused', 'motion', 'windows'):
            path = Path(getattr(args, name))
            require(path.is_file(), f'{name}: archive missing: {path}')
            z = zipfile.ZipFile(path)
            archives[name] = z
            bad = z.testzip()
            require(bad is None, f'{name}: CRC failure: {bad}')
            print(f'{name}: CRC PASS ({len(z.namelist())} members)')
        browser = report(archives['browser'], 'report.json')
        require(browser.get('errors') == [] and browser.get('warnings') == [],
                'browser: errors or warnings not empty')
        labels = browser.get('expected', {})
        version, build = labels.get('version'), labels.get('build')
        require(isinstance(version, str) and version and
                isinstance(build, str) and build, 'browser: missing build labels')
        for name in ('cinematic', 'focused', 'motion'):
            r = report(archives[name], 'report.json')
            require(r.get('sha') == sha and r.get('errors') == [],
                    f'{name}: source SHA mismatch or errors')
        views = report(archives['cinematic'], 'report.json').get('views', [])
        require(len(views) >= 5, 'cinematic: missing five views')
        for view in ('day', 'dusk', 'night', 'left', 'right'):
            require(view + '.png' in archives['cinematic'].namelist(),
                    f'cinematic: missing {view} screenshot')
        long = report(archives['motion'], 'long-fire-report.json')
        require(long.get('sha') == sha and long.get('errors') == [],
                'motion: long report mismatch/errors')
        require(long.get('source') == 'actual browser-rendered fixed-step game frames'
                and long.get('frames', 0) >= 600
                and long.get('durationSeconds', 0) >= 30,
                'motion: not genuine 600-frame/30-second browser recording')
        video(archives['motion'], 'skyline-long.mp4',
              long['frames'], long['fps'], long['durationSeconds'])
        for clip in ('skyline', 'houses', 'traffic', 'dragon', 'skyfall'):
            video(archives['motion'], clip + '.mp4', 100, 20, 5)
        video(archives['focused'], 'skyline.mp4', 100, 20, 5)
        preview = archives['windows'].read('PREVIEW-BUILD.txt').decode()
        require('Tested commit: ' + sha in preview
                and 'Version: ' + version in preview
                and 'Build: ' + build in preview,
                'Windows preview: source/build mismatch')
        require('assets/tech-freire-original.fbx' in archives['windows'].namelist(),
                'Windows preview: original FBX missing')
        manifest = report(archives['windows'], 'assets/vfx/manifest.json')
        require(manifest.get('license') == 'CC0-1.0'
                and len(manifest.get('assets', [])) >= 2,
                'Windows preview: CC0 license/assets missing')
        for asset in manifest['assets']:
            name = 'assets/vfx/' + asset['converted']
            digest = hashlib.sha256(archives['windows'].read(name)).hexdigest()
            require(digest == asset['converted_sha256'],
                    f'Windows preview: CC0 hash mismatch: {name}')
        zero = browser.get('zeroBlockBackgroundDamage', {})
        before, after = zero.get('beforeImpact', {}), zero.get('afterImpact', {})
        require(before.get('fires') == 0
                and before.get('ambientRooftopFires') == 0,
                'causality: background fire before impact')
        require(after.get('fires', 0) > 0 and after.get('damaged', 0) > 0,
                'causality: no background fire/damage after impact')
        impact = browser.get('landmarkImpact', {})
        require(impact.get('beforeDamage') == 0
                and impact.get('afterDamage', 0) > 0
                and impact.get('fireVisible') is True,
                'causality: landmark fire did not follow impact')
        for key in ('skylineReset', 'skylineAfterCascadeRestart'):
            reset = browser.get(key, {})
            require(reset.get('fireVisible') is False
                    and reset.get('smokeVisible') is False,
                    f'causality: fire/smoke persists after {key}')
        print(f'Exact-source artifact PASS: {sha} ({version} / {build})')
        print('NOT verified: Windows hardware FPS, cinematic art, GitHub conclusions')
    finally:
        for z in archives.values():
            z.close()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sha', required=True)
    for name in ('browser', 'cinematic', 'focused', 'motion', 'windows'):
        parser.add_argument('--' + name, required=True)
    try:
        verify(parser.parse_args())
    except (ValueError, KeyError, FileNotFoundError, zipfile.BadZipFile,
            subprocess.CalledProcessError, ZeroDivisionError) as exc:
        print(f'Artifact verification FAILED: {exc}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
