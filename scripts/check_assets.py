"""Validate shipped WebP assets and their baked collision metadata (Pillow only)."""
from pathlib import Path
import base64
import json
import re
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = (root / 'game.js').read_text()
manifest = source.split('const ASSETS = {', 1)[1].split('\n};', 1)[0]
paths = set(re.findall(r'"(assets_webp/[^\"]+)"', manifest))
families = re.findall(r'^  (\w+): \{name:', (root / 'world.js').read_text(), re.M)
paths.update(f'assets_webp/celulas/{family}_0{i}.webp' for family in families for i in range(1, 4))
shapes = json.loads((root / 'world-shapes.js').read_text().split('= ', 1)[1].rstrip(';\n'))
assert len(families) == 10, 'Cell family manifest changed; review this validator'
assert len(paths) > 60, 'Asset manifest could not be read'
decoded_bytes = 0
shape_count = 0
for name in sorted(paths):
    path = root / name
    assert path.suffix == '.webp', name
    with Image.open(path) as image:
        assert image.format == 'WEBP', name
        decoded_bytes += image.width * image.height * 4
        folder = path.parent.name
        if folder not in ('new_size', 'celulas', 'macrofago'):
            continue
        assert 'A' in image.getbands(), f'Missing alpha: {name}'
        alpha = image.getchannel('A')
        assert alpha.getextrema()[0] == 0 and alpha.getbbox(), f'Invalid transparent silhouette: {name}'
        if folder == 'new_size':
            assert image.size == (1001, 535), name
        elif folder == 'macrofago':
            assert image.size == (1254, 1254), name
        else:
            assert max(image.size) <= 512, name
        shape = shapes[path.stem]
        assert image.size == (shape['width'], shape['height']), f'Stale SDF size: {name}'
        assert alpha.point(lambda a: 255 if a >= 48 else 0).getbbox() == tuple(shape['bounds']), f'Stale alpha bounds: {name}'
        assert len(base64.b64decode(shape['data'])) == shape['w'] * shape['h'], name
        shape_count += 1
assert shape_count == len(shapes), 'Unused or missing collision shapes'
for name, size in {
    'Bacteria_Background_7.webp': (232, 284),
    'clock.webp': (512, 512),
}.items():
    with Image.open(root / 'assets_webp' / name) as image:
        assert image.format == 'WEBP' and image.mode == 'RGBA', name
        assert image.size == size, name
        alpha = image.getchannel('A')
        assert alpha.getextrema()[0] == 0 and alpha.getbbox(), f'Invalid icon alpha: {name}'
version = re.search(r'const BUILD_VERSION = "([^"]+)"', source)[1]
html = (root / 'index.html').read_text()
for script in ('game.js', 'world.js', 'enemies.js', 'controls.js', 'audio/sound.js', 'style.css'):
    assert f'{script}?v={version}' in html, f'Build version differs: {script}'
for image in re.findall(r'<img src="([^"]+)"', html):
    assert image.endswith(f'.webp?v={version}'), f'Unversioned menu image: {image}'
print(f'{len(paths)} WebP images checked; {shape_count} alpha/SDF shapes; {decoded_bytes / 2**20:.2f} MiB estimated RGBA')
