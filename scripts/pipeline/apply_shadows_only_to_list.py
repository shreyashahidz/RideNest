import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

vdir = 'public/img/vehicles'

# Exactly the 8 vehicles requested by the user:
SHADOW_VEHICLES = {
    "creta",
    "nexon-ev",
    "city",
    "thar",
    "baleno",
    "tesla-model-3",
    "scorpio",
    "ertiga"
}

ALL_VEHICLES = [
    "swift",
    "creta",
    "nexon-ev",
    "innova-crysta",
    "city",
    "thar",
    "seltos",
    "fortuner",
    "baleno",
    "xuv700",
    "tesla-model-3",
    "scorpio",
    "ertiga",
    "i20",
    "classic-350",
    "activa",
    "duke-390",
    "s1-pro",
    "pulsar-ns200",
    "himalayan",
    "yzf-r15",
    "apache-rtr-200",
    "splendor-plus",
    "bullet-350",
    "dominar-400",
    "access-125"
]

def add_clean_tire_shadow(canvas, x, y, w, h):
    shadow = Image.new('RGBA', canvas.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(shadow)
    
    shadow_w = int(w * 0.84)
    shadow_h = 16
    shadow_x = x + (w - shadow_w) // 2
    # Place directly touching the bottom of the tires
    shadow_y = y + h - (shadow_h // 2) - 2
    
    draw.ellipse(
        [shadow_x, shadow_y, shadow_x + shadow_w, shadow_y + shadow_h],
        fill=(25, 30, 35, 80)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=5))
    canvas.alpha_composite(shadow)

for k in ALL_VEHICLES:
    filepath = os.path.join(vdir, f"{k}.webp")
    if not os.path.exists(filepath):
        print(f"Skipping {k}: not found")
        continue

    img = Image.open(filepath)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    arr = np.array(img)
    alpha = arr[:, :, 3]
    mask = alpha > 25
    if not np.any(mask):
        print(f"Skipping {k}: no content")
        continue

    y_indices, x_indices = np.where(mask)
    x0, x1 = x_indices.min(), x_indices.max()
    y0, y1 = y_indices.min(), y_indices.max()

    cropped = img.crop((x0, y0, x1 + 1, y1 + 1))
    cw, ch = cropped.size

    canvas_w = 1056
    canvas_h = 594
    canvas = Image.new('RGBA', (canvas_w, canvas_h), (255, 255, 255, 0))

    # Scale proportionally
    max_w = 880
    max_h = 420
    scale = min(max_w / cw, max_h / ch)
    new_w = int(cw * scale)
    new_h = int(ch * scale)
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    pos_x = (canvas_w - new_w) // 2
    pos_y = canvas_h - new_h - 60

    # ONLY add shadow to the 8 vehicles requested!
    if k in SHADOW_VEHICLES:
        add_clean_tire_shadow(canvas, pos_x, pos_y, new_w, new_h)
        print(f"  [SHADOW ADDED] {k}")
    else:
        print(f"  [NO SHADOW ADDED - native only] {k}")

    # Composite vehicle
    canvas.alpha_composite(resized, (pos_x, pos_y))

    # Save WebP
    canvas.save(filepath, 'WEBP', quality=95)

print("\nDone! Shadows added ONLY to the 8 specified vehicles.")
