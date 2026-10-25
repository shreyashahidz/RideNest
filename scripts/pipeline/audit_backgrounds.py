import os
from PIL import Image
import numpy as np

vdir = 'public/img/vehicles'
files = [f for f in sorted(os.listdir(vdir)) if f.endswith('.webp')]

studio_files = []
outdoor_files = []

for f in files:
    im = Image.open(os.path.join(vdir, f))
    if im.mode == 'RGBA':
        # Check if alpha has transparent pixels
        arr = np.array(im)
        alpha = arr[:, :, 3]
        if np.any(alpha < 200):
            studio_files.append((f, 'transparent_png'))
            continue
    arr = np.array(im.convert('RGB'))
    tl = arr[0:20, 0:20].mean()
    tr = arr[0:20, -20:].mean()
    if tl > 230 and tr > 230:
        studio_files.append((f, f'white_studio (tl={tl:.0f}, tr={tr:.0f})'))
    else:
        outdoor_files.append((f, f'outdoor (tl={tl:.0f}, tr={tr:.0f})'))

print("=== STUDIO CUTOUTS (NO BACKGROUND) ===")
for f, info in studio_files:
    print(f"  [OK] {f:20} -> {info}")

print("\n=== OUTDOOR BACKGROUND (NEEDS REPLACEMENT) ===")
for f, info in outdoor_files:
    print(f"  [NEED FIX] {f:20} -> {info}")
