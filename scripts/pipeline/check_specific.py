import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()

targets = [
    ('i20', 'https://www.carwale.com/hyundai-cars/i20/images/'),
    ('tesla', 'https://www.carwale.com/tesla-cars/model-3/images/'),
    ('s1-pro', 'https://www.bikewale.com/ola-scooters/s1-pro/images/'),
    ('pulsar-ns200', 'https://www.bikewale.com/bajaj-bikes/pulsar-ns200/images/')
]

for name, url in targets:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, context=ctx) as r:
            html = r.read().decode('utf-8', errors='ignore')
            m = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+', html)
            m = [x for x in m if any(k in x for k in ['side-view', 'profile', 'left', 'right', name])]
            print(f"{name} matches: {len(m)}")
            for x in m[:6]:
                print(f"   {x}")
    except Exception as e:
        print(f"{name} error: {e}")
