import urllib.request
import ssl
import os
import rembg
from PIL import Image, ImageDraw, ImageFilter
import io
import numpy as np

ctx = ssl._create_unverified_context()
session = rembg.new_session('u2net')

url = "https://imgd.aeplcdn.com/1056x594/n/cw/ec/144681/virtus-exterior-right-side-view-6.jpeg?isig=0&q=85"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
    raw_img = Image.open(io.BytesIO(r.read()))

# 1. Flip to face LEFT
left_img = raw_img.transpose(Image.FLIP_LEFT_RIGHT)

# 2. Background removal
cutout = rembg.remove(left_img, session=session)

# 3. Crop
arr = np.array(cutout)
alpha = arr[:, :, 3]
y_idx, x_idx = np.where(alpha > 20)
cropped = cutout.crop((x_idx.min(), y_idx.min(), x_idx.max() + 1, y_idx.max() + 1))
cw, ch = cropped.size

# 4. Canvas (1056 x 594)
canvas = Image.new('RGBA', (1056, 594), (255, 255, 255, 0))
scale = min(880 / cw, 420 / ch)
new_w = int(cw * scale)
new_h = int(ch * scale)
resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

pos_x = (1056 - new_w) // 2
pos_y = 594 - new_h - 60

# 5. Clean tire contact shadow
shadow = Image.new('RGBA', canvas.size, (255, 255, 255, 0))
draw = ImageDraw.Draw(shadow)
shadow_w = int(new_w * 0.84)
shadow_h = 16
shadow_x = pos_x + (new_w - shadow_w) // 2
shadow_y = pos_y + new_h - (shadow_h // 2) - 2
draw.ellipse([shadow_x, shadow_y, shadow_x + shadow_w, shadow_y + shadow_h], fill=(25, 30, 35, 80))
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=5))
canvas.alpha_composite(shadow)

# 6. Composite
canvas.alpha_composite(resized, (pos_x, pos_y))

# Save
dest = 'public/img/vehicles/virtus.webp'
canvas.save(dest, 'WEBP', quality=95)
print(f"Virtus image created at {dest}!")
