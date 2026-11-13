// Trạng thái lâu dài của người chơi (linh thạch, dược liệu, túi đan…) + lưu vào trình duyệt.
import { CANH_GIOI, CHI_SO, DAN_PHUONG, DUOC_LIEU, HE_SO_GIA, LUAT, NANG_CAP_GOC, TONG_MON, bacSo, giaBan, giaHatGiong, laDanThat, timDanPhuong, timDuocLieu, timLoDan, timPhuLieu, type ChiSo, type DanPhuong, type LoiThe, type NangCap, type PhamThat, type Tuoi } from './duLieu.ts';
import type { KetQua } from './luyenDan.ts';
import { loiThe, timXuatThan, type NhanVat } from './nhanVat.ts';

export interface Kho {
  phienBan: 3;
  /** Chưa tạo nhân vật thì null. */
  nhanVat: NhanVat | null;
  /** Tu vi: cảnh giới (chỉ số trong CANH_GIOI), tầng hiện tại (1–9) và điểm đã tích trong tầng. */
  tuVi: { canhGioi: number; tang: number; diem: number };
  linhThach: number;
  /** id dược liệu -> số lượng theo tuổi thuốc [mười, trăm, ngàn năm]. */
  duocLieu: Record<string, [number, number, number]>;
  /** id phụ liệu -> số lượng. */
  phuLieu: Record<string, number>;
  /** id đan phương -> số viên theo phẩm [hạ, trung, thượng, cực]. Viên đan văn đếm riêng, không nằm trong đây. */
  tuiDan: Record<string, [number, number, number, number]>;
  /** id đan phương -> số viên cực phẩm có đan văn. */
  danVan: Record<string, number>;
  /** id đan phương -> số mẻ đã luyện thành (để mở luyện nhanh). */
  thongThao: Record<string, number>;
  nangCap: NangCap;
  /** Lò vừa nổ, phải sửa mới luyện tiếp được. */
  loHu: boolean;
  thongKe: { soMe: number; noLo: number };
  /** id dược liệu -> số hạt giống đang có. */
  hatGiong: Record<string, number>;
  /** Vườn dược: số ô đã mở và cây trong từng ô (null = ô trống). */
  vuon: { soO: number; o: (OVuon | null)[] };
  /** Phường thị: kỳ hàng gần nhất mà người chơi đã mua, và số đã mua của từng mặt hàng trong kỳ đó. */
  cho: { ky: number; daMua: Record<string, number> };
  /** Lò đan: chiếc đang dùng và những chiếc đã mua. */
  loDan: { dung: string; co: string[] };
  /** Đơn hàng tông môn: đơn ở từng chỗ (null = chỗ trống), và thời điểm (ms) chỗ trống đó có đơn mới. */
  donHang: { ds: (Don | null)[]; luc: number[] };
  /** id tông môn -> danh vọng đã tích. */
  danhVong: Record<string, number>;
  /** Đan độc: số điểm tại thời điểm `luc` (ms); từ đó tới giờ độc đã tự tan bớt, xem docHienTai. */
  doc: { diem: number; luc: number };
  /** Đang được tăng tốc tu luyện nhờ đan: cộng thêm `nhan` lần tốc độ gốc trong `giay` giây chơi nữa. */
  tangToc: { nhan: number; giay: number };
  /** Phần cộng vào tỉ lệ thành công của lần đột phá kế tiếp (từ Băng Tâm Đan); dùng xong thì về 0. */
  congDotPha: number;
  /** Chỉ số được cộng vĩnh viễn nhờ uống đan (số lẻ; lúc hiển thị mới làm tròn). */
  chiSoCong: Partial<Record<ChiSo, number>>;
  /** id đan phương -> số viên đã uống từ trước tới giờ (để tính nhờn thuốc). */
  daUong: Record<string, number>;
  /** Máu: lượng đang thiếu tại thời điểm `luc` (ms); từ đó tới giờ đã tự hồi bớt, xem mauHienTai. */
  mau: { thieu: number; luc: number };
}

/** Một đơn đặt đan của tông môn. */
export interface Don {
  tongMon: string;
  phuongId: string;
  /** Phẩm thấp nhất tông môn chịu nhận; viên phẩm cao hơn vẫn giao được. */
  pham: PhamThat;
  soLuong: number;
  /** Linh thạch và danh vọng nhận được khi giao đủ. */
  thuong: number;
  danhVong: number;
}

/** Một cây trong vườn: vị thuốc gì, gieo lúc nào (mili giây theo đồng hồ thật). */
export interface OVuon {
  id: string;
  luc: number;
}

const KHOA = 'luyen-dan-kho-v3';

/** Kho khởi đầu. Có nhân vật thì xuất thân quyết định vốn liếng ban đầu. */
export function khoMoi(nv: NhanVat | null = null): Kho {
  const xt = nv ? timXuatThan(nv.xuatThan) : null;
  const hs = xt?.heSoDuocLieu ?? 1;
  const duocLieu: Kho['duocLieu'] = {};
  for (const d of DUOC_LIEU) duocLieu[d.id] = [0, 0, 0];
  // vốn ban đầu: đủ luyện ba mẻ Tụ Khí Đan
  duocLieu['linh-thao'] = [6 * hs, 0, 0];
  duocLieu['chu-qua'] = [3 * hs, 0, 0];
  const tuiDan: Kho['tuiDan'] = {};
  const danVan: Kho['danVan'] = {};
  const thongThao: Kho['thongThao'] = {};
  for (const p of DAN_PHUONG) {
    tuiDan[p.id] = [0, 0, 0, 0];
    danVan[p.id] = 0;
    thongThao[p.id] = 0;
  }
  // thế gia luyện đan: coi như đã thạo đan nhập môn nên đan phương thứ hai mở sẵn
  if (xt?.moSanPhuong) thongThao['tu-khi-dan'] = 3;
  return {
    phienBan: 3,
    nhanVat: nv,
    // bắt đầu là Phàm Nhân: lần đột phá đầu tiên (Dẫn Khí Đan) chính là bài nhập môn
    tuVi: { canhGioi: 0, tang: 1, diem: 0 },
    linhThach: xt?.linhThach ?? 120,
    duocLieu,
    phuLieu: { 'hoa-tinh': 0, 'ngung-than-thao': 0 },
    tuiDan,
    danVan,
    thongThao,
    nangCap: { ...NANG_CAP_GOC, lo: xt?.lo ?? 0 },
    loHu: false,
    thongKe: { soMe: 0, noLo: 0 },
    hatGiong: {},
    vuon: { soO: LUAT.vuon.soODau, o: [] },
    cho: { ky: 0, daMua: {} },
    loDan: { dung: 'thanh-dong-lo', co: ['thanh-dong-lo'] },
    donHang: { ds: [], luc: [] },
    danhVong: {},
    doc: { diem: 0, luc: 0 },
    tangToc: { nhan: 0, giay: 0 },
    congDotPha: 0,
    chiSoCong: {},
    daUong: {},
    mau: { thieu: 0, luc: 0 },
  };
}

export function napKho(): Kho {
  try {
    const s = localStorage.getItem(KHOA);
    if (s) {
      const k = JSON.parse(s) as Kho;
      if (k && k.phienBan === 3) {
        // bù các mục mới thêm vào dữ liệu sau khi người chơi đã có bản lưu
        const moi = khoMoi();
        return {
          ...moi,
          ...k,
          duocLieu: { ...Object.fromEntries(DUOC_LIEU.map((d) => [d.id, [0, 0, 0] as [number, number, number]])), ...k.duocLieu },
          phuLieu: { ...moi.phuLieu, ...k.phuLieu },
          tuiDan: { ...moi.tuiDan, ...k.tuiDan },
          danVan: { ...moi.danVan, ...k.danVan },
          thongThao: { ...moi.thongThao, ...k.thongThao },
          nangCap: { ...moi.nangCap, ...k.nangCap },
          thongKe: { ...moi.thongKe, ...k.thongKe },
          tuVi: { ...moi.tuVi, ...k.tuVi },
          hatGiong: { ...k.hatGiong },
          vuon: { ...moi.vuon, ...k.vuon },
          cho: { ...moi.cho, ...k.cho },
          loDan: { ...moi.loDan, ...k.loDan },
          donHang: { ...moi.donHang, ...k.donHang },
          danhVong: { ...k.danhVong },
          doc: { ...moi.doc, ...k.doc },
          tangToc: { ...moi.tangToc, ...k.tangToc },
          chiSoCong: { ...k.chiSoCong },
          daUong: { ...k.daUong },
          mau: { ...moi.mau, ...k.mau },
        };
      }
    }
  } catch {
    // bản lưu hỏng hoặc trình duyệt chặn lưu trữ: chơi bằng kho mới
  }
  return khoMoi();
}

export function luuKho(k: Kho) {
  try {
    localStorage.setItem(KHOA, JSON.stringify(k));
  } catch {
    // chế độ ẩn danh có thể chặn ghi — bỏ qua, game vẫn chạy
  }
}

export function duLieu(k: Kho, lieu: readonly string[], tuoi: readonly Tuoi[], phuLieuId: string | null): boolean {
  // gom nhu cầu theo (vị, tuổi) vì một đan phương có thể cần hai phần cùng một vị
  const can = new Map<string, number>();
  lieu.forEach((id, i) => can.set(`${id}|${tuoi[i]}`, (can.get(`${id}|${tuoi[i]}`) ?? 0) + 1));
  for (const [khoa, n] of can) {
    const [id, t] = khoa.split('|');
    if ((k.duocLieu[id]?.[Number(t)] ?? 0) < n) return false;
  }
  if (phuLieuId && (k.phuLieu[phuLieuId] ?? 0) < 1) return false;
  return true;
}

/** Liệt kê dược liệu còn thiếu cho lựa chọn hiện tại (gộp theo vị và tuổi thuốc). */
export function thieuGi(k: Kho, lieu: readonly string[], tuoi: readonly Tuoi[]): { id: string; tuoi: Tuoi; thieu: number }[] {
  const can = new Map<string, number>();
  lieu.forEach((id, i) => can.set(`${id}|${tuoi[i]}`, (can.get(`${id}|${tuoi[i]}`) ?? 0) + 1));
  const ra: { id: string; tuoi: Tuoi; thieu: number }[] = [];
  for (const [khoa, n] of can) {
    const [id, t] = khoa.split('|');
    const co = k.duocLieu[id]?.[Number(t)] ?? 0;
    if (co < n) ra.push({ id, tuoi: Number(t) as Tuoi, thieu: n - co });
  }
  return ra;
}

/** Trừ nguyên liệu khi khai lò. */
export function truNguyenLieu(k: Kho, lieu: readonly string[], tuoi: readonly Tuoi[], phuLieuId: string | null): Kho {
  const duocLieu = { ...k.duocLieu };
  lieu.forEach((id, i) => {
    const c = [...duocLieu[id]] as [number, number, number];
    c[tuoi[i]] -= 1;
    duocLieu[id] = c;
  });
  const phuLieu = { ...k.phuLieu };
  if (phuLieuId) phuLieu[phuLieuId] = (phuLieu[phuLieuId] ?? 0) - 1;
  return { ...k, duocLieu, phuLieu };
}

/** Cất đan vừa luyện vào túi và ghi thống kê. Nổ lò thì lò hư. */
export function nhanKetQua(k: Kho, phuongId: string, kq: KetQua): Kho {
  const thongKe = { soMe: k.thongKe.soMe + 1, noLo: k.thongKe.noLo + (kq.noLo ? 1 : 0) };
  if (kq.noLo) return { ...k, thongKe, loHu: true };
  const tui = [...k.tuiDan[phuongId]] as [number, number, number, number];
  let dv = k.danVan[phuongId] ?? 0;
  for (const v of kq.vien) {
    if (v.danVan) dv += 1;
    else if (laDanThat(v.pham)) tui[v.pham] += 1;
  }
  const coDan = kq.vien.some((v) => v.pham >= 0);
  return {
    ...k,
    thongKe,
    tuiDan: { ...k.tuiDan, [phuongId]: tui },
    danVan: { ...k.danVan, [phuongId]: dv },
    thongThao: { ...k.thongThao, [phuongId]: (k.thongThao[phuongId] ?? 0) + (coDan ? 1 : 0) },
  };
}

// ---------- phường thị ----------

/** Giá mua một phần dược liệu, đã tính lợi thế của nhân vật (giới diện, xuất thân). */
export const giaMua = (k: Kho, id: string, tuoi: Tuoi) => Math.max(1, Math.round(timDuocLieu(id).gia[tuoi] * loiThe(k.nhanVat).heSoMua));
export const giaMuaPhuLieu = (k: Kho, id: string) => Math.max(1, Math.round((timPhuLieu(id)?.gia ?? 0) * loiThe(k.nhanVat).heSoMua));

// Hàng của phường thị đổi theo kỳ (LUAT.cho.gioDoiHang giờ một lần). Hàng mỗi kỳ được quay từ số kỳ và tên nhân vật,
// nên trong một kỳ nó không đổi dù nạp lại trang, và mỗi nhân vật gặp một chợ khác nhau.

const MS_MOI_KY = LUAT.cho.gioDoiHang * 3600_000;
export const kyCho = (luc = Date.now()) => Math.floor(luc / MS_MOI_KY);
/** Còn bao nhiêu giây nữa thì phường thị đổi hàng. */
export const giayToiKySau = (luc = Date.now()) => Math.ceil(((kyCho(luc) + 1) * MS_MOI_KY - luc) / 1000);
/** Khoá của một mặt hàng: thuốc theo tuổi, hoặc hạt giống. */
export const khoaThuoc = (id: string, tuoi: Tuoi) => `${id}|${tuoi}`;
export const khoaHat = (id: string) => `${id}|hat`;

function bam(chu: string): number {
  let h = 2166136261;
  for (let i = 0; i < chu.length; i++) h = Math.imul(h ^ chu.charCodeAt(i), 16777619);
  return h >>> 0;
}
const boNhoCho = new Map<string, Record<string, number>>();
/** Số lượng từng mặt hàng mà phường thị bày bán trong một kỳ (chưa trừ phần người chơi đã mua). */
export function hangCho(k: Kho, ky: number): Record<string, number> {
  const khoa = `${k.nhanVat?.ten ?? ''}|${ky}`;
  const co = boNhoCho.get(khoa);
  if (co) return co;
  let hat = bam(khoa);
  const rng = () => {
    hat = (hat + 0x6d2b79f5) >>> 0;
    let t = hat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const trong = ([a, b]: readonly number[]) => a + Math.floor(rng() * (b - a + 1));
  const c = LUAT.cho;
  const hang: Record<string, number> = {};
  for (const d of DUOC_LIEU) {
    const luonCo = (c.luonCo as readonly string[]).includes(d.id);
    for (const t of [0, 1, 2] as Tuoi[]) {
      // luôn quay đủ số lần cho mỗi vị, để thêm bớt luật không làm xô lệch hàng của các vị khác
      const coHang = rng() < c.tiLe[t];
      const n = trong(c.soLuong[t]);
      hang[khoaThuoc(d.id, t)] = t === 0 && luonCo ? c.luonCoSoLuong : coHang ? n : 0;
    }
    const coHat = rng() < c.hatTiLe;
    const n = trong(c.hatSoLuong);
    hang[khoaHat(d.id)] = luonCo ? Math.max(2, n) : coHat ? n : 0;
  }
  boNhoCho.set(khoa, hang);
  return hang;
}
/** Một mặt hàng còn lại bao nhiêu trong kỳ hiện tại. */
export function conHang(k: Kho, khoa: string, luc = Date.now()): number {
  const ky = kyCho(luc);
  return (hangCho(k, ky)[khoa] ?? 0) - (k.cho.ky === ky ? k.cho.daMua[khoa] ?? 0 : 0);
}
function ghiDaMua(k: Kho, khoa: string, luc: number): Kho['cho'] {
  const ky = kyCho(luc);
  const daMua = k.cho.ky === ky ? { ...k.cho.daMua } : {};
  daMua[khoa] = (daMua[khoa] ?? 0) + 1;
  return { ky, daMua };
}

export function muaDuocLieu(k: Kho, id: string, tuoi: Tuoi, luc = Date.now()): Kho {
  const gia = giaMua(k, id, tuoi);
  const khoa = khoaThuoc(id, tuoi);
  if (k.linhThach < gia || conHang(k, khoa, luc) < 1) return k;
  const c = [...k.duocLieu[id]] as [number, number, number];
  c[tuoi] += 1;
  return { ...k, linhThach: k.linhThach - gia, duocLieu: { ...k.duocLieu, [id]: c }, cho: ghiDaMua(k, khoa, luc) };
}

export const giaMuaHat = (k: Kho, id: string) => Math.max(1, Math.round(giaHatGiong(timDuocLieu(id)) * loiThe(k.nhanVat).heSoMua));
export function muaHatGiong(k: Kho, id: string, luc = Date.now()): Kho {
  const gia = giaMuaHat(k, id);
  const khoa = khoaHat(id);
  if (k.linhThach < gia || conHang(k, khoa, luc) < 1) return k;
  return { ...k, linhThach: k.linhThach - gia, hatGiong: { ...k.hatGiong, [id]: (k.hatGiong[id] ?? 0) + 1 }, cho: ghiDaMua(k, khoa, luc) };
}

export function muaPhuLieu(k: Kho, id: string): Kho {
  const p = timPhuLieu(id);
  const gia = giaMuaPhuLieu(k, id);
  if (!p || k.linhThach < gia) return k;
  return { ...k, linhThach: k.linhThach - gia, phuLieu: { ...k.phuLieu, [id]: (k.phuLieu[id] ?? 0) + 1 } };
}

/** Giá trị toàn bộ đan của một đan phương nếu bán ở phường thị. */
export function giaTriTui(k: Kho, phuongId: string): number {
  const p = timDanPhuong(phuongId);
  const t = k.tuiDan[phuongId];
  const hs = loiThe(k.nhanVat).heSoBan;
  let tong = (k.danVan[phuongId] ?? 0) * giaBan(p, 3, true, hs);
  for (let i = 0; i < 4; i++) tong += t[i] * giaBan(p, i as PhamThat, false, hs);
  return tong;
}

export function banDan(k: Kho, phuongId: string): Kho {
  const tien = giaTriTui(k, phuongId);
  if (tien <= 0) return k;
  return {
    ...k,
    linhThach: k.linhThach + tien,
    tuiDan: { ...k.tuiDan, [phuongId]: [0, 0, 0, 0] },
    danVan: { ...k.danVan, [phuongId]: 0 },
  };
}

/** Bán lẻ: một số viên của một loại đan ở đúng một phẩm ('dv' = đan văn). */
export function banLe(k: Kho, phuongId: string, loai: PhamThat | 'dv', soLuong: number): Kho {
  const p = timDanPhuong(phuongId);
  const hs = loiThe(k.nhanVat).heSoBan;
  if (loai === 'dv') {
    const n = Math.min(soLuong, k.danVan[phuongId] ?? 0);
    if (n < 1) return k;
    return { ...k, linhThach: k.linhThach + n * giaBan(p, 3, true, hs), danVan: { ...k.danVan, [phuongId]: (k.danVan[phuongId] ?? 0) - n } };
  }
  const tui = [...k.tuiDan[phuongId]] as [number, number, number, number];
  const n = Math.min(soLuong, tui[loai]);
  if (n < 1) return k;
  tui[loai] -= n;
  return { ...k, linhThach: k.linhThach + n * giaBan(p, loai, false, hs), tuiDan: { ...k.tuiDan, [phuongId]: tui } };
}

// ---------- đơn hàng tông môn ----------

/** Quay một đơn mới hợp với cảnh giới hiện tại: chỉ đặt đan của bậc đang đứng và bậc ngay dưới. */
function taoDon(k: Kho, rng: () => number, daCo: readonly string[]): Don {
  const cg = k.tuVi.canhGioi;
  const hop = DAN_PHUONG.filter((p) => bacSo(p) <= cg && bacSo(p) >= cg - 1);
  // tránh ba đơn cùng đòi một loại đan, trừ khi cảnh giới này chỉ có đúng loại đó
  const chuaCo = hop.filter((p) => !daCo.includes(p.id));
  const nguon = chuaCo.length ? chuaCo : hop;
  const p = nguon[Math.floor(rng() * nguon.length)] ?? DAN_PHUONG[0];
  const c = LUAT.don;
  let r = rng();
  let pham = 0;
  while (pham < 3 && r >= c.phamTiLe[pham]) {
    r -= c.phamTiLe[pham];
    pham += 1;
  }
  const [a, b] = c.soLuong[pham];
  // đan đột phá là của hiếm: tông môn chỉ đặt một hai viên
  const soLuong = Math.min(p.dotPha && p.dotPha > 1 ? 2 : 99, a + Math.floor(rng() * (b - a + 1)));
  const heSo = c.heSo[0] + rng() * (c.heSo[1] - c.heSo[0]);
  return {
    tongMon: TONG_MON[Math.floor(rng() * TONG_MON.length)].id,
    phuongId: p.id,
    pham: pham as PhamThat,
    soLuong,
    thuong: Math.max(1, Math.round(p.giaGoc * HE_SO_GIA[pham] * soLuong * heSo * loiThe(k.nhanVat).heSoBan)),
    danhVong: soLuong * (pham + 1) * (bacSo(p) + 1),
  };
}

/** Lấp đơn mới vào những chỗ trống đã hết thời gian chờ. Không có gì đổi thì trả lại đúng kho cũ. */
export function lamMoiDon(k: Kho, rng: () => number = Math.random, luc = Date.now()): Kho {
  if (!k.nhanVat) return k;
  let ds: (Don | null)[] | null = null;
  for (let i = 0; i < LUAT.don.soDon; i++) {
    if (k.donHang.ds[i] || (k.donHang.luc[i] ?? 0) > luc) continue;
    ds ??= Array.from({ length: LUAT.don.soDon }, (_, j) => k.donHang.ds[j] ?? null);
    ds[i] = taoDon(k, rng, ds.flatMap((d) => (d ? [d.phuongId] : [])));
  }
  return ds ? { ...k, donHang: { ...k.donHang, ds } } : k;
}

/** Số viên trong túi đủ phẩm để giao cho một đơn (đan văn tính là cực phẩm). */
export function soVienHopDon(k: Kho, d: Don): number {
  const t = k.tuiDan[d.phuongId];
  let n = k.danVan[d.phuongId] ?? 0;
  for (let ph = d.pham; ph <= 3; ph++) n += t[ph];
  return n;
}

function dongDon(k: Kho, viTri: number, luc: number): Kho['donHang'] {
  const ds = Array.from({ length: LUAT.don.soDon }, (_, j) => k.donHang.ds[j] ?? null);
  const lucMoi = Array.from({ length: LUAT.don.soDon }, (_, j) => k.donHang.luc[j] ?? 0);
  ds[viTri] = null;
  lucMoi[viTri] = luc + LUAT.don.choMoi * 1000;
  return { ds, luc: lucMoi };
}

/** Giao một đơn: lấy viên phẩm thấp nhất còn đủ điều kiện trước, để giữ lại viên quý. */
export function giaoDon(k: Kho, viTri: number, luc = Date.now()): Kho {
  const d = k.donHang.ds[viTri];
  if (!d || soVienHopDon(k, d) < d.soLuong) return k;
  const tui = [...k.tuiDan[d.phuongId]] as [number, number, number, number];
  let dv = k.danVan[d.phuongId] ?? 0;
  let con = d.soLuong;
  for (let ph = d.pham; ph <= 3 && con > 0; ph++) {
    const lay = Math.min(con, tui[ph]);
    tui[ph] -= lay;
    con -= lay;
  }
  dv -= con;
  return {
    ...k,
    linhThach: k.linhThach + d.thuong,
    tuiDan: { ...k.tuiDan, [d.phuongId]: tui },
    danVan: { ...k.danVan, [d.phuongId]: dv },
    danhVong: { ...k.danhVong, [d.tongMon]: (k.danhVong[d.tongMon] ?? 0) + d.danhVong },
    donHang: dongDon(k, viTri, luc),
  };
}

/** Từ chối một đơn: chỗ đó trống một lúc rồi mới có đơn khác. */
export function tuChoiDon(k: Kho, viTri: number, luc = Date.now()): Kho {
  return k.donHang.ds[viTri] ? { ...k, donHang: dongDon(k, viTri, luc) } : k;
}

// ---------- lò đan ----------

export function muaLo(k: Kho, id: string): Kho {
  const lo = timLoDan(id);
  if (lo.id !== id || k.loDan.co.includes(id) || k.linhThach < lo.gia) return k;
  return { ...k, linhThach: k.linhThach - lo.gia, loDan: { dung: id, co: [...k.loDan.co, id] } };
}
export function dungLo(k: Kho, id: string): Kho {
  return k.loDan.co.includes(id) ? { ...k, loDan: { ...k.loDan, dung: id } } : k;
}

// ---------- vườn dược ----------

/** Giai đoạn của một cây: 0 = mầm (chưa hái được), 1 = thuốc 10 năm, 2 = 100 năm, 3 = 1000 năm. */
export function giaiDoan(o: OVuon, luc = Date.now()): 0 | 1 | 2 | 3 {
  const giay = (luc - o.luc) / 1000;
  const m = LUAT.vuon.giay;
  return giay >= m[2] ? 3 : giay >= m[1] ? 2 : giay >= m[0] ? 1 : 0;
}
/** Còn bao nhiêu giây nữa cây lên giai đoạn kế (đã 1000 năm thì 0). */
export function giayToiGiaiDoanSau(o: OVuon, luc = Date.now()): number {
  const gd = giaiDoan(o, luc);
  const m: readonly number[] = LUAT.vuon.giay;
  return gd >= 3 ? 0 : Math.max(0, Math.ceil(m[gd] - (luc - o.luc) / 1000));
}
export function gieoHat(k: Kho, viTri: number, id: string, luc = Date.now()): Kho {
  if (viTri < 0 || viTri >= k.vuon.soO || k.vuon.o[viTri] || (k.hatGiong[id] ?? 0) < 1) return k;
  const o = Array.from({ length: k.vuon.soO }, (_, i) => k.vuon.o[i] ?? null);
  o[viTri] = { id, luc };
  return { ...k, hatGiong: { ...k.hatGiong, [id]: k.hatGiong[id] - 1 }, vuon: { ...k.vuon, o } };
}
/** Hái một ô: được thuốc đúng tuổi cây đang có. r là số ngẫu nhiên 0–1 quyết định có được thêm một phần không. */
export function thuHoach(k: Kho, viTri: number, r: number, luc = Date.now()): Kho {
  const cay = k.vuon.o[viTri];
  if (!cay) return k;
  const gd = giaiDoan(cay, luc);
  if (gd < 1) return k;
  const v = LUAT.vuon;
  const them = r < v.themTiLe + ((k.nhanVat?.khiVan ?? 50) - 50) * v.themKhiVan ? 1 : 0;
  const c = [...(k.duocLieu[cay.id] ?? [0, 0, 0])] as [number, number, number];
  c[gd - 1] += v.sanLuong + them;
  const o = [...k.vuon.o];
  o[viTri] = null;
  return { ...k, duocLieu: { ...k.duocLieu, [cay.id]: c }, vuon: { ...k.vuon, o } };
}
/** Giá mở thêm một ô; đã đủ số ô tối đa thì null. */
export const giaMoO = (k: Kho) => (k.vuon.soO >= LUAT.vuon.soOToiDa ? null : LUAT.vuon.giaO * LUAT.vuon.giaONhan ** (k.vuon.soO - LUAT.vuon.soODau));
export function moO(k: Kho): Kho {
  const gia = giaMoO(k);
  if (gia === null || k.linhThach < gia) return k;
  return { ...k, linhThach: k.linhThach - gia, vuon: { ...k.vuon, soO: k.vuon.soO + 1 } };
}

/** Sửa lò: thiếu tiền thì trả hết số đang có, để không bao giờ kẹt cứng. */
export function suaLo(k: Kho): Kho {
  return { ...k, loHu: false, linhThach: Math.max(0, k.linhThach - LUAT.giaSuaLo) };
}

/** Cạn túi: không còn đan để bán và không đủ tiền mua mẻ rẻ nhất. */
export function canTui(k: Kho): boolean {
  const conDan = DAN_PHUONG.some((p) => giaTriTui(k, p.id) > 0);
  return !conDan && k.linhThach < 15;
}

export function nhanTroCap(k: Kho): Kho {
  return canTui(k) ? { ...k, linhThach: k.linhThach + LUAT.troCap } : k;
}

// ---------- tu luyện ----------

/** Số tầng của một cảnh giới. */
export const soTang = (canhGioi: number) => (canhGioi === 0 ? LUAT.soTangPhamNhan : LUAT.soTang);
/** Điểm tu vi cần để vượt một tầng ở một cảnh giới. */
export function tuViCan(tang: number, canhGioi: number): number {
  const heSo = canhGioi === 0 ? LUAT.heSoTuViPhamNhan : LUAT.heSoTuViMoiCanhGioi ** Math.max(0, canhGioi - 1);
  return Math.round(tang * LUAT.tuViMoiTang * heSo);
}
/** Đã viên mãn tầng cuối chưa (phải dùng đan đột phá mới lên tiếp được). */
export const vienMan = (k: Kho) => k.tuVi.tang >= soTang(k.tuVi.canhGioi) && k.tuVi.diem >= tuViCan(k.tuVi.tang, k.tuVi.canhGioi);

/** Tu vi mỗi giây khi không có đan trợ lực (linh căn quyết định). */
export const tocDoGoc = (k: Kho) => LUAT.tuViMoiGiay * loiThe(k.nhanVat).tocDoTuLuyen;
/** Tu vi mỗi giây ngay lúc này, đã tính phần tăng tốc nhờ đan. */
export const tocDoTuVi = (k: Kho) => tocDoGoc(k) * (1 + (k.tangToc.giay > 0 ? k.tangToc.nhan : 0));

/** Cộng tu vi theo số giây đã trôi qua, tự lên tầng khi đủ điểm, dừng ở viên mãn tầng cuối. */
export function tuLuyen(k: Kho, giay: number): Kho {
  if (!k.nhanVat || vienMan(k)) return k;
  const cg = k.tuVi.canhGioi;
  let { tang, diem } = k.tuVi;
  // phần tăng tốc nhờ đan chỉ tính cho số giây còn hiệu lực
  const giayNhanh = Math.min(giay, k.tangToc.giay);
  diem += (giay + giayNhanh * k.tangToc.nhan) * tocDoGoc(k);
  while (tang < soTang(cg) && diem >= tuViCan(tang, cg)) {
    diem -= tuViCan(tang, cg);
    tang += 1;
  }
  if (tang >= soTang(cg)) diem = Math.min(diem, tuViCan(tang, cg));
  const conGiay = k.tangToc.giay - giayNhanh;
  const tangToc = giayNhanh > 0 ? { nhan: conGiay > 0 ? k.tangToc.nhan : 0, giay: conGiay } : k.tangToc;
  return { ...k, tuVi: { ...k.tuVi, tang, diem }, tangToc };
}

/** Lợi thế luyện đan của người chơi: bẩm sinh (thiên mệnh), cộng phần do cảnh giới mang lại, cộng tính chất của lò đang dùng. */
export function loiTheKho(k: Kho): LoiThe {
  const goc = loiThe(k.nhanVat);
  const bac = Math.max(0, k.tuVi.canhGioi - 1);
  const lo = timLoDan(k.loDan.dung);
  return {
    ...goc,
    phamCong: goc.phamCong + bac * LUAT.canhGioi.pham + (lo.phamCong ?? 0),
    rongVung: goc.rongVung + bac * LUAT.canhGioi.rongVung + (lo.rongVung ?? 0),
    heSoAp: goc.heSoAp * (lo.heSoAp ?? 1),
    xanh: goc.xanh + (lo.xanh ?? 0),
    heSoQuet: goc.heSoQuet * (lo.heSoQuet ?? 1),
    vuotKiep: Math.min(0.95, goc.vuotKiep + (lo.vuotKiep ?? 0)),
    soVien: goc.soVien + (lo.soVien ?? 0),
  };
}

// ---------- chỉ số nhân vật ----------

/** Hệ số bẩm sinh của từng chỉ số: thể chất cho điểm mạnh riêng, tư chất nâng thần thức, còn lại là căn cốt mỗi người một khác. */
function heSoBamSinh(k: Kho, cs: ChiSo): number {
  const nv = k.nhanVat;
  if (!nv) return 1;
  // căn cốt: lệch ±12% cố định theo tên nhân vật và chỉ số
  let hs = 0.88 + (bam(`${nv.ten}|${cs}`) % 2401) / 10000;
  if (cs === 'khiHuyet' && nv.theChat === 'thanh-moc') hs *= 1.25;
  if (cs === 'luc' && nv.theChat === 'hoa-linh') hs *= 1.25;
  if (cs === 'thanThuc' && nv.theChat === 'bang-tam') hs *= 1.25;
  if (nv.theChat === 'dan-the') hs *= cs === 'thanThuc' ? 1.2 : cs === 'khiHuyet' ? 1.1 : 1;
  if (cs === 'thanThuc') hs *= 0.9 + nv.tuChat / 500;
  return hs;
}
/** Phần gốc của một chỉ số, do cảnh giới, tầng và bẩm sinh quyết định. */
export function chiSoGoc(k: Kho, cs: ChiSo): number {
  const c = LUAT.chiSo;
  const goc = c.goc * c.moiCanhGioi ** k.tuVi.canhGioi * (1 + c.moiTang * (k.tuVi.tang - 1)) * heSoBamSinh(k, cs);
  return goc * (cs === 'khiHuyet' ? c.heSoMau : 1);
}
/** Phần được cộng nhờ uống đan. */
export const chiSoDan = (k: Kho, cs: ChiSo) => (k.chiSoCong[cs] ?? 0) * (cs === 'khiHuyet' ? LUAT.chiSo.heSoMau : 1);
/** Giá trị một chỉ số (làm tròn xuống). */
export const chiSo = (k: Kho, cs: ChiSo) => Math.floor(chiSoGoc(k, cs) + chiSoDan(k, cs));

/** Uống `soLuong` viên thì mỗi chỉ số được cộng bao nhiêu (đơn vị thô, chưa nhân heSoMau), đã tính nhờn thuốc. */
function chiSoKhiUong(k: Kho, p: DanPhuong, loai: PhamThat | 'dv', soLuong: number): Partial<Record<ChiSo, number>> {
  if (!p.chiSo) return {};
  const c = LUAT.chiSo;
  const da = k.daUong[p.id] ?? 0;
  let heSo = 0;
  for (let i = 0; i < soLuong; i++) heSo += 1 / (1 + (da + i) / c.khangDuoc);
  heSo *= c.heSoPham[loai === 'dv' ? 4 : loai];
  const ra: Partial<Record<ChiSo, number>> = {};
  for (const cs of CHI_SO) if (p.chiSo[cs.id]) ra[cs.id] = p.chiSo[cs.id]! * heSo;
  return ra;
}

export const mauToiDa = (k: Kho) => chiSo(k, 'khiHuyet');
/** Máu lúc này (đã cộng phần tự hồi theo thời gian). */
export function mauHienTai(k: Kho, luc = Date.now()): number {
  const toiDa = mauToiDa(k);
  const thieu = Math.max(0, k.mau.thieu - (Math.max(0, luc - k.mau.luc) / 1000) * LUAT.chiSo.hoiMau * toiDa);
  return Math.max(0, Math.round(toiDa - thieu));
}

// ---------- uống đan ----------

/** Lượng đan độc đang có trong người lúc này (đã trừ phần tự tan theo thời gian). */
export function docHienTai(k: Kho, luc = Date.now()): number {
  return Math.max(0, k.doc.diem - Math.max(0, luc - k.doc.luc) / 1000 / LUAT.doc.giayMoiDiem);
}
/** Chỉ số phẩm trong các bảng năm mức [hạ, trung, thượng, cực, đan văn]. */
const mucPham = (loai: PhamThat | 'dv') => (loai === 'dv' ? 4 : loai);
/** Độc tố của một viên đan. */
export const docMoiVien = (p: DanPhuong, loai: PhamThat | 'dv') => LUAT.doc.moiVien[mucPham(loai)] * (p.uong?.doc ?? 1);

export interface XemUong {
  /** Uống được không; không thì `lyDo` nói vì sao. */
  duoc: boolean;
  lyDo?: string;
  /** Độc tố sẽ cộng thêm và mức sau khi uống. */
  docThem: number;
  docSau: number;
  /** Câu tả tác dụng của đúng số viên đang chọn. */
  moTa: string;
}

/** Xem trước việc uống `soLuong` viên: độc tố tăng bao nhiêu, được gì, có uống nổi không. Không đổi gì trong kho. */
export function xemUong(k: Kho, phuongId: string, loai: PhamThat | 'dv', soLuong: number, luc = Date.now()): XemUong {
  const p = timDanPhuong(phuongId);
  const td = p.uong;
  const docThem = docMoiVien(p, loai) * soLuong;
  const docSau = docHienTai(k, luc) + docThem;
  if (!td) return { duoc: false, lyDo: p.dotPha ? 'Đan đột phá, dùng ở nút Đột phá' : 'Đan này không uống được', docThem: 0, docSau: docHienTai(k, luc), moTa: '' };
  const v = td.giaTri[mucPham(loai)];
  const co = loai === 'dv' ? k.danVan[phuongId] ?? 0 : k.tuiDan[phuongId][loai];
  let moTa = '';
  let lyDo: string | undefined;
  if (td.loai === 'tang-toc') {
    const giay = (td.giay ?? 60) * soLuong;
    moTa = `Tu vi mỗi giây +${Math.round(v * 100)}% trong ${Math.floor(giay / 60)} phút${giay % 60 ? ` ${giay % 60} giây` : ''}`;
    if (vienMan(k)) lyDo = 'Đã viên mãn, uống cũng không thêm tu vi';
  } else if (td.loai === 'tu-vi') {
    const cg = k.tuVi.canhGioi;
    moTa = `Lập tức +${Math.round(tuViCan(k.tuVi.tang, cg) * v * soLuong)} tu vi`;
    if (vienMan(k)) lyDo = 'Đã viên mãn, uống cũng không thêm tu vi';
  } else if (td.loai === 'tu-chat') {
    const tc = k.nhanVat?.tuChat ?? 0;
    moTa = `Tư chất +${Math.min(100 - tc, v * soLuong)} vĩnh viễn (đang ${tc}/100)`;
    if (tc >= 100) lyDo = 'Tư chất đã tới đỉnh';
  } else if (td.loai === 'hoi-mau') {
    const toiDa = mauToiDa(k);
    const thieu = toiDa - mauHienTai(k, luc);
    moTa = thieu > 0 ? `Hồi ${Math.min(thieu, Math.round(toiDa * Math.min(1, v * soLuong)))} máu` : 'Máu đang đầy';
  } else {
    const con = LUAT.dotPha.congToiDa - k.congDotPha;
    moTa = `Lần đột phá tới +${Math.round(Math.min(con, v * soLuong) * 100)}% thành công (đang +${Math.round(k.congDotPha * 100)}%, tối đa +${Math.round(LUAT.dotPha.congToiDa * 100)}%)`;
    if (con <= 0.0001) lyDo = 'Tâm đã tĩnh hết mức, uống thêm vô ích';
  }
  // phần chỉ số được cộng thêm, ghi nối vào sau tác dụng chính
  const them = chiSoKhiUong(k, p, loai, soLuong);
  const chuChiSo = CHI_SO.filter((cs) => them[cs.id])
    .map((cs) => `${cs.ten} +${(them[cs.id]! * (cs.id === 'khiHuyet' ? LUAT.chiSo.heSoMau : 1)).toFixed(1)}`)
    .join(', ');
  if (chuChiSo) moTa += ` · ${chuChiSo}`;
  if (co < soLuong) lyDo = 'Không đủ viên';
  else if (docSau > LUAT.doc.day + 0.0001) lyDo = 'Đan độc sẽ vượt ngưỡng chịu đựng';
  return { duoc: !lyDo, lyDo, docThem, docSau, moTa };
}

/** Uống `soLuong` viên. Không uống được (xem xemUong) thì trả lại đúng kho cũ. */
export function uongDan(k: Kho, phuongId: string, loai: PhamThat | 'dv', soLuong: number, luc = Date.now()): Kho {
  const xem = xemUong(k, phuongId, loai, soLuong, luc);
  const p = timDanPhuong(phuongId);
  const td = p.uong;
  if (!xem.duoc || !td || !k.nhanVat) return k;
  const v = td.giaTri[mucPham(loai)];
  const them = chiSoKhiUong(k, p, loai, soLuong);
  const chiSoCong = { ...k.chiSoCong };
  for (const cs of CHI_SO) if (them[cs.id]) chiSoCong[cs.id] = (chiSoCong[cs.id] ?? 0) + them[cs.id]!;
  // máu tối đa có thể vừa tăng: chốt lượng máu đang thiếu theo mốc hiện tại trước khi đổi
  const thieuNay = mauToiDa(k) - mauHienTai(k, luc);
  let moi: Kho = {
    ...k,
    doc: { diem: xem.docSau, luc },
    chiSoCong,
    daUong: { ...k.daUong, [phuongId]: (k.daUong[phuongId] ?? 0) + soLuong },
    mau: { thieu: thieuNay, luc },
  };
  if (loai === 'dv') moi.danVan = { ...k.danVan, [phuongId]: (k.danVan[phuongId] ?? 0) - soLuong };
  else {
    const tui = [...k.tuiDan[phuongId]] as [number, number, number, number];
    tui[loai] -= soLuong;
    moi.tuiDan = { ...k.tuiDan, [phuongId]: tui };
  }
  if (td.loai === 'tang-toc') {
    // thời gian nối dài; mức tăng lấy theo viên mạnh nhất còn hiệu lực
    const dangCo = k.tangToc.giay > 0 ? k.tangToc.nhan : 0;
    moi.tangToc = { nhan: Math.max(dangCo, v), giay: Math.max(0, k.tangToc.giay) + (td.giay ?? 60) * soLuong };
  } else if (td.loai === 'tu-vi') {
    // cộng thẳng tu vi rồi để tuLuyen lo việc lên tầng (0 giây = không cộng gì thêm)
    const them = tuViCan(k.tuVi.tang, k.tuVi.canhGioi) * v * soLuong;
    moi = tuLuyen({ ...moi, tuVi: { ...moi.tuVi, diem: moi.tuVi.diem + them } }, 0);
  } else if (td.loai === 'tu-chat') {
    moi.nhanVat = { ...k.nhanVat, tuChat: Math.min(100, k.nhanVat.tuChat + v * soLuong) };
  } else if (td.loai === 'hoi-mau') {
    moi.mau = { thieu: Math.max(0, thieuNay - mauToiDa(k) * Math.min(1, v * soLuong)), luc };
  } else {
    moi.congDotPha = Math.min(LUAT.dotPha.congToiDa, k.congDotPha + v * soLuong);
  }
  return moi;
}

// ---------- đột phá ----------

/** Đan đột phá mà cảnh giới hiện tại cần; đã ở đỉnh (Tiên Đế) thì không có. */
export const danDotPha = (k: Kho): DanPhuong | null =>
  k.tuVi.canhGioi + 1 < CANH_GIOI.length ? DAN_PHUONG.find((p) => p.dotPha === k.tuVi.canhGioi + 1) ?? null : null;

/** Tỉ lệ đột phá thành công nếu dùng một viên phẩm này. */
export function tiLeDotPha(k: Kho, pham: PhamThat, danVan: boolean): number {
  if (danVan) return 1;
  const kv = ((k.nhanVat?.khiVan ?? 50) - 50) * LUAT.dotPha.khiVan;
  return Math.min(0.99, Math.max(0.05, LUAT.dotPha.tiLe[pham] + kv + k.congDotPha));
}

/**
 * Dùng một viên đan đột phá. r là số ngẫu nhiên 0–1 do nơi gọi quay sẵn (để giao diện biết trước kết quả mà dựng hiệu ứng).
 * Thành công: lên cảnh giới mới, tầng 1. Thất bại: mất viên đan, hao một phần tu vi của tầng hiện tại.
 * Không đủ điều kiện (chưa viên mãn, không có viên đó) thì trả về null.
 */
export function dotPha(k: Kho, pham: PhamThat, danVan: boolean, r: number): { kho: Kho; thanh: boolean } | null {
  const p = danDotPha(k);
  if (!p || !vienMan(k)) return null;
  const tui = [...k.tuiDan[p.id]] as [number, number, number, number];
  let dv = k.danVan[p.id] ?? 0;
  if (danVan) {
    if (dv < 1) return null;
    dv -= 1;
  } else {
    if (tui[pham] < 1) return null;
    tui[pham] -= 1;
  }
  const thanh = r < tiLeDotPha(k, pham, danVan);
  const tuVi = thanh
    ? { canhGioi: k.tuVi.canhGioi + 1, tang: 1, diem: 0 }
    : { ...k.tuVi, diem: Math.floor(k.tuVi.diem * (1 - LUAT.dotPha.matTuVi)) };
  return { thanh, kho: { ...k, tuVi, congDotPha: 0, tuiDan: { ...k.tuiDan, [p.id]: tui }, danVan: { ...k.danVan, [p.id]: dv } } };
}
