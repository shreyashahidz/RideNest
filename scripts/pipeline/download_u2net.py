import urllib.request
import ssl
import os

ctx = ssl._create_unverified_context()
dest_dir = os.path.expanduser(r'~\.rembg\models\u2net')
os.makedirs(dest_dir, exist_ok=True)
dest_file = os.path.join(dest_dir, 'u2net.onnx')

if os.path.exists(dest_file) and os.path.getsize(dest_file) > 100_000_000:
    print("u2net.onnx already exists! Size:", os.path.getsize(dest_file))
else:
    url = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx"
    print("Downloading u2net.onnx (~176MB)...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as r:
        with open(dest_file, 'wb') as f:
            total = 0
            while True:
                chunk = r.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
                total += len(chunk)
                print(f"Downloaded {total / (1024*1024):.1f} MB", end='\r')
    print(f"\nDone! File size: {os.path.getsize(dest_file)} bytes")
