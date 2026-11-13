#!/usr/bin/env python3
"""Compare genuine time-aligned Dragon Defense motion artifact MP4 frames.

Requires ffmpeg, ffprobe and Pillow. Visual change is not cinematic art approval
or a physical Windows FPS measurement.
"""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile
from PIL import Image, ImageChops

DEFAULT_FRAMES = (0, 20, 60, 120, 240, 360, 480, 580, 599)


def checked_zip(path):
    z = zipfile.ZipFile(path)
    corrupt = z.testzip()
    if corrupt:
        z.close()
        raise ValueError(f'{path}: corrupt ZIP member {corrupt}')
    return z


def read_metadata(z, expected_sha):
    report = json.loads(z.read('long-fire-report.json'))
    if report.get('errors') != []:
        raise ValueError('long-fire-report.json has errors or lacks clean errors array')
    if expected_sha and report.get('sha') != expected_sha:
        raise ValueError(f"source SHA mismatch: {report.get('sha')} != {expected_sha}")
    if report.get('source') != 'actual browser-rendered fixed-step game frames':
        raise ValueError('recording provenance is not genuine browser-rendered frames')
    if report.get('frames', 0) < 600 or report.get('durationSeconds', 0) < 30:
        raise ValueError('long recording shorter than 600 frames / 30 seconds')
    return report


def probe(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                             '-show_entries', 'stream=width,height,nb_frames,avg_frame_rate,duration',
                             '-of', 'json', str(path)], capture_output=True, text=True, check=True)
    streams = json.loads(result.stdout).get('streams', [])
    if len(streams) != 1:
        raise ValueError('expected exactly one video stream')
    return streams[0]


def decode_samples(path, width, height, frame_indices):
    expr = '+'.join(f'eq(n\\,{n})' for n in frame_indices)
    command = ['ffmpeg', '-v', 'error', '-i', str(path), '-vf', f'select={expr}',
               '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    result = subprocess.run(command, capture_output=True, check=True, timeout=120)
    stride = width * height * 3
    if len(result.stdout) != stride * len(frame_indices):
        raise ValueError(f'expected {len(frame_indices)} decoded frames, got {len(result.stdout) / stride:.2f}')
    return [Image.frombytes('RGB', (width, height), result.stdout[i*stride:(i+1)*stride])
            for i in range(len(frame_indices))]


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('baseline_zip')
    p.add_argument('candidate_zip')
    p.add_argument('--baseline-sha')
    p.add_argument('--candidate-sha')
    p.add_argument('--frames', default=','.join(map(str, DEFAULT_FRAMES)))
    p.add_argument('--threshold', type=int, default=10)
    p.add_argument('--require-change', action='store_true')
    p.add_argument('--min-changed-frames', type=int, default=1)
    p.add_argument('--output')
    a = p.parse_args()
    if not 0 <= a.threshold <= 254 or a.min_changed_frames < 1:
        p.error('threshold must be 0..254 and min-changed-frames must be positive')
    indices = [int(x) for x in a.frames.split(',')]
    if not indices or len(set(indices)) != len(indices) or min(indices) < 0 or indices != sorted(indices):
        p.error('frames must be unique nonnegative integers in ascending order')
    with checked_zip(a.baseline_zip) as bz, checked_zip(a.candidate_zip) as cz:
        before = read_metadata(bz, a.baseline_sha)
        after = read_metadata(cz, a.candidate_sha)
        if max(indices) >= min(before['frames'], after['frames']):
            raise ValueError('sample frame index exceeds recording duration')
        with tempfile.TemporaryDirectory() as tmp:
            paths = []
            for i, z in enumerate((bz, cz)):
                target = Path(tmp) / f'{i}.mp4'
                target.write_bytes(z.read('skyline-long.mp4'))
                paths.append(target)
            specs = [probe(path) for path in paths]
            for spec, report in zip(specs, (before, after)):
                rate = spec['avg_frame_rate'].split('/')
                fps = int(rate[0]) / int(rate[1])
                if int(spec['nb_frames']) != report['frames'] or abs(fps - report['fps']) > .001:
                    raise ValueError('MP4 frame count/rate differs from source report')
                if abs(float(spec['duration']) - report['durationSeconds']) > .02:
                    raise ValueError('MP4 duration differs from source report')
            dimensions = [(int(s['width']), int(s['height'])) for s in specs]
            if dimensions[0] != dimensions[1]:
                raise ValueError('recording dimensions differ; cannot compare matched pixels')
            w, h = dimensions[0]
            old, new = [decode_samples(path, w, h, indices) for path in paths]
            results = []
            for frame, x, y in zip(indices, old, new):
                delta = ImageChops.difference(x, y)
                channels = delta.split()
                maximum = ImageChops.lighter(ImageChops.lighter(channels[0], channels[1]), channels[2])
                histogram = maximum.histogram()
                results.append({
                    'frame': frame,
                    'seconds': round(frame / before['fps'], 3),
                    'changed_pixels': sum(histogram[1:]),
                    'changed_pixels_over_threshold': sum(histogram[a.threshold + 1:]),
                    'fraction_over_threshold': round(sum(histogram[a.threshold + 1:]) / (w*h), 8),
                    'mean_max_channel_difference': round(sum(i*v for i,v in enumerate(histogram))/(w*h), 5)
                })
    changed = sum(x['changed_pixels_over_threshold'] > 0 for x in results)
    outcome = {
        'baseline_sha': before['sha'], 'candidate_sha': after['sha'],
        'dimensions': [w,h], 'threshold': a.threshold, 'frames': results,
        'changed_sample_frames': changed, 'sampled_frames': len(results),
        'visible_change_detected': changed >= a.min_changed_frames,
        'disclaimer': 'Difference is not cinematic art approval or physical Windows FPS evidence.'
    }
    serialized = json.dumps(outcome, indent=2) + '\n'
    print(serialized)
    if a.output:
        Path(a.output).write_text(serialized, encoding='utf-8')
    if a.require_change and not outcome['visible_change_detected']:
        raise SystemExit('FAIL: motion recordings are unchanged at sampled frames')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, zipfile.BadZipFile, subprocess.CalledProcessError) as error:
        sys.exit(f'FAIL: {error}')
