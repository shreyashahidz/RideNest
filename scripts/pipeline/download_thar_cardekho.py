import urllib.request
import ssl
from PIL import Image
import io

ctx = ssl._create_unverified_context()
url = "https://stimg.cardekho.com/images/carexteriorimages/930x620/Mahindra/Thar/13948/1790588115946/side-view-(left)-90.jpg"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as r:
    img = Image.open(io.BytesIO(r.read()))
    img.save('public/img/vehicles/thar.webp', 'WEBP', quality=90)
    print("Saved Thar from CarDekho! Size:", img.size)
