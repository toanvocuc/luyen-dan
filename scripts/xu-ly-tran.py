# Ảnh màn trận: Hinh_anh/tran/* -> public/hinh/tran/ và public/hinh/nhan-vat-lung/.
# Dùng: python scripts/xu-ly-tran.py
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')
GOC = os.path.join(os.path.dirname(__file__), '..')
ns: dict = {'__file__': os.path.join(GOC, 'scripts', 'xu-ly-nhan-vat-thien.py')}
exec(open(ns['__file__'], encoding='utf-8').read().split(chr(10) + 'VAO = ')[0], ns)
tach = ns['tach_nen_mep']
ns2: dict = {'__file__': os.path.join(GOC, 'scripts', 'xu-ly-combat.py')}
exec(open(ns2['__file__'], encoding='utf-8').read().split(chr(10) + 'for ten, (nhom')[0], ns2)
khoi = ns2['khoi_lon_nhat']
V = os.path.join(GOC, 'Hinh_anh', 'tran')
RT = os.path.join(GOC, 'public', 'hinh', 'tran')
RL = os.path.join(GOC, 'public', 'hinh', 'nhan-vat-lung')


def lon_nhat(im: Image.Image, gop: int) -> Image.Image:
    a = np.asarray(im).copy()
    giu = khoi(a[..., 3] > 100, gop)
    a[..., 3] = np.where(giu, a[..., 3], 0)
    im = Image.fromarray(a, 'RGBA')
    return im.crop(im.getbbox())


# 1-2. nhân vật quay lưng: lưới 3x2, cao 720
BO = ['pham-y', 'thanh-van', 'dan-su', 'kiem-tu', 'ma-tu', 'tien-bao']
for g in ['nam', 'nu']:
    tam = Image.open(os.path.join(V, f'{g}-lung.png')).convert('RGB')
    W, H = tam.size
    for i, bo in enumerate(BO):
        c, r = i % 3, i // 3
        o = lon_nhat(tach(tam.crop((c * W // 3, r * H // 2, (c + 1) * W // 3, (r + 1) * H // 2))), 9)
        o = o.resize((round(o.width * 720 / o.height), 720), Image.LANCZOS)
        o.save(os.path.join(RL, f'{g}-{bo}.webp'), 'WEBP', quality=86, alpha_quality=90, method=6)
    print('ok lung', g)

# 3. dải tuyệt chiêu: chỉ giữ phần ánh vàng (ghép screen); vùng trắng / xám không màu -> đen
a = np.asarray(Image.open(os.path.join(V, 'dai-tuyet-chieu.png')).convert('RGB')).astype(np.float32)
mx, mn = a.max(axis=2), a.min(axis=2)
bao_hoa = (mx - mn) / np.maximum(mx, 1)
giu = np.clip((bao_hoa - 0.18) / 0.25, 0, 1)[..., None]
Image.fromarray((a * giu).clip(0, 255).astype(np.uint8), 'RGB').save(os.path.join(RT, 'dai-tuyet-chieu.webp'), 'WEBP', quality=85, method=6)
print('ok dai')

# 4. kết trận: 2 vòng trên nền đen, cắt đôi
kt = Image.open(os.path.join(V, 'ket-tran.png')).convert('RGB')
W, H = kt.size
for i, ten in enumerate(['thang', 'thua']):
    o = kt.crop((i * W // 2, 0, (i + 1) * W // 2, H))
    s = np.asarray(o).max(axis=2) > 40
    s[int(H * 0.85):, :] = False  # dấu watermark ở góc dưới
    ys, xs = np.nonzero(s)
    o = o.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    canh = max(o.size) + 20
    k = Image.new('RGB', (canh, canh))
    k.paste(o, ((canh - o.width) // 2, (canh - o.height) // 2))
    k.resize((512, 512), Image.LANCZOS).save(os.path.join(RT, f'ket-{ten}.webp'), 'WEBP', quality=85, method=6)
print('ok ket')

# 5. ba khung thanh
kt = Image.open(os.path.join(V, 'khung-thanh.png')).convert('RGB')
W, H = kt.size
for i, ten in enumerate(['thanh-boss', 'thanh-mau', 'thanh-nguyen']):
    o = lon_nhat(tach(kt.crop((0, i * H // 3, W, (i + 1) * H // 3))), 9)
    o = o.resize((600, round(o.height * 600 / o.width)), Image.LANCZOS)
    o.save(os.path.join(RT, ten + '.webp'), 'WEBP', quality=88, alpha_quality=90, method=6)
    print(ten, o.size)

# 6. vòng nút chiêu: cắt tròn, ruột đen -> trong suốt (để thấy biểu tượng chiêu đặt dưới)
nc = Image.open(os.path.join(V, 'nut-chieu.png')).convert('RGB')
a = np.asarray(nc).astype(np.int32)
ys, xs = np.nonzero(a.min(axis=2) < 200)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
canh = max(x1 - x0, y1 - y0) + 1
nc = nc.crop((x0, y0, x0 + canh, y0 + canh)).convert('RGBA')
mnk = Image.new('L', (canh * 4, canh * 4), 0)
ImageDraw.Draw(mnk).ellipse((6, 6, canh * 4 - 6, canh * 4 - 6), fill=255)
mnk = np.asarray(mnk.resize((canh, canh), Image.LANCZOS)).astype(np.float32)
b = np.asarray(nc).astype(np.float32)
den = np.clip((b[..., :3].max(axis=2) - 18) / 30, 0, 1)
# chỉ khoét phần đen ở giữa (bán kính < 74% nửa cạnh)
yy, xx = np.mgrid[0:canh, 0:canh]
trong = ((xx - canh / 2) ** 2 + (yy - canh / 2) ** 2) < (canh * 0.37) ** 2
alpha = np.where(trong, den * 255, 255) * (mnk / 255)
b[..., 3] = alpha
Image.fromarray(b.astype(np.uint8), 'RGBA').resize((256, 256), Image.LANCZOS).save(os.path.join(RT, 'nut-chieu.webp'), 'WEBP', quality=88, alpha_quality=90, method=6)
print('ok nut')
