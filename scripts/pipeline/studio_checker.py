import urllib.request
import ssl
import re
from PIL import Image
import io
import numpy as np

ctx = ssl._create_unverified_context()

def check_is_studio(img_data):
    try:
        im = Image.open(io.BytesIO(img_data)).convert('RGB')
        arr = np.array(im)
        # Check top corners: if top-left and top-right are white (> 240)
        h, w, _ = arr.shape
        tl = arr[0:30, 0:30].mean()
        tr = arr[0:30, -30:].mean()
        bl = arr[-30:, 0:30].mean()
        br = arr[-30:, -30:].mean()
        # White studio background has tl > 240 and tr > 240
        is_studio = (tl > 235 and tr > 235 and (bl > 220 or br > 220))
        return is_studio, (tl, tr, bl, br)
    except Exception as e:
        return False, str(e)

print("Studio checker ready")
