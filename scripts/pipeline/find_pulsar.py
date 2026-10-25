import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()
req = urllib.request.Request('https://www.bikewale.com/bajaj-bikes/', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, context=ctx) as r:
    html = r.read().decode('utf-8', errors='ignore')
    links = re.findall(r'href="(/bajaj-bikes/[^"]*ns200[^"]*)"', html, re.I)
    print("Pulsar links on Bajaj page:", set(links))
    imgs = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+pulsar[^"\'\s<>]*', html, re.I)
    print("Pulsar imgs:", len(imgs))
    for img in set(imgs[:10]):
        print("  ", img)
