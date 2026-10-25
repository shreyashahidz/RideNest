import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

vdir = 'public/img/vehicles'

# 1. Update Thar with the clean no-bg version
if os.path.exists('test_thar_nobg.png'):
    os.replace('test_thar_nobg.png', os.path.join(vdir, 'thar_clean.png'))
    print("Thar clean no-bg prepared!")

# 2. Update Pulsar NS200 with the real red-and-black motorcycle
if os.path.exists('test_pulsar.png'):
    pulsar_img = Image.open('test_pulsar.png')
    # Flip to face LEFT
    pulsar_left = pulsar_img.transpose(Image.FLIP_LEFT_RIGHT)
    pulsar_left.save(os.path.join(vdir, 'pulsar_clean.png'))
    print("Pulsar clean red-black prepared!")

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

def add_single_contact_shadow(canvas, x, y, w, h):
    # Single realistic contact shadow directly touching the tire bottoms
    shadow = Image.new('RGBA', canvas.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(shadow)
    
    shadow_w = int(w * 0.82)
    shadow_h = 14
    shadow_x = x + (w - shadow_w) // 2
    # Exactly touching the bottom of the tires
    shadow_y = y + h - (shadow_h // 2)
    
    draw.ellipse(
        [shadow_x, shadow_y, shadow_x + shadow_w, shadow_y + shadow_h],
        fill=(20, 25, 30, 85)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=5))
    canvas.alpha_composite(shadow)

for k in ALL_VEHICLES:
    src_file = os.path.join(vdir, f"{k}.webp")
    if k == 'thar' and os.path.exists(os.path.join(vdir, 'thar_clean.png')):
        src_file = os.path.join(vdir, 'thar_clean.png')
    elif k == 'pulsar-ns200' and os.path.exists(os.path.join(vdir, 'pulsar_clean.png')):
        src_file = os.path.join(vdir, 'pulsar_clean.png')

    if not os.path.exists(src_file):
        print(f"File not found: {src_file}")
        continue

    img = Image.open(src_file)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    arr = np.array(img)
    alpha = arr[:, :, 3]
    mask = alpha > 25
    if not np.any(mask):
        print(f"Warning: no pixels in {k}")
        continue

    y_indices, x_indices = np.where(mask)
    x0, x1 = x_indices.min(), x_indices.max()
    y0, y1 = y_indices.min(), y_indices.max()

    cropped = img.crop((x0, y0, x1 + 1, y1 + 1))
    cw, ch = cropped.size

    canvas_w = 1056
    canvas_h = 594
    canvas = Image.new('RGBA', (canvas_w, canvas_h), (255, 255, 255, 0))

    # Scale vehicle
    max_w = 880
    max_h = 410
    scale = min(max_w / cw, max_h / ch)
    new_w = int(cw * scale)
    new_h = int(ch * scale)
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Position centered horizontally, tires sitting naturally at the baseline
    pos_x = (canvas_w - new_w) // 2
    pos_y = canvas_h - new_h - 70

    # Add single contact shadow directly under tires
    add_single_contact_shadow(canvas, pos_x, pos_y, new_w, new_h)

    # Composite vehicle
    canvas.alpha_composite(resized, (pos_x, pos_y))

    # Save cleanly to target webp
    dest_path = os.path.join(vdir, f"{k}.webp")
    canvas.save(dest_path, 'WEBP', quality=95)
    print(f"[CLEANED] {k}: ({new_w}x{new_h}) at ({pos_x}, {pos_y})")

print("\nAll 26 vehicles realigned with single shadow on pure transparent background!")
