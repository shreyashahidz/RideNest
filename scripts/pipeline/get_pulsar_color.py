import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()
url = "https://www.bikewale.com/bajaj-bikes/pulsar-ns200/images/right-side-view-73892/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
        html = r.read().decode('utf-8', errors='ignore')
        imgs = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+', html)
        side_imgs = [x for x in imgs if 'side-view' in x]
        print("Found side images on BikeWale for Pulsar NS200:", len(side_imgs))
        for img in set(side_imgs[:8]):
            print("  ", img)
except Exception as e:
    print("Error:", e)
