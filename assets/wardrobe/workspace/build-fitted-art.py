"""Build the fitted wardrobe artwork with Pillow, NumPy and SciPy.

Run from the repository root.
"""
import base64
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi


ITEMS = Path('assets/wardrobe/items')
TYPING = Path('assets/animations/study-together-lottie/lottie/typing.json')
CHAIR = Path('assets/animations/pip-chair-performance/frames')
GIFTS = Path('assets/environments/igloo/gifts')
CUSTOMIZATION = Path('assets/animations/pip-customization')


def open_art(source):
    return Image.open(source).convert('RGBA')


def clean(im):
    pixels = np.array(im)
    opaque = pixels[:, :, 3] > 10
    labels, _ = ndi.label(opaque)
    counts = np.bincount(labels[opaque])
    keep = np.flatnonzero(counts >= max(12, counts.max() * .07))
    pixels[:, :, 3] *= ndi.binary_dilation(np.isin(labels, keep) & opaque)
    return Image.fromarray(pixels)


def trim(im):
    return im.crop(im.getchannel('A').getbbox())


def encode(im):
    buffer = io.BytesIO()
    im.save(buffer, format='PNG', optimize=True)
    return {
        'w': im.width,
        'h': im.height,
        'p': 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode(),
    }


def write(name, data):
    (ITEMS / name).write_text(json.dumps(data, separators=(',', ':')) + '\n')


paths = {
    'gift-hat': GIFTS / 'wear-1.webp',
    'gift-backpack': GIFTS / 'wear-3.webp',
    'royal-crown': ITEMS / 'crown-body-layer-v2.png',
    'round-glasses': ITEMS / 'glasses-body-layer-v2.png',
    'study-glasses': CUSTOMIZATION / 'study-together/glasses/aligned.png',
    'knight-helmet': ITEMS / 'knight-helmet-body-layer-v2.png',
    'knight-chest': ITEMS / 'knight-chest-body-layer-v2.png',
    'knight-cape': ITEMS / 'knight-cape-body-layer.png',
    'knight-flipper-left': ITEMS / 'knight-left-arm-layer-v2.png',
    'knight-flipper-right': ITEMS / 'knight-right-arm-layer-v2.png',
    'knight-boot-left': ITEMS / 'knight-left-foot-layer-v2.png',
    'knight-boot-right': ITEMS / 'knight-right-foot-layer-v2.png',
    'scarf-teal': ITEMS / 'scarves/scarf-teal.png',
    'scarf-berry': ITEMS / 'scarves/scarf-red.png',
    'scarf-lavender': ITEMS / 'scarves/scarf-lavender.png',
}

art = {}
for item, source in paths.items():
    im = open_art(source)
    if item == 'study-glasses':
        im = im.crop((203, 225, 334, 299))
    im = clean(im)
    # Rig-authored pieces keep the origin of their original canvas.
    if item in ('gift-hat', 'gift-backpack', 'royal-crown', 'round-glasses', 'study-glasses', 'knight-helmet'):
        im = trim(im)
    art[item] = encode(im)
    if item.startswith('scarf-') or item == 'round-glasses':
        trim(im).save(ITEMS / (item + '-thumb.png'), optimize=True)

# Keep the headphone cups and arch independent so the head can occlude the far cup.
headphones = trim(clean(open_art(CUSTOMIZATION / 'my-igloo/headphones/aligned.png').crop((151, 112, 329, 303))))
headphones.save(ITEMS / 'cozy-headphones.png')
pieces = {
    'band': [(0, 0), (178, 0), (178, 78), (147, 72), (117, 78), (95, 100), (55, 87), (0, 98)],
    'near': [(0, 108), (11, 85), (45, 81), (61, 85), (84, 100), (96, 118), (99, 156), (104, 180), (0, 180)],
    'far': [(84, 103), (102, 79), (126, 66), (153, 66), (178, 77), (178, 171), (105, 174), (99, 150), (98, 127)],
}
for name, points in pieces.items():
    mask = Image.new('L', headphones.size)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.3))
    part = headphones.copy()
    alpha = np.array(headphones.getchannel('A'), float) * np.array(mask) / 255
    part.putalpha(Image.fromarray(np.uint8(alpha)))
    art['cozy-headphones-' + name] = encode(trim(part))


def feet(im, *, chair=False):
    r, g, b, alpha = np.array(im, dtype=float).transpose(2, 0, 1)
    y = np.indices(r.shape)[0]
    orange = (r - g > 27) & (g - b > 21) & (r > 135) & (y > (399 if chair else 435)) & (alpha > 80)
    labels, _ = ndi.label(ndi.binary_closing(orange, iterations=2))
    boxes = []
    for index, box in enumerate(ndi.find_objects(labels), 1):
        if box is None:
            continue
        rows, cols = box
        width, height = cols.stop - cols.start, rows.stop - rows.start
        if width >= 34:
            center = [round((cols.start + cols.stop) / 2), round((rows.start + rows.stop) / 2)]
            boxes.append((np.sum(labels[box] == index), [*center, width, height]))
    return sorted(box for _, box in sorted(boxes, reverse=True)[:2])


def scarf_tints(im):
    r, g, b, alpha = np.array(im, dtype=float).transpose(2, 0, 1)
    y, x = np.indices(r.shape)
    teal = np.minimum(g - r, b - r)
    # Restrict dye to the scarf color and region to preserve Pip and the laptop.
    mask = (teal > 4) & (g > b - 3) & (alpha > 10) & (y > 270) & (y < 483) & (x < 305)
    labels, _ = ndi.label(mask)
    keep = np.flatnonzero(np.bincount(labels[mask]) >= 100)
    mask = np.clip((teal - 3) / 12, 0, 1) * np.isin(labels, keep) * mask * (alpha / 255)
    luminance = .2126 * r + .7152 * g + .0722 * b
    result = {}
    for name, target in [('berry', (175, 105, 117)), ('lavender', (153, 127, 179))]:
        rgb = np.dstack([luminance + (channel - 125) * np.clip(luminance / 105, 0, 1.2) for channel in target])
        overlay = Image.fromarray(np.uint8(np.clip(np.dstack([rgb, mask * 255]), 0, 255)))
        box = overlay.getbbox()
        if box:
            cropped = overlay.crop(box).quantize(colors=100, method=Image.Quantize.FASTOCTREE)
            result[name] = {**encode(cropped), 'x': box[0], 'y': box[1]}
    return result


chair_cels = [CHAIR / f'pip-chair_{n:02}.png' for n in range(11)]
chair_cels += [CHAIR / f'pip-chair-{pose}-v2.png' for pose in ('contact', 'settle', 'rest')]
boot_anchors = {str(n): feet(open_art(path), chair=True) for n, path in enumerate(chair_cels)}
colors = {}
for cel in json.loads(TYPING.read_text())['assets']:
    encoded = cel.get('p', '')
    if not encoded.startswith('data:'):
        continue
    im = open_art(io.BytesIO(base64.b64decode(encoded.split(',', 1)[1])))
    boot_anchors[cel['id']] = feet(im)
    colors[cel['id']] = scarf_tints(im)

write('fitted-lottie-art.json', art)
write('seated-scarf-colors.json', colors)
write('boot-anchors.json', boot_anchors)
