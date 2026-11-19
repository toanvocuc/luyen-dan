# Khung giao diện và tông môn: Hinh_anh/khung/*, Hinh_anh/tong-mon/* -> public/hinh/khung/, public/hinh/tong-mon/.
# Dùng: python scripts/xu-ly-khung-tong-mon.py
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')
GOC = os.path.join(os.path.dirname(__file__), '..')
nguon = open(os.path.join(GOC, 'scripts', 'xu-ly-nhan-vat-thien.py'), encoding='utf-8').read().split('\nVAO = ')[0]
ns: dict = {'__file__': os.path.join(GOC, 'scripts', 'xu-ly-nhan-vat-thien.py')}
exec(nguon, ns)
tach = ns['tach_nen_mep']
K = os.path.join(GOC, 'Hinh_anh', 'khung')
T = os.path.join(GOC, 'Hinh_anh', 'tong-mon')
RK = os.path.join(GOC, 'public', 'hinh', 'khung')
RT = os.path.join(GOC, 'public', 'hinh', 'tong-mon')


nguon2 = open(os.path.join(GOC, 'scripts', 'xu-ly-combat.py'), encoding='utf-8').read().split(chr(10) + 'for ten, (nhom')[0]
ns2: dict = {'__file__': os.path.join(GOC, 'scripts', 'xu-ly-combat.py')}
exec(nguon2, ns2)
khoi_lon_nhat = ns2['khoi_lon_nhat']


def cat_sat(im: Image.Image, gop: int = 0) -> Image.Image:
    # gop > 0: chỉ giữ khối hình lớn nhất (bỏ mẩu của ô bên cạnh lọt vào)
    if gop:
        arr = np.asarray(im).copy()
        giu = khoi_lon_nhat(arr[..., 3] > 120, gop)
        arr[..., 3] = np.where(giu, arr[..., 3], 0)
        im = Image.fromarray(arr, 'RGBA')
    return im.crop(im.getbbox())


# khung bảng: tách nền trắng, cắt sát, thu về rộng 600 (CSS dùng làm border-image chín ô)
kb = cat_sat(tach(Image.open(os.path.join(K, 'khung-bang.png')).convert('RGB')))
kb = kb.resize((600, round(kb.height * 600 / kb.width)), Image.LANCZOS)
kb.save(os.path.join(RK, 'khung-bang.webp'), 'WEBP', quality=88, alpha_quality=90, method=6)
print('khung-bang', kb.size)
Image.open(os.path.join(K, 'nen-nhan-vat.png')).convert('RGB').save(os.path.join(RK, 'nen-nhan-vat.webp'), 'WEBP', quality=80, method=6)
# 4 tấm nút xếp dọc
nut = Image.open(os.path.join(K, 'nut.png')).convert('RGB')
W, H = nut.size
for i, ten in enumerate(['nut-thuong', 'nut-chinh', 'the', 'the-chon']):
    o = cat_sat(tach(nut.crop((0, i * H // 4, W, (i + 1) * H // 4))), 9)
    o = o.resize((480, round(o.height * 480 / o.width)), Image.LANCZOS)
    o.save(os.path.join(RK, ten + '.webp'), 'WEBP', quality=88, alpha_quality=90, method=6)
    print(ten, o.size)
# ô chiêu tròn
oc = Image.open(os.path.join(K, 'o-chieu.png')).convert('RGB')
a = np.asarray(oc).astype(np.int32)
ys, xs = np.nonzero(a.min(axis=2) < 215)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
canh = max(x1 - x0, y1 - y0) + 1
oc = oc.crop((x0, y0, x0 + canh, y0 + canh))
mn = Image.new('L', (canh * 4, canh * 4), 0)
ImageDraw.Draw(mn).ellipse((4, 4, canh * 4 - 4, canh * 4 - 4), fill=255)
oc = oc.convert('RGBA')
oc.putalpha(mn.resize((canh, canh), Image.LANCZOS))
oc.resize((200, 200), Image.LANCZOS).save(os.path.join(RK, 'o-chieu.webp'), 'WEBP', quality=88, alpha_quality=90, method=6)
# 6 toà nhà
ct = Image.open(os.path.join(T, 'cong-trinh.png')).convert('RGB')
W, H = ct.size
for i, ten in enumerate(['nghi-su-duong', 'tang-kinh-cac', 'tang-bao-cac', 'luyen-vo-truong', 'y-quan', 'son-mon']):
    c, r = i % 3, i // 3
    o = cat_sat(tach(ct.crop((c * W // 3, r * H // 2, (c + 1) * W // 3, (r + 1) * H // 2))), 3)
    o.thumbnail((300, 300), Image.LANCZOS)
    o.save(os.path.join(RT, ten + '.webp'), 'WEBP', quality=88, alpha_quality=90, method=6)
    print(ten, o.size)
for ten in ['thanh-van', 'duoc-vuong', 'thien-kiem', 'van-bao', 'huyen-am']:
    Image.open(os.path.join(T, f'nen-{ten}.png')).convert('RGB').save(os.path.join(RT, f'nen-{ten}.webp'), 'WEBP', quality=82, method=6)
print('ok nen tong mon')
