"""Objective checks on captured screenshots (no human eyes required).

Verifies: every scene is non-blank, keeps dark contour ink, has restrained
saturation in acts 1-3, and that truly saturated green appears only at the
new-sprout / epilogue moment.
"""
import colorsys
import glob
import os

from PIL import Image, ImageStat

SHOTS = os.path.join(os.path.dirname(__file__), "screenshots")
GREEN_MIN_AREA = 0.0015          # 新芽应是可见的一小块，不是整屏
DARK_MIN = 0.008                 # 深褐粗轮廓至少占比
SAT_LIMIT_OTHER = 0.010          # 其余场景允许的饱和绿上限


def analyse(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    small = im.resize((max(1, w // 4), max(1, h // 4)))
    px = list(small.getdata())
    total = len(px)

    stat = ImageStat.Stat(small)
    mean = sum(stat.mean) / 3
    stddev = sum(stat.stddev) / 3

    dark = 0
    saturated_green = 0
    near_white = 0
    for r, g, b in px:
        if (r * 0.299 + g * 0.587 + b * 0.114) < 90:
            dark += 1
        if r > 246 and g > 246 and b > 246:
            near_white += 1
        hh, ll, ss = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        deg = hh * 360
        if 90 <= deg <= 165 and ss > 0.45 and ll > 0.15:
            saturated_green += 1

    unique = len(set(px))
    return {
        "name": os.path.basename(path),
        "size": f"{w}x{h}",
        "stddev": round(stddev, 1),
        "dark": round(dark / total, 4),
        "green": round(saturated_green / total, 4),
        "white": round(near_white / total, 4),
        "colors": unique,
    }


def main():
    files = sorted(glob.glob(os.path.join(SHOTS, "*.png")))
    if not files:
        raise SystemExit("no screenshots — run: node tests/browser.cjs")

    failures = []
    rows = []
    for path in files:
        data = analyse(path)
        rows.append(data)

        if data["colors"] < 40 or data["stddev"] < 6:
            failures.append(f"{data['name']}: 画面近似空白 (colors={data['colors']}, stddev={data['stddev']})")
        if data["dark"] < DARK_MIN:
            failures.append(f"{data['name']}: 缺少深褐轮廓 (dark={data['dark']})")
        if data["white"] > 0.35:
            failures.append(f"{data['name']}: 近白像素过多 (white={data['white']})")

        is_finale = data["name"].startswith(("26-", "27-"))
        if is_finale:
            if data["green"] < GREEN_MIN_AREA:
                failures.append(f"{data['name']}: 结局缺少真正饱和的新芽绿 (green={data['green']})")
        elif data["green"] > SAT_LIMIT_OTHER:
            failures.append(f"{data['name']}: 非结局场景出现过多饱和绿 (green={data['green']})")

    width = max(len(r["name"]) for r in rows) + 2
    print(f"{'scene'.ljust(width)}{'size':>10}{'stddev':>9}{'dark':>8}{'green':>8}{'white':>8}{'colors':>8}")
    for r in rows:
        print(f"{r['name'].ljust(width)}{r['size']:>10}{r['stddev']:>9}{r['dark']:>8}{r['green']:>8}{r['white']:>8}{r['colors']:>8}")

    print()
    if failures:
        print(f"FAILED {len(failures)}:")
        for item in failures:
            print(" -", item)
        raise SystemExit(1)
    print(f"PASS  {len(rows)} 张截图全部通过客观视觉检查")


if __name__ == "__main__":
    main()
