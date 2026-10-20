"""Convert source images to runtime WebP without resizing or trimming their canvas."""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('images', nargs='+', type=Path)
parser.add_argument('--output-dir', type=Path, help='Destination folder (default: assets_webp/)')
parser.add_argument('--max-size', type=int, help='Optional mobile derivative limit; retains aspect ratio and full canvas')
args = parser.parse_args()
output = args.output_dir or Path(__file__).resolve().parents[1] / 'assets_webp'
output.mkdir(parents=True, exist_ok=True)
for source in args.images:
    target = output / (source.stem + '.webp')
    with Image.open(source) as image:
        image = image.convert('RGBA')
        if args.max_size:
            image.thumbnail((args.max_size, args.max_size), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=90, method=6, lossless=False, exact=True)
    print(f'{source} -> {target.name}: {target.stat().st_size} bytes')
