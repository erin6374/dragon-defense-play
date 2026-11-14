#!/usr/bin/env python3
"""Compare same-camera cinematic PNGs from two QA artifact ZIPs or directories.

Requires Pillow: python -m pip install Pillow
Nonzero pixel differences prove rendering changed, not cinematic art approval.
"""
import argparse
import io
import json
from pathlib import Path
import sys
import zipfile

try:
    from PIL import Image, ImageChops, ImageEnhance
except ImportError:
    sys.exit('Pillow is required: python -m pip install Pillow')

VIEWS = ('day', 'dusk', 'night', 'left', 'right')


def load_artifact(path):
    path = Path(path)
    if path.is_dir():
        def read(name):
            return (path / name).read_bytes()
        return read, None
    archive = zipfile.ZipFile(path)
    if archive.testzip() is not None:
        raise ValueError(f'Corrupt ZIP: {path}')
    def read(name):
        return archive.read(name)
    return read, archive


def compare_view(before, after, threshold):
    a = Image.open(io.BytesIO(before)).convert('RGB')
    b = Image.open(io.BytesIO(after)).convert('RGB')
    if a.size != b.size:
        raise ValueError(f'Image size mismatch: {a.size} vs {b.size}')
    diff = ImageChops.difference(a, b)
    channel_max = ImageChops.lighter(ImageChops.lighter(*diff.split()[:2]), diff.split()[2])
    histogram = channel_max.histogram()
    changed = sum(histogram[1:])
    changed_over_threshold = sum(histogram[threshold + 1:])
    width, height = a.size
    return {
        'width': width,
        'height': height,
        'changed_pixels': changed,
        'changed_pixels_over_threshold': changed_over_threshold,
        'changed_fraction': round(changed / (width * height), 8),
        'mean_max_channel_difference': round(sum(i * n for i, n in enumerate(histogram)) / (width * height), 5),
        'max_channel_difference': next((i for i in range(255, -1, -1) if histogram[i]), 0),
        'changed_bounds': channel_max.getbbox(),
    }, diff


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('before', help='Baseline cinematic ZIP or directory')
    parser.add_argument('after', help='Candidate cinematic ZIP or directory')
    parser.add_argument('--threshold', type=int, default=10, help='RGB max-channel difference threshold (default: 10)')
    parser.add_argument('--require-change', action='store_true', help='Fail if any camera view is unchanged')
    parser.add_argument('--min-changed', type=int, default=1, help='Minimum changed pixels in each view when required')
    parser.add_argument('--expected-before-sha', help='Fail unless baseline report.json has this exact source SHA')
    parser.add_argument('--expected-after-sha', help='Fail unless candidate report.json has this exact source SHA')
    parser.add_argument('--output', help='Write machine-readable JSON report')
    parser.add_argument('--diff-dir', help='Write amplified PNG difference images')
    args = parser.parse_args()
    if not 0 <= args.threshold <= 254 or args.min_changed < 1:
        parser.error('threshold must be 0..254 and min-changed must be >= 1')
    a_read, a_zip = load_artifact(args.before)
    b_read, b_zip = load_artifact(args.after)
    try:
        a_report = json.loads(a_read('report.json'))
        b_report = json.loads(b_read('report.json'))
        for name, report, expected in [('baseline', a_report, args.expected_before_sha), ('candidate', b_report, args.expected_after_sha)]:
            if expected and report.get('sha') != expected:
                raise ValueError(f'{name} source SHA mismatch: {report.get("sha")} != {expected}')
            if report.get('errors'):
                raise ValueError(f'{name} cinematic report contains errors: {report["errors"]}')
        results = {}
        if args.diff_dir:
            Path(args.diff_dir).mkdir(parents=True, exist_ok=True)
        for view in VIEWS:
            results[view], diff = compare_view(a_read(view + '.png'), b_read(view + '.png'), args.threshold)
            if args.diff_dir:
                ImageEnhance.Contrast(diff).enhance(4).save(Path(args.diff_dir) / (view + '-diff.png'))
        outcome = {
            'baseline_sha': a_report.get('sha'),
            'candidate_sha': b_report.get('sha'),
            'threshold': args.threshold,
            'views': results,
            'all_views_changed': all(v['changed_pixels'] >= args.min_changed for v in results.values()),
            'disclaimer': 'Nonzero pixel difference is not cinematic art approval or physical Windows FPS evidence.',
        }
        rendered = json.dumps(outcome, indent=2)
        print(rendered)
        if args.output:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            Path(args.output).write_text(rendered + '\n', encoding='utf-8')
        if args.require_change and not outcome['all_views_changed']:
            sys.exit('FAIL: at least one camera view is unchanged')
    finally:
        if a_zip:
            a_zip.close()
        if b_zip:
            b_zip.close()


if __name__ == '__main__':
    main()
