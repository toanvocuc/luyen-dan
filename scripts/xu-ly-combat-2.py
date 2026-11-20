# Combat đợt 1 (bước 12): cắt 4 tấm ảnh trong Hinh_anh/_gemini/ thành từng ảnh.
# Gemini không giữ đúng lưới (tấm dọc thay vì ngang…), nên cắt THEO KHỐI HÌNH chứ không theo ô:
# tìm các khối hình (gộp mảnh gần nhau), giữ N khối lớn nhất (bỏ dấu ✦ lẻ), xếp theo thứ tự đọc trái->phải, trên->dưới.
# Dùng: python scripts/xu-ly-combat-2.py
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.stdout.reconfigure(encoding='utf-8')
GOC = os.path.join(os.path.dirname(__file__), '..')
ns: dict = {'__file__': os.path.join(GOC, 'scripts', 'xu-ly-combat.py')}
exec(open(ns['__file__'], encoding='utf-8').read().split(chr(10) + 'for ten, (nhom')[0], ns)
tach_trang = ns['tach_trang']
V = os.path.join(GOC, 'Hinh_anh', '_gemini')
HINH = os.path.join(GOC, 'public', 'hinh')

# tệp vào -> (thư mục ra, nền, cỡ ra, độ gộp mảnh, danh sách id theo thứ tự đọc)
TAM = {
    'vo-cong/vo-ky-moi.png': ('combat/bt', 'trang', 160, 25, [
        'kiem-khi-tram', 'kiem-vong', 'doan-nhac-dao', 'huyet-dao',
        'hoi-ma-thuong', 'thuong-tran', 'bang-son-quyen', 'kim-chung-trao',
        'thai-cuc-thoi-thu', 'hap-tinh-chuong', 'pha-huyet-chi', 'giai-huyet-chi']),
    'dan-chien/dan-chien.png': ('dan', 'trang', 256, 9, [
        'cuong-huyet-dan', 'kim-cuong-dan', 'phong-hanh-dan', 'van-doc-dan', 'loi-hoa-dan', 'tan-linh-dan']),
    'combat/hieu-ung-moi.png': ('combat/phu', 'den', 256, 41, ['doc-no', 'loi-hoa', 'tan-linh', 'cuong-khi', 'vo-cuong', 'ngat']),
    'combat/trang-thai-moi.png': ('combat/tt', 'trang', 160, 25, [
        'gong', 'vo-cuong', 'phan-don', 'cuong-huyet', 'kim-cuong', 'phong-hanh', 'khac-he', 'hap-tinh', 'giai']),
}


def cac_khoi(mat: np.ndarray, gop: int, n: int) -> list[tuple[int, int, int, int]]:
    """Các khối hình (gộp mảnh cách nhau dưới `gop`): trả n hộp lớn nhất, xếp theo thứ tự đọc."""
    m = Image.fromarray((mat * 255).astype(np.uint8), 'L').filter(ImageFilter.MaxFilter(gop | 1))
    nhan = m.copy()
    a = np.asarray(m) > 0
    da = np.zeros_like(a)
    khoi = []
    ys, xs = np.nonzero(a)
    for y, x in zip(ys[::7].tolist(), xs[::7].tolist()):
        if da[y, x]:
            continue
        ImageDraw.floodfill(nhan, (x, y), 100)
        vung = np.asarray(nhan) == 100
        da |= vung
        vy, vx = np.nonzero(vung)
        khoi.append((int((vung & mat).sum()), (vx.min(), vy.min(), vx.max() + 1, vy.max() + 1)))
        nhan = Image.fromarray(np.where(vung, 0, np.asarray(nhan)).astype(np.uint8), 'L').copy()
    khoi.sort(key=lambda k: -k[0])
    hop = [k[1] for k in khoi[:n]]
    if len(hop) < n:
        raise SystemExit(f'chỉ thấy {len(hop)} khối, cần {n}')
    # thứ tự đọc: gom hàng theo tâm dọc (cùng hàng nếu tâm lệch dưới nửa chiều cao trung bình)
    hop.sort(key=lambda b: (b[1] + b[3]) / 2)
    cao_tb = sum(b[3] - b[1] for b in hop) / n
    hang, ra = [], []
    for b in hop:
        if hang and abs((b[1] + b[3]) / 2 - (hang[0][1] + hang[0][3]) / 2) > cao_tb / 2:
            ra += sorted(hang, key=lambda c: c[0])
            hang = []
        hang.append(b)
    return ra + sorted(hang, key=lambda c: c[0])


for ten, (thu_muc, nen, co, gop, ids) in TAM.items():
    tam = Image.open(os.path.join(V, ten)).convert('RGB')
    os.makedirs(os.path.join(HINH, thu_muc), exist_ok=True)
    if nen == 'den':
        a = np.asarray(tam).astype(np.float32)
        mat = a.max(axis=2) > 60
    else:
        tt = tach_trang(tam)
        mat = np.asarray(tt)[..., 3] > 40
    for id_, (x0, y0, x1, y1) in zip(ids, cac_khoi(mat, gop, len(ids))):
        le = 14
        bb = (max(0, x0 - le), max(0, y0 - le), min(tam.width, x1 + le), min(tam.height, y1 + le))
        if nen == 'den':
            o = tam.crop(bb)
        else:
            o = tach_trang(tam.crop(bb))
        canh = max(o.size)
        khung = Image.new(o.mode, (canh, canh), (0, 0, 0) if nen == 'den' else (0, 0, 0, 0))
        khung.paste(o, ((canh - o.width) // 2, (canh - o.height) // 2))
        khung = khung.resize((co, co), Image.LANCZOS)
        khung.save(os.path.join(HINH, thu_muc, id_ + '.webp'), 'WEBP', quality=86, alpha_quality=90, method=6)
    print('ok', ten, '->', thu_muc, len(ids))
