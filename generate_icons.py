from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('icons', exist_ok=True)

for size in [192, 512]:
    img = Image.new('RGBA', (size, size), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)
    
    # Background circle
    margin = size * 0.08
    draw.ellipse([margin, margin, size-margin, size-margin], fill=(30, 41, 59, 255))
    
    # Emoji-style bowl icon using text
    font_size = int(size * 0.52)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    emoji = "🍜"
    try:
        bbox = draw.textbbox((0, 0), emoji, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (size - w) / 2 - bbox[0]
        y = (size - h) / 2 - bbox[1]
        draw.text((x, y), emoji, font=font, embedded_color=True)
    except:
        # Fallback: draw simple bowl shape
        cx, cy = size//2, size//2
        r = int(size * 0.28)
        draw.ellipse([cx-r, cy-r//2, cx+r, cy+r], fill=(56, 189, 248, 255))
        draw.ellipse([cx-r+4, cy-r//2+4, cx+r-4, cy+r-4], fill=(30, 41, 59, 255))
    
    img.save(f'icons/icon-{size}.png')
    print(f'icon-{size}.png created')
