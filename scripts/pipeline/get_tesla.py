import urllib.request
import ssl
import json

ctx = ssl._create_unverified_context()

# Search Wikimedia API for Tesla Model 3 side
url = "https://commons.wikimedia.org/w/api.php?action=query&titles=File:Tesla_Model_3_Side.jpg|File:White_Tesla_Model_3_(side).jpg|File:Model_3_passenger_side.jpg&prop=imageinfo&iiprop=url|size&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, context=ctx) as r:
    data = json.loads(r.read().decode())
    pages = data.get('query', {}).get('pages', {})
    for pid, p in pages.items():
        print(p.get('title'), p.get('imageinfo', [{}])[0].get('url'))
