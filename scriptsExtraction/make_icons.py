# make_icons.py – draws the DealScore gauge icon at 16/32/48/128 px (pure Python, no Pillow).
# Run from the repo root: python scriptsExtraction/make_icons.py
import math
import struct
import zlib

A, B = (108, 140, 255), (155, 108, 255)


def pixel(x, y):
    """Colour of a point in the unit square (RGBA 0–255)."""
    # Rounded square
    r = 0.24
    cx = min(max(x, r), 1 - r)
    cy = min(max(y, r), 1 - r)
    if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
        return (0, 0, 0, 0)
    base = tuple(A[i] + (B[i] - A[i]) * y for i in range(3))
    dx, dy = x - 0.5, y - 0.5
    dist = math.hypot(dx, dy)
    ang = (math.degrees(math.atan2(dy, dx)) + 360) % 360  # 0 = right, clockwise
    white = 0.0
    if 0.245 <= dist <= 0.345:
        rel = (ang - 135) % 360  # gauge spans 270° from bottom-left
        if rel <= 270:
            white = 1.0 if rel <= 195 else 0.35
    if dist <= 0.075:
        white = 1.0
    return tuple(int(base[i] * (1 - white) + 255 * white) for i in range(3)) + (255,)


def render(size, ss=4):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    c = pixel((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size)
                    for i in range(3):
                        acc[i] += c[i] * c[3]
                    acc[3] += c[3]
            a = acc[3] / (ss * ss)
            rgb = [int(acc[i] / acc[3]) if acc[3] else 0 for i in range(3)]
            row += bytes(rgb + [int(a)])
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


for s in (16, 32, 48, 128):
    with open(f"icons/icon{s}.png", "wb") as f:
        f.write(render(s))
print("icons written")
