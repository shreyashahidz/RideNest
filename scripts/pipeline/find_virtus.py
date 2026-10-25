import urllib.request, ssl, re

ctx = ssl._create_unverified_context()
req = urllib.request.Request('https://www.carwale.com/volkswagen-cars/virtus/images/', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        m = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+(?:side-view|profile)[^"\'\s<>]*', html)
        if not m:
            m = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+side[^"\'\s<>]*', html)
        print("Found Virtus images:", len(m))
        for x in set(m[:6]):
            print("  ", x)
except Exception as e:
    print("Error:", e)
