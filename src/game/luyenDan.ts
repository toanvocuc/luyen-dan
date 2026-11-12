// Lõi luyện đan: thuần tính toán, không dính giao diện — để chạy mô phỏng cân bằng được bằng Node.
import {
  CHAT_LUONG_THEO_TUOI,
  LUAT,
  type DanPhuong,
  type NangCap,
  type Pham,
  type PhuLieu,
  type Tuoi,
} from './duLieu.ts';

/** Trạng thái của một mẻ đang luyện. */
export interface Me {
  /** Chất lượng: càng cao phẩm cấp càng lệch lên trên. */
  chatLuong: number;
  /** Áp lò: càng cao càng dễ nổ. */
  apLo: number;
  soVien: number;
  /** Số chu thiên đã luyện thêm. */
  chuThien: number;
}

export type Vung = 'trong' | 'nong' | 'lanh';

/** Tỉ lệ của mẻ: nổ lò (cả mẻ), rồi phân bố từng viên [phế, hạ, trung, thượng, cực] cộng lại bằng 1. */
export interface TiLe {
  noLo: number;
  vien: [number, number, number, number, number];
}

export interface Vien {
  pham: Pham;
  danVan: boolean;
}
export interface KetQua {
  noLo: boolean;
  vien: Vien[];
}

export function batDauMe(tuoi: readonly [Tuoi, Tuoi, Tuoi], phuLieu: PhuLieu | null, nangCap: NangCap): Me {
  const tb = (CHAT_LUONG_THEO_TUOI[tuoi[0]] + CHAT_LUONG_THEO_TUOI[tuoi[1]] + CHAT_LUONG_THEO_TUOI[tuoi[2]]) / 3;
  const themVien = Math.floor(nangCap.tayNghe / 2);
  return {
    chatLuong: tb + (phuLieu?.chatLuong ?? 0),
    // áp lò được phép âm: phụ liệu ổn định cho một khoản "đệm" trừ dần khi lò quá nóng
    apLo: phuLieu?.apLo ?? 0,
    soVien: Math.max(1, LUAT.soVienGoc + themVien + (phuLieu?.soVien ?? 0)),
    chuThien: 0,
  };
}

/** Bề rộng vùng hỏa hầu hiện tại (hẹp dần theo từng chu thiên, rộng ra theo cấp linh hỏa). */
export function rongVung(phuong: DanPhuong, me: Me, nangCap: NangCap): number {
  return Math.max(8, phuong.rongVung + nangCap.lua * 2 - me.chuThien * LUAT.chuThien.hepVung);
}

/** Cập nhật mẻ theo một khoảng thời gian giữ lửa. Trả về mẻ mới (không sửa mẻ cũ). */
export function giuLua(me: Me, vung: Vung, dt: number): Me {
  const r = me.chuThien > 0 ? LUAT.chuThien : LUAT.chinh;
  if (vung === 'trong') return { ...me, chatLuong: me.chatLuong + r.trong * dt };
  if (vung === 'lanh') return { ...me, chatLuong: Math.max(0, me.chatLuong + r.lanh * dt) };
  return { ...me, apLo: me.apLo + r.nongAp * dt };
}

export function coTheLuyenThem(me: Me): boolean {
  return me.chuThien < LUAT.chuThien.toiDa;
}

/** Bước vào một chu thiên mới: trả giá áp lò cố định ngay lúc bấm. */
export function vaoChuThien(me: Me): Me {
  return { ...me, chuThien: me.chuThien + 1, apLo: me.apLo + LUAT.chuThien.apCoDinh };
}

export function tinhTiLe(phuong: DanPhuong, me: Me, nangCap: NangCap): TiLe {
  const giamNo = 1 - 0.12 * nangCap.lo;
  const noLo = Math.min(LUAT.noLoToiDa, Math.max(0, (phuong.noLoGoc + Math.max(0, me.apLo) * LUAT.noLoMoiDiemAp) * giamNo));

  const q = Math.min(100, Math.max(0, me.chatLuong));
  const tam = LUAT.phamGoc + (LUAT.phamDoc * q) / 100 - phuong.doKho;
  const w: number[] = [];
  let tong = 0;
  for (let i = 0; i < 5; i++) {
    const d = i - tam;
    const v = Math.exp(-(d * d) / (2 * LUAT.phamDoRong * LUAT.phamDoRong));
    w.push(v);
    tong += v;
  }
  return { noLo, vien: w.map((v) => v / tong) as TiLe['vien'] };
}

/** Sáu đoạn của thanh tỉ lệ, cộng lại bằng 1: [nổ lò, phế, hạ, trung, thượng, cực]. */
export function thanhTiLe(t: TiLe): number[] {
  return [t.noLo, ...t.vien.map((v) => v * (1 - t.noLo))];
}

/** Mở lò: quay nổ lò một lần cho cả mẻ, rồi quay phẩm cấp riêng cho từng viên. */
export function moLo(phuong: DanPhuong, me: Me, nangCap: NangCap, rng: () => number = Math.random): KetQua {
  const t = tinhTiLe(phuong, me, nangCap);
  if (rng() < t.noLo) return { noLo: true, vien: [] };
  const vien: Vien[] = [];
  for (let n = 0; n < me.soVien; n++) {
    let r = rng();
    let i = 0;
    while (i < 4 && r >= t.vien[i]) {
      r -= t.vien[i];
      i++;
    }
    const pham = (i - 1) as Pham;
    vien.push({ pham, danVan: pham === 3 && rng() < LUAT.danVan });
  }
  return { noLo: false, vien };
}

/** Luyện nhanh: bỏ qua khống hỏa, coi như giữ được lửa trong vùng một phần thời gian cố định. */
export function luyenNhanh(phuong: DanPhuong, me: Me): Me {
  const tongGiay = phuong.doan.reduce((s, d) => s + d.giay, 0);
  const trong = tongGiay * LUAT.luyenNhanhTrongVung;
  const conLai = tongGiay - trong;
  let m = giuLua(me, 'trong', trong);
  m = giuLua(m, 'lanh', conLai / 2);
  m = giuLua(m, 'nong', conLai / 2);
  return m;
}
