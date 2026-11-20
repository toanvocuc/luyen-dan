// Lực chiến: một con số để so sức, gom MỌI thứ ảnh hưởng tới trận đánh.
// Ý tưởng: lực chiến ≈ 10 × √(sát thương mỗi lượt × lượng máu hiệu dụng), nên mạnh công hay mạnh thủ đều được tính,
// và nhân đôi cả hai phía thì lực chiến cũng nhân đôi (con số tăng đều, so được giữa các nhân vật).
// - Chỉ số: lấy giá trị "chưa giảm" (không tính mất hồn, trúng độc… tạm thời) để con số ổn định, không nhảy theo trạng thái.
//   Phần đan, bùa, tâm pháp cộng chỉ số, linh thú cộng chỉ số, trang phục (sau này) đều đã nằm trong chỉ số.
// - Võ công: hệ số chiêu (phẩm, luyện thục), thiên phú hệ võ, tuyệt chiêu chia theo hồi chiêu, thân pháp, tâm pháp, hợp linh căn.
// - Linh thú xuất chiến (đánh hộ, đỡ hộ), môn quy tông môn.
import { HE, THIEN_PHU, heSoChieu, linhCanCua, thienPhuCua, timBiTich, timTrongTui, vaiCua, voKyPhu, MO_O, type BiTich } from './voCong.ts';
import { chiSoChuaGiam, tamPhapDangLap, type Kho } from './kho.ts';
import { thuXuatChien, timLoaiThu } from './linhThu.ts';

export interface PhanLucChien {
  ten: string;
  /** Phần lực chiến mục này góp thêm. */
  them: number;
  chu: string;
}
export interface LucChien {
  tong: number;
  phan: PhanLucChien[];
}

/** Các nút bật / tắt từng nguồn, để tách phần góp của từng nguồn. */
interface Bat {
  voKy: boolean;
  phu: boolean;
  tuyet: boolean;
  phuTro: boolean;
  linhCan: boolean;
  thu: boolean;
  tong: boolean;
}

function tinh(k: Kho, b: Bat): number {
  const s = {
    khiHuyet: chiSoChuaGiam(k, 'khiHuyet'),
    luc: chiSoChuaGiam(k, 'luc'),
    phongNgu: chiSoChuaGiam(k, 'phongNgu'),
    thanPhap: chiSoChuaGiam(k, 'thanPhap'),
    thanThuc: chiSoChuaGiam(k, 'thanThuc'),
  };
  const v = k.voCong;
  const cg = k.tuVi.canhGioi;
  const tp = thienPhuCua(k.nhanVat);
  const lc = linhCanCua(k.nhanVat);
  const voKy = b.voKy ? timTrongTui(v, v.lap.voKy) : null;
  const tuyet = b.tuyet && cg >= MO_O.tuyetChieu ? timTrongTui(v, v.lap.tuyetChieu) : null;
  const congCua = (bt: BiTich | null) => (bt && timBiTich(bt.id).he && !HE[timBiTich(bt.id).he!].ngoai ? s.thanThuc : s.luc);
  const heSoDu = (bt: BiTich) => heSoChieu(bt) * (1 + THIEN_PHU[tp[timBiTich(bt.id).he ?? 'quyen']].satThuong);

  // sát thương mỗi lượt: võ kỹ (không có thì quyền cước 80%) + tuyệt chiêu chia đều theo hồi chiêu
  let dps = voKy ? congCua(voKy) * heSoDu(voKy) : s.luc * 0.8;
  if (tuyet) dps += (congCua(tuyet) * heSoDu(tuyet)) / (timBiTich(tuyet.id).hoi ?? 3);
  // thân pháp: bạo kích (tới +10%) và né (tới +30% máu hiệu dụng), so với mặt bằng các chỉ số khác
  const tbKhac = Math.max(1, (s.luc + s.thanThuc + s.phongNgu) / 3);
  const r = s.thanPhap / tbKhac;
  dps *= 1 + (0.1 * r) / (r + 1);
  let ehp = s.khiHuyet * (1 + s.phongNgu / Math.max(1, s.khiHuyet / 10)) / (1 - (0.3 * r) / (r + 1));

  // chiêu phụ: phá / ngắt góp thêm chút sát thương (dùng xen kẽ), hộ thân góp máu hiệu dụng
  if (b.phu)
    for (const bt of voKyPhu(v, cg)) {
      if (!bt) continue;
      if (vaiCua(bt.id) === 'ho') ehp *= 1.06;
      else dps += (congCua(bt) * heSoDu(bt)) * 0.12;
    }
  if (b.phuTro) {
    const thanPhap = cg >= MO_O.thanPhap ? timTrongTui(v, v.lap.thanPhap)?.id : undefined;
    if (thanPhap) {
      ehp *= 1.05;
      dps *= 1.03;
    }
    const tam = tamPhapDangLap(k);
    if (tam.includes('hon-nguyen')) dps *= 1.05;
    if (tam.includes('thanh-tam')) dps *= 1.03;
    if (tam.includes('cuong-huyet')) dps *= 1.03;
  }
  if (b.linhCan) for (const bt of [voKy, tuyet]) if (bt?.nguyenTo && lc.he.includes(bt.nguyenTo)) dps *= 1 + 0.08 * lc.hieuLuc;
  if (b.thu) {
    const t = thuXuatChien(k);
    if (t) {
      const bac = timLoaiThu(t.loai).bac;
      dps *= 1 + 0.1 * (1 + 0.15 * bac);
      ehp *= 1.15;
    }
  }
  if (b.tong) {
    if (v.tongMon === 'thien-kiem') dps *= 1.05;
    if (v.tongMon === 'duoc-vuong') ehp *= 1.05;
  }
  return 10 * Math.sqrt(Math.max(0, dps) * Math.max(0, ehp));
}

/** Lực chiến và phần góp của từng nguồn (cộng lại đúng bằng tổng). */
export function lucChien(k: Kho): LucChien {
  if (!k.nhanVat || !k.voCong) return { tong: 0, phan: [] };
  const buoc: [keyof Bat, string, string][] = [
    ['voKy', 'Võ kỹ', 'phẩm, luyện thục, thiên phú hệ võ'],
    ['phu', 'Chiêu phụ', 'phá, ngắt đòn, hộ thân'],
    ['tuyet', 'Tuyệt chiêu', 'chia theo số lượt hồi chiêu'],
    ['phuTro', 'Thân pháp & tâm pháp', 'né đòn, kéo dài trạng thái…'],
    ['linhCan', 'Hợp linh căn', 'chiêu cùng hệ linh căn'],
    ['thu', 'Linh thú', 'đánh hộ, đỡ hộ'],
    ['tong', 'Môn quy', 'ưu đãi tông môn'],
  ];
  const bat: Bat = { voKy: false, phu: false, tuyet: false, phuTro: false, linhCan: false, thu: false, tong: false };
  let truoc = tinh(k, bat);
  const phan: PhanLucChien[] = [{ ten: 'Chỉ số & cảnh giới', them: Math.round(truoc), chu: 'khí huyết, lực, phòng ngự, thân pháp, thần thức (gồm đan, bùa, tâm pháp, linh thú)' }];
  for (const [khoa, ten, chu] of buoc) {
    bat[khoa] = true;
    const sau = tinh(k, bat);
    phan.push({ ten, them: Math.round(sau - truoc), chu });
    truoc = sau;
  }
  // làm tròn từng phần nhưng giữ tổng khớp
  const tong = phan.reduce((a, p) => a + p.them, 0);
  return { tong, phan };
}
