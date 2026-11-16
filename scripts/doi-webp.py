# Đổi mọi ảnh PNG/JPG trong public/hinh sang WebP (nhẹ còn khoảng 1/3), xoá bản PNG/JPG, rồi ghi danh sách ảnh
# vào src/game/danhSachAnh.ts để game tải trước. Chạy sau xu-ly-anh.py và cat-lop-nhan-vat.py (package.json đã nối sẵn).
# Dùng: python scripts/doi-webp.py
import os
import sys

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
GOC = os.path.join(os.path.dirname(__file__), '..', 'public')
HINH = os.path.join(GOC, 'hinh')

doi = 0
for thu_muc, _, ds in os.walk(HINH):
    for ten in ds:
        goc_ten, duoi = os.path.splitext(ten)
        if duoi.lower() not in ('.png', '.jpg', '.jpeg'):
            continue
        p = os.path.join(thu_muc, ten)
        ra = os.path.join(thu_muc, goc_ten + '.webp')
        im = Image.open(p)
        if im.mode in ('RGBA', 'LA', 'P') and duoi.lower() == '.png':
            # ảnh tách nền: giữ kênh trong suốt sắc nét (viền nhân vật, khung chín ô)
            im.convert('RGBA').save(ra, 'WEBP', quality=85, alpha_quality=90, method=6)
        else:
            im.convert('RGB').save(ra, 'WEBP', quality=82, method=6)
        os.remove(p)
        doi += 1
print(f'doi {doi} anh sang webp')

ds = []
for thu_muc, _, tep in os.walk(HINH):
    for ten in tep:
        if ten.endswith('.webp'):
            ds.append(os.path.relpath(os.path.join(thu_muc, ten), GOC).replace(os.sep, '/'))
ds.sort()
ra = os.path.join(os.path.dirname(__file__), '..', 'src', 'game', 'danhSachAnh.ts')
with open(ra, 'w', encoding='utf-8', newline='') as f:
    f.write('// File này do scripts/doi-webp.py ghi lại mỗi lần đổi ảnh — đừng sửa tay.\n')
    f.write('/** Mọi ảnh trong public/ (đường dẫn tương đối, không có ./ đằng trước), để tải trước. */\n')
    f.write('export const DANH_SACH_ANH: readonly string[] = [\n')
    for d in ds:
        f.write(f"  '{d}',\n")
    f.write('];\n')
print(f'ghi {len(ds)} anh vao danhSachAnh.ts')
