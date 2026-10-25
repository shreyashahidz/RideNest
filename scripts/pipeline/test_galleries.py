import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()

urls = [
    ("Creta", "https://www.carwale.com/hyundai-cars/creta/images/"),
    ("Nexon", "https://www.carwale.com/tata-cars/nexon-ev/images/"),
    ("Innova Crysta", "https://www.carwale.com/toyota-cars/innova-crysta/images/"),
    ("City", "https://www.carwale.com/honda-cars/city/images/"),
    ("Thar", "https://www.carwale.com/mahindra-cars/thar/images/"),
    ("Seltos", "https://www.carwale.com/kia-cars/seltos/images/"),
    ("Fortuner", "https://www.carwale.com/toyota-cars/fortuner/images/"),
    ("Baleno", "https://www.carwale.com/maruti-suzuki-cars/baleno/images/"),
    ("XUV700", "https://www.carwale.com/mahindra-cars/xuv700/images/"),
    ("Scorpio", "https://www.carwale.com/mahindra-cars/scorpio/images/"),
    ("Ertiga", "https://www.carwale.com/maruti-suzuki-cars/ertiga/images/"),
    ("i20", "https://www.carwale.com/hyundai-cars/i20/images/"),
    ("Classic 350", "https://www.bikewale.com/royalenfield-bikes/classic-350/images/"),
    ("Activa", "https://www.bikewale.com/honda-bikes/activa-6g/images/"),
    ("Duke 390", "https://www.bikewale.com/ktm-bikes/390-duke/images/"),
    ("S1 Pro", "https://www.bikewale.com/ola-electric-bikes/s1-pro/images/"),
    ("Pulsar NS200", "https://www.bikewale.com/bajaj-bikes/pulsar-ns200/images/"),
    ("Himalayan", "https://www.bikewale.com/royalenfield-bikes/himalayan/images/"),
    ("R15", "https://www.bikewale.com/yamaha-bikes/yzf-r15/images/"),
    ("Apache", "https://www.bikewale.com/tvs-bikes/apache-rtr-200-4v/images/"),
    ("Splendor", "https://www.bikewale.com/hero-bikes/splendor-plus/images/"),
    ("Bullet 350", "https://www.bikewale.com/royalenfield-bikes/bullet-350/images/"),
    ("Dominar 400", "https://www.bikewale.com/bajaj-bikes/dominar-400/images/"),
    ("Access 125", "https://www.bikewale.com/suzuki-bikes/access-125/images/")
]

for name, url in urls:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
            html = r.read().decode('utf-8', errors='ignore')
            # Look for left-side-view or right-side-view or side-view image links
            side_imgs = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+(?:left-side-view|right-side-view|side-view)[^"\'\s<>]*', html)
            if side_imgs:
                print(f"[SUCCESS] {name}: found {len(side_imgs)} side images. First: {side_imgs[0][:100]}")
            else:
                # look for any exterior images
                any_ext = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+exterior[^"\'\s<>]*', html)
                print(f"[PARTIAL] {name}: no direct side, but found {len(any_ext)} exterior imgs")
    except Exception as e:
        print(f"[FAIL] {name} ({url}): {e}")
