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

# List of vehicles with gallery pages
VEHICLES = [
    {
        "key": "swift",
        "make": "Maruti Suzuki",
        "model": "Swift",
        "type": "car",
        "gallery": "https://www.carwale.com/maruti-suzuki-cars/swift/images/"
    },
    {
        "key": "creta",
        "make": "Hyundai",
        "model": "Creta",
        "type": "car",
        "gallery": "https://www.carwale.com/hyundai-cars/creta/images/"
    },
    {
        "key": "nexon-ev",
        "make": "Tata",
        "model": "Nexon EV",
        "type": "car",
        "gallery": "https://www.carwale.com/tata-cars/nexon-ev/images/"
    },
    {
        "key": "innova-crysta",
        "make": "Toyota",
        "model": "Innova Crysta",
        "type": "car",
        "gallery": "https://www.carwale.com/toyota-cars/innova-crysta/images/"
    },
    {
        "key": "city",
        "make": "Honda",
        "model": "City",
        "type": "car",
        "gallery": "https://www.carwale.com/honda-cars/city/images/"
    },
    {
        "key": "thar",
        "make": "Mahindra",
        "model": "Thar",
        "type": "car",
        "gallery": "https://www.carwale.com/mahindra-cars/thar/images/"
    },
    {
        "key": "seltos",
        "make": "Kia",
        "model": "Seltos",
        "type": "car",
        "gallery": "https://www.carwale.com/kia-cars/seltos/images/"
    },
    {
        "key": "fortuner",
        "make": "Toyota",
        "model": "Fortuner",
        "type": "car",
        "gallery": "https://www.carwale.com/toyota-cars/fortuner/images/"
    },
    {
        "key": "baleno",
        "make": "Maruti Suzuki",
        "model": "Baleno",
        "type": "car",
        "gallery": "https://www.carwale.com/maruti-suzuki-cars/baleno/images/"
    },
    {
        "key": "xuv700",
        "make": "Mahindra",
        "model": "XUV700",
        "type": "car",
        "gallery": "https://www.carwale.com/mahindra-cars/xuv700/images/"
    },
    {
        "key": "tesla-model-3",
        "make": "Tesla",
        "model": "Model 3",
        "type": "car",
        "gallery": "https://www.carwale.com/tesla-cars/model-3/images/"
    },
    {
        "key": "scorpio",
        "make": "Mahindra",
        "model": "Scorpio",
        "type": "car",
        "gallery": "https://www.carwale.com/mahindra-cars/scorpio/images/"
    },
    {
        "key": "ertiga",
        "make": "Maruti Suzuki",
        "model": "Ertiga",
        "type": "car",
        "gallery": "https://www.carwale.com/maruti-suzuki-cars/ertiga/images/"
    },
    {
        "key": "i20",
        "make": "Hyundai",
        "model": "i20",
        "type": "car",
        "gallery": "https://www.carwale.com/hyundai-cars/i20/images/"
    },
    # Bikes
    {
        "key": "classic-350",
        "make": "Royal Enfield",
        "model": "Classic 350",
        "type": "bike",
        "gallery": "https://www.bikewale.com/royalenfield-bikes/classic-350/images/"
    },
    {
        "key": "activa",
        "make": "Honda",
        "model": "Activa",
        "type": "bike",
        "gallery": "https://www.bikewale.com/honda-bikes/activa-6g/images/"
    },
    {
        "key": "duke-390",
        "make": "KTM",
        "model": "Duke 390",
        "type": "bike",
        "gallery": "https://www.bikewale.com/ktm-bikes/390-duke/images/"
    },
    {
        "key": "s1-pro",
        "make": "Ola",
        "model": "S1 Pro",
        "type": "bike",
        "gallery": "https://www.bikewale.com/ola-scooters/s1-pro/images/"
    },
    {
        "key": "pulsar-ns200",
        "make": "Bajaj",
        "model": "Pulsar NS200",
        "type": "bike",
        "gallery": "https://www.bikewale.com/bajaj-bikes/pulsar-ns200/images/"
    },
    {
        "key": "himalayan",
        "make": "Royal Enfield",
        "model": "Himalayan",
        "type": "bike",
        "gallery": "https://www.bikewale.com/royalenfield-bikes/himalayan/images/"
    },
    {
        "key": "yzf-r15",
        "make": "Yamaha",
        "model": "YZF-R15",
        "type": "bike",
        "gallery": "https://www.bikewale.com/yamaha-bikes/yzf-r15/images/"
    },
    {
        "key": "apache-rtr-200",
        "make": "TVS",
        "model": "Apache RTR 200 4V",
        "type": "bike",
        "gallery": "https://www.bikewale.com/tvs-bikes/apache-rtr-200-4v/images/"
    },
    {
        "key": "splendor-plus",
        "make": "Hero",
        "model": "Splendor+",
        "type": "bike",
        "gallery": "https://www.bikewale.com/hero-bikes/splendor-plus/images/"
    },
    {
        "key": "bullet-350",
        "make": "Royal Enfield",
        "model": "Bullet 350",
        "type": "bike",
        "gallery": "https://www.bikewale.com/royalenfield-bikes/bullet-350/images/"
    },
    {
        "key": "dominar-400",
        "make": "Bajaj",
        "model": "Dominar 400",
        "type": "bike",
        "gallery": "https://www.bikewale.com/bajaj-bikes/dominar-400/images/"
    },
    {
        "key": "access-125",
        "make": "Suzuki",
        "model": "Access 125",
        "type": "bike",
        "gallery": "https://www.bikewale.com/suzuki-bikes/access-125/images/"
    }
]

def fetch_html(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, context=ctx, timeout=12) as r:
        return r.read().decode('utf-8', errors='ignore')

def get_best_side_image(v):
    html = fetch_html(v['gallery'])
    
    # Priority 1: left-side-view (faces LEFT naturally)
    left_matches = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+left-side-view[^"\'\s<>]*', html)
    if left_matches:
        raw_url = left_matches[0].replace('&amp;', '&').split('\\u0026')[0]
        # upscale
        hd_url = re.sub(r'https://imgd\.aeplcdn\.com/\d+x\d+/', 'https://imgd.aeplcdn.com/1056x594/', raw_url)
        return hd_url, 'left'
    
    # Priority 2: right-side-view (faces RIGHT, needs flip to face LEFT)
    right_matches = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+right-side-view[^"\'\s<>]*', html)
    if right_matches:
        raw_url = right_matches[0].replace('&amp;', '&').split('\\u0026')[0]
        hd_url = re.sub(r'https://imgd\.aeplcdn\.com/\d+x\d+/', 'https://imgd.aeplcdn.com/1056x594/', raw_url)
        return hd_url, 'right'
        
    # Priority 3: any side view
    side_matches = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+side[^"\'\s<>]*', html)
    if side_matches:
        raw_url = side_matches[0].replace('&amp;', '&').split('\\u0026')[0]
        hd_url = re.sub(r'https://imgd\.aeplcdn\.com/\d+x\d+/', 'https://imgd.aeplcdn.com/1056x594/', raw_url)
        return hd_url, 'unknown'
        
    return None, None

results = []

for v in VEHICLES:
    try:
        url, orientation = get_best_side_image(v)
        if not url:
            print(f"[MISSING] {v['key']}: No side image found in gallery")
            continue
        print(f"[FOUND] {v['key']}: {orientation} -> {url[:80]}")
        results.append({
            "key": v['key'],
            "make": v['make'],
            "model": v['model'],
            "type": v['type'],
            "url": url,
            "orientation": orientation
        })
    except Exception as e:
        print(f"[ERROR] {v['key']}: {e}")

with open(os.path.join(out_dir, 'image_manifest.json'), 'w') as f:
    json.dump(results, f, indent=2)

print(f"\nDone! Found {len(results)} of {len(VEHICLES)} vehicle images.")
