# Ảnh cảnh cắt tuyệt chiêu: Hinh_anh/_gemini/tuyet-ky/{nam,nu}-tuyet-ky.png -> public/hinh/tuyet-ky/{nam,nu}-{he}.webp
# Mỗi tấm là các thế ra đòn vẽ bóng mực trên nền đen; nền đen đổi thành trong suốt theo độ sáng.
# Dùng: python scripts/xu-ly-tuyet-ky.py
import os
import sys

import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
GOC = os.path.join(os.path.dirname(__file__), '..')
ns: dict = {'__file__': os.path.join(GOC, 'scripts', 'xu-ly-combat.py')}
exec(open(ns['__file__'], encoding='utf-8').read().split(chr(10) + 'for ten, (nhom')[0], ns)
khoi = ns['khoi_lon_nhat']
V = os.path.join(GOC, 'Hinh_anh', '_gemini', 'tuyet-ky')
RA = os.path.join(GOC, 'public', 'hinh', 'tuyet-ky')
os.makedirs(RA, exist_ok=True)

# (số cột, số hàng, ô của từng hệ (cột, hàng), vùng dấu ✦ của Gemini cần xoá (x0, y0, x1, y1) theo tỉ lệ)
BANG = {
    # tấm nam vẽ dư 2 ô (lưới 2x4): bỏ ô rồng tay không và ô chưởng lửa
    'nam': (2, 4, {'kiem': (0, 0), 'dao': (1, 0), 'thuong': (0, 1), 'quyen': (0, 2), 'chuong': (1, 2), 'chi': (1, 3)}, (0.80, 0.86, 0.93, 0.94)),
    'nu': (3, 2, {'kiem': (0, 0), 'dao': (1, 0), 'thuong': (2, 0), 'quyen': (0, 1), 'chuong': (1, 1), 'chi': (2, 1)}, (0.86, 0.81, 0.95, 0.92)),
}

for g, (cot, hang, o_he, dau) in BANG.items():
    tam = np.asarray(Image.open(os.path.join(V, f'{g}-tuyet-ky.png')).convert('RGB')).astype(np.float32).copy()
    H, W = tam.shape[:2]
    tam[int(dau[1] * H):int(dau[3] * H), int(dau[0] * W):int(dau[2] * W)] = 0
    for he, (c, r) in o_he.items():
        x0, x1 = c * W // cot, (c + 1) * W // cot
        y0, y1 = r * H // hang, (r + 1) * H // hang
        o = tam[y0:y1, x0:x1]
        sang = o.max(axis=2)
        # nền đen của Gemini là xám rất tối: cắt đáy; vùng mực xám giữa coi như đặc để bóng người không bị "ma"
        a = np.clip((sang - 14) / 90, 0, 1)
        giu = khoi(a > 0.08, 21)
        a = np.where(giu, a, 0)
        mau = np.clip(o / np.maximum(a[..., None], 1e-3), 0, 255)
        anh = Image.fromarray(np.dstack([mau, a * 255]).round().astype(np.uint8), 'RGBA')
        anh = anh.crop(anh.getbbox())
        cao = 480
        anh = anh.resize((round(anh.width * cao / anh.height), cao), Image.LANCZOS)
        anh.save(os.path.join(RA, f'{g}-{he}.webp'), 'WEBP', quality=86, alpha_quality=88, method=6)
        print('ok', g, he, anh.size)
