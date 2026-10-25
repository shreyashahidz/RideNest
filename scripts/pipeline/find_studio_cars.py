import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()

cars = [
    ("creta", "https://www.carwale.com/hyundai-cars/creta/images/"),
    ("thar", "https://www.carwale.com/mahindra-cars/thar/images/"),
    ("innova-crysta", "https://www.carwale.com/toyota-cars/innova-crysta/images/"),
    ("city", "https://www.carwale.com/honda-cars/city/images/"),
    ("seltos", "https://www.carwale.com/kia-cars/seltos/images/"),
    ("fortuner", "https://www.carwale.com/toyota-cars/fortuner/images/"),
    ("baleno", "https://www.carwale.com/maruti-suzuki-cars/baleno/images/"),
    ("xuv700", "https://www.carwale.com/mahindra-cars/xuv700/images/"),
    ("scorpio", "https://www.carwale.com/mahindra-cars/scorpio/images/"),
    ("ertiga", "https://www.carwale.com/maruti-suzuki-cars/ertiga/images/"),
    ("i20", "https://www.carwale.com/hyundai-cars/i20/images/")
]

for name, url in cars:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
            html = r.read().decode('utf-8', errors='ignore')
            # Look for png files or 360 or studio images
            pngs = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+(?:side-view|\.png)[^"\'\s<>]*', html)
            print(f"{name}: found {len(pngs)} png/side-view links")
            for p in pngs[:3]:
                print(f"   {p[:90]}")
    except Exception as e:
        print(f"Error {name}:", e)
