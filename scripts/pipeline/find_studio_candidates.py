import urllib.request
import ssl
import re
from PIL import Image
import io
import numpy as np

ctx = ssl._create_unverified_context()

def check_studio(data):
    im = Image.open(io.BytesIO(data))
    if im.mode == 'RGBA':
        arr = np.array(im)
        if np.any(arr[:, :, 3] < 200):
            return True, 'transparent_png', im
    arr = np.array(im.convert('RGB'))
    tl = arr[0:20, 0:20].mean()
    tr = arr[0:20, -20:].mean()
    if tl > 240 and tr > 240:
        return True, f'white_studio(tl={tl:.0f}, tr={tr:.0f})', im
    return False, f'outdoor(tl={tl:.0f}, tr={tr:.0f})', im

targets = [
    ("creta", "https://www.carwale.com/hyundai-cars/creta/images/"),
    ("nexon-ev", "https://www.carwale.com/tata-cars/nexon-ev/images/"),
    ("city", "https://www.carwale.com/honda-cars/city/images/"),
    ("baleno", "https://www.carwale.com/maruti-suzuki-cars/baleno/images/"),
    ("ertiga", "https://www.carwale.com/maruti-suzuki-cars/ertiga/images/"),
    ("scorpio", "https://www.carwale.com/mahindra-cars/scorpio/images/"),
    ("dominar-400", "https://www.bikewale.com/bajaj-bikes/dominar-400/images/"),
]

for name, gallery in targets:
    req = urllib.request.Request(gallery, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            html = r.read().decode('utf-8', errors='ignore')
            urls = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+(?:side-view|\.png)[^"\'\s<>]*', html)
            print(f"Checking {name}: found {len(urls)} side/png candidates...")
            found = False
            for u in set(urls):
                u_clean = u.replace('&amp;', '&').split('\\u0026')[0]
                u_hd = re.sub(r'https://imgd\.aeplcdn\.com/\d+x\d+/', 'https://imgd.aeplcdn.com/1056x594/', u_clean)
                try:
                    img_req = urllib.request.Request(u_hd, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(img_req, context=ctx, timeout=8) as ir:
                        data = ir.read()
                        ok, info, im = check_studio(data)
                        if ok:
                            print(f"   [MATCH FOUND!] {name}: {info} -> {u_hd}")
                            found = True
                            break
                except Exception:
                    continue
            if not found:
                print(f"   [NO STUDIO CANDIDATE on CarWale] {name}")
    except Exception as e:
        print(f"Error {name}: {e}")
