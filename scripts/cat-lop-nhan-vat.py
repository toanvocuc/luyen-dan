# Cắt lớp búp bê nhân vật: Hinh_anh/nhan-vat/ -> public/hinh/nhan-vat/
# Chạy: python scripts/cat-lop-nhan-vat.py
#
# Ảnh gốc: than.png (thân trọc đầu, áo lót trắng) và các biến thể toc-N / mat-N / ao-N — mỗi biến thể là
# ảnh thân gốc được Gemini sửa đúng một phần. Lớp của một biến thể = những điểm ảnh KHÁC ảnh thân gốc,
# giới hạn trong vùng cơ thể mà loại lớp đó được phép đụng tới (để nhiễu lặt vặt ở chỗ khác không lọt vào).
# Mọi lớp xuất ra cùng một khung hình, nên chồng lên nhau là khớp: thân -> áo -> mặt -> tóc.
import glob
import importlib.util
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

DAY = os.path.dirname(os.path.abspath(__file__))
GOC = os.path.join(DAY, '..', 'Hinh_anh', 'nhan-vat')
RA = os.path.join(DAY, '..', 'public', 'hinh', 'nhan-vat')
CANH = 640  # cạnh ảnh xuất

# dùng lại hàm tách nền trắng của script xử lý ảnh
spec = importlib.util.spec_from_file_location('xu_ly_anh', os.path.join(DAY, 'xu-ly-anh.py'))
xu_ly_anh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(xu_ly_anh)

# Áo lót trắng của thân gốc trùng màu nền: phải bịt khe nét viền rộng hơn hẳn mặc định, nếu không lòng áo bị coi là nền và thủng.
xu_ly_anh.BIT_KHE = 18

NGUONG = 0.10  # khác nhau quá mức này (trên thang 0–1) mới tính là điểm thuộc lớp


def tach_nen_dac(im: Image.Image) -> Image.Image:
    """Tách nền trắng nhưng giữ ĐẶC mọi thứ nằm trong đường viền ngoài cùng.
    Khác hàm chung ở chỗ không coi mảng trắng kín bên trong là lỗ thủng — với nhân vật, đó là áo trắng."""
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    alpha = 1.0 - a.min(axis=2)
    ngoai = xu_ly_anh.vung_ngoai_thuong(alpha > 0.45)
    alpha_ra = np.where(ngoai, alpha, 1.0)
    alpha_ra[alpha_ra < 0.02] = 0.0
    an_toan = np.maximum(alpha_ra, 1e-3)[..., None]
    mau = np.where(ngoai[..., None], np.clip((a - (1.0 - an_toan)) / an_toan, 0, 1), a)
    return Image.fromarray((np.dstack([mau, alpha_ra[..., None]]) * 255).round().astype(np.uint8), 'RGBA')


def doc(ten):
    return np.asarray(Image.open(os.path.join(GOC, ten)).convert('RGB')).astype(np.float32) / 255.0


def mo(mat_na: np.ndarray, ban_kinh: int) -> np.ndarray:
    """Nở rồi làm mềm mép mặt nạ."""
    im = Image.fromarray((mat_na * 255).astype(np.uint8), 'L')
    if ban_kinh > 0:
        im = im.filter(ImageFilter.MaxFilter(2 * ban_kinh + 1))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255.0


def khung_dau(than_alpha: np.ndarray):
    """Ước lượng hộp đầu từ bóng thân gốc: đầu là phần hẹp phía trên, cổ là chỗ thắt lại rồi vai xoè ra."""
    h, w = than_alpha.shape
    rong = (than_alpha > 0.5).sum(axis=1)
    hang = np.nonzero(rong > 0)[0]
    tren = hang[0]
    # cổ là chỗ hẹp nhất trong khoảng 12%–35% chiều cao người tính từ đỉnh đầu (đầu + cổ luôn nằm trong đó)
    cao = hang[-1] - tren
    a, b = tren + int(cao * 0.12), tren + int(cao * 0.35)
    co = a + int(np.argmin(rong[a:b]))
    cot = np.nonzero((than_alpha[tren:co] > 0.5).sum(axis=0) > 0)[0]
    return tren, co, cot[0], cot[-1]


def main():
    os.makedirs(RA, exist_ok=True)
    than = doc('than.png')
    than_rgba = tach_nen_dac(Image.open(os.path.join(GOC, 'than.png')))
    than_alpha = np.asarray(than_rgba.getchannel('A')).astype(np.float32) / 255.0
    h, w = than_alpha.shape
    tren, co, trai, phai = khung_dau(than_alpha)
    print(f'dau: tren={tren} co={co} trai={trai} phai={phai}')
    yy, xx = np.mgrid[0:h, 0:w]

    # vùng được phép của từng loại lớp
    cao_dau = co - tren
    tam_x = (trai + phai) / 2
    vung = {
        # mặt: hình bầu dục trong lòng đầu, chừa đỉnh sọ và hai tai
        'mat': (((xx - tam_x) / ((phai - trai) * 0.40)) ** 2 + ((yy - (tren + cao_dau * 0.56)) / (cao_dau * 0.36)) ** 2) <= 1,
        # tóc: mọi thứ từ ngang ngực trở lên (tóc dài rủ xuống vai), trừ lòng mặt
        'toc': yy < co + cao_dau * 1.25,
        # áo: từ cổ trở xuống
        'ao': yy > co - cao_dau * 0.10,
    }

    than_rgba.resize((CANH, CANH), Image.LANCZOS).save(os.path.join(RA, 'than.png'), optimize=True)
    print('ok than.png')

    loi = 0
    for duong in sorted(glob.glob(os.path.join(GOC, '*.png'))):
        ten = os.path.basename(duong)
        loai = ten.split('-')[0]
        if loai not in vung:
            continue
        bien = doc(ten)
        if bien.shape != than.shape:
            print('SAI KICH THUOC', ten, bien.shape); loi += 1; continue
        khac = np.abs(bien - than).max(axis=2)
        mat_na = (khac > NGUONG) & vung[loai]
        if loai == 'toc':
            # tóc không được đè lên lòng mặt (chỗ đó thuộc lớp mặt), trừ phần tóc mai thật sự khác màu da rõ rệt
            mat_na &= ~(vung['mat'] & (khac < 0.30))
        # bỏ đốm lẻ: chỉ giữ điểm có đủ hàng xóm cùng khác
        dem = np.asarray(Image.fromarray((mat_na * 255).astype(np.uint8), 'L').filter(ImageFilter.BoxBlur(2))).astype(np.float32) / 255.0
        mat_na &= dem > 0.35
        ti_le = mat_na.mean()
        m = mo(mat_na, 2 if loai != 'mat' else 3)
        if loai == 'mat':
            # mặt là một miếng vá đặc phủ kín lòng mặt, mép mềm — để nét mặt cũ của thân gốc không lộ ra
            m = np.maximum(m, mo(vung['mat'], 0))
        rgba = np.asarray(tach_nen_dac(Image.open(duong))).astype(np.float32) / 255.0
        # bên trong bóng thân gốc thì lấy nguyên màu của biến thể, đặc hoàn toàn: phần vải màu nhạt (áo trắng ngọc)
        # dễ bị bước tách nền coi là nền trắng rồi làm thủng
        trong_than = than_alpha > 0.5
        rgba[trong_than, :3] = bien[trong_than]
        rgba[trong_than, 3] = 1.0
        rgba[..., 3] *= m
        ra = Image.fromarray((rgba * 255).round().astype(np.uint8), 'RGBA').resize((CANH, CANH), Image.LANCZOS)
        ra.save(os.path.join(RA, ten), optimize=True)
        # độ lệch ở phần KHÔNG thuộc lớp cho biết Gemini có lỡ sửa chỗ khác không
        ngoai = khac[(than_alpha > 0.5) & ~vung[loai]]
        lech = f'tb {ngoai.mean():.3f} / p99 {np.percentile(ngoai, 99):.3f}' if ngoai.size else 'khong do duoc'
        print(f'ok {ten}: lop chiem {ti_le * 100:.1f}% anh, lech ngoai vung {lech}')
    sys.exit(1 if loi else 0)


if __name__ == '__main__':
    main()
