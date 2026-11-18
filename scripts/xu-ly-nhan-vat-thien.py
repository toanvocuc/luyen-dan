# Nhân vật ngồi thiền (mỗi bộ trang phục một ảnh): Hinh_anh/nhan-vat-thien/<gioi>-<bo>.png
# -> public/hinh/nhan-vat-thien/<gioi>-<bo>.webp, tách nền trắng, đưa về cùng cỡ: khung vuông 720,
# hình cao 640 (ảnh rộng quá thì thu cho vừa), đáy hình chạm sát đáy khung để đặt lên bệ đá.
# Dùng: python scripts/xu-ly-nhan-vat-thien.py
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.stdout.reconfigure(encoding='utf-8')
GOC = os.path.join(os.path.dirname(__file__), '..')

NGUONG_LO = 2500  # mảng trắng kín lớn hơn bấy nhiêu điểm ảnh (ảnh gốc 1024) thì là nền


def tach_nen_mep(im: Image.Image) -> Image.Image:
    """Chỉ xoá nền gần trắng NỐI LIỀN với mép ảnh; mảng áo sáng bên trong giữ nguyên. Viền chuyển mềm theo độ trắng."""
    rgb = np.asarray(im).astype(np.float32) / 255.0
    trang = rgb.min(axis=2)  # 1 = trắng tuyệt đối
    gan_trang = Image.fromarray(((trang > 0.93) * 255).astype(np.uint8), 'L')
    # loang từ khung viền 1 điểm ảnh bao quanh: điểm nào trắng và nối ra mép thì là nền
    h, w = trang.shape
    lon = Image.new('L', (w + 2, h + 2), 255)
    lon.paste(gan_trang, (1, 1))
    ImageDraw.floodfill(lon, (0, 0), 128)
    nen = (np.asarray(lon)[1:-1, 1:-1] == 128)
    # mảng trắng tinh bị dải lụa hay khói bao kín: đủ lớn và đủ trắng thì cũng là nền (áo trắng có nếp vẽ nên ít khi trắng tinh cả mảng)
    tinh = (trang > 0.965) & ~nen
    lo = Image.fromarray((tinh * 255).astype(np.uint8), 'L')
    ys, xs = np.nonzero(tinh)
    da = np.zeros_like(tinh)
    for y, x in zip(ys[::7].tolist(), xs[::7].tolist()):
        if da[y, x] or not tinh[y, x]:
            continue
        ImageDraw.floodfill(lo, (x, y), 100)
        mang = np.asarray(lo) == 100
        da |= mang
        if mang.sum() > NGUONG_LO:
            nen |= mang
        lo.paste(Image.fromarray(np.where(mang, 0, np.asarray(lo)).astype(np.uint8), 'L'))
    # dải chuyển tiếp 3 điểm ảnh quanh vật: độ đục theo độ trắng, để viền không răng cưa
    vat = Image.fromarray(((~nen) * 255).astype(np.uint8), 'L')
    gan_vat = np.asarray(vat.filter(ImageFilter.MaxFilter(7))) > 0
    mem = np.clip((1.0 - trang) / 0.25, 0, 1)
    alpha = np.where(nen, np.where(gan_vat, mem, 0.0), 1.0)
    # gỡ phần trắng đã pha vào màu ở dải viền
    a3 = np.maximum(alpha, 1e-3)[..., None]
    mau = np.clip((rgb - (1 - a3)) / a3, 0, 1)
    mau = np.where(nen[..., None], mau, rgb)
    ra = np.dstack([mau, alpha])
    return Image.fromarray((ra * 255).round().astype(np.uint8), 'RGBA')


VAO = os.path.join(GOC, 'Hinh_anh', 'nhan-vat-thien')
RA = os.path.join(GOC, 'public', 'hinh', 'nhan-vat-thien')
os.makedirs(RA, exist_ok=True)
KHUNG, CAO = 720, 640
for ten in sorted(os.listdir(VAO)):
    goc_ten, duoi = os.path.splitext(ten)
    if duoi.lower() != '.png':
        continue
    hinh = tach_nen_mep(Image.open(os.path.join(VAO, ten)).convert("RGB"))
    hinh = hinh.crop(hinh.getbbox())
    tl = min(CAO / hinh.height, (KHUNG - 8) / hinh.width)
    hinh = hinh.resize((round(hinh.width * tl), round(hinh.height * tl)), Image.LANCZOS)
    nen = Image.new('RGBA', (KHUNG, KHUNG), (0, 0, 0, 0))
    nen.alpha_composite(hinh, ((KHUNG - hinh.width) // 2, KHUNG - hinh.height))
    nen.save(os.path.join(RA, goc_ten + '.webp'), 'WEBP', quality=86, alpha_quality=90, method=6)
    print('ok', goc_ten, hinh.size)
