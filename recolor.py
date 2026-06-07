import sys
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

import colorsys

def recolor(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    for r, g, b, a in data:
        if a == 0:
            new_data.append((r, g, b, a))
            continue
        
        # Convert RGB to HSV
        h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        
        # Shift hue (orange is ~0.07, blue is ~0.60)
        # Shift by +0.53
        h = (h + 0.53) % 1.0
        
        # Convert back to RGB
        r_new, g_new, b_new = colorsys.hsv_to_rgb(h, s, v)
        new_data.append((int(r_new * 255), int(g_new * 255), int(b_new * 255), a))

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    recolor(sys.argv[1], sys.argv[2])
