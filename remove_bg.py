from PIL import Image

def remove_darkness(img_path, out_path):
    try:
        img = Image.open(img_path).convert("RGBA")
        data = img.getdata()
        new_data = []
        
        for r, g, b, a in data:
            # We want to keep the Gold (High R + G, Low B)
            # We want to remove Dark Blue (Low R, Low G, somewhat higher B but overall dark)
            
            # Simple luminance
            lum = 0.299*r + 0.587*g + 0.114*b
            
            if lum < 40:
                new_data.append((r,g,b,0))
            elif lum < 120:
                # Anti-aliasing fade
                alpha = int(((lum - 40) / 80) * 255)
                # Boost brightness of gold slightly during fade
                new_data.append((r, g, b, alpha))
            else:
                new_data.append((r, g, b, 255))
                
        img.putdata(new_data)
        img.save(out_path, "PNG")
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

remove_darkness("public/logo.png", "public/logo_transparent.png")
