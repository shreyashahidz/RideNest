import rembg
from PIL import Image

session = rembg.new_session('u2net')
inp = Image.open('public/img/vehicles/thar.webp')
out = rembg.remove(inp, session=session)
out.save('test_thar_nobg.png')
print("Thar background removed successfully! Size:", out.size)
