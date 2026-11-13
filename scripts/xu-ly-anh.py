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
from PIL import Image, ImageFilter

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


def tach_nen(im: Image.Image, tron: bool = False) -> Image.Image:
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
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
    for thu_muc, (canh, tron) in THU_MUC.items():
        vao = os.path.join(GOC, thu_muc)
        if not os.path.isdir(vao):
            print('THIEU thu muc', thu_muc); loi += 1; continue
        os.makedirs(os.path.join(RA, thu_muc), exist_ok=True)
        for ten in sorted(os.listdir(vao)):
            if not ten.lower().endswith('.png') or ten in BO_QUA:
                continue
            im = thu_nho(cat_sat(tach_nen(Image.open(os.path.join(vao, ten)), tron)), canh)
            im.save(os.path.join(RA, thu_muc, ten), optimize=True)
            print('ok', thu_muc + '/' + ten, im.size)
    # ghi danh sách đan đã có ảnh riêng, để game biết đan nào còn phải mượn ảnh
    co = sorted(os.path.splitext(t)[0] for t in os.listdir(os.path.join(RA, 'dan')) if t.endswith('.png'))
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
            canh = 256 if ten.startswith('nut-') else 1024
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

    sys.exit(1 if loi else 0)


if __name__ == '__main__':
    main()
