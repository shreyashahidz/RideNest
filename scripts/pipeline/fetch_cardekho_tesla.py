import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()
req = urllib.request.Request(
    'https://www.cardekho.com/tesla/model-3/pictures',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)
try:
    with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        imgs = re.findall(r'https://stimg\.cardekho\.com/images/carexteriorimages/[^"\'\s<>]+', html)
        print("Found CarDekho Tesla images:", len(imgs))
        for img in set(imgs):
            print("  ", img)
except Exception as e:
    print("Error:", e)
