// Mô phỏng cân bằng: chạy `npm run mo-phong`. Không cần trình duyệt.
// Người chơi được mô tả bằng tay nghề: giữ lửa (phần thời gian trong vùng / quá nóng) và độ lệch thời điểm
// khi bấm dừng con lắc (mili giây, phân bố chuẩn). Với mỗi đan phương và mỗi kiểu chơi, in ra tỉ lệ hỏng mẻ,
// cấp tôi đan đạt được, phân bố phẩm, và lãi kỳ vọng mỗi mẻ khi bán ở phường thị.
import { DAN_PHUONG, LUAT, NANG_CAP_GOC, giaBan, laDanThat, timDuocLieu, type Tuoi } from '../src/game/duLieu.ts';
import { batDauMe, coTheToi, khongHoaGia, moLo, quaAp, tocDoGoc, toiDan, vungToi } from '../src/game/luyenDan.ts';

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
const rng = taoRng(12345);
const chuan = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

interface TayNghe {
  ten: string;
  trong: number;
  nong: number;
  /** Độ lệch chuẩn của thời điểm bấm (ms). Người thường khoảng 60–90, giỏi 40–50. */
  lechMs: number;
}
const TAY: TayNghe[] = [
  { ten: 'vụng', trong: 0.5, nong: 0.18, lechMs: 120 },
  { ten: 'khá', trong: 0.7, nong: 0.1, lechMs: 75 },
  { ten: 'giỏi', trong: 0.85, nong: 0.05, lechMs: 45 },
];
/** Tôi tới cấp này thì thu (0 = không tôi). Luôn dừng sớm nếu áp lò không còn chịu nổi một lần lệch. */
const DUNG_O = [0, 2, 4, 6];

const pt = (x: number) => (x * 100).toFixed(0).padStart(3) + '%';
const SO_ME = 8000;
const TUOI: Tuoi = 0;

for (const phuong of DAN_PHUONG) {
  console.log(`\n=== ${phuong.ten} (độ khó ${phuong.doKho}, thuốc 10 năm, hạ phẩm bán ${giaBan(phuong, 0)}) ===`);
  console.log('tay nghề, mục tiêu'.padEnd(20), 'nổ-lửa hỏng  cấp  viên |  phế   hạ trung thượng văn |  vốn   thu   lãi');
  const von = phuong.lieu.reduce((s, id) => s + timDuocLieu(id).gia[TUOI], 0);
  for (const tay of TAY) {
    for (const dungO of DUNG_O) {
      let thu = 0, noLua = 0, hong = 0, tongVien = 0, tongCap = 0, soMeSong = 0;
      const dem = [0, 0, 0, 0, 0]; // phế, hạ, trung, thượng, đan văn
      for (let i = 0; i < SO_ME; i++) {
        // tay nghề dao động mỗi mẻ một chút
        const trong = Math.min(0.98, Math.max(0.1, tay.trong + chuan() * 0.08));
        const nong = Math.max(0, tay.nong + chuan() * 0.04);
        let me = khongHoaGia(phuong, batDauMe([TUOI, TUOI, TUOI], null, NANG_CAP_GOC), NANG_CAP_GOC, trong, Math.min(nong, 1 - trong));
        if (quaAp(me)) {
          noLua++; hong++; thu -= LUAT.giaSuaLo;
          continue;
        }
        let no = false;
        while (me.cap < dungO && coTheToi(me) && me.apLo + LUAT.toi.apLech < LUAT.apNoLo) {
          const v = vungToi(phuong, me, rng());
          // nhắm vào tâm khoảng xanh; lệch thời điểm đổi ra lệch vị trí theo tốc độ con lắc tại đó
          const tocDo = tocDoGoc(v) * Math.sqrt(v.tam * (1 - v.tam));
          const x = v.tam + tocDo * (chuan() * tay.lechMs) / 1000;
          const r = toiDan(me, v, x, NANG_CAP_GOC);
          me = r.me;
          if (r.loai === 'no') { no = true; break; }
        }
        if (no) { hong++; thu -= LUAT.giaSuaLo; continue; }
        if (me.soVien <= 0) { hong++; continue; }
        soMeSong++; tongCap += me.cap;
        for (const vien of moLo(phuong, me, rng).vien) {
          tongVien++;
          if (vien.danVan) { dem[4]++; thu += giaBan(phuong, 3, true); }
          else if (laDanThat(vien.pham)) { dem[vien.pham + 1]++; thu += giaBan(phuong, vien.pham); }
          else dem[0]++;
        }
      }
      const tv = Math.max(1, tongVien);
      console.log(
        `${tay.ten}, tôi +${dungO}`.padEnd(20),
        pt(noLua / SO_ME).padStart(6), pt(hong / SO_ME), (tongCap / Math.max(1, soMeSong)).toFixed(1).padStart(5), (tongVien / SO_ME).toFixed(1).padStart(5), '|',
        ...dem.map((d) => pt(d / tv).padStart(5)),
        '|', String(von).padStart(4), (thu / SO_ME).toFixed(0).padStart(5), (thu / SO_ME - von).toFixed(0).padStart(5),
      );
    }
  }
}
console.log(`\n(${SO_ME} mẻ mỗi dòng. "nổ-lửa" = nổ ngay lúc khống hỏa; "hỏng" = mọi kiểu mất trắng. Lãi đã trừ tiền sửa lò ${LUAT.giaSuaLo}.)`);
