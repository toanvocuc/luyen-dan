// Lõi luyện đan: thuần tính toán, không dính giao diện — để chạy mô phỏng cân bằng được bằng Node.
import { CHAT_LUONG_THEO_TUOI, LUAT, type DanPhuong, type NangCap, type Pham, type PhuLieu, type Tuoi } from './duLieu.ts';

/** Trạng thái của một mẻ đang luyện. */
export interface Me {
  /** Chất lượng: càng cao phẩm cấp càng lệch lên trên. */
  chatLuong: number;
  /** Áp lò: chạm LUAT.apNoLo là nổ. Tăng khi lửa quá nóng và khi tôi đan trượt. */
  apLo: number;
  soVien: number;
  /** Cấp tôi đan hiện tại (+0, +1, …). */
  cap: number;
}

export type Vung = 'trong' | 'nong' | 'lanh';

export interface Vien {
  pham: Pham;
  danVan: boolean;
  /** Chỉ có ở viên từng là cực phẩm: true = vượt đan kiếp, false = kiếp tán (tụt xuống thượng phẩm). */
  vuotKiep?: boolean;
}
export interface KetQua {
  noLo: boolean;
  vien: Vien[];
}

const kep = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
/** Lò tốt hơn thì áp tăng chậm hơn. */
const heSoAp = (nangCap: NangCap) => Math.max(0.3, 1 - 0.1 * nangCap.lo);

export function batDauMe(tuoi: readonly [Tuoi, Tuoi, Tuoi], phuLieu: PhuLieu | null, nangCap: NangCap): Me {
  const tb = (CHAT_LUONG_THEO_TUOI[tuoi[0]] + CHAT_LUONG_THEO_TUOI[tuoi[1]] + CHAT_LUONG_THEO_TUOI[tuoi[2]]) / 3;
  const themVien = Math.floor(nangCap.tayNghe / 2);
  return {
    chatLuong: tb + (phuLieu?.chatLuong ?? 0),
    // áp lò được phép âm: phụ liệu ổn định cho một khoản "đệm" trừ dần về sau
    apLo: phuLieu?.apLo ?? 0,
    soVien: Math.max(1, LUAT.soVienGoc + themVien + (phuLieu?.soVien ?? 0)),
    cap: 0,
  };
}

/** Bề rộng vùng hỏa hầu (rộng ra theo cấp linh hỏa). */
export function rongVung(phuong: DanPhuong, nangCap: NangCap): number {
  return phuong.rongVung + nangCap.lua * 2;
}

/**
 * Cập nhật mẻ theo một khoảng thời gian giữ lửa. Trả về mẻ mới (không sửa mẻ cũ).
 * `giayNong` là số giây lửa đã nằm liên tục ở vùng quá nóng — càng lì càng dâng áp nhanh.
 */
export function giuLua(me: Me, vung: Vung, dt: number, nangCap: NangCap, giayNong = 0): Me {
  const r = LUAT.chinh;
  if (vung === 'trong') return { ...me, chatLuong: me.chatLuong + r.trong * dt, apLo: me.apLo > 0 ? Math.max(0, me.apLo - r.xaAp * dt) : me.apLo };
  if (vung === 'lanh') return { ...me, chatLuong: Math.max(0, me.chatLuong + r.lanh * dt) };
  return { ...me, apLo: me.apLo + r.nongAp * (1 + r.nongTangToc * giayNong) * heSoAp(nangCap) * dt };
}

/** Áp lò đã vượt ngưỡng nổ chưa. */
export const quaAp = (me: Me) => me.apLo >= LUAT.apNoLo;

/** Phân bố phẩm cấp của từng viên nếu thu đan ngay: [phế, hạ, trung, thượng, cực], cộng lại bằng 1. */
export function tiLeVien(phuong: DanPhuong, me: Me): number[] {
  const q = kep(me.chatLuong, 0, 100);
  const tam = LUAT.phamGoc + (LUAT.phamDoc * q) / 100 - phuong.doKho + LUAT.toi.phamMoiCap * me.cap;
  const w: number[] = [];
  let tong = 0;
  for (let i = 0; i < 5; i++) {
    const d = i - tam;
    const v = Math.exp(-(d * d) / (2 * LUAT.phamDoRong * LUAT.phamDoRong));
    w.push(v);
    tong += v;
  }
  return w.map((v) => v / tong);
}

// ---------- tôi đan: minigame con lắc ----------

export type KetQuaToi = 'no' | 'lech' | 'truot' | 'thanh' | 'dai-thanh';

/** Bố cục thanh tôi đan cho một lần bấm. Mọi bề rộng tính theo phần của thanh (0–1). */
export interface VungToi {
  /** Tâm khoảng xanh. */
  tam: number;
  /** Bề rộng khoảng xanh (thành). */
  xanh: number;
  /** Bề rộng khoảng vàng nằm giữa khoảng xanh (đại thành). */
  vang: number;
  /** Bề rộng dải "trượt" mỗi bên. */
  gan: number;
  /** Số giây con lắc đi hết một lượt từ đầu này sang đầu kia. */
  giayQuet: number;
}

export const coTheToi = (me: Me) => me.cap < LUAT.toi.capToiDa && me.soVien > 0;

/** Bố cục thanh ở cấp hiện tại. `r` trong [0,1) quyết định vị trí khoảng xanh, để không bấm theo nhịp thuộc lòng được. */
export function vungToi(phuong: DanPhuong, me: Me, r: number): VungToi {
  const t = LUAT.toi;
  const q = kep(me.chatLuong, 0, 100);
  const xanh = Math.max(t.xanhToiThieu, t.xanhGoc - t.xanhMoiCap * me.cap - t.xanhDoKho * phuong.doKho + t.xanhMoiChatLuong * (q - 50));
  const vang = Math.min(xanh * 0.6, Math.max(t.vangToiThieu, t.vangGoc - t.vangMoiCap * me.cap));
  const nua = xanh / 2 + t.gan;
  return {
    tam: nua + 0.04 + r * (1 - 2 * (nua + 0.04)),
    xanh,
    vang,
    gan: t.gan,
    giayQuet: Math.max(t.quetToiThieu, t.quetGoc - t.quetMoiCap * me.cap),
  };
}

/** Vị trí con lắc (0–1) tại pha `p` radian: dao động hình sin, nhanh nhất ở giữa thanh. */
export const viTriConLac = (p: number) => 0.5 - 0.5 * Math.cos(p);
/** Tốc độ góc của con lắc ứng với thời gian quét. */
export const tocDoGoc = (v: VungToi) => Math.PI / v.giayQuet;

/** Người chơi dừng con lắc ở vị trí x (0–1). */
export function toiDan(me: Me, vung: VungToi, x: number, nangCap: NangCap): { loai: KetQuaToi; me: Me } {
  const t = LUAT.toi;
  const d = Math.abs(x - vung.tam);
  const capMoi = (them: number) => Math.min(t.capToiDa, me.cap + them);
  if (d <= vung.vang / 2) return { loai: 'dai-thanh', me: { ...me, cap: capMoi(2) } };
  if (d <= vung.xanh / 2) return { loai: 'thanh', me: { ...me, cap: capMoi(1) } };
  const gan = d <= vung.xanh / 2 + vung.gan;
  const sau: Me = {
    ...me,
    apLo: me.apLo + (gan ? t.apTruot : t.apLech) * heSoAp(nangCap),
    soVien: gan ? me.soVien : me.soVien - 1,
  };
  if (quaAp(sau)) return { loai: 'no', me: { ...sau, soVien: 0 } };
  return { loai: gan ? 'truot' : 'lech', me: sau };
}

/** Mở lò: quay phẩm cấp riêng cho từng viên; viên cực phẩm phải qua đan kiếp. */
export function moLo(phuong: DanPhuong, me: Me, rng: () => number = Math.random): KetQua {
  const tl = tiLeVien(phuong, me);
  const vien: Vien[] = [];
  for (let n = 0; n < me.soVien; n++) {
    let r = rng();
    let i = 0;
    while (i < 4 && r >= tl[i]) {
      r -= tl[i];
      i++;
    }
    const pham = (i - 1) as Pham;
    if (pham === 3) {
      const qua = rng() < LUAT.vuotKiep;
      vien.push(qua ? { pham: 3, danVan: true, vuotKiep: true } : { pham: 2, danVan: false, vuotKiep: false });
    } else {
      vien.push({ pham, danVan: false });
    }
  }
  return { noLo: false, vien };
}

/**
 * Giả lập cả vòng khống hỏa bằng ba con số: phần thời gian trong vùng, phần quá nóng (còn lại là quá nguội),
 * và độ dài trung bình mỗi lần lỡ sang vùng nóng. Dùng cho luyện nhanh và mô phỏng cân bằng.
 */
export function khongHoaGia(phuong: DanPhuong, me: Me, nangCap: NangCap, trong: number, nong: number, giayMoiLanNong = 0.5): Me {
  const tong = phuong.doan.reduce((s, d) => s + d.giay, 0);
  let m = giuLua(me, 'trong', tong * trong, nangCap);
  m = giuLua(m, 'lanh', tong * Math.max(0, 1 - trong - nong), nangCap);
  return giuLua(m, 'nong', tong * nong, nangCap, giayMoiLanNong / 2);
}

/** Luyện nhanh: bỏ qua khống hỏa, coi như giữ được lửa trong vùng một phần thời gian cố định. */
export function luyenNhanh(phuong: DanPhuong, me: Me, nangCap: NangCap): Me {
  const con = 1 - LUAT.luyenNhanhTrongVung;
  return khongHoaGia(phuong, me, nangCap, LUAT.luyenNhanhTrongVung, con * 0.3);
}
