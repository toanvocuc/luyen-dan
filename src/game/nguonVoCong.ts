// Nguồn bí tịch và các việc võ công cần kho: hàng bí tịch ở phường thị và tông môn (đổi theo kỳ hàng phường thị),
// đấu giá 3 ngày một phiên (bỏ giá kín, so với giá ẩn của đối thủ), gia nhập tông môn, Ngộ Đạo Đan, Tẩy Cốt Đan.
import { LUAT, TONG_MON, type PhamThat } from './duLieu.ts';
import { kyCho, type Kho } from './kho.ts';
import { ngayVuc } from './vucTham.ts';
import {
  BI_TICH,
  CAP_LUYEN_THUC_TOI_DA,
  HE,
  rngHat,
  themBiTich,
  themLuyenThuc,
  thienPhuCua,
  timBiTich,
  timTrongTui,
  type BacThienPhu,
  type He,
  type NguyenTo,
} from './voCong.ts';

export const LUAT_BT = {
  /** Giá bí tịch = hệ số giá theo cảnh giới × giaPham[phẩm]. */
  giaPham: [3, 8, 20, 50, 120, 300],
  cho: { so: 3, trong: [60, 32, 8, 0, 0, 0] },
  tongMon: { so: 4, trong: [28, 36, 29, 7, 0, 0], danhVong: [15, 30, 60, 120, 0, 0], heSoGia: 0.5 },
  dauGia: { so: 3, ngayMoiPhien: 3, trong: [0, 0, 0, 60, 30, 10], khoiDiem: 0.7, giaAnTu: 0.9, giaAnDen: 1.6 },
  /** Rời tông môn: mất bấy nhiêu phần danh vọng với tông đó, và phải đợi bấy nhiêu ngày mới vào tông khác. */
  ngayDoiTongMon: 3,
  matDanhVongKhiRoi: 0.5,
  /** Danh vọng đủ để vào tông mà không cần thiên phú hợp. */
  danhVongVao: 100,
  /** Ngộ Đạo Đan: điểm luyện thục theo phẩm [hạ, trung, thượng, cực, đan văn]. Tẩy Cốt Đan: tỉ lệ thành theo phẩm. */
  ngoDao: [4, 6, 9, 14, 20],
  tayCot: [0.25, 0.4, 0.6, 0.85, 1],
  tayCotToiDa: 3 as BacThienPhu,
} as const;

/** Hệ số giá theo cảnh giới (bằng phần thưởng linh thạch gốc của một kỳ ngộ ở cảnh giới đó). */
const heGia = (k: Kho) => LUAT.kyNgo.linhThachGoc * LUAT.kyNgo.heSoCanhGioi ** k.tuVi.canhGioi;
function bam(chu: string): number {
  let h = 2166136261;
  for (let i = 0; i < chu.length; i++) h = Math.imul(h ^ chu.charCodeAt(i), 16777619);
  return h >>> 0;
}
function chonTrong(trong: readonly number[], rng: () => number): number {
  let r = rng() * trong.reduce((a, b) => a + b, 0);
  for (let i = 0; i < trong.length; i++) {
    r -= trong[i];
    if (r < 0) return i;
  }
  return 0;
}
const NT: NguyenTo[] = ['kim', 'moc', 'thuy', 'hoa', 'tho', 'loi'];
const quayNguyenTo = (rng: () => number): NguyenTo => (rng() < 0.08 ? 'loi' : NT[Math.floor(rng() * 5)]);

export interface MonBt {
  khoa: string;
  id: string;
  pham: number;
  nguyenTo?: NguyenTo;
  /** Linh thạch (đấu giá: giá khởi điểm). */
  gia: number;
  /** Danh vọng của tông môn đang theo (chỉ hàng tông môn). */
  danhVong?: number;
}
function quayMon(k: Kho, hat: string, so: number, trong: readonly number[], tienTo: string, nguon: readonly (typeof BI_TICH)[number][] = BI_TICH): MonBt[] {
  const rng = rngHat(bam(hat));
  const ra: MonBt[] = [];
  for (let i = 0; i < so; i++) {
    const g = nguon[Math.floor(rng() * nguon.length)];
    const pham = chonTrong(trong, rng);
    const nt = quayNguyenTo(rng);
    ra.push({ khoa: `${tienTo}|${i}`, id: g.id, pham, nguyenTo: g.loai === 'vo-ky' || g.loai === 'tuyet-chieu' ? nt : undefined, gia: Math.round(heGia(k) * LUAT_BT.giaPham[pham]) });
  }
  return ra;
}

// ---------- phường thị và tông môn (đổi theo kỳ hàng phường thị) ----------

export const hangBtCho = (k: Kho, luc = Date.now()) => quayMon(k, `${k.nhanVat?.ten}|bt-cho|${kyCho(luc)}`, LUAT_BT.cho.so, LUAT_BT.cho.trong, 'cho');
export function hangBtTongMon(k: Kho, luc = Date.now()): MonBt[] {
  const tm = k.voCong.tongMon;
  if (!tm) return [];
  const c = LUAT_BT.tongMon;
  const he = TONG_MON_INFO[tm]?.he ?? [];
  // Tàng Kinh Các chỉ có võ công hai hệ của tông, cùng thân pháp và tâm pháp
  const nguon = BI_TICH.filter((b) => !b.he || he.includes(b.he));
  const giam = tm === 'van-bao' ? 0.85 : 1;
  return quayMon(k, `${k.nhanVat?.ten}|bt-${tm}|${kyCho(luc)}`, c.so, c.trong, 'tm', nguon).map((m) => ({ ...m, gia: Math.round(m.gia * c.heSoGia * giam), danhVong: c.danhVong[m.pham] }));
}
export const daMuaBt = (k: Kho, khoa: string, luc = Date.now()) => k.voCong.mua.ky === kyCho(luc) && k.voCong.mua.ds.includes(khoa);
/** Mua một cuốn (phường thị hoặc tông môn). Thiếu tiền / danh vọng / đã mua thì trả lại kho cũ. */
export function muaBt(k: Kho, mon: MonBt, luc = Date.now()): Kho {
  const tm = k.voCong.tongMon;
  if (daMuaBt(k, mon.khoa, luc) || k.linhThach < mon.gia) return k;
  if (mon.danhVong && (!tm || (k.danhVong[tm] ?? 0) < mon.danhVong)) return k;
  const ky = kyCho(luc);
  const v = themBiTich(k.voCong, mon.id, mon.pham, mon.nguyenTo);
  return {
    ...k,
    linhThach: k.linhThach - mon.gia,
    danhVong: mon.danhVong && tm ? { ...k.danhVong, [tm]: (k.danhVong[tm] ?? 0) - mon.danhVong } : k.danhVong,
    voCong: { ...v, mua: { ky, ds: [...(v.mua.ky === ky ? v.mua.ds : []), mon.khoa] } },
  };
}

// ---------- tông môn ----------

export const TONG_MON_DS = TONG_MON;
export type MonQuy = 'tu-luyen' | 'sat-thuong' | 'hoi-mau' | 'bi-tich' | 'hac-hoa';
/** Võ học chính, tôn chỉ và môn quy (ưu đãi khi là đệ tử) của từng tông. */
export const TONG_MON_INFO: Record<string, { he: He[]; tonChi: string; monQuy: string; uuDai: MonQuy }> = {
  'thanh-van': { he: ['kiem', 'chi'], tonChi: 'Thuận theo tự nhiên, tâm như mây trôi.', monQuy: 'Tu luyện nhanh hơn 5%.', uuDai: 'tu-luyen' },
  'thien-kiem': { he: ['kiem', 'dao'], tonChi: 'Kiếm ra không hối, thẳng tới cùng.', monQuy: 'Sát thương võ công +5%.', uuDai: 'sat-thuong' },
  'duoc-vuong': { he: ['chuong', 'chi'], tonChi: 'Cứu người trước, tu mình sau.', monQuy: 'Hồi máu (đan, chiêu) mạnh hơn 15%.', uuDai: 'hoi-mau' },
  'van-bao': { he: ['thuong', 'quyen'], tonChi: 'Vật quý tìm người có duyên.', monQuy: 'Bí tịch ở Tàng Kinh Các rẻ hơn 15%.', uuDai: 'bi-tich' },
  'huyen-am': { he: ['chuong', 'dao'], tonChi: 'Đi trong bóng tối mà lòng không tối.', monQuy: 'Ở Vực Thẳm hắc hoá tăng chậm hơn 20%.', uuDai: 'hac-hoa' },
};
/** Người chơi có đang hưởng môn quy này không. */
export const coMonQuy = (k: Kho, u: MonQuy) => !!k.voCong?.tongMon && TONG_MON_INFO[k.voCong.tongMon]?.uuDai === u;
/** Còn bao nhiêu giây nữa mới được vào tông môn mới (sau lần rời gần nhất). */
export const giayDoiTongMon = (k: Kho, luc = Date.now()) =>
  k.voCong.lucRoi ? Math.max(0, Math.ceil((k.voCong.lucRoi + LUAT_BT.ngayDoiTongMon * 86400000 - luc) / 1000)) : 0;
/** Lý do chưa vào được tông này (null = vào được): cần thiên phú Khá ở một hệ tông dạy, hoặc đủ danh vọng. */
export function lyDoKhongVao(k: Kho, id: string, luc = Date.now()): string | null {
  if (k.voCong.tongMon) return 'Đang là đệ tử tông khác. Rời tông ở Sơn Môn trước.';
  if (giayDoiTongMon(k, luc) > 0) return 'Vừa rời tông môn, chưa thể bái sư nơi khác.';
  const tp = thienPhuCua(k.nhanVat);
  const info = TONG_MON_INFO[id];
  if (info.he.some((h) => tp[h] >= 2)) return null;
  if ((k.danhVong[id] ?? 0) >= LUAT_BT.danhVongVao) return null;
  return `Cần thiên phú Khá ở ${info.he.map((h) => HE[h].dao).join(' hoặc ')}, hoặc ${LUAT_BT.danhVongVao} danh vọng với tông này.`;
}
export function giaNhapTongMon(k: Kho, id: string, luc = Date.now()): Kho {
  if (lyDoKhongVao(k, id, luc)) return k;
  return { ...k, voCong: { ...k.voCong, tongMon: id, lucGiaNhap: luc } };
}
/** Rời tông môn: mất một phần danh vọng với tông đó, phải đợi mới vào tông khác. */
export function roiTongMon(k: Kho, luc = Date.now()): Kho {
  const tm = k.voCong.tongMon;
  if (!tm) return k;
  const dv = k.danhVong[tm] ?? 0;
  return { ...k, danhVong: { ...k.danhVong, [tm]: Math.floor(dv * (1 - LUAT_BT.matDanhVongKhiRoi)) }, voCong: { ...k.voCong, tongMon: null, lucRoi: luc } };
}

// ---------- đấu giá ----------

export const phienDauGia = (luc = Date.now()) => Math.floor(ngayVuc(luc) / LUAT_BT.dauGia.ngayMoiPhien);
export const giayToiPhienSau = (luc = Date.now()) => {
  const ms = (phienDauGia(luc) + 1) * LUAT_BT.dauGia.ngayMoiPhien * 86400000 - 7 * 3600 * 1000;
  return Math.max(0, Math.ceil((ms - luc) / 1000));
};
export function hangDauGia(k: Kho, luc = Date.now()): MonBt[] {
  const c = LUAT_BT.dauGia;
  return quayMon(k, `${k.nhanVat?.ten}|dau-gia|${phienDauGia(luc)}`, c.so, c.trong, 'dg').map((m) => ({ ...m, gia: Math.round(m.gia * c.khoiDiem) }));
}
/** Giá ẩn của đối thủ cho một món (cố định trong phiên). */
function giaAn(k: Kho, mon: MonBt, luc: number): number {
  const c = LUAT_BT.dauGia;
  const r = rngHat(bam(`${k.nhanVat?.ten}|gia-an|${phienDauGia(luc)}|${mon.khoa}`))();
  return Math.round((mon.gia / c.khoiDiem) * (c.giaAnTu + r * (c.giaAnDen - c.giaAnTu)));
}
export const giaDaRa = (k: Kho, khoa: string, luc = Date.now()) => (k.voCong.dauGia.phien === phienDauGia(luc) ? k.voCong.dauGia.ra[khoa] ?? null : null);
/** Bỏ giá kín cho một món: mỗi món một lần mỗi phiên. Cao hơn giá ẩn thì được (trả đúng giá đã ra), thấp hơn thì không mất gì. */
export function raGia(k: Kho, mon: MonBt, gia: number, luc = Date.now()): { kho: Kho; thang: boolean } | null {
  if (giaDaRa(k, mon.khoa, luc) || gia < mon.gia || gia > k.linhThach) return null;
  const phien = phienDauGia(luc);
  const thang = gia >= giaAn(k, mon, luc);
  const ra = { ...(k.voCong.dauGia.phien === phien ? k.voCong.dauGia.ra : {}), [mon.khoa]: { gia, thang } };
  let v = { ...k.voCong, dauGia: { phien, ra } };
  if (thang) v = themBiTich(v, mon.id, mon.pham, mon.nguyenTo);
  return { kho: { ...k, linhThach: k.linhThach - (thang ? gia : 0), voCong: v }, thang };
}

// ---------- Ngộ Đạo Đan, Tẩy Cốt Đan ----------

/** Các phẩm đan đang có (để chọn viên dùng): [loại, số viên], phẩm cao trước. */
export function dsPhamDan(k: Kho, phuongId: string): [PhamThat | 'dv', number][] {
  const t = k.tuiDan[phuongId] ?? [0, 0, 0, 0];
  return ([['dv', k.danVan[phuongId] ?? 0], [3, t[3]], [2, t[2]], [1, t[1]], [0, t[0]]] as [PhamThat | 'dv', number][]).filter(([, n]) => n > 0);
}
function truDan(k: Kho, phuongId: string, loai: PhamThat | 'dv'): Kho | null {
  if (loai === 'dv') return (k.danVan[phuongId] ?? 0) > 0 ? { ...k, danVan: { ...k.danVan, [phuongId]: k.danVan[phuongId] - 1 } } : null;
  const t = [...(k.tuiDan[phuongId] ?? [0, 0, 0, 0])] as [number, number, number, number];
  if (t[loai] < 1) return null;
  t[loai] -= 1;
  return { ...k, tuiDan: { ...k.tuiDan, [phuongId]: t } };
}
const muc = (loai: PhamThat | 'dv') => (loai === 'dv' ? 4 : loai);

/** Uống Ngộ Đạo Đan cho một cuốn bí tịch. */
export function ngoDao(k: Kho, uid: number, loai: PhamThat | 'dv'): { kho: Kho; chu: string } | null {
  const bt = timTrongTui(k.voCong, uid);
  if (!bt || bt.cap >= CAP_LUYEN_THUC_TOI_DA) return null;
  const sau = truDan(k, 'ngo-dao-dan', loai);
  if (!sau) return null;
  const diem = LUAT_BT.ngoDao[muc(loai)];
  const r = themLuyenThuc(sau.voCong, uid, diem, k.nhanVat);
  return { kho: { ...sau, voCong: r.vo }, chu: `${timBiTich(bt.id).ten}: +${diem} luyện thục${r.len ? `, lên cấp ${bt.cap + r.len}!` : '.'}` };
}
/** Uống Tẩy Cốt Đan để nâng thiên phú một hệ (tối đa Giỏi). Có thể hỏng (mất viên đan). */
export function tayCot(k: Kho, he: He, loai: PhamThat | 'dv', rng: () => number = Math.random): { kho: Kho; chu: string; thanh: boolean } | null {
  const nv = k.nhanVat;
  if (!nv) return null;
  const tp = { ...thienPhuCua(nv) };
  if (tp[he] >= LUAT_BT.tayCotToiDa) return null;
  const sau = truDan(k, 'tay-cot-dan', loai);
  if (!sau) return null;
  if (rng() >= LUAT_BT.tayCot[muc(loai)]) return { kho: sau, chu: 'Dược lực tán mất, căn cốt chưa đổi.', thanh: false };
  tp[he] = (tp[he] + 1) as BacThienPhu;
  return { kho: { ...sau, nhanVat: { ...nv, thienPhu: tp } }, chu: `Căn cốt thay đổi: ${HE[he].dao} lên ${['Kém', 'Thường', 'Khá', 'Giỏi', 'Thiên tài'][tp[he]]}.`, thanh: true };
}

