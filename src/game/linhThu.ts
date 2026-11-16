// Linh thú: mua trứng ở Tàng Bảo Các (Vạn Bảo Lâu), ấp trứng kiểu dưỡng đan (cấp ấp càng cao càng dễ ra thú bậc cao),
// nở ra thì nhận nuôi hoặc bỏ rơi; nuôi bằng đan (độ no, kén ăn theo bậc và dạng), lớn qua 3 dạng; một con xuất chiến cho tác dụng.
// Thuần tính toán. Ảnh: public/hinh/linh-thu/<loai>-<non|thanh|truong|trung>.webp, trứng mua: trung-chua-ro.webp.
import { DAN_PHUONG, LUAT, bacSo, timDanPhuong, type PhamThat } from './duLieu.ts';
import type { Kho } from './kho.ts';

export type LoaiThu = 'linh-tho' | 'nguyet-lang' | 'huyen-quy' | 'ky-lan' | 'duc-quang';
/** Bậc thú: 0 Thường, 1 Cao, 2 Thượng, 3 Huyền thoại, 4 Thần. */
export const TEN_BAC_THU = ['Thường', 'Cao', 'Thượng', 'Huyền thoại', 'Thần'] as const;
export const MAU_BAC_THU = ['#cfc6b0', '#7fd1a0', '#7fb8ff', '#d39bff', '#ffcf5a'] as const;
export const TEN_DANG = ['Con non', 'Thanh niên', 'Trưởng thành'] as const;
const DUOI_DANG = ['non', 'thanh', 'truong'] as const;

export interface LoaiThuDL {
  id: LoaiThu;
  ten: string;
  bac: number;
  moTa: string;
  /** Chỉ số gốc của thú (dạng trưởng thành, tiềm năng 50). */
  mau: number;
  sucManh: number;
}
export const LINH_THU: readonly LoaiThuDL[] = [
  { id: 'linh-tho', ten: 'Ngọc Nhĩ Linh Thố', bac: 0, moTa: 'Thỏ linh tai ngọc, nhanh nhẹn. Đi theo chủ thì thể lực du ngoạn hồi nhanh hơn.', mau: 80, sucManh: 10 },
  { id: 'nguyet-lang', ten: 'Ngân Nguyệt Lang', bac: 1, moTa: 'Sói bạc mang ấn trăng khuyết. Tăng Lực và Thân pháp của chủ.', mau: 120, sucManh: 30 },
  { id: 'huyen-quy', ten: 'Bích Thủy Huyền Quy', bac: 2, moTa: 'Rùa linh mai ngọc, nước theo chân. Tăng Khí huyết và Phòng ngự của chủ.', mau: 220, sucManh: 18 },
  { id: 'ky-lan', ten: 'Thanh Vân Kỳ Lân', bac: 3, moTa: 'Kỳ lân bờm mây, điềm lành. Tăng tỉ lệ đột phá và phá bình cảnh.', mau: 180, sucManh: 40 },
  { id: 'duc-quang', ten: 'Dực Quang Thần Thú', bac: 4, moTa: 'Chim cắt thần lửa vàng lam. Lửa của nó nâng phẩm đan và đẩy nhanh tu luyện.', mau: 200, sucManh: 60 },
];
export const timLoaiThu = (id: string) => LINH_THU.find((t) => t.id === id) ?? LINH_THU[0];
export const anhThu = (loai: string, dang: number) => `./hinh/linh-thu/${loai}-${DUOI_DANG[dang]}.webp`;
export const anhTrungThu = (loai: string) => `./hinh/linh-thu/${loai}-trung.webp`;
export const ANH_TRUNG_CHUA_RO = './hinh/linh-thu/trung-chua-ro.webp';

export interface Thu {
  uid: string;
  loai: LoaiThu;
  /** 0 con non, 1 thanh niên, 2 trưởng thành. */
  dang: number;
  /** Điểm trưởng thành trong dạng hiện tại. */
  lon: number;
  /** Độ no tại thời điểm lucNo (tụt dần theo đồng hồ thật). */
  no: number;
  lucNo: number;
  haoCam: number;
  /** 1–100: tố chất bẩm sinh, nhân vào chỉ số và tác dụng. */
  tiemNang: number;
}

// ---------- số cân bằng ----------
export const LUAT_THU = {
  soToiDa: 8,
  /** Độ no tụt hết 100 điểm trong bấy nhiêu giây. */
  giayNoHet: 12 * 3600,
  noMoiLan: 25,
  haoCamMoiLan: 3,
  /** Điểm trưởng thành cần để lên dạng kế, theo bậc thú: [non -> thanh niên, thanh niên -> trưởng thành]. */
  canLon: [
    [30, 80],
    [50, 130],
    [80, 200],
    [120, 300],
    [200, 500],
  ],
  /** Phẩm thấp nhất chịu ăn theo [bậc][dạng]: 0..3 = hạ..cực; 'dv5' = đan văn đã dưỡng từ 5 chuyển. */
  anToiThieu: [
    [0, 0, 1],
    [0, 1, 1],
    [1, 1, 2],
    [1, 2, 2],
    [2, 2, 'dv5'],
  ] as const,
  heSoDang: [0.4, 0.7, 1],
  /** Ấp trứng: tỉ lệ trúng ở từng cấp ấp (0..12), nhân với tiềm năng người chơi; trượt lùi `lui` cấp; trượt quá `truotToiDa` lần thì vỡ. */
  apTiLe: [0.95, 0.9, 0.85, 0.8, 0.74, 0.67, 0.6, 0.52, 0.44, 0.36, 0.28, 0.2, 0.12],
  lui: 2,
  truotToiDa: 3,
  /** Phân bố bậc thú khi nở theo cấp ấp (nội suy giữa các mốc): [Thường, Cao, Thượng, Huyền thoại, Thần] (%). */
  noBac: [
    [0, [80, 18, 2, 0, 0]],
    [5, [45, 35, 16, 4, 0]],
    [10, [20, 35, 30, 14, 1]],
    [13, [10, 25, 35, 27, 3]],
  ] as const,
  /** Giá trứng: linh thạch giaGoc × giaNhan^(cảnh giới − 1), cộng danh vọng Vạn Bảo. */
  giaGoc: 30000,
  giaNhan: 1.7,
  giaDanhVong: 50,
};
export const CAP_AP_TOI_DA = LUAT_THU.apTiLe.length;

// ---------- tiện ích ----------
const kep = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const noHienTai = (t: Thu, luc = Date.now()) => kep(t.no - (Math.max(0, luc - t.lucNo) / 1000) * (100 / LUAT_THU.giayNoHet), 0, 100);
export const canLon = (t: Thu) => (t.dang >= 2 ? 0 : LUAT_THU.canLon[timLoaiThu(t.loai).bac][t.dang]);
export const thuXuatChien = (k: Kho): Thu | null => k.linhThu.find((t) => t.uid === k.thuXuatChien) ?? null;
/** Chỉ số riêng của thú (để xem). */
export function chiSoThu(t: Thu) {
  const l = timLoaiThu(t.loai);
  const hs = LUAT_THU.heSoDang[t.dang] * (0.5 + t.tiemNang / 100);
  return { mau: Math.round(l.mau * hs), sucManh: Math.round(l.sucManh * hs) };
}
/** Hệ số tác dụng của thú xuất chiến (0 khi đói). */
export function hieuLucThu(t: Thu | null, luc = Date.now()): number {
  if (!t || noHienTai(t, luc) <= 0) return 0;
  return LUAT_THU.heSoDang[t.dang] * (0.6 + (0.4 * t.tiemNang) / 100) * (0.85 + (0.15 * t.haoCam) / 100);
}
/** Các tác dụng đang có của thú xuất chiến (đã nhân hiệu lực). Mọi chỗ trong game đọc qua đây. */
export function tacDungThu(k: Kho, luc = Date.now()) {
  const t = thuXuatChien(k);
  const h = hieuLucThu(t, luc);
  const la = (id: LoaiThu) => (t?.loai === id ? h : 0);
  return {
    theLuc: 0.6 * la('linh-tho'),
    lucThan: 0.3 * la('nguyet-lang'),
    mauPhong: 0.3 * la('huyen-quy'),
    dotPha: 0.12 * la('ky-lan'),
    pham: 0.4 * la('duc-quang'),
    tuLuyen: 0.5 * la('duc-quang'),
  };
}
/** Câu tả tác dụng hiện tại của một con (nếu nó xuất chiến). */
export function chuTacDung(t: Thu, luc = Date.now()): string {
  const h = hieuLucThu(t, luc);
  const pt = (x: number) => `${Math.round(x * 100)}%`;
  if (h <= 0) return 'Đang đói: chưa có tác dụng';
  switch (t.loai) {
    case 'linh-tho':
      return `Thể lực hồi nhanh +${pt(0.6 * h)}`;
    case 'nguyet-lang':
      return `Lực, Thân pháp +${pt(0.3 * h)}`;
    case 'huyen-quy':
      return `Khí huyết, Phòng ngự +${pt(0.3 * h)}`;
    case 'ky-lan':
      return `Tỉ lệ đột phá, phá bình cảnh +${pt(0.12 * h)}`;
    default:
      return `Phẩm đan nhích lên ${h < 0.5 ? 'một chút' : 'rõ rệt'}, tu luyện +${pt(0.5 * h)}`;
  }
}

// ---------- trứng ----------
export const giaTrung = (k: Kho) => Math.round(LUAT_THU.giaGoc * LUAT_THU.giaNhan ** Math.max(0, k.tuVi.canhGioi - 1));
export function muaTrung(k: Kho): Kho {
  const gia = giaTrung(k);
  if (k.linhThach < gia || (k.danhVong['van-bao'] ?? 0) < LUAT_THU.giaDanhVong) return k;
  return { ...k, linhThach: k.linhThach - gia, danhVong: { ...k.danhVong, 'van-bao': k.danhVong['van-bao'] - LUAT_THU.giaDanhVong }, trungThu: (k.trungThu ?? 0) + 1 };
}
/** Tiềm năng người chơi (0..1) từ tư chất + khí vận. */
export const tiemNangNguoi = (k: Kho) => ((k.nhanVat?.tuChat ?? 50) + (k.nhanVat?.khiVan ?? 50)) / 200;
export function tiLeAp(k: Kho, cap: number): number {
  if (cap >= CAP_AP_TOI_DA) return 0;
  return Math.min(0.97, LUAT_THU.apTiLe[cap] * (0.75 + 0.5 * tiemNangNguoi(k)));
}
/** Phân bố bậc thú (%) ở một cấp ấp. */
export function phanBoBac(cap: number): number[] {
  const m = LUAT_THU.noBac;
  for (let i = 0; i < m.length - 1; i++) {
    const [a, pa] = m[i];
    const [b, pb] = m[i + 1];
    if (cap <= b) {
      const t = (cap - a) / (b - a);
      return pa.map((x, j) => x + (pb[j] - x) * t);
    }
  }
  return [...m[m.length - 1][1]];
}
export function batDauAp(k: Kho): Kho {
  if (k.apTrung || (k.trungThu ?? 0) < 1) return k;
  return { ...k, trungThu: k.trungThu - 1, apTrung: { cap: 0, truot: 0 } };
}
/** Một lần truyền linh khí vào trứng. */
export function truyenLinhKhi(k: Kho, r: number): { kho: Kho; ket: 'trung' | 'truot' | 'vo' } | null {
  const a = k.apTrung;
  if (!a || a.cap >= CAP_AP_TOI_DA) return null;
  if (r < tiLeAp(k, a.cap)) return { kho: { ...k, apTrung: { ...a, cap: a.cap + 1 } }, ket: 'trung' };
  const truot = a.truot + 1;
  if (truot > LUAT_THU.truotToiDa) return { kho: { ...k, apTrung: null }, ket: 'vo' };
  return { kho: { ...k, apTrung: { cap: Math.max(0, a.cap - LUAT_THU.lui), truot } }, ket: 'truot' };
}
function taoThu(loai: LoaiThu, tiemNang: number, luc: number): Thu {
  return { uid: `${luc.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`, loai, dang: 0, lon: 0, no: 60, lucNo: luc, haoCam: 10, tiemNang: Math.round(kep(tiemNang, 1, 100)) };
}
/** Cho trứng đang ấp nở: quay bậc theo cấp ấp. Thú mới nằm ở `thuMoiNo` chờ nhận nuôi hoặc bỏ rơi. */
export function moTrung(k: Kho, r1: number, r2: number, luc = Date.now()): Kho {
  const a = k.apTrung;
  if (!a || k.thuMoiNo) return k;
  const pb = phanBoBac(a.cap);
  let x = r1 * pb.reduce((s, v) => s + v, 0);
  let bac = 0;
  while (bac < 4 && x >= pb[bac]) {
    x -= pb[bac];
    bac++;
  }
  const loai = LINH_THU.find((t) => t.bac === bac)!.id;
  return { ...k, apTrung: null, thuMoiNo: taoThu(loai, 15 + r2 * 60 + a.cap * 2, luc) };
}
/** Trứng Dực Quang (quà Linh Thú Thần Đan): nở thẳng ra thú Thần. */
export function moTrungDucQuang(k: Kho, r: number, luc = Date.now()): Kho {
  if (!k.trung || k.thuMoiNo) return k;
  return { ...k, trung: null, thuMoiNo: taoThu('duc-quang', 55 + r * 45, luc) };
}
export function nhanNuoi(k: Kho): Kho {
  if (!k.thuMoiNo || k.linhThu.length >= LUAT_THU.soToiDa) return k;
  const t = k.thuMoiNo;
  return { ...k, thuMoiNo: null, linhThu: [...k.linhThu, t], thuXuatChien: k.thuXuatChien ?? t.uid };
}
export const boRoiThuMoi = (k: Kho): Kho => ({ ...k, thuMoiNo: null });
export function boRoi(k: Kho, uid: string): Kho {
  const ds = k.linhThu.filter((t) => t.uid !== uid);
  return { ...k, linhThu: ds, thuXuatChien: k.thuXuatChien === uid ? (ds[0]?.uid ?? null) : k.thuXuatChien };
}
export const xuatChien = (k: Kho, uid: string): Kho => (k.linhThu.some((t) => t.uid === uid) ? { ...k, thuXuatChien: uid } : k);

// ---------- cho ăn ----------
/** Một món ăn: viên đan thường (theo phẩm), đan văn, hoặc viên đã dưỡng (khoá danChuyen). */
export interface MonAn {
  khoa: string;
  phuongId: string;
  loai: PhamThat | 'dv';
  chuyen: number;
  co: number;
}
export function dsMonAn(k: Kho): MonAn[] {
  const ra: MonAn[] = [];
  for (const p of DAN_PHUONG) {
    if ((k.danVan[p.id] ?? 0) > 0) ra.push({ khoa: `${p.id}|dv`, phuongId: p.id, loai: 'dv', chuyen: 0, co: k.danVan[p.id] });
    for (const ph of [3, 2, 1, 0] as PhamThat[]) if ((k.tuiDan[p.id]?.[ph] ?? 0) > 0) ra.push({ khoa: `${p.id}|${ph}`, phuongId: p.id, loai: ph, chuyen: 0, co: k.tuiDan[p.id][ph] });
  }
  for (const [khoa, co] of Object.entries(k.danChuyen)) {
    if (co <= 0) continue;
    const [phuongId, l, b] = khoa.split('|');
    ra.push({ khoa, phuongId, loai: l === 'dv' ? 'dv' : (Number(l) as PhamThat), chuyen: Number(b), co });
  }
  return ra;
}
/** Thú có chịu ăn món này không; không thì vì sao. */
export function chiuAn(t: Thu, m: MonAn, luc = Date.now()): string | null {
  if (noHienTai(t, luc) >= 100 - 0.5) return 'Đang no, không ăn thêm';
  const min = LUAT_THU.anToiThieu[timLoaiThu(t.loai).bac][t.dang];
  if (min === 'dv5') return m.loai === 'dv' && m.chuyen >= 5 ? null : 'Chỉ ăn đan văn đã dưỡng từ 5 chuyển';
  const muc = m.loai === 'dv' ? 4 : m.loai;
  return muc >= min ? null : `Chê: chỉ ăn đan từ ${['hạ', 'trung', 'thượng', 'cực'][min]} phẩm trở lên`;
}
/** Điểm trưởng thành một viên mang lại: bậc đan càng cao, phẩm càng cao, chuyển càng nhiều thì càng bổ. */
export const dinhDuong = (m: MonAn) => (bacSo(timDanPhuong(m.phuongId)) + 1) * LUAT.chiSo.heSoPham[m.loai === 'dv' ? 4 : m.loai] * (1 + m.chuyen * 0.1);
export function choAn(k: Kho, uid: string, khoa: string, luc = Date.now()): { kho: Kho; lenDang: boolean } | null {
  const t = k.linhThu.find((x) => x.uid === uid);
  const m = dsMonAn(k).find((x) => x.khoa === khoa);
  if (!t || !m || chiuAn(t, m, luc)) return null;
  // trừ viên đan
  let kho: Kho = k;
  if (m.chuyen > 0) {
    const dc = { ...k.danChuyen, [khoa]: k.danChuyen[khoa] - 1 };
    if (dc[khoa] <= 0) delete dc[khoa];
    kho = { ...kho, danChuyen: dc };
  } else if (m.loai === 'dv') kho = { ...kho, danVan: { ...kho.danVan, [m.phuongId]: kho.danVan[m.phuongId] - 1 } };
  else {
    const tui = [...kho.tuiDan[m.phuongId]] as [number, number, number, number];
    tui[m.loai] -= 1;
    kho = { ...kho, tuiDan: { ...kho.tuiDan, [m.phuongId]: tui } };
  }
  // no, hảo cảm, lớn
  let { dang, lon } = t;
  lon += dinhDuong(m);
  let lenDang = false;
  while (dang < 2 && lon >= LUAT_THU.canLon[timLoaiThu(t.loai).bac][dang]) {
    lon -= LUAT_THU.canLon[timLoaiThu(t.loai).bac][dang];
    dang++;
    lenDang = true;
  }
  if (dang >= 2) lon = 0;
  const moi: Thu = { ...t, dang, lon, no: Math.min(100, noHienTai(t, luc) + LUAT_THU.noMoiLan), lucNo: luc, haoCam: Math.min(100, t.haoCam + LUAT_THU.haoCamMoiLan) };
  return { kho: { ...kho, linhThu: kho.linhThu.map((x) => (x.uid === uid ? moi : x)) }, lenDang };
}
