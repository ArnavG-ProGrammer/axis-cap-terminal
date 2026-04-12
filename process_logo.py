import sys
import subprocess

try:
    from PIL import Image
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def process_logo(img_path, out_path):
    print("Opening image...")
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    new_data = []

    print("Processing pixels...")
    for r, g, b, a in data:
        # Isolate Gold (Yellowish = High R, High G, Low B)
        # We check if Red and Green are higher than Blue, identifying the gold pixels
        if r > b + 10 and g > b + 10 and (r + g) > 80:
            # It's the gold text or logo! Keep it intact with a bit of a contrast boost.
            new_data.append((min(r+20, 255), min(g+20, 255), b, 255))
        else:
            # It's the blue space background or dark shadows
            new_data.append((0, 0, 0, 0))

    img.putdata(new_data)
    
    print("Cropping bounding box...")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    print(f"Saving to {out_path}...")
    img.save(out_path, "PNG")
    print("Success")

if __name__ == "__main__":
    process_logo("public/logo.png", "public/logo_transparent.png")
