# Cắt các tấm ảnh combat (Hinh_anh/combat/*.png) thành từng ảnh trong public/hinh/combat/<nhom>/<id>.webp.
# - Tấm nền đen (vệt chiêu, hiệu ứng): giữ nền đen để ghép bằng mix-blend-mode: screen.
# - Tấm nền trắng (biểu tượng): tách nền thành trong suốt.
# Mỗi ô chỉ giữ khối hình lớn nhất (gộp các mảnh gần nhau), nên chữ Gemini tự thêm và dấu watermark nằm lẻ đều bị xoá.
# Dùng: python scripts/xu-ly-combat.py
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.stdout.reconfigure(encoding='utf-8')
GOC = os.path.join(os.path.dirname(__file__), '..')
VAO = os.path.join(GOC, 'Hinh_anh', 'combat')
RA = os.path.join(GOC, 'public', 'hinh', 'combat')

# tên tệp -> (nhóm ra, nền, số cột, số hàng, danh sách id theo thứ tự trái->phải, trên->dưới)
TAM = {
    'vet-vo-ky.png': ('vet', 'den', 3, 2, ['kiem', 'dao', 'thuong', 'quyen', 'chuong', 'chi']),
    'vet-tuyet-chieu.png': ('tuyet', 'den', 3, 2, ['kiem', 'dao', 'thuong', 'quyen', 'chuong', 'chi']),
    'nguyen-to.png': ('nguyen-to', 'den', 3, 2, ['kim', 'moc', 'thuy', 'hoa', 'tho', 'loi']),
    'hieu-ung-phu.png': ('phu', 'den', 3, 2, ['ne', 'khien', 'hoi', 'bao', 'choang', 'khi-the']),
    'trang-thai.png': ('tt', 'trang', 4, 4, ['kiem-thuong', 'pha-giap', 'lien-kich', 'chan-dong', 'choang', 'noi-thuong', 'diem-huyet', 'thieu-dot',
                                          'han-khi', 'sinh-co', 'ho-the', 'khi-the', 'doc', 'yeu', 'hac', 'cuong']),
    'icon-tuyet-chieu.png': ('icon-tc', 'trang', 3, 2, ['kiem', 'dao', 'thuong', 'quyen', 'chuong', 'chi']),
    'loai-vo-cong.png': ('loai', 'trang', 3, 3, ['quyen', 'chuong', 'chi', 'kiem', 'dao', 'thuong', 'than-phap', 'tam-phap', 'tuyet-ky']),
}
CO = {'den': 256, 'trang': 160}


def khoi_lon_nhat(mat: np.ndarray, gop: int) -> np.ndarray:
    """mat: mảng bool điểm 'có hình'. Gộp mảnh cách nhau dưới `gop` điểm ảnh rồi trả về mặt nạ của khối nhiều điểm nhất."""
    h, w = mat.shape
    m = Image.fromarray((mat * 255).astype(np.uint8), 'L').filter(ImageFilter.MaxFilter(gop | 1))
    a = np.asarray(m) > 0
    # .copy(): ảnh dựng từ mảng numpy có thể dùng chung bộ nhớ chỉ đọc, floodfill ghi vào sẽ không ăn
    nhan = Image.fromarray((a * 255).astype(np.uint8), 'L').copy()
    tot, tot_dem = None, -1
    ys, xs = np.nonzero(a)
    da = np.zeros_like(a)
    for y, x in zip(ys[::13].tolist(), xs[::13].tolist()):
        if da[y, x]:
            continue
        ImageDraw.floodfill(nhan, (x, y), 100)
        vung = np.asarray(nhan) == 100
        da |= vung
        dem = int((vung & mat).sum())
        if dem > tot_dem:
            tot, tot_dem = vung.copy(), dem
        nhan = Image.fromarray(np.where(vung, 0, np.asarray(nhan)).astype(np.uint8), 'L').copy()
    return tot if tot is not None else np.ones_like(mat)


def tach_trang(o: Image.Image) -> Image.Image:
    """Nền trắng -> trong suốt, chỉ xoá trắng nối ra mép ô (giữ phần sáng bên trong hình)."""
    rgb = np.asarray(o).astype(np.float32) / 255.0
    trang = rgb.min(axis=2)
    h, w = trang.shape
    lon = Image.new('L', (w + 2, h + 2), 255)
    lon.paste(Image.fromarray(((trang > 0.92) * 255).astype(np.uint8), 'L'), (1, 1))
    ImageDraw.floodfill(lon, (0, 0), 128)
    nen = np.asarray(lon)[1:-1, 1:-1] == 128
    vat = Image.fromarray(((~nen) * 255).astype(np.uint8), 'L')
    gan = np.asarray(vat.filter(ImageFilter.MaxFilter(5))) > 0
    alpha = np.where(nen, np.where(gan, np.clip((1 - trang) / 0.25, 0, 1), 0.0), 1.0)
    a3 = np.maximum(alpha, 1e-3)[..., None]
    mau = np.where(nen[..., None], np.clip((rgb - (1 - a3)) / a3, 0, 1), rgb)
    return Image.fromarray((np.dstack([mau, alpha]) * 255).round().astype(np.uint8), 'RGBA')


for ten, (nhom, nen, cot, hang, ids) in TAM.items():
    p = os.path.join(VAO, ten)
    if not os.path.exists(p):
        print('thiếu', ten)
        continue
    tam = Image.open(p).convert('RGB')
    W, H = tam.size
    if nen == 'den':
        # xoá cứng: dải chữ Gemini tự thêm ở đầu/cuối mỗi ô, và dấu watermark ngôi sao ở góc dưới phải cả tấm
        ve = ImageDraw.Draw(tam)
        for r in range(hang):
            y0, y1 = r * H // hang, (r + 1) * H // hang
            ve.rectangle((0, y0, W, y0 + int((y1 - y0) * 0.07)), fill=(0, 0, 0))
            ve.rectangle((0, y1 - int((y1 - y0) * 0.10), W, y1), fill=(0, 0, 0))
        ve.rectangle((int(W * 0.80), int(H * 0.86), int(W * 0.93), int(H * 0.94)), fill=(0, 0, 0))
    os.makedirs(os.path.join(RA, nhom), exist_ok=True)
    for i, id_ in enumerate(ids):
        c, r = i % cot, i // cot
        le = 6  # bỏ đường kẻ ô
        o = tam.crop((c * W // cot + le, r * H // hang + le, (c + 1) * W // cot - le, (r + 1) * H // hang - le))
        if nen == 'den':
            a = np.asarray(o).astype(np.float32)
            sang = a.max(axis=2)
            giu = khoi_lon_nhat(sang > 70, 31)
            # giữ quầng sáng mềm quanh khối: nới mặt nạ rồi làm mờ
            mn = Image.fromarray((giu * 255).astype(np.uint8), 'L').filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(8))
            k = np.asarray(mn).astype(np.float32)[..., None] / 255.0
            o = Image.fromarray((a * k).clip(0, 255).astype(np.uint8), 'RGB')
            bb = Image.fromarray((np.asarray(o).max(axis=2) > 12).astype(np.uint8) * 255).getbbox()
        else:
            o = tach_trang(o)
            al = np.asarray(o)[..., 3]
            giu = khoi_lon_nhat(al > 40, 15)
            mn = Image.fromarray((giu * 255).astype(np.uint8), 'L').filter(ImageFilter.MaxFilter(7))
            arr = np.asarray(o).copy()
            arr[..., 3] = (arr[..., 3].astype(np.float32) * (np.asarray(mn) / 255.0)).astype(np.uint8)
            o = Image.fromarray(arr, 'RGBA')
            bb = o.getbbox()
        o = o.crop(bb)
        canh = max(o.size) + 8
        khung = Image.new(o.mode, (canh, canh), (0, 0, 0) if nen == 'den' else (0, 0, 0, 0))
        khung.paste(o, ((canh - o.width) // 2, (canh - o.height) // 2))
        khung = khung.resize((CO[nen], CO[nen]), Image.LANCZOS)
        ra = os.path.join(RA, nhom, id_ + '.webp')
        if nen == 'den':
            khung.save(ra, 'WEBP', quality=85, method=6)
        else:
            khung.save(ra, 'WEBP', quality=88, alpha_quality=90, method=6)
    print('ok', ten, '->', nhom, len(ids))
