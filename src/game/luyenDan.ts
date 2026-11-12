// Lõi luyện đan: thuần tính toán, không dính giao diện — để chạy mô phỏng cân bằng được bằng Node.
import { CHAT_LUONG_THEO_TUOI, LUAT, type DanPhuong, type NangCap, type Pham, type PhuLieu, type Tuoi } from './duLieu.ts';

/** Trạng thái của một mẻ đang luyện. */
export interface Me {
  /** Chất lượng: càng cao phẩm cấp càng lệch lên trên. */
  chatLuong: number;
  /** Áp lò: càng cao thì tôi đan càng dễ nổ; chạm ngưỡng lúc khống hỏa là nổ tại chỗ. */
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

export function batDauMe(tuoi: readonly [Tuoi, Tuoi, Tuoi], phuLieu: PhuLieu | null, nangCap: NangCap): Me {
  const tb = (CHAT_LUONG_THEO_TUOI[tuoi[0]] + CHAT_LUONG_THEO_TUOI[tuoi[1]] + CHAT_LUONG_THEO_TUOI[tuoi[2]]) / 3;
  const themVien = Math.floor(nangCap.tayNghe / 2);
  return {
    chatLuong: tb + (phuLieu?.chatLuong ?? 0),
    // áp lò được phép âm: phụ liệu ổn định cho một khoản "đệm" trừ dần khi lò quá nóng
    apLo: phuLieu?.apLo ?? 0,
    soVien: Math.max(1, LUAT.soVienGoc + themVien + (phuLieu?.soVien ?? 0)),
    cap: 0,
  };
}

/** Bề rộng vùng hỏa hầu (rộng ra theo cấp linh hỏa). */
export function rongVung(phuong: DanPhuong, nangCap: NangCap): number {
  return phuong.rongVung + nangCap.lua * 2;
}

/** Cập nhật mẻ theo một khoảng thời gian giữ lửa. Trả về mẻ mới (không sửa mẻ cũ). */
export function giuLua(me: Me, vung: Vung, dt: number): Me {
  const r = LUAT.chinh;
  if (vung === 'trong') return { ...me, chatLuong: me.chatLuong + r.trong * dt };
  if (vung === 'lanh') return { ...me, chatLuong: Math.max(0, me.chatLuong + r.lanh * dt) };
  return { ...me, apLo: me.apLo + r.nongAp * dt };
}

/** Áp lò đã vượt ngưỡng nổ trong lúc khống hỏa chưa. */
export const quaAp = (me: Me) => me.apLo >= LUAT.apNoLo;

/** Phân bố phẩm cấp của từng viên nếu thu đan ngay: [phế, hạ, trung, thượng, cực], cộng lại bằng 1. */
export function tiLeVien(phuong: DanPhuong, me: Me): number[] {
  const q = Math.min(100, Math.max(0, me.chatLuong));
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

export type KetQuaToi = 'no' | 'ton' | 'giu' | 'thanh' | 'dai-thanh';
export const THU_TU_TOI: readonly KetQuaToi[] = ['no', 'ton', 'giu', 'thanh', 'dai-thanh'];

export const coTheToi = (me: Me) => me.cap < LUAT.toi.capToiDa && me.soVien > 0;

/** Tỉ lệ một lần tôi đan: [nổ lò, tổn, giữ, thành, đại thành], cộng lại bằng 1. */
export function tiLeToi(phuong: DanPhuong, me: Me, nangCap: NangCap): number[] {
  const t = LUAT.toi;
  const q = Math.min(100, Math.max(0, me.chatLuong));
  const no = Math.min(0.6, Math.max(0.005, (phuong.noLoGoc + t.noMoiCap * me.cap + t.noMoiAp * Math.max(0, me.apLo)) * (1 - 0.12 * nangCap.lo)));
  const ton = t.tonGoc + t.tonMoiCap * me.cap;
  let dai = Math.max(0.02, t.daiThanhGoc + t.daiThanhMoiChatLuong * (q - 50));
  let thanh = Math.max(0.05, t.thanhGoc - t.thanhMoiCap * me.cap - t.thanhDoKho * phuong.doKho + t.thanhMoiChatLuong * (q - 50));
  // phần tốt không được vượt quá chỗ còn lại sau khi trừ rủi ro
  const con = 1 - no - ton;
  if (dai + thanh > con) {
    const k = con / (dai + thanh);
    dai *= k;
    thanh *= k;
  }
  return [no, ton, Math.max(0, con - dai - thanh), thanh, dai];
}

/** Một lần tôi đan với số ngẫu nhiên r trong [0,1) — r cũng là vị trí kim dừng trên thanh tỉ lệ. */
export function toiDan(phuong: DanPhuong, me: Me, nangCap: NangCap, r: number): { loai: KetQuaToi; me: Me } {
  const tl = tiLeToi(phuong, me, nangCap);
  let i = 0;
  let x = r;
  while (i < 4 && x >= tl[i]) {
    x -= tl[i];
    i++;
  }
  const loai = THU_TU_TOI[i];
  const capMoi = (them: number) => Math.min(LUAT.toi.capToiDa, me.cap + them);
  if (loai === 'no') return { loai, me: { ...me, soVien: 0 } };
  if (loai === 'ton') return { loai, me: { ...me, soVien: me.soVien - 1 } };
  if (loai === 'thanh') return { loai, me: { ...me, cap: capMoi(1) } };
  if (loai === 'dai-thanh') return { loai, me: { ...me, cap: capMoi(2) } };
  return { loai, me };
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

/** Luyện nhanh: bỏ qua khống hỏa, coi như giữ được lửa trong vùng một phần thời gian cố định. */
export function luyenNhanh(phuong: DanPhuong, me: Me): Me {
  const tongGiay = phuong.doan.reduce((s, d) => s + d.giay, 0);
  const trong = tongGiay * LUAT.luyenNhanhTrongVung;
  const conLai = tongGiay - trong;
  let m = giuLua(me, 'trong', trong);
  m = giuLua(m, 'lanh', conLai * 0.7);
  m = giuLua(m, 'nong', conLai * 0.3);
  return m;
}
