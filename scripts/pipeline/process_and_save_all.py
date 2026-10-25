import urllib.request
import ssl
import re
import os
import json
from PIL import Image
import io

ctx = ssl._create_unverified_context()
out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'img', 'vehicles')
os.makedirs(out_dir, exist_ok=True)

# Master list of all 26 vehicles with verified URLs and required orientation (all must face LEFT)
VEHICLE_IMAGES = [
    {
        "key": "swift",
        "make": "Maruti Suzuki",
        "model": "Swift",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/159099/swift-exterior-left-side-view-11.jpeg?isig=0&q=85",
        "needs_flip": False
    },
    {
        "key": "creta",
        "make": "Hyundai",
        "model": "Creta",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/106815/creta-exterior-right-side-view-2.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "nexon-ev",
        "make": "Tata",
        "model": "Nexon EV",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/149123/nexon-ev-exterior-left-side-view.jpeg?isig=0&q=85",
        "needs_flip": False
    },
    {
        "key": "innova-crysta",
        "make": "Toyota",
        "model": "Innova Crysta",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/222736/innova-crysta-2026-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "city",
        "make": "Honda",
        "model": "City",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/219846/city-facelift-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "thar",
        "make": "Mahindra",
        "model": "Thar",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/219824/thar-facelift-exterior-right-side-view-5.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "seltos",
        "make": "Kia",
        "model": "Seltos",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/192817/seltos-exterior-right-side-view-50.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "fortuner",
        "make": "Toyota",
        "model": "Fortuner",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/44709/fortuner-exterior-right-side-view-3.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "baleno",
        "make": "Maruti Suzuki",
        "model": "Baleno",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/221126/baleno-2026-exterior-right-side-view-8.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "xuv700",
        "make": "Mahindra",
        "model": "XUV700",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/205104/xuv-7xo-exterior-right-side-view-557.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "tesla-model-3",
        "make": "Tesla",
        "model": "Model 3",
        "url": "https://stimg.cardekho.com/images/carexteriorimages/930x620/Tesla/Model-3/5251/1693556345148/side-view-(left)-90.jpg",
        "needs_flip": False
    },
    {
        "key": "scorpio",
        "make": "Mahindra",
        "model": "Scorpio",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/128413/scorpio-classic-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "ertiga",
        "make": "Maruti Suzuki",
        "model": "Ertiga",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/115777/ertiga-exterior-right-side-view-2.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "i20",
        "make": "Hyundai",
        "model": "i20",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/150603/i20-exterior-right-side-view.jpeg?isig=0&q=85",
        "needs_flip": True
    },
    # Bikes
    {
        "key": "classic-350",
        "make": "Royal Enfield",
        "model": "Classic 350",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/101487/classic-350-right-side-view-20.png?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "activa",
        "make": "Honda",
        "model": "Activa",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/44686/activa-6g-right-side-view-2.png?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "duke-390",
        "make": "KTM",
        "model": "Duke 390",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/220872/390-duke-right-side-view-3.png?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "s1-pro",
        "make": "Ola",
        "model": "S1 Pro",
        "url": "https://imgd.aeplcdn.com/1280x720/n/cw/ec/196991/s1-pro-left-side-view-3.png?isig=0&q=100",
        "needs_flip": False
    },
    {
        "key": "pulsar-ns200",
        "make": "Bajaj",
        "model": "Pulsar NS200",
        "url": "https://imgd.aeplcdn.com/1280x720/n/cw/ec/227542/new-pulsar-ns200-right-side-view.jpeg?isig=0&q=100",
        "needs_flip": True
    },
    {
        "key": "himalayan",
        "make": "Royal Enfield",
        "model": "Himalayan",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/110431/himalayan-right-side-view-8.png?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "yzf-r15",
        "make": "Yamaha",
        "model": "YZF-R15",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/209893/r15-right-side-view-3.png?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "apache-rtr-200",
        "make": "TVS",
        "model": "Apache RTR 200 4V",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/204536/apache-200-right-side-view-5.png?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "splendor-plus",
        "make": "Hero",
        "model": "Splendor+",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/212711/splendor-plus-right-side-view-3.png?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "bullet-350",
        "make": "Royal Enfield",
        "model": "Bullet 350",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/127499/bullet-right-side-view-14.png?isig=0&q=85",
        "needs_flip": True
    },
    {
        "key": "dominar-400",
        "make": "Bajaj",
        "model": "Dominar 400",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/217059/dominar-400-right-side-view-12.jpeg?isig=0&q=100",
        "needs_flip": True
    },
    {
        "key": "access-125",
        "make": "Suzuki",
        "model": "Access 125",
        "url": "https://imgd.aeplcdn.com/1056x594/n/cw/ec/188491/access-125-right-side-view-20.png?isig=0&q=85",
        "needs_flip": True
    }
]

saved = []
for item in VEHICLE_IMAGES:
    k = item['key']
    url = item['url']
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = resp.read()
            img = Image.open(io.BytesIO(data))
            
            # If it needs flipping so it faces LEFT:
            if item['needs_flip']:
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
            
            target_path = os.path.join(out_dir, f"{k}.webp")
            img.save(target_path, 'WEBP', quality=90)
            
            local_url = f"/img/vehicles/{k}.webp"
            saved.append({
                "key": k,
                "make": item['make'],
                "model": item['model'],
                "localPath": target_path,
                "imageUrl": local_url,
                "size": img.size
            })
            print(f"[SAVED] {k} ({item['make']} {item['model']}): size={img.size}, flip={item['needs_flip']} -> {local_url}")
    except Exception as e:
        print(f"[FAIL] {k}: {e}")

print(f"\nSuccessfully downloaded and saved {len(saved)} / {len(VEHICLE_IMAGES)} vehicle images!")
with open(os.path.join(out_dir, 'vehicles_map.json'), 'w') as f:
    json.dump(saved, f, indent=2)
