// Mô phỏng cân bằng: chạy `npm run mo-phong`. Không cần trình duyệt.
// In ra, với từng đan phương và từng kiểu chơi, tỉ lệ nổ lò + phân bố phẩm cấp + giá trị kỳ vọng mỗi mẻ.
import { DAN_PHUONG, DUOC_LIEU, HE_SO_GIA, HE_SO_DAN_VAN, LUAT, laDanThat, NANG_CAP_GOC, PHU_LIEU, timDuocLieu, type Tuoi } from '../src/game/duLieu.ts';
import { batDauMe, giuLua, moLo, tinhTiLe, vaoChuThien, type Me } from '../src/game/luyenDan.ts';

// bộ sinh số ngẫu nhiên có hạt giống, để kết quả lặp lại được
function taoRng(hat: number) {
  let s = hat >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface KieuChoi {
  ten: string;
  tuoi: Tuoi;
  /** Phần thời gian giữ lửa trong vùng; phần còn lại chia đều nóng/lạnh. */
  trong: number;
  chuThien: number;
  phuLieu: string | null;
}

const KIEU: KieuChoi[] = [
  { ten: 'vụng, thuốc rẻ, thu ngay', tuoi: 0, trong: 0.45, chuThien: 0, phuLieu: null },
  { ten: 'khá, thuốc rẻ, thu ngay', tuoi: 0, trong: 0.75, chuThien: 0, phuLieu: null },
  { ten: 'khá, thuốc trăm năm, thu ngay', tuoi: 1, trong: 0.75, chuThien: 0, phuLieu: null },
  { ten: 'khá, trăm năm, 2 chu thiên', tuoi: 1, trong: 0.75, chuThien: 2, phuLieu: null },
  { ten: 'giỏi, ngàn năm, Hỏa Tinh, 3 chu thiên', tuoi: 2, trong: 0.9, chuThien: 3, phuLieu: 'hoa-tinh' },
  { ten: 'giỏi, ngàn năm, Ngưng Thần, 3 chu thiên', tuoi: 2, trong: 0.9, chuThien: 3, phuLieu: 'ngung-than-thao' },
];

function luyen(me: Me, giay: number, trong: number): Me {
  const conLai = giay * (1 - trong);
  let m = giuLua(me, 'trong', giay * trong);
  m = giuLua(m, 'lanh', conLai / 2);
  return giuLua(m, 'nong', conLai / 2);
}

const pt = (x: number) => (x * 100).toFixed(1).padStart(5) + '%';
const SO_ME = 20000;
const rng = taoRng(12345);

for (const phuong of DAN_PHUONG) {
  console.log(`\n=== ${phuong.ten} (độ khó ${phuong.doKho}, giá gốc ${phuong.giaGoc}) ===`);
  console.log('kiểu chơi'.padEnd(40), 'nổ lò   phế    hạ     trung  thượng cực  | vốn   thu/mẻ  lãi/mẻ');
  for (const k of KIEU) {
    const pl = PHU_LIEU.find((p) => p.id === k.phuLieu) ?? null;
    let me = batDauMe([k.tuoi, k.tuoi, k.tuoi], pl, NANG_CAP_GOC);
    me = luyen(me, phuong.doan.reduce((s, d) => s + d.giay, 0), k.trong);
    for (let c = 0; c < k.chuThien; c++) {
      me = vaoChuThien(me);
      // mỗi chu thiên vùng hẹp hơn nên giữ lửa kém đi một chút
      me = luyen(me, LUAT.chuThien.giay, Math.max(0.2, k.trong - 0.08 * (c + 1)));
    }
    const t = tinhTiLe(phuong, me, NANG_CAP_GOC);
    const von = phuong.lieu.reduce((s, id) => s + timDuocLieu(id).gia[k.tuoi], 0) + (pl?.gia ?? 0);

    let thu = 0;
    let no = 0;
    for (let i = 0; i < SO_ME; i++) {
      const kq = moLo(phuong, me, NANG_CAP_GOC, rng);
      if (kq.noLo) {
        no++;
        continue;
      }
      for (const v of kq.vien) if (laDanThat(v.pham)) thu += phuong.giaGoc * HE_SO_GIA[v.pham] * (v.danVan ? HE_SO_DAN_VAN : 1);
    }
    const thuTb = thu / SO_ME;
    console.log(
      k.ten.padEnd(40),
      pt(no / SO_ME), ...t.vien.map(pt),
      '|', String(von).padStart(4), thuTb.toFixed(0).padStart(7), (thuTb - von).toFixed(0).padStart(7),
    );
  }
}
console.log(`\n(${SO_ME} mẻ mỗi dòng; ${DUOC_LIEU.length} dược liệu, ${DAN_PHUONG.length} đan phương)`);
