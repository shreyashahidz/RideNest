import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()
req = urllib.request.Request('https://www.cardekho.com/hyundai/creta/pictures', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as r:
    html = r.read().decode('utf-8', errors='ignore')
    m = re.findall(r'https://stimg\.cardekho\.com/images/carexteriorimages/[^"\'\s<>]+side-view[^"\'\s<>]*', html)
    print("Creta side-view:", set(m))
