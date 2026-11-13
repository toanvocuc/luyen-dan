// Trạng thái lâu dài của người chơi (linh thạch, dược liệu, túi đan…) + lưu vào trình duyệt.
import { CANH_GIOI, DAN_PHUONG, DUOC_LIEU, LUAT, NANG_CAP_GOC, giaBan, laDanThat, timDanPhuong, timDuocLieu, timPhuLieu, type DanPhuong, type LoiThe, type NangCap, type PhamThat, type Tuoi } from './duLieu.ts';
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

export function muaDuocLieu(k: Kho, id: string, tuoi: Tuoi): Kho {
  const gia = giaMua(k, id, tuoi);
  if (k.linhThach < gia) return k;
  const c = [...k.duocLieu[id]] as [number, number, number];
  c[tuoi] += 1;
  return { ...k, linhThach: k.linhThach - gia, duocLieu: { ...k.duocLieu, [id]: c } };
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

/** Cộng tu vi theo số giây đã trôi qua, tự lên tầng khi đủ điểm, dừng ở viên mãn tầng cuối. */
export function tuLuyen(k: Kho, giay: number): Kho {
  if (!k.nhanVat || vienMan(k)) return k;
  const cg = k.tuVi.canhGioi;
  let { tang, diem } = k.tuVi;
  diem += giay * LUAT.tuViMoiGiay * loiThe(k.nhanVat).tocDoTuLuyen;
  while (tang < soTang(cg) && diem >= tuViCan(tang, cg)) {
    diem -= tuViCan(tang, cg);
    tang += 1;
  }
  if (tang >= soTang(cg)) diem = Math.min(diem, tuViCan(tang, cg));
  return { ...k, tuVi: { ...k.tuVi, tang, diem } };
}

/** Lợi thế luyện đan của người chơi: bẩm sinh (thiên mệnh) cộng phần do cảnh giới mang lại. */
export function loiTheKho(k: Kho): LoiThe {
  const goc = loiThe(k.nhanVat);
  const bac = Math.max(0, k.tuVi.canhGioi - 1);
  return { ...goc, phamCong: goc.phamCong + bac * LUAT.canhGioi.pham, rongVung: goc.rongVung + bac * LUAT.canhGioi.rongVung };
}

// ---------- đột phá ----------

/** Đan đột phá mà cảnh giới hiện tại cần; đã ở đỉnh (Tiên Đế) thì không có. */
export const danDotPha = (k: Kho): DanPhuong | null =>
  k.tuVi.canhGioi + 1 < CANH_GIOI.length ? DAN_PHUONG.find((p) => p.dotPha === k.tuVi.canhGioi + 1) ?? null : null;

/** Tỉ lệ đột phá thành công nếu dùng một viên phẩm này. */
export function tiLeDotPha(k: Kho, pham: PhamThat, danVan: boolean): number {
  if (danVan) return 1;
  const kv = ((k.nhanVat?.khiVan ?? 50) - 50) * LUAT.dotPha.khiVan;
  return Math.min(0.99, Math.max(0.05, LUAT.dotPha.tiLe[pham] + kv));
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
  return { thanh, kho: { ...k, tuVi, tuiDan: { ...k.tuiDan, [p.id]: tui }, danVan: { ...k.danVan, [p.id]: dv } } };
}
