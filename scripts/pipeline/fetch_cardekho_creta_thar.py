import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()

for name, url in [
    ("creta", "https://www.cardekho.com/hyundai/creta/pictures"),
    ("thar", "https://www.cardekho.com/mahindra/thar/pictures"),
]:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
            html = r.read().decode('utf-8', errors='ignore')
            m = re.findall(r'https://stimg\.cardekho\.com/images/carexteriorimages/[^"\'\s<>]+(?:side-view|profile)[^"\'\s<>]*', html)
            if not m:
                m = re.findall(r'https://stimg\.cardekho\.com/images/carexteriorimages/[^"\'\s<>]+side[^"\'\s<>]*', html)
            print(f"{name} found {len(m)} images:")
            for x in set(m[:6]):
                print("  ", x)
    except Exception as e:
        print(f"Error {name}:", e)
