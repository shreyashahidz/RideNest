import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()

for name, url in [
    ("Ola S1", "https://www.bikewale.com/ola-bikes/s1-pro/images/"),
    ("Pulsar", "https://www.bikewale.com/bajaj-bikes/pulsar-ns200/"),
]:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, context=ctx) as r:
            html = r.read().decode('utf-8', errors='ignore')
            m = re.findall(r'https://imgd\.aeplcdn\.com/[^"\'\s<>]+side[^"\'\s<>]*', html)
            print(f"{name} found {len(m)} side images:")
            for x in set(m[:6]):
                print("  ", x)
    except Exception as e:
        print(f"{name} error: {e}")
