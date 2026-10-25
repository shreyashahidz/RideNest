import rembg
from PIL import Image

input_path = 'public/img/vehicles/creta.webp'
output_path = 'public/img/vehicles/creta_nobg.webp'

inp = Image.open(input_path)
out = rembg.remove(inp)
out.save(output_path, 'WEBP')
print("Creta background removed successfully! Output size:", out.size, "Mode:", out.mode)
