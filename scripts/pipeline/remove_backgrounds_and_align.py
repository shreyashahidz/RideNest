import os
import rembg
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

vdir = 'public/img/vehicles'
session = rembg.new_session('u2net')

# List of all 26 vehicle keys in the database
VEHICLE_KEYS = [
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

# The ones that need rembg
NEEDS_REMBG = [
    "creta",
    "nexon-ev",
    "city",
    "baleno",
    "ertiga",
    "scorpio",
    "tesla-model-3",
    "dominar-400"
]

def add_ground_shadow(canvas, x, y, w, h):
    # Draw soft elliptical shadow under the wheels
    shadow = Image.new('RGBA', canvas.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(shadow)
    # Wheel shadow
    shadow_w = int(w * 0.88)
    shadow_h = int(h * 0.09)
    shadow_x = x + (w - shadow_w) // 2
    shadow_y = y + h - int(shadow_h * 0.45)
    
    draw.ellipse(
        [shadow_x, shadow_y, shadow_x + shadow_w, shadow_y + shadow_h],
        fill=(25, 30, 35, 110)
    )
    # Soft blur
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=shadow_h // 2.5))
    canvas.alpha_composite(shadow)

def process_vehicle(k):
    filepath = os.path.join(vdir, f"{k}.webp")
    if not os.path.exists(filepath):
        print(f"Skipping {k}: file does not exist")
        return

    img = Image.open(filepath)
    print(f"Processing {k} (original: {img.size}, mode: {img.mode})...")

    # 1. Remove background if needed
    if k in NEEDS_REMBG:
        print(f"  Removing background from {k} with u2net...")
        img = rembg.remove(img, session=session)
    else:
        # If it's already an isolated studio photo with white background (RGB)
        # Convert white background to transparent so we can frame it perfectly
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            arr = np.array(img)
            r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
            # Detect white background: corners are near 255
            # Make pure white transparent
            white_mask = (r > 248) & (g > 248) & (b > 248)
            arr[white_mask, 3] = 0
            img = Image.fromarray(arr, 'RGBA')

    # 2. Get tight bounding box of vehicle
    alpha = np.array(img)[:, :, 3]
    # Filter out very faint noise
    mask = alpha > 25
    if not np.any(mask):
        print(f"  Warning: no opaque pixels in {k}")
        return

    y_indices, x_indices = np.where(mask)
    x0, x1 = x_indices.min(), x_indices.max()
    y0, y1 = y_indices.min(), y_indices.max()
    
    cropped = img.crop((x0, y0, x1 + 1, y1 + 1))
    cw, ch = cropped.size

    # 3. Canvas size
    canvas_w = 1056
    canvas_h = 594
    canvas = Image.new('RGBA', (canvas_w, canvas_h), (255, 255, 255, 0))

    # 4. Scale vehicle so it fits with balanced margins
    # Target max width: 880px (~83%), max height: 430px (~72%)
    max_w = 880
    max_h = 420
    scale = min(max_w / cw, max_h / ch)
    new_w = int(cw * scale)
    new_h = int(ch * scale)
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # 5. Position centered horizontally, ground aligned near bottom
    pos_x = (canvas_w - new_w) // 2
    # Tires resting at ~78-82% down the canvas
    pos_y = canvas_h - new_h - 75

    # 6. Add ground shadow
    add_ground_shadow(canvas, pos_x, pos_y, new_w, new_h)

    # 7. Composite vehicle
    canvas.alpha_composite(resized, (pos_x, pos_y))

    # 8. Save back to original path
    canvas.save(filepath, 'WEBP', quality=92)
    print(f"  [DONE] {k}: framed ({new_w}x{new_h}) at ({pos_x}, {pos_y})")

print("Starting background removal and alignment for all vehicles...")
for k in VEHICLE_KEYS:
    process_vehicle(k)

print("\nAll 26 vehicles processed successfully!")
