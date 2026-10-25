import os
from PIL import Image

vdir = 'public/img/vehicles'
files = [f for f in sorted(os.listdir(vdir)) if f.endswith('.webp')]
print(f"Total webp images: {len(files)}")
for f in files:
    p = os.path.join(vdir, f)
    img = Image.open(p)
    print(f"  {f:25} size={img.size} mode={img.mode} bytes={os.path.getsize(p)}")
