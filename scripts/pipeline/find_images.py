import urllib.request
import urllib.parse
import ssl
import re
import json

ctx = ssl._create_unverified_context()

cars = [
    ("Maruti Suzuki", "Swift", "car"),
    ("Hyundai", "Creta", "car"),
    ("Tata", "Nexon EV", "car"),
    ("Toyota", "Innova Crysta", "car"),
    ("Honda", "City", "car"),
    ("Mahindra", "Thar", "car"),
    ("Kia", "Seltos", "car"),
    ("Toyota", "Fortuner", "car"),
    ("Maruti Suzuki", "Baleno", "car"),
    ("Mahindra", "XUV700", "car"),
    ("Tesla", "Model 3", "car"),
    ("Mahindra", "Scorpio", "car"),
    ("Maruti Suzuki", "Ertiga", "car"),
    ("Hyundai", "i20", "car"),
]

bikes = [
    ("Royal Enfield", "Classic 350", "bike"),
    ("Honda", "Activa", "bike"),
    ("KTM", "Duke 390", "bike"),
    ("Ola", "S1 Pro", "bike"),
    ("Bajaj", "Pulsar NS200", "bike"),
    ("Royal Enfield", "Himalayan", "bike"),
    ("Yamaha", "YZF-R15", "bike"),
    ("TVS", "Apache RTR 200 4V", "bike"),
    ("Hero", "Splendor+", "bike"),
    ("Royal Enfield", "Bullet 350", "bike"),
    ("Bajaj", "Dominar 400", "bike"),
    ("Suzuki", "Access 125", "bike"),
]

def search_carwale(make, model, vtype):
    query = f"site:carwale.com {make} {model} left-side-view" if vtype == 'car' else f"site:bikewale.com {make} {model} left-side-view OR right-side-view"
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            links = re.findall(r'href="([^"]*carwale\.com/[^"]*left-side-view[^"]*)"', html)
            if not links:
                links = re.findall(r'href="([^"]*(?:carwale|bikewale)\.com/[^"]*(?:side-view|images)[^"]*)"', html)
            print(f"{make} {model}: found {len(links)} links")
            if links:
                print("   Sample:", links[0][:90])
    except Exception as e:
        print(f"Error {make} {model}:", e)

for make, model, vtype in cars[:4]:
    search_carwale(make, model, vtype)
