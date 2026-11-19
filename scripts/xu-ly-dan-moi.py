# Cắt tấm 6 viên đan mới (Hinh_anh/dan-moi/dan-moi.png, lưới 3 cột x 2 hàng, mỗi viên trên một ô đen)
# -> public/hinh/dan/<id>.webp (cắt tròn theo viên đan), và nền đấu giá -> public/hinh/dau-gia/nen-dau-gia.webp.
# Dùng: python scripts/xu-ly-dan-moi.py
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.stdout.reconfigure(encoding='utf-8')
GOC = os.path.join(os.path.dirname(__file__), '..')
VAO = os.path.join(GOC, 'Hinh_anh', 'dan-moi')
IDS = ['ngo-dao-dan', 'tay-cot-dan', 'hoi-nguyen-dan', 'giai-doc-dan', 'chi-huyet-dan', 'thanh-tam-dan']
tam = Image.open(os.path.join(VAO, 'dan-moi.png')).convert('RGB')
W, H = tam.size
for i, id_ in enumerate(IDS):
    c, r = i % 3, i // 3
    o = tam.crop((c * W // 3, r * H // 2, (c + 1) * W // 3, (r + 1) * H // 2))
    a = np.asarray(o).astype(np.int32)
    # ô đen: điểm rất tối; viên đan: điểm không tối nằm trong ô đen
    toi = a.max(axis=2) < 30
    ys, xs = np.nonzero(toi)
    o = o.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    a = np.asarray(o).astype(np.int32)
    sang = a.max(axis=2) > 45
    ys, xs = np.nonzero(sang)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    canh = max(x1 - x0, y1 - y0) + 1
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    o = o.crop((int(cx - canh / 2), int(cy - canh / 2), int(cx - canh / 2) + canh, int(cy - canh / 2) + canh))
    to = 4
    mn = Image.new('L', (canh * to, canh * to), 0)
    ImageDraw.Draw(mn).ellipse((2 * to, 2 * to, canh * to - 2 * to, canh * to - 2 * to), fill=255)
    mn = mn.resize((canh, canh), Image.LANCZOS)
    ra = o.convert('RGBA')
    ra.putalpha(mn)
    ra = ra.resize((256, 256), Image.LANCZOS)
    ra.save(os.path.join(GOC, 'public', 'hinh', 'dan', id_ + '.webp'), 'WEBP', quality=88, alpha_quality=90, method=6)
    print('ok', id_)
nen = Image.open(os.path.join(VAO, 'nen-dau-gia.png')).convert('RGB')
os.makedirs(os.path.join(GOC, 'public', 'hinh', 'dau-gia'), exist_ok=True)
nen.save(os.path.join(GOC, 'public', 'hinh', 'dau-gia', 'nen-dau-gia.webp'), 'WEBP', quality=82, method=6)
print('ok nen-dau-gia', nen.size)
