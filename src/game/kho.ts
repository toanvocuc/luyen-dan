// Trạng thái lâu dài của người chơi (linh thạch, dược liệu, túi đan…) + lưu vào trình duyệt.
import { DAN_PHUONG, DUOC_LIEU, NANG_CAP_GOC, laDanThat, type NangCap, type Tuoi } from './duLieu.ts';
import type { KetQua } from './luyenDan.ts';

export interface Kho {
  phienBan: 1;
  linhThach: number;
  /** id dược liệu -> số lượng theo tuổi thuốc [mười, trăm, ngàn năm]. */
  duocLieu: Record<string, [number, number, number]>;
  /** id phụ liệu -> số lượng. */
  phuLieu: Record<string, number>;
  /** id đan phương -> số viên theo phẩm [hạ, trung, thượng, cực]. */
  tuiDan: Record<string, [number, number, number, number]>;
  /** id đan phương -> số viên cực phẩm có đan văn. */
  danVan: Record<string, number>;
  /** id đan phương -> số mẻ đã luyện thành (để mở luyện nhanh). */
  thongThao: Record<string, number>;
  nangCap: NangCap;
  thongKe: { soMe: number; noLo: number };
}

const KHOA = 'luyen-dan-kho-v1';

export function khoMoi(): Kho {
  const duocLieu: Kho['duocLieu'] = {};
  for (const d of DUOC_LIEU) duocLieu[d.id] = [12, 4, 1];
  const tuiDan: Kho['tuiDan'] = {};
  const danVan: Kho['danVan'] = {};
  const thongThao: Kho['thongThao'] = {};
  for (const p of DAN_PHUONG) {
    tuiDan[p.id] = [0, 0, 0, 0];
    danVan[p.id] = 0;
    thongThao[p.id] = 0;
  }
  return {
    phienBan: 1,
    linhThach: 100,
    duocLieu,
    phuLieu: { 'hoa-tinh': 2, 'ngung-than-thao': 2 },
    tuiDan,
    danVan,
    thongThao,
    nangCap: { ...NANG_CAP_GOC },
    thongKe: { soMe: 0, noLo: 0 },
  };
}

export function napKho(): Kho {
  try {
    const s = localStorage.getItem(KHOA);
    if (s) {
      const k = JSON.parse(s) as Kho;
      if (k && k.phienBan === 1) {
        // bù các mục mới thêm vào dữ liệu sau khi người chơi đã có bản lưu
        const moi = khoMoi();
        return {
          ...moi,
          ...k,
          duocLieu: { ...moi.duocLieu, ...k.duocLieu },
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

/** Cất đan vừa luyện vào túi và ghi thống kê. */
export function nhanKetQua(k: Kho, phuongId: string, kq: KetQua): Kho {
  const thongKe = { soMe: k.thongKe.soMe + 1, noLo: k.thongKe.noLo + (kq.noLo ? 1 : 0) };
  if (kq.noLo) return { ...k, thongKe };
  const tui = [...k.tuiDan[phuongId]] as [number, number, number, number];
  let dv = k.danVan[phuongId] ?? 0;
  for (const v of kq.vien) {
    if (laDanThat(v.pham)) tui[v.pham] += 1;
    if (v.danVan) dv += 1;
  }
  return {
    ...k,
    thongKe,
    tuiDan: { ...k.tuiDan, [phuongId]: tui },
    danVan: { ...k.danVan, [phuongId]: dv },
    thongThao: { ...k.thongThao, [phuongId]: (k.thongThao[phuongId] ?? 0) + 1 },
  };
}
