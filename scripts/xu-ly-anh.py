# Tách nền trắng của ảnh gốc trong Hinh_anh/ và xuất ra public/hinh/ với kích thước dùng trong game.
# Chạy: python scripts/xu-ly-anh.py
#
# Cách tách: "màu thành độ trong" — điểm ảnh càng trắng thì càng trong suốt, nên quầng sáng
# vẽ trên nền trắng vẫn giữ được thành quầng sáng bán trong. Riêng phần BÊN TRONG vật thể
# (vùng không nối được ra mép ảnh) thì giữ đặc hoàn toàn, để điểm bóng sáng trên lò/đan không bị thủng.
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

GOC = os.path.join(os.path.dirname(__file__), '..', 'Hinh_anh')
RA = os.path.join(os.path.dirname(__file__), '..', 'public', 'hinh')

# tên file gốc -> (tên xuất, cạnh dài tối đa)
VAT_THE = {
    'alchemy_pill_furnace.png': ('lo-dan.png', 720),
    'spirit_herb.png': ('duoc-lieu.png', 256),
    'alchemy_pill.png': ('dan.png', 256),
}
NEN = {
    'background.png': ('nen-dan-phong.jpg', 1920),
}


def tach_nen(im: Image.Image) -> Image.Image:
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    h, w, _ = a.shape
    # độ đục nếu coi nền là trắng tuyệt đối
    alpha = 1.0 - a.min(axis=2)
    dac = alpha > 0.45  # điểm "đặc" của vật thể (viền đậm, thân vật)

    # loang từ mép ảnh qua các điểm không đặc -> vùng "bên ngoài"
    ngoai = np.zeros((h, w), dtype=bool)
    hang = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not dac[y, x] and not ngoai[y, x]:
                ngoai[y, x] = True
                hang.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if not dac[y, x] and not ngoai[y, x]:
                ngoai[y, x] = True
                hang.append((y, x))
    while hang:
        y, x = hang.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not ngoai[ny, nx] and not dac[ny, nx]:
                ngoai[ny, nx] = True
                hang.append((ny, nx))

    # lỗ kín bên trong vật thể (vd lòng quai lò): mảng gần trắng tuyệt đối, đủ lớn -> coi như bên ngoài
    gan_trang = (alpha < 0.15) & ~ngoai
    da_xet = np.zeros((h, w), dtype=bool)
    ys, xs = np.nonzero(gan_trang)
    for y0, x0 in zip(ys.tolist(), xs.tolist()):
        if da_xet[y0, x0]:
            continue
        mang = [(y0, x0)]
        da_xet[y0, x0] = True
        hang = deque(mang)
        while hang:
            y, x = hang.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and gan_trang[ny, nx] and not da_xet[ny, nx]:
                    da_xet[ny, nx] = True
                    mang.append((ny, nx))
                    hang.append((ny, nx))
        if len(mang) > 60:
            for y, x in mang:
                ngoai[y, x] = True

    # bên trong: đặc hẳn. bên ngoài: bán trong theo độ trắng, và gỡ phần trắng đã pha vào màu
    alpha_ra = np.where(ngoai, alpha, 1.0)
    alpha_ra[alpha_ra < 0.02] = 0.0
    an_toan = np.maximum(alpha_ra, 1e-3)[..., None]
    mau_go = np.clip((a - (1.0 - an_toan)) / an_toan, 0, 1)
    mau = np.where(ngoai[..., None], mau_go, a)
    ra = np.dstack([mau, alpha_ra[..., None]])
    return Image.fromarray((ra * 255).round().astype(np.uint8), 'RGBA')


def cat_sat(im: Image.Image, le=8) -> Image.Image:
    box = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box:
        return im
    l, t, r, b = box
    return im.crop((max(0, l - le), max(0, t - le), min(im.width, r + le), min(im.height, b + le)))


def thu_nho(im: Image.Image, canh: int) -> Image.Image:
    ti = canh / max(im.size)
    if ti >= 1:
        return im
    return im.resize((round(im.width * ti), round(im.height * ti)), Image.LANCZOS)


def main():
    os.makedirs(RA, exist_ok=True)
    loi = 0
    for goc, (ten, canh) in VAT_THE.items():
        p = os.path.join(GOC, goc)
        if not os.path.exists(p):
            print('THIEU', goc); loi += 1; continue
        im = thu_nho(cat_sat(tach_nen(Image.open(p))), canh)
        im.save(os.path.join(RA, ten), optimize=True)
        print('ok', goc, '->', ten, im.size)
    for goc, (ten, canh) in NEN.items():
        p = os.path.join(GOC, goc)
        if not os.path.exists(p):
            print('THIEU', goc); loi += 1; continue
        im = thu_nho(Image.open(p).convert('RGB'), canh)
        im.save(os.path.join(RA, ten), quality=88)
        print('ok', goc, '->', ten, im.size)
    sys.exit(1 if loi else 0)


if __name__ == '__main__':
    main()
