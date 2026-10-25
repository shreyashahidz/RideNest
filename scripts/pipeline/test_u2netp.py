import ssl
# Disable SSL verify for pooch download if certs expired in 2026
ssl._create_default_https_context = ssl._create_unverified_context

import os
import rembg
print("Creating session...")
session = rembg.new_session('u2netp') # lightweight model (only 4MB instead of 170MB!)
print("Session created!")
from PIL import Image
inp = Image.open('public/img/vehicles/creta.webp')
out = rembg.remove(inp, session=session)
out.save('public/img/vehicles/creta_nobg.webp')
print("Creta nobg saved!")
