from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "tray-icon-template-preview.png"


def cutout_line(draw: ImageDraw.ImageDraw, points, width: int):
    draw.line(points, fill=0, width=width, joint="curve")


def main():
    size = 1024
    img = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(img)

    # Main face silhouette
    draw.ellipse((90, 70, 934, 914), fill=255)

    # Left eye cutout ring
    draw.ellipse((205, 175, 505, 475), fill=0)
    draw.ellipse((278, 248, 432, 402), fill=255)
    draw.ellipse((322, 292, 388, 358), fill=0)

    # Right wink
    cutout_line(draw, [(560, 355), (675, 300), (815, 335)], width=56)

    # Mouth cutout
    draw.pieslice((165, 420, 865, 825), start=186, end=360, fill=0)
    draw.rounded_rectangle((220, 515, 820, 705), radius=110, fill=0)

    # Tongue / lower mouth separator to preserve expression essence
    tongue = Image.new("L", (size, size), 0)
    tongue_draw = ImageDraw.Draw(tongue)
    tongue_draw.pieslice((345, 640, 700, 860), start=180, end=360, fill=255)
    tongue_draw.pieslice((475, 630, 760, 850), start=180, end=360, fill=255)
    tongue = tongue.filter(ImageFilter.GaussianBlur(4))
    img = Image.composite(Image.new("L", (size, size), 255), img, tongue)

    # Smooth edges slightly for icon export
    alpha = img.filter(ImageFilter.GaussianBlur(1.2))
    rgba = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    black = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    rgba = Image.composite(black, rgba, alpha)
    rgba.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
