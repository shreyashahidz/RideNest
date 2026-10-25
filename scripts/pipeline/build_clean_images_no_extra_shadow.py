import urllib.request
import ssl
import os
import rembg
from PIL import Image
import io
import numpy as np

ctx = ssl._create_unverified_context()
vdir = os.path.join(os.path.dirname(__file__), '..', 'public', 'img', 'vehicles')
os.makedirs(vdir, exist_ok=True)

session = rembg.new_session('u2net')

VEHICLE_IMAGES = [
    {
        "key": "swift",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/159099/swift-exterior-left-side-view-11.jpeg?isig=0&q=85",
        "needs_flip": False,
        "is_outdoor": False
    },
    {
        "key": "creta",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/106815/creta-exterior-right-side-view-2.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": True
    },
    {
        "key": "nexon-ev",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/149123/nexon-ev-exterior-left-side-view.jpeg?isig=0&q=85",
        "needs_flip": False,
        "is_outdoor": True
    },
    {
        "key": "innova-crysta",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/222736/innova-crysta-2026-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "city",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/219846/city-facelift-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": True
    },
    {
        "key": "thar",
        "url": "https://stimg.cardekho.com/images/carexteriorimages/930x620/Mahindra/Thar/13948/1790588115946/side-view-(left)-90.jpg",
        "needs_flip": False,
        "is_outdoor": True
    },
    {
        "key": "seltos",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/192817/seltos-exterior-right-side-view-50.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "fortuner",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/44709/fortuner-exterior-right-side-view-3.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "baleno",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/221126/baleno-2026-exterior-right-side-view-8.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": True
    },
    {
        "key": "xuv700",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/205104/xuv-7xo-exterior-right-side-view-557.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "tesla-model-3",
        "url": "https://stimg.cardekho.com/images/carexteriorimages/930x620/Tesla/Model-3/5251/1693556345148/side-view-(left)-90.jpg",
        "needs_flip": False,
        "is_outdoor": True
    },
    {
        "key": "scorpio",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/128413/scorpio-classic-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": True
    },
    {
        "key": "ertiga",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/115777/ertiga-exterior-right-side-view-2.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": True
    },
    {
        "key": "i20",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/150603/i20-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    # Bikes - All official BikeWale PNGs with native studio shadows
    {
        "key": "classic-350",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/101487/classic-350-right-side-view-20.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "activa",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/44686/activa-6g-right-side-view-2.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "duke-390",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/220872/390-duke-right-side-view-3.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "s1-pro",
        "url": "https://imgd.aeplcdn.com/1280x720/n/cw/ec/196991/s1-pro-left-side-view-3.png?isig=0&q=100",
        "needs_flip": False,
        "is_outdoor": False
    },
    {
        "key": "pulsar-ns200",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/58025/pulsar-ns-right-side-view-12.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "himalayan",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/110431/himalayan-right-side-view-8.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "yzf-r15",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/209893/r15-right-side-view-3.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "apache-rtr-200",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/204536/apache-200-right-side-view-5.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "splendor-plus",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/212711/splendor-plus-right-side-view-3.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "bullet-350",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/127499/bullet-right-side-view-14.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "dominar-400",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/217059/dominar-400-right-side-view-11.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    },
    {
        "key": "access-125",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/188491/access-125-right-side-view-20.png?isig=0&q=85",
        "needs_flip": True,
        "is_outdoor": False
    }
]

def fetch_image(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        return Image.open(io.BytesIO(r.read()))

def process_item(item):
    k = item['key']
    print(f"Fetching clean {k} from {item['url'][:60]}...")
    img = fetch_image(item['url'])

    # 1. Flip if needed so it faces LEFT
    if item['needs_flip']:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)

    # 2. Remove background if outdoor
    if item['is_outdoor']:
        print(f"  Removing background from {k} with u2net...")
        img = rembg.remove(img, session=session)
    else:
        # If it's a studio photo with white background (JPEG)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            arr = np.array(img)
            r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
            # White background to transparent
            white_mask = (r > 248) & (g > 248) & (b > 248)
            arr[white_mask, 3] = 0
            img = Image.fromarray(arr, 'RGBA')

    # 3. Tight crop (includes the car and its native shadow)
    arr = np.array(img)
    alpha = arr[:, :, 3]
    mask = alpha > 15
    if not np.any(mask):
        print(f"  Error: no content in {k}")
        return

    y_indices, x_indices = np.where(mask)
    x0, x1 = x_indices.min(), x_indices.max()
    y0, y1 = y_indices.min(), y_indices.max()
    cropped = img.crop((x0, y0, x1 + 1, y1 + 1))
    cw, ch = cropped.size

    # 4. Standard canvas (NO EXTRA BASE SHADOW ADDED!)
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

    # Center horizontally and position cleanly
    pos_x = (canvas_w - new_w) // 2
    pos_y = canvas_h - new_h - 60

    # Composite ONLY the vehicle with its own shadow - NO ADDED BASE SHADOW!
    canvas.alpha_composite(resized, (pos_x, pos_y))

    # Save
    out_path = os.path.join(vdir, f"{k}.webp")
    canvas.save(out_path, 'WEBP', quality=95)
    print(f"  [SAVED] {k} -> {out_path} (NO EXTRA SHADOW)")

print("Rebuilding all 26 vehicle images with ONLY their original native shadow...")
for item in VEHICLE_IMAGES:
    try:
        process_item(item)
    except Exception as e:
        print(f"  Error processing {item['key']}: {e}")

print("\nDone! All 26 vehicles have exactly ONE single native shadow and NO extra base shadow.")
