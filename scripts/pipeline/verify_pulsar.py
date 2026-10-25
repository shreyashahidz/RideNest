import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()
req = urllib.request.Request('https://www.bikewale.com/bajaj-bikes/new-pulsar-ns200/images/', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, context=ctx) as r:
    html = r.read().decode('utf-8', errors='ignore')
    m = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+side[^"\'\s<>]*', html)
    print("New Pulsar NS200 side images:", len(m))
    for x in set(m[:6]):
        print("  ", x)
