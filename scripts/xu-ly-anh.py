# Tách nền trắng của ảnh gốc trong Hinh_anh/ và xuất ra public/hinh/ với kích thước dùng trong game.
# Chạy: python scripts/xu-ly-anh.py
#
# Cách tách: "màu thành độ trong" — điểm ảnh càng trắng thì càng trong suốt, nên quầng sáng
# vẽ trên nền trắng vẫn giữ được thành quầng sáng bán trong. Riêng phần BÊN TRONG vật thể thì giữ
# đặc hoàn toàn, để những chỗ màu nhạt (cánh hoa băng, viên đan trắng, điểm bóng sáng) không bị thủng.
#
# "Bên trong" được xác định theo hai kiểu:
#   - vật thể thường: vùng không loang được từ mép ảnh vào, sau khi đã BỊT các khe hở nhỏ ở nét viền;
#   - viên đan (hình tròn): cả hình tròn khớp theo thân viên — vì màu thân có khi gần trắng,
#     và Gemini hay vẽ khói cắt ngang nét viền làm hở một khe lớn không bịt nổi.
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

GOC = os.path.join(os.path.dirname(__file__), '..', 'Hinh_anh')
RA = os.path.join(os.path.dirname(__file__), '..', 'public', 'hinh')

# tên file gốc -> (tên xuất, cạnh dài tối đa)
VAT_THE = {
    'alchemy_pill_furnace.png': ('lo-dan.png', 720),
}
NEN = {
    'background.png': ('nen-dan-phong.jpg', 1920),
}
# thư mục con: mọi file .png bên trong được tách nền và xuất ra thư mục cùng tên -> (cạnh dài tối đa, là hình tròn?)
THU_MUC = {
    'duoc-lieu': (256, False),
    'dan': (256, True),
    'nguyen-lieu': (256, False),
}
BO_QUA = {'spirit_herb.png'}

BIT_KHE = 7  # bịt khe hở nét viền rộng tới 2*BIT_KHE điểm ảnh (ở ảnh gốc 1024)


def loang_tu_mep(chan: np.ndarray) -> np.ndarray:
    """Loang 4 hướng từ mép ảnh qua mọi điểm KHÔNG bị chắn. Trả về vùng tới được."""
    h, w = chan.shape
    toi = np.zeros((h, w), dtype=bool)
    hang = deque()

    def them(y, x):
        if not chan[y, x] and not toi[y, x]:
            toi[y, x] = True
            hang.append((y, x))

    for x in range(w):
        them(0, x); them(h - 1, x)
    for y in range(h):
        them(y, 0); them(y, w - 1)
    while hang:
        y, x = hang.popleft()
        if y + 1 < h: them(y + 1, x)
        if y > 0: them(y - 1, x)
        if x + 1 < w: them(y, x + 1)
        if x > 0: them(y, x - 1)
    return toi


def no_ra(m: np.ndarray) -> np.ndarray:
    """Nở vùng ra một điểm ảnh theo 8 hướng (cùng kiểu hình vuông với MaxFilter dùng để bịt khe)."""
    r = m.copy()
    r[1:, :] |= m[:-1, :]
    r[:-1, :] |= m[1:, :]
    n = r.copy()
    n[:, 1:] |= r[:, :-1]
    n[:, :-1] |= r[:, 1:]
    return n


def vung_ngoai_thuong(dac: np.ndarray) -> np.ndarray:
    # nét viền nở dày ra để bịt khe, loang từ mép, rồi lấn ngược lại đúng phần đã nở (không lọt qua khe)
    day = np.asarray(Image.fromarray((dac * 255).astype(np.uint8), 'L').filter(ImageFilter.MaxFilter(2 * BIT_KHE + 1))) > 127
    ngoai = loang_tu_mep(day)
    for _ in range(BIT_KHE + 1):
        ngoai = no_ra(ngoai) & ~dac
    return ngoai


def vung_ngoai_tron(dac: np.ndarray) -> np.ndarray:
    # khớp hình tròn theo bề ngang và đáy của thân viên (khói chỉ bay lên trên nên không dùng mép trên)
    h, w = dac.shape
    cot = np.nonzero(dac.sum(axis=0) > 10)[0]
    hang_ = np.nonzero(dac.sum(axis=1) > 10)[0]
    if len(cot) == 0 or len(hang_) == 0:
        return vung_ngoai_thuong(dac)
    cx = (cot[0] + cot[-1]) / 2
    r = (cot[-1] - cot[0]) / 2
    cy = hang_[-1] - r
    yy, xx = np.mgrid[0:h, 0:w]
    return (xx - cx) ** 2 + (yy - cy) ** 2 > (r + 1) ** 2


def nen_giay(im: Image.Image) -> bool:
    """Ảnh có nền màu giấy (Gemini không vẽ nền trắng như dặn) không: xét dải 6px quanh mép."""
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    mep = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    return float(np.median(mep.min(axis=1))) < 0.95


def anh_nen_giay(im: Image.Image) -> np.ndarray:
    """Ước lượng màu giấy tại từng điểm (nền loang từ kem sang trắng): lấy điểm sáng nhất quanh đó rồi làm mịn."""
    w, h = im.size
    nho = im.convert('RGB').resize((max(1, w // 8), max(1, h // 8)), Image.BILINEAR)
    nho = nho.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(6))
    return np.asarray(nho.resize((w, h), Image.BILINEAR)).astype(np.float32) / 255.0


def tach_nen(im: Image.Image, tron: bool = False, giay: bool = False) -> Image.Image:
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    goc = a
    if giay:
        # nền giấy: chia cho màu giấy để giấy thành trắng tuyệt đối, rồi tách như thường; bên trong vật giữ màu gốc
        a = np.clip(a / np.maximum(anh_nen_giay(im), 0.3), 0, 1)
    # độ đục nếu coi nền là trắng tuyệt đối
    alpha = 1.0 - a.min(axis=2)
    dac = alpha > 0.45  # điểm "đặc" của vật thể (viền đậm, thân vật)

    ngoai = vung_ngoai_tron(dac) if tron else vung_ngoai_thuong(dac)

    if tron:
        # ngoài hình tròn chỉ giữ quầng sáng mỏng sát mép; khói và tia lấp lánh ở xa thì xoá hẳn
        than = Image.fromarray(((~ngoai) * 255).astype(np.uint8), 'L')
        gan = np.asarray(than.filter(ImageFilter.GaussianBlur(10))).astype(np.float32) / 255.0
        alpha = np.where(ngoai, np.minimum(alpha, 0.6) * np.clip(gan * 2.6 - 0.2, 0, 1), alpha)
    else:
        # lỗ kín thật sự của vật thể (vd lòng quai lò): mảng gần trắng tuyệt đối, đủ lớn -> cũng là bên ngoài
        h, w = dac.shape
        gan_trang = (alpha < 0.05) & ~ngoai
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
            if len(mang) > 400:
                for y, x in mang:
                    ngoai[y, x] = True

    # bên trong: đặc hẳn. bên ngoài: bán trong theo độ trắng, và gỡ phần trắng đã pha vào màu
    alpha_ra = np.where(ngoai, alpha, 1.0)
    alpha_ra[alpha_ra < 0.02] = 0.0
    an_toan = np.maximum(alpha_ra, 1e-3)[..., None]
    mau_go = np.clip((a - (1.0 - an_toan)) / an_toan, 0, 1)
    mau = np.where(ngoai[..., None], mau_go, goc)
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
            # ảnh lò gốc có thể đã được dời vào thư mục lo/
            p = os.path.join(GOC, 'lo', goc)
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
    for thu_muc, (canh, tron) in THU_MUC.items():
        vao = os.path.join(GOC, thu_muc)
        if not os.path.isdir(vao):
            print('THIEU thu muc', thu_muc); loi += 1; continue
        os.makedirs(os.path.join(RA, thu_muc), exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            if not ten.lower().endswith('.png') or ten in BO_QUA:
                continue
            goc_anh = Image.open(os.path.join(vao, ten))
            if ten in TACH_THUONG:
                # viên đan trắng đặt trên hình trắng: tách kiểu tròn giữ nhầm cả đĩa nền, nên tách thường rồi lấp lỗ kín bên trong
                im = thu_nho(cat_sat(lap_lo(tach_nen(goc_anh, False), goc_anh)), canh)
            else:
                im = thu_nho(cat_sat(tach_nen(goc_anh, tron)), canh)
            im.save(os.path.join(RA, thu_muc, ten), optimize=True)
            print('ok', thu_muc + '/' + ten, im.size)
    # ghi danh sách đan đã có ảnh riêng, để game biết đan nào còn phải mượn ảnh
    co = sorted({os.path.splitext(t)[0] for t in os.listdir(os.path.join(RA, 'dan')) if t.endswith(('.png', '.webp'))})
    with open(os.path.join(os.path.dirname(__file__), '..', 'src', 'game', 'anhDanCoSan.ts'), 'w', encoding='utf-8', newline='') as f:
        f.write('// File này do scripts/xu-ly-anh.py ghi lại mỗi lần xử lý ảnh — đừng sửa tay.\n')
        f.write('/** Những đan phương đã có ảnh riêng trong public/hinh/dan/. */\n')
        f.write('export const ANH_DAN_CO_SAN: ReadonlySet<string> = new Set([' + ', '.join("'" + t + "'" for t in co) + ']);\n')

    # ảnh nền theo bậc cảnh giới: Hinh_anh/nen/dong-phu-1.png … dan-phong-5.png -> public/hinh/nen/*.jpg (chưa có thì bỏ qua)
    vao = os.path.join(GOC, 'nen')
    if os.path.isdir(vao):
        os.makedirs(os.path.join(RA, 'nen'), exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            goc_ten, duoi = os.path.splitext(ten)
            if duoi.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
                continue
            im = thu_nho(Image.open(os.path.join(vao, ten)).convert('RGB'), 1920)
            im.save(os.path.join(RA, 'nen', goc_ten + '.jpg'), quality=86)
            print('ok nen/' + ten, im.size)

    # ảnh giao diện: Hinh_anh/ui/*.png -> public/hinh/ui/ (nút tròn nut-*.png thu về 256, khung và bảng giữ tới 1024)
    vao = os.path.join(GOC, 'ui')
    if os.path.isdir(vao):
        os.makedirs(os.path.join(RA, 'ui'), exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            if not ten.lower().endswith('.png'):
                continue
            canh = 256 if ten.startswith(('nut-', 'tong-')) else 1024
            im = thu_nho(cat_sat(tach_nen(Image.open(os.path.join(vao, ten)))), canh)
            im.save(os.path.join(RA, 'ui', ten), optimize=True)
            print('ok ui/' + ten, im.size)
            if ten == 'khung-bang.png':
                # bản lòng tối: chỉ hạ sáng phần lòng màu ngọc (lục và lam trội hơn đỏ), viền đồng giữ nguyên
                a = np.asarray(im).astype(np.float32)
                long_ = (a[..., 1] > a[..., 0] + 15) & (a[..., 2] > a[..., 0] + 15)
                a[long_, :3] *= 0.42
                Image.fromarray(a.round().astype(np.uint8), 'RGBA').save(os.path.join(RA, 'ui', 'khung-bang-toi.png'), optimize=True)
                print('ok ui/khung-bang-toi.png')

    # vườn dược: nen-vuon.* là ảnh nền, còn lại là ô đất và các giai đoạn cây (tách nền)
    vao = os.path.join(GOC, 'vuon')
    if os.path.isdir(vao):
        os.makedirs(os.path.join(RA, 'vuon'), exist_ok=True)
        os.makedirs(os.path.join(RA, 'nen'), exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            goc_ten, duoi = os.path.splitext(ten)
            if duoi.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
                continue
            im = Image.open(os.path.join(vao, ten))
            if goc_ten.startswith('nen'):
                thu_nho(im.convert('RGB'), 1920).save(os.path.join(RA, 'nen', 'vuon.jpg'), quality=86)
                print('ok vuon/' + ten, '-> nen/vuon.jpg')
                continue
            im = thu_nho(cat_sat(tach_nen(im)), 384 if goc_ten.startswith('o-') else 256)
            im.save(os.path.join(RA, 'vuon', goc_ten + '.png'), optimize=True)
            print('ok vuon/' + ten, im.size)

    # lò đan mua ở phường thị: Hinh_anh/lo/<id>.png -> public/hinh/lo/ (cùng cỡ với lò mặc định)
    vao = os.path.join(GOC, 'lo')
    if os.path.isdir(vao):
        os.makedirs(os.path.join(RA, 'lo'), exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            if not ten.lower().endswith('.png'):
                continue
            im = thu_nho(cat_sat(tach_nen(Image.open(os.path.join(vao, ten)))), 720)
            # ảnh lò gốc chính là Thanh Đồng Lô
            ten = 'thanh-dong-lo.png' if ten in VAT_THE else ten
            im.save(os.path.join(RA, 'lo', ten), optimize=True)
            print('ok lo/' + ten, im.size)

    # mảnh hiệu ứng: Hinh_anh/hieu-ung/*.png vẽ trên NỀN ĐEN -> PNG trắng có độ đục bằng độ sáng.
    # Game dùng chúng làm mặt nạ rồi tô màu theo phẩm đan, nên chỉ cần hình dạng, không cần màu gốc.
    vao = os.path.join(GOC, 'hieu-ung')
    if os.path.isdir(vao):
        os.makedirs(os.path.join(RA, 'hieu-ung'), exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            if not ten.lower().endswith('.png'):
                continue
            a = np.asarray(Image.open(os.path.join(vao, ten)).convert('RGB')).astype(np.float32) / 255.0
            sang = a.max(axis=2)
            # nền đen của Gemini thường là xám rất tối chứ không phải 0: cắt đáy rồi kéo giãn lại
            sang = np.clip((sang - 0.07) / 0.86, 0, 1)
            # dấu ✦ của Gemini luôn nằm ở góc dưới phải: xoá hẳn góc đó (các mảnh hiệu ứng đều để trống góc)
            h, w = sang.shape
            sang[int(h * 0.84):, int(w * 0.80):] = 0
            ra = np.dstack([np.ones_like(a), sang[..., None]])
            im = Image.fromarray((ra * 255).round().astype(np.uint8), 'RGBA')
            im = thu_nho(im, 96 if ten.startswith('hat') else 640)
            im.save(os.path.join(RA, 'hieu-ung', ten), optimize=True)
            print('ok hieu-ung/' + ten, im.size)

    # âm thanh: Am_thanh/*.mp3 -> public/am/ (chép nguyên; âm lượng và điểm lặp chỉnh trong src/amThanh.ts)
    vao = os.path.join(os.path.dirname(__file__), '..', 'Am_thanh')
    if os.path.isdir(vao):
        import shutil
        ra_am = os.path.join(os.path.dirname(__file__), '..', 'public', 'am')
        os.makedirs(ra_am, exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            if ten.lower().endswith(('.mp3', '.ogg', '.wav')):
                shutil.copyfile(os.path.join(vao, ten), os.path.join(ra_am, ten))
                print('ok am/' + ten)

    xu_ly_ky_ngo()
    xu_ly_mo_dau()
    xu_ly_trang_thai()
    sys.exit(1 if loi else 0)


def noi_dai(im: Image.Image, ti_le: float) -> Image.Image:
    """Nối ảnh nền theo chiều dọc cho đủ cao = rộng × ti_le: bản trên ở đầu, bản dưới ở cuối, đoạn chồng giữa hoà tuyến tính."""
    w, h = im.size
    cao = round(w * ti_le)
    if cao <= h:
        return im
    chong = 2 * h - cao  # đoạn hai bản chồng lên nhau
    a = np.asarray(im).astype(np.float32)
    ra = np.zeros((cao, w, 3), dtype=np.float32)
    ra[:h] = a
    ra[cao - h:] = a
    if chong > 0:
        t = np.linspace(0, 1, chong, dtype=np.float32)[:, None, None]
        ra[cao - h:h] = a[h - chong:] * (1 - t) + a[:chong] * t
    return Image.fromarray(ra.round().clip(0, 255).astype(np.uint8), 'RGB')


def va_dau_sao(im: Image.Image, tam: tuple[int, int], r: int, den: bool = False) -> Image.Image:
    """Xoá dấu ✦ Gemini in ở góc: tô đen (nền đen) hoặc vá bằng mảng nền ngay bên trái, mép hoà mềm."""
    im = im.convert('RGB').copy()
    x, y = tam
    hop = (x - r, y - r, x + r, y + r)
    if den:
        im.paste((0, 0, 0), hop)
        return im
    manh = im.crop((x - 3 * r, y - r, x - r, y + r))
    mat = Image.new('L', manh.size, 0)
    ImageDraw.Draw(mat).ellipse((2, 2, manh.width - 2, manh.height - 2), fill=255)
    im.paste(manh, (x - r, y - r), mat.filter(ImageFilter.GaussianBlur(3)))
    return im


def xu_ly_mo_dau():
    """Đoạn mở đầu + màn tiêu đề: Hinh_anh/mo-dau -> public/hinh/mo-dau (rồi chạy doi-webp.py).
    canh-dan-lao, man-tieu-de: tranh giữ nền (vá dấu ✦); logo: nền đen (tô đen dấu ✦, game dùng mix-blend screen); dan-*: tách nền."""
    vao = os.path.join(GOC, 'mo-dau')
    if not os.path.isdir(vao):
        return
    ra = os.path.join(RA, 'mo-dau')
    os.makedirs(ra, exist_ok=True)
    dau = {'canh-dan-lao': ((482, 934), 22, False), 'man-tieu-de': ((487, 939), 18, False), 'logo': ((934, 482), 26, True)}
    for ten in sorted(os.listdir(vao)):
        goc_ten, duoi = os.path.splitext(ten)
        if duoi.lower() != '.png':
            continue
        im = Image.open(os.path.join(vao, ten))
        if goc_ten.startswith('dan-'):
            im = thu_nho(cat_sat(tach_nen(im)), 384)
            im.save(os.path.join(ra, ten), optimize=True)
        else:
            if goc_ten in dau:
                tam, r, den = dau[goc_ten]
                im = va_dau_sao(im, tam, r, den)
            im = thu_nho(im.convert('RGB'), 1280)
            im.save(os.path.join(ra, goc_ten + '.jpg'), quality=88)
        print('ok mo-dau/' + ten, im.size)


# ảnh trong THU_MUC phải tách kiểu thường + lấp lỗ (xem lap_lo)
TACH_THUONG = {'ho-dao-dan.png', 'ket-kim-dan.png', 'hoa-than-dan.png', 'pha-hu-dan.png', 'dung-the-dan.png'}


def lap_lo(im: Image.Image, goc: Image.Image) -> Image.Image:
    """Lấp mọi lỗ trong suốt nằm kín bên trong vật (không thông ra mép ảnh) bằng màu gốc, đặc hoàn toàn."""
    a = np.asarray(im).copy()
    dac = a[..., 3] > 40
    h, w = dac.shape
    ngoai = np.zeros_like(dac)
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
            if 0 <= ny < h and 0 <= nx < w and not dac[ny, nx] and not ngoai[ny, nx]:
                ngoai[ny, nx] = True
                hang.append((ny, nx))
    lo = ~dac & ~ngoai
    g = np.asarray(goc.convert('RGB'))
    a[lo, :3] = g[lo]
    a[lo, 3] = 255
    return Image.fromarray(a, 'RGBA')


def xu_ly_trang_thai():
    """Thẻ trạng thái: Hinh_anh/trang-thai/*.png (tranh 1024×765 trên giấy) -> public/hinh/trang-thai/*.jpg, vá dấu ✦ góc dưới phải."""
    vao = os.path.join(GOC, 'trang-thai')
    if not os.path.isdir(vao):
        return
    ra = os.path.join(RA, 'trang-thai')
    os.makedirs(ra, exist_ok=True)
    for ten in sorted(os.listdir(vao)):
        goc_ten, duoi = os.path.splitext(ten)
        if duoi.lower() != '.png':
            continue
        im = Image.open(os.path.join(vao, ten))
        w, h = im.size
        im = thu_nho(va_dau_sao(im, (w - 95, h - 80), 18), 800)
        im.save(os.path.join(ra, goc_ten + '.jpg'), quality=86)
        print('ok trang-thai/' + ten, im.size)


def xu_ly_ky_ngo():
    """Bản đồ và kỳ ngộ. Chạy riêng được: python -c "import importlib.util as u; ..." hoặc qua main.
    - ban-do/nen-*.png: nền giấy -> jpg; ban-do/dau-*.png: dấu nhỏ (tách nền, 128); còn lại là địa điểm (tách nền, 384).
    - ky-ngo/<sự kiện>-N.png: tranh kể chuyện vẽ trên giấy -> jpg, giữ nguyên nền; giay.png -> jpg;
      khung.png và nv-*.png: tách nền (khung giữ 768, chân dung 512)."""
    vao = os.path.join(GOC, 'ban-do')
    if os.path.isdir(vao):
        os.makedirs(os.path.join(RA, 'ban-do'), exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            goc_ten, duoi = os.path.splitext(ten)
            if duoi.lower() != '.png':
                continue
            im = Image.open(os.path.join(vao, ten))
            if goc_ten.startswith('nen'):
                thu_nho(im.convert('RGB'), 1280).save(os.path.join(RA, 'ban-do', goc_ten + '.jpg'), quality=85)
                print('ok ban-do/' + goc_ten + '.jpg')
                # bản đồ dài: nối hai bản cùng chiều, chồng lên nhau một đoạn và hoà dần để không lộ đường nối
                noi_dai(thu_nho(im.convert('RGB'), 1280), 1740 / 572).save(os.path.join(RA, 'ban-do', goc_ten + '-dai.jpg'), quality=85)
                print('ok ban-do/' + goc_ten + '-dai.jpg')
                continue
            im = thu_nho(cat_sat(tach_nen(im)), 128 if goc_ten.startswith('dau-') else 384)
            im.save(os.path.join(RA, 'ban-do', ten), optimize=True)
            print('ok ban-do/' + ten, im.size)
    vao = os.path.join(GOC, 'ky-ngo')
    if os.path.isdir(vao):
        os.makedirs(os.path.join(RA, 'ky-ngo'), exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            goc_ten, duoi = os.path.splitext(ten)
            if duoi.lower() != '.png':
                continue
            im = Image.open(os.path.join(vao, ten))
            if goc_ten == 'khung' or goc_ten.startswith('nv-'):
                im = thu_nho(cat_sat(tach_nen(im, giay=goc_ten.startswith('nv-') and nen_giay(im))), 768 if goc_ten == 'khung' else 512)
                im.save(os.path.join(RA, 'ky-ngo', ten), optimize=True)
            else:
                im = thu_nho(im.convert('RGB'), 512 if goc_ten == 'giay' else 800)
                im.save(os.path.join(RA, 'ky-ngo', goc_ten + '.jpg'), quality=84)
            print('ok ky-ngo/' + ten, im.size)


if __name__ == '__main__':
    main()
