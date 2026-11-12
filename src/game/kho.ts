// Trạng thái lâu dài của người chơi (linh thạch, dược liệu, túi đan…) + lưu vào trình duyệt.
import { DAN_PHUONG, DUOC_LIEU, LUAT, NANG_CAP_GOC, giaBan, laDanThat, timDanPhuong, timDuocLieu, timPhuLieu, type NangCap, type PhamThat, type Tuoi } from './duLieu.ts';
import type { KetQua } from './luyenDan.ts';

export interface Kho {
  phienBan: 2;
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

const KHOA = 'luyen-dan-kho-v2';

export function khoMoi(): Kho {
  const duocLieu: Kho['duocLieu'] = {};
  for (const d of DUOC_LIEU) duocLieu[d.id] = [0, 0, 0];
  // vốn ban đầu: đủ luyện ba mẻ Tụ Khí Đan
  duocLieu['linh-thao'] = [6, 0, 0];
  duocLieu['chu-qua'] = [3, 0, 0];
  const tuiDan: Kho['tuiDan'] = {};
  const danVan: Kho['danVan'] = {};
  const thongThao: Kho['thongThao'] = {};
  for (const p of DAN_PHUONG) {
    tuiDan[p.id] = [0, 0, 0, 0];
    danVan[p.id] = 0;
    thongThao[p.id] = 0;
  }
  return {
    phienBan: 2,
    linhThach: 120,
    duocLieu,
    phuLieu: { 'hoa-tinh': 0, 'ngung-than-thao': 0 },
    tuiDan,
    danVan,
    thongThao,
    nangCap: { ...NANG_CAP_GOC },
    loHu: false,
    thongKe: { soMe: 0, noLo: 0 },
  };
}

export function napKho(): Kho {
  try {
    const s = localStorage.getItem(KHOA);
    if (s) {
      const k = JSON.parse(s) as Kho;
      if (k && k.phienBan === 2) {
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

export function muaDuocLieu(k: Kho, id: string, tuoi: Tuoi): Kho {
  const gia = timDuocLieu(id).gia[tuoi];
  if (k.linhThach < gia) return k;
  const c = [...k.duocLieu[id]] as [number, number, number];
  c[tuoi] += 1;
  return { ...k, linhThach: k.linhThach - gia, duocLieu: { ...k.duocLieu, [id]: c } };
}

export function muaPhuLieu(k: Kho, id: string): Kho {
  const p = timPhuLieu(id);
  if (!p || k.linhThach < p.gia) return k;
  return { ...k, linhThach: k.linhThach - p.gia, phuLieu: { ...k.phuLieu, [id]: (k.phuLieu[id] ?? 0) + 1 } };
}

/** Giá trị toàn bộ đan của một đan phương nếu bán ở phường thị. */
export function giaTriTui(k: Kho, phuongId: string): number {
  const p = timDanPhuong(phuongId);
  const t = k.tuiDan[phuongId];
  let tong = (k.danVan[phuongId] ?? 0) * giaBan(p, 3, true);
  for (let i = 0; i < 4; i++) tong += t[i] * giaBan(p, i as PhamThat);
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
