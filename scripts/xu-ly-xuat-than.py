# Cắt tấm 8 cảnh xuất thân (Hinh_anh/xuat-than/tam-xuat-than.png, lưới 4 cột x 2 hàng)
# -> public/hinh/xuat-than/<id>.webp, nền giấy trắng ở mép thành trong suốt, khung vuông 320.
# Dùng: python scripts/xu-ly-xuat-than.py
import os
import sys

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
GOC = os.path.join(os.path.dirname(__file__), '..')
# chỉ mượn hàm tach_nen_mep, không chạy phần xử lý nhân vật
nguon = open(os.path.join(GOC, 'scripts', 'xu-ly-nhan-vat-thien.py'), encoding='utf-8').read()
ns: dict = {'__file__': os.path.join(GOC, 'scripts', 'xu-ly-nhan-vat-thien.py')}
exec(nguon.split('\nVAO = ')[0], ns)
tach_nen_mep = ns['tach_nen_mep']

THU_TU = ['nong-ho', 'thu-huong', 'thuong-gia', 'tho-san', 'y-su', 'tho-ren', 'co-nhi', 'dao-dong']
tam = Image.open(os.path.join(GOC, 'Hinh_anh', 'xuat-than', 'tam-xuat-than.png')).convert('RGB')
W, H = tam.size
RA = os.path.join(GOC, 'public', 'hinh', 'xuat-than')
os.makedirs(RA, exist_ok=True)
for i, ten in enumerate(THU_TU):
    c, h = i % 4, i // 4
    o = tam.crop((c * W // 4, h * H // 2, (c + 1) * W // 4, (h + 1) * H // 2))
    t = tach_nen_mep(o)
    t = t.crop(t.getbbox())
    canh = max(t.size)
    nen = Image.new('RGBA', (canh, canh), (0, 0, 0, 0))
    nen.alpha_composite(t, ((canh - t.width) // 2, (canh - t.height) // 2))
    nen = nen.resize((320, 320), Image.LANCZOS)
    nen.save(os.path.join(RA, ten + '.webp'), 'WEBP', quality=86, alpha_quality=90, method=6)
    print('ok', ten, t.size)
