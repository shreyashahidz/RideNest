import os
import rembg
from PIL import Image

session = rembg.new_session('u2net')
inp = Image.open('public/img/vehicles/creta.webp')
out = rembg.remove(inp, session=session)
out.save('public/img/vehicles/creta_u2net.webp')
print("Creta removed with u2net successfully!")
