from pathlib import Path
import math
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "app-icon.png"
OUTPUT = ROOT / "assets" / "app-icon-composed.png"
SAFE_SCALE = 0.78

def squircle_points(size: int, exponent: float = 5.0, oversample: int = 4) -> list[tuple[float, float]]:
    scaled = size * oversample
    half = scaled / 2
    points: list[tuple[float, float]] = []
    for step in range(720):
        theta = (math.tau * step) / 720
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        x = math.copysign(abs(cos_t) ** (2 / exponent), cos_t)
        y = math.copysign(abs(sin_t) ** (2 / exponent), sin_t)
        points.append((half + x * half, half + y * half))
    return points


def squircle_mask(size: int, exponent: float = 5.0) -> Image.Image:
    oversample = 4
    scaled = size * oversample
    mask = Image.new("L", (scaled, scaled), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(squircle_points(size, exponent, oversample), fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    if source.size != (1024, 1024):
        source = source.resize((1024, 1024), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    scaled_size = int(1024 * SAFE_SCALE)
    scaled = source.resize((scaled_size, scaled_size), Image.Resampling.LANCZOS)
    scaled.putalpha(squircle_mask(scaled_size, exponent=5.0))
    offset = ((1024 - scaled_size) // 2, 1024 - scaled_size)
    canvas.alpha_composite(scaled, offset)
    canvas.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
