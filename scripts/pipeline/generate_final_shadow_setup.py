import os
import urllib.request
import ssl
import io
import time
import numpy as np
import scipy.ndimage as ndi
from PIL import Image, ImageDraw, ImageFilter
import rembg

ctx = ssl._create_unverified_context()

vdir = 'public/img/vehicles'
cache_dir = 'cutouts_cache'
os.makedirs(vdir, exist_ok=True)
os.makedirs(cache_dir, exist_ok=True)

# The EXACT 8 vehicles requested by the user:
# 1. hyundai creta
# 2. tata nexon ev
# 3. honda city
# 4. mahindra tata (Mahindra Thar)
# 5. maruti suzuki baleno
# 6. tesla model 3
# 7. mahindra scorpio
# 8. maruti suzuki ertiga
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

# Source information for all 26 vehicles
SOURCES = [
    # 8 vehicles in the user's list (need background removal & realistic ground shadow)
    {
        "key": "creta",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/106815/creta-exterior-right-side-view-2.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "outdoor_rembg"
    },
    {
        "key": "nexon-ev",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/149123/nexon-ev-exterior-left-side-view.jpeg?isig=0&q=85",
        "needs_flip": False,
        "type": "outdoor_rembg"
    },
    {
        "key": "city",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/219846/city-facelift-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "outdoor_rembg"
    },
    {
        "key": "thar",
        "url": "https://stimg.cardekho.com/images/carexteriorimages/930x620/Mahindra/Thar/13948/1790588115946/side-view-(left)-90.jpg",
        "needs_flip": False,
        "type": "outdoor_rembg"
    },
    {
        "key": "baleno",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/221126/baleno-2026-exterior-right-side-view-8.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "outdoor_rembg"
    },
    {
        "key": "tesla-model-3",
        "url": "https://stimg.cardekho.com/images/carexteriorimages/930x620/Tesla/Model-3/5251/1693556345148/side-view-(left)-90.jpg",
        "needs_flip": False,
        "type": "outdoor_rembg"
    },
    {
        "key": "scorpio",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/128413/scorpio-classic-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "outdoor_rembg"
    },
    {
        "key": "ertiga",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/115777/ertiga-exterior-right-side-view-2.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "outdoor_rembg"
    },

    # Studio cars - already have native studio floor shadow (NO SHADOW TO BE ADDED)
    {
        "key": "swift",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/159099/swift-exterior-left-side-view-11.jpeg?isig=0&q=85",
        "needs_flip": False,
        "type": "studio_car"
    },
    {
        "key": "innova-crysta",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/222736/innova-crysta-2026-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "studio_car"
    },
    {
        "key": "seltos",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/192817/seltos-exterior-right-side-view-50.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "studio_car"
    },
    {
        "key": "fortuner",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/44709/fortuner-exterior-right-side-view-3.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "studio_car"
    },
    {
        "key": "xuv700",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/205104/xuv-7xo-exterior-right-side-view-557.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "studio_car"
    },
    {
        "key": "i20",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/150603/i20-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True,
        "type": "studio_car"
    },

    # Two-wheelers - official transparent PNGs with native studio shadows (NO SHADOW TO BE ADDED)
    {
        "key": "classic-350",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/101487/classic-350-right-side-view-20.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "activa",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/44686/activa-6g-right-side-view-2.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "duke-390",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/220872/390-duke-right-side-view-3.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "s1-pro",
        "url": "https://imgd.aeplcdn.com/1280x720/n/cw/ec/196991/s1-pro-left-side-view-3.png?isig=0&q=100",
        "needs_flip": False,
        "type": "bike_png"
    },
    {
        "key": "pulsar-ns200",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/58025/pulsar-ns-right-side-view-12.png?isig=0&q=85",
        "local_source": "test_pulsar.png",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "himalayan",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/110431/himalayan-right-side-view-8.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "yzf-r15",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/209893/r15-right-side-view-3.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "apache-rtr-200",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/204536/apache-200-right-side-view-5.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "splendor-plus",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/212711/splendor-plus-right-side-view-3.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "bullet-350",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/127499/bullet-right-side-view-14.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "dominar-400",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/217059/dominar-400-right-side-view-11.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    },
    {
        "key": "access-125",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/188491/access-125-right-side-view-20.png?isig=0&q=85",
        "needs_flip": True,
        "type": "bike_png"
    }
]

print("Initializing rembg session...")
session = rembg.new_session('u2net')

def fetch_image(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        return Image.open(io.BytesIO(r.read()))

def process_studio_car(img, flip=False):
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    
    img = img.convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Neutral white/grey detection
    max_c = np.maximum(r, np.maximum(g, b))
    min_c = np.minimum(r, np.minimum(g, b))
    is_neutral = (max_c - min_c) < 18
    is_pure_white = is_neutral & (min_c >= 250)
    
    # Background connected component from top-left
    labeled, num_features = ndi.label(is_pure_white)
    bg_label = labeled[0, 0]
    is_bg = (labeled == bg_label)
    
    alpha = np.ones_like(max_c) * 255.0
    alpha[is_bg] = 0.0
    
    # Preserve studio floor shadow under the car
    h, w = arr.shape[:2]
    bottom_half = np.zeros_like(is_bg, dtype=bool)
    bottom_half[int(h * 0.5):, :] = True
    shadow_mask = bottom_half & is_neutral & (min_c >= 210) & (min_c < 250)
    alpha[shadow_mask] = np.minimum(alpha[shadow_mask], (250.0 - min_c[shadow_mask]) / 40.0 * 210.0)
    
    arr[:, :, 3] = alpha
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')

def add_clean_tire_shadow(canvas, x, y, w, h):
    # Natural single contact shadow directly touching the tire bottom
    shadow = Image.new('RGBA', canvas.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(shadow)
    
    shadow_w = int(w * 0.84)
    shadow_h = 16
    shadow_x = x + (w - shadow_w) // 2
    shadow_y = y + h - (shadow_h // 2) - 2
    
    draw.ellipse(
        [shadow_x, shadow_y, shadow_x + shadow_w, shadow_y + shadow_h],
        fill=(25, 30, 35, 80)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=5))
    canvas.alpha_composite(shadow)

print("\nStarting vehicle image processing according to exact user list...")

for item in SOURCES:
    k = item['key']
    t_start = time.time()
    
    # 1. Obtain clean transparent cutout
    cached_path = os.path.join(cache_dir, f"{k}.png")
    
    if os.path.exists(cached_path):
        raw_cutout = Image.open(cached_path)
    else:
        # Fetch or load source
        if item.get('local_source') and os.path.exists(item['local_source']):
            src_img = Image.open(item['local_source'])
        else:
            src_img = fetch_image(item['url'])
            
        if item['type'] == 'outdoor_rembg':
            if item['needs_flip']:
                src_img = src_img.transpose(Image.FLIP_LEFT_RIGHT)
            raw_cutout = rembg.remove(src_img, session=session)
        elif item['type'] == 'studio_car':
            raw_cutout = process_studio_car(src_img, flip=item['needs_flip'])
        elif item['type'] == 'bike_png':
            if item['needs_flip']:
                src_img = src_img.transpose(Image.FLIP_LEFT_RIGHT)
            raw_cutout = src_img.convert('RGBA')
            
        raw_cutout.save(cached_path)
    
    # 2. Tight crop based on content
    arr = np.array(raw_cutout)
    alpha = arr[:, :, 3]
    mask = alpha > 20
    if not np.any(mask):
        print(f"Error: No visible pixels for {k}")
        continue
        
    y_idx, x_idx = np.where(mask)
    x0, x1 = x_idx.min(), x_idx.max()
    y0, y1 = y_idx.min(), y_idx.max()
    cropped = raw_cutout.crop((x0, y0, x1 + 1, y1 + 1))
    cw, ch = cropped.size
    
    # 3. Canvas setup (1056 x 594)
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
    
    # 4. SHADOW LOGIC:
    # ONLY add shadow to the 8 vehicles specified by the user!
    if k in SHADOW_VEHICLES:
        add_clean_tire_shadow(canvas, pos_x, pos_y, new_w, new_h)
        status_tag = "[SHADOW ADDED (User List)]"
    else:
        status_tag = "[NO SHADOW ADDED - NATIVE ONLY]"
        
    # Composite vehicle
    canvas.alpha_composite(resized, (pos_x, pos_y))
    
    # Save final WebP
    dest_path = os.path.join(vdir, f"{k}.webp")
    canvas.save(dest_path, 'WEBP', quality=95)
    
    elapsed = time.time() - t_start
    print(f"  {status_tag:32} {k:15} -> {dest_path} ({elapsed:.1f}s)")

print("\nAll 26 vehicles processed successfully!")
