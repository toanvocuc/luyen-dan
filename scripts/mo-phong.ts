// Mô phỏng cân bằng: chạy `npm run mo-phong`. Không cần trình duyệt.
// Với từng đan phương và từng kiểu chơi (tay nghề giữ lửa, tuổi thuốc, tôi đan tới cấp mấy thì dừng),
// in ra tỉ lệ nổ lò, số viên, phân bố phẩm, và lãi kỳ vọng mỗi mẻ khi bán ở phường thị.
import { DAN_PHUONG, LUAT, NANG_CAP_GOC, giaBan, laDanThat, timDuocLieu, type Tuoi } from '../src/game/duLieu.ts';
import { batDauMe, coTheToi, giuLua, moLo, toiDan, type Me } from '../src/game/luyenDan.ts';

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
  /** Phần thời gian giữ lửa trong vùng; phần còn lại 70% nguội, 30% nóng. */
  trong: number;
  /** Tôi đan tới cấp này thì thu. */
  dungO: number;
}

const KIEU: KieuChoi[] = [
  { ten: 'vụng (45%), thuốc 10 năm, không tôi', tuoi: 0, trong: 0.45, dungO: 0 },
  { ten: 'khá (70%), thuốc 10 năm, không tôi', tuoi: 0, trong: 0.7, dungO: 0 },
  { ten: 'khá (70%), thuốc 10 năm, tôi +2', tuoi: 0, trong: 0.7, dungO: 2 },
  { ten: 'khá (70%), thuốc 10 năm, tôi +4', tuoi: 0, trong: 0.7, dungO: 4 },
  { ten: 'khá (70%), thuốc 10 năm, tôi +6', tuoi: 0, trong: 0.7, dungO: 6 },
  { ten: 'khá (70%), thuốc 100 năm, tôi +3', tuoi: 1, trong: 0.7, dungO: 3 },
  { ten: 'giỏi (85%), thuốc 1000 năm, tôi +3', tuoi: 2, trong: 0.85, dungO: 3 },
  { ten: 'giỏi (85%), thuốc 1000 năm, tôi +6', tuoi: 2, trong: 0.85, dungO: 6 },
];

function khongHoa(me: Me, giay: number, trong: number): Me {
  const conLai = giay * (1 - trong);
  let m = giuLua(me, 'trong', giay * trong);
  m = giuLua(m, 'lanh', conLai * 0.7);
  return giuLua(m, 'nong', conLai * 0.3);
}

const pt = (x: number) => (x * 100).toFixed(0).padStart(3) + '%';
const SO_ME = 20000;
const rng = taoRng(12345);

for (const phuong of DAN_PHUONG) {
  console.log(`\n=== ${phuong.ten} (độ khó ${phuong.doKho}, hạ phẩm bán ${giaBan(phuong, 0)}) ===`);
  console.log('kiểu chơi'.padEnd(38), 'hỏng  viên  phế   hạ trung thượng cực(văn) |  vốn   thu   lãi');
  for (const k of KIEU) {
    const tongGiay = phuong.doan.reduce((s, d) => s + d.giay, 0);
    const von = phuong.lieu.reduce((s, id) => s + timDuocLieu(id).gia[k.tuoi], 0);
    let thu = 0;
    let hong = 0;
    let tongVien = 0;
    const dem = [0, 0, 0, 0, 0]; // phế, hạ, trung, thượng, đan văn
    for (let i = 0; i < SO_ME; i++) {
      let me = khongHoa(batDauMe([k.tuoi, k.tuoi, k.tuoi], null, NANG_CAP_GOC), tongGiay, k.trong);
      let no = false;
      while (me.cap < k.dungO && coTheToi(me)) {
        const r = toiDan(phuong, me, NANG_CAP_GOC, rng());
        me = r.me;
        if (r.loai === 'no') {
          no = true;
          break;
        }
      }
      if (no) {
        hong++;
        thu -= LUAT.giaSuaLo;
        continue;
      }
      if (me.soVien <= 0) {
        hong++;
        continue;
      }
      for (const v of moLo(phuong, me, rng).vien) {
        tongVien++;
        if (v.danVan) {
          dem[4]++;
          thu += giaBan(phuong, 3, true);
        } else if (laDanThat(v.pham)) {
          dem[v.pham + 1]++;
          thu += giaBan(phuong, v.pham);
        } else dem[0]++;
      }
    }
    const tv = Math.max(1, tongVien);
    console.log(
      k.ten.padEnd(38),
      pt(hong / SO_ME), (tongVien / SO_ME).toFixed(1).padStart(5), ...dem.map((d) => pt(d / tv).padStart(5)),
      '   |', String(von).padStart(4), (thu / SO_ME).toFixed(0).padStart(5), (thu / SO_ME - von).toFixed(0).padStart(5),
    );
  }
}
console.log(`\n(${SO_ME} mẻ mỗi dòng. "hỏng" = nổ lò hoặc tổn hết viên. Lãi đã trừ tiền sửa lò ${LUAT.giaSuaLo}.)`);
