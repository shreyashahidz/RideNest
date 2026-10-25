import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()
req = urllib.request.Request(
    'https://www.carwale.com/maruti-suzuki-cars/swift/images/left-side-view-73592/',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)
try:
    with urllib.request.urlopen(req, context=ctx) as r:
        html = r.read().decode('utf-8', errors='ignore')
        imgs = re.findall(r'https://imgd\.aeplcdn\.com/[^\s"\'<>]+', html)
        for img in list(set(imgs))[:15]:
            print(img)
except Exception as e:
    print('Error:', e)
