// Bộ máy trận đánh dùng chung cho đánh theo lượt (boss) và tự đánh (quái thường).
// Không biết gì về Vực Thẳm hay kho: nơi gọi đưa vào "đòn chuẩn" (sát thương 100% một đòn của người chơi lên địch này),
// máu tối đa hai bên, rồi nhận lại sát thương, dòng nhật ký và danh sách hiệu ứng hình ảnh để giao diện phát.
// Thiết kế: docs/thiet-ke-combat.md.
import {
  HE,
  NGUYEN,
  THIEN_PHU,
  nguyenCua,
  heSoChieu,
  timBiTich,
  type BacThienPhu,
  type BiTich,
  type He,
  type NguyenTo,
} from './voCong.ts';

// ---------- trạng thái trong trận ----------

export type TtId = 'kiem-thuong' | 'pha-giap' | 'lien-kich' | 'chan-dong' | 'choang' | 'noi-thuong' | 'diem-huyet' | 'thieu-dot' | 'han-khi' | 'khi-the' | 'truy-phong';
export interface TtTang {
  tang: number;
  /** Còn bấy nhiêu lượt (0 = không hết hạn). */
  luot: number;
}
export type BangTt = Partial<Record<TtId, TtTang>>;
/** Thông tin hiển thị: tên, số tầng tối đa, ảnh biểu tượng (public/hinh/combat/tt/<anh>.webp), mô tả ngắn. */
export const TT: Record<TtId, { ten: string; toiDa: number; anh: string; moTa: string }> = {
  'kiem-thuong': { ten: 'Kiếm thương', toiDa: 5, anh: 'kiem-thuong', moTa: 'Mất 1,5% máu mỗi tầng mỗi lượt' },
  'pha-giap': { ten: 'Phá giáp', toiDa: 3, anh: 'pha-giap', moTa: 'Chịu thêm 10% sát thương mỗi tầng' },
  'lien-kich': { ten: 'Liên kích', toiDa: 5, anh: 'lien-kich', moTa: 'Sát thương +10% mỗi tầng; thủ hoặc dùng đan thì mất' },
  'chan-dong': { ten: 'Chấn động', toiDa: 3, anh: 'chan-dong', moTa: 'Đủ 3 tầng thì choáng' },
  choang: { ten: 'Choáng', toiDa: 1, anh: 'choang', moTa: 'Mất lượt' },
  'noi-thuong': { ten: 'Nội thương', toiDa: 3, anh: 'noi-thuong', moTa: 'Mất 2% máu mỗi tầng mỗi lượt, bỏ qua giáp' },
  'diem-huyet': { ten: 'Điểm huyệt', toiDa: 3, anh: 'diem-huyet', moTa: 'Gây ít hơn 12% sát thương mỗi tầng' },
  'thieu-dot': { ten: 'Thiêu đốt', toiDa: 3, anh: 'thieu-dot', moTa: 'Mất 1,5% máu mỗi tầng mỗi lượt' },
  'han-khi': { ten: 'Hàn khí', toiDa: 1, anh: 'han-khi', moTa: 'Chịu thêm 10% sát thương' },
  'khi-the': { ten: 'Khí thế', toiDa: 2, anh: 'khi-the', moTa: 'Mỗi tầng: tuyệt chiêu hồi nhanh 1 lượt' },
  'truy-phong': { ten: 'Truy phong', toiDa: 1, anh: 'lien-kich', moTa: 'Võ kỹ kế tiếp +30%' },
};
export const anhTt = (id: string) => `./hinh/combat/tt/${id}.webp`;

/** Trạng thái riêng của một trận (lưu trong trận boss; tự đánh thì chỉ sống trong lúc mô phỏng). */
export interface ChienTran {
  dich: BangTt;
  minh: BangTt;
  /** Khiên của người chơi (máu tuyệt đối). */
  khien: number;
  /** Tuyệt chiêu còn bấy nhiêu lượt mới dùng lại được. */
  hoi: number;
  /** Còn bấy nhiêu lượt địch mới bị choáng lại được (địch mạnh không bị khoá chết). */
  choangCho: number;
  /** Số lượt người chơi đã đi (để tính Lăng Ba Bộ). */
  luot: number;
  /** Chân nguyên còn lại (thiếu ở trận cũ thì coi như đầy). */
  nguyen?: number;
}
export const chienMoi = (nguyen: number = NGUYEN.toiDa): ChienTran => ({ dich: {}, minh: {}, khien: 0, hoi: 0, choangCho: 0, luot: 0, nguyen });
/** Chân nguyên tối đa của người chơi. */
export const nguyenToiDa = (hs: { tamPhap: string[] }) => NGUYEN.toiDa + (hs.tamPhap.includes('thanh-tam') ? NGUYEN.thanhTam : 0);
export const nguyenNay = (st: ChienTran, hs: { tamPhap: string[] }) => st.nguyen ?? nguyenToiDa(hs);
/** Chiêu có đủ chân nguyên để dùng không. */
export const duNguyen = (hs: HoSo, st: ChienTran, loai: 'vo-ky' | 'tuyet-chieu') => {
  const bt = loai === 'vo-ky' ? hs.voKy : hs.tuyetChieu;
  return !bt || nguyenNay(st, hs) >= nguyenCua(bt.id);
};

// ---------- hình ảnh ----------

export type Vfx =
  | { loai: 'vet' | 'tuyet' | 'nguyen-to' | 'phu'; id: string; ben: 'dich' | 'minh' }
  | { loai: 'so'; so: number; kieu: 'thuong' | 'bao' | 'dot' | 'hoi' | 'ne' | 'khien'; ben: 'dich' | 'minh' }
  | { loai: 'rung' };
export const anhVfx = (loai: string, id: string) => `./hinh/combat/${loai}/${id}.webp`;

// ---------- hồ sơ người chơi ----------

/** Những gì của người chơi mà trận đánh cần, dựng từ kho ở nơi gọi. */
export interface HoSo {
  voKy: BiTich | null;
  tuyetChieu: BiTich | null;
  thanPhap: string | null;
  tamPhap: string[];
  thienPhu: Record<He, BacThienPhu>;
  linhCan: { he: NguyenTo[]; hieuLuc: number };
  /** Thân pháp người chơi / thân pháp chuẩn của địch. */
  rThanPhap: number;
  mauMax: number;
  mauNay: number;
}

const coTam = (hs: HoSo, id: string) => hs.tamPhap.includes(id);
const luotTt = (hs: HoSo) => 3 + (coTam(hs, 'hon-nguyen') ? 1 : 0);
function them(b: BangTt, id: TtId, so = 1, luot = 3): BangTt {
  const cu = b[id];
  return { ...b, [id]: { tang: Math.min(TT[id].toiDa, (cu?.tang ?? 0) + so), luot } };
}
function bo(b: BangTt, id: TtId): BangTt {
  const m = { ...b };
  delete m[id];
  return m;
}
export const tang = (b: BangTt, id: TtId) => b[id]?.tang ?? 0;

/** Võ kỹ dùng khi chưa lắp gì: quyền cước thô sơ. */
const QUYEN_CUOC = { heSo: 0.8, he: 'quyen' as He, ten: 'Quyền cước' };

/** Chiêu đang dùng: tên, hệ, hệ số đầy đủ (phẩm, luyện thục, thiên phú). */
function thongTinChieu(hs: HoSo, bt: BiTich | null) {
  if (!bt) return { ten: QUYEN_CUOC.ten, he: QUYEN_CUOC.he, heSo: QUYEN_CUOC.heSo, id: '', nguyenTo: undefined as NguyenTo | undefined, hoi: 0 };
  const g = timBiTich(bt.id);
  const he = g.he ?? 'quyen';
  return { ten: g.ten, he, heSo: heSoChieu(bt) * (1 + THIEN_PHU[hs.thienPhu[he]].satThuong), id: g.id, nguyenTo: bt.nguyenTo, hoi: g.hoi ?? 3 };
}
/** Tuyệt chiêu có dùng được lúc này không (đã lắp, đã mở ô, hết hồi). */
export const tuyetChieuSan = (hs: HoSo, st: ChienTran, moO: boolean) => moO && !!hs.tuyetChieu && st.hoi <= 0 && nguyenNay(st, hs) >= nguyenCua(hs.tuyetChieu.id);

export interface KetDon {
  st: ChienTran;
  /** Sát thương lên địch. */
  dmg: number;
  /** Máu người chơi hồi lại (tuyệt đối). */
  hoi: number;
  dong: string[];
  vfx: Vfx[];
}

/**
 * Người chơi ra một đòn. `donChuan(ngoai)` = sát thương 100% của đòn ngoại gia (Lực) hoặc nội gia (Thần thức) lên địch này.
 * `heSoGiap`: địch đang thủ giáp thì < 1 (Nhất Dương Chỉ xuyên qua).
 */
export function raDon(hs: HoSo, st0: ChienTran, loai0: 'vo-ky' | 'tuyet-chieu' | 'thuong', donChuan: (ngoai: boolean) => number, mauMaxDich: number, heSoGiap: number, rng: () => number): KetDon {
  // đánh thường (quyền cước) = võ kỹ khi chưa lắp gì: không tốn chân nguyên
  const loai = loai0 === 'thuong' ? 'vo-ky' : loai0;
  const bt = loai0 === 'thuong' ? null : loai === 'tuyet-chieu' ? hs.tuyetChieu : hs.voKy;
  const c = thongTinChieu(hs, bt);
  const toiDa = nguyenToiDa(hs);
  const tieu = bt ? nguyenCua(bt.id) : 0;
  let st: ChienTran = { ...st0, dich: { ...st0.dich }, minh: { ...st0.minh }, luot: st0.luot + 1, nguyen: Math.min(toiDa, nguyenNay(st0, hs) - tieu + NGUYEN.hoiMoiLuot) };
  const dong: string[] = [];
  const vfx: Vfx[] = [];
  const goc = donChuan(HE[c.he].ngoai);
  const coThem = coTam(hs, 'thanh-tam') ? 0.1 : 0;
  const lt = luotTt(hs);
  // hệ số chung của mọi đòn trong lượt này
  let chung = 1 + 0.1 * tang(st.minh, 'lien-kich');
  chung *= 1 + 0.1 * tang(st.dich, 'pha-giap');
  if (st.dich['han-khi']) chung *= 1.1;
  if (coTam(hs, 'cuong-huyet') && hs.mauNay < hs.mauMax * 0.3) chung *= 1.2;
  const giap = c.id === 'nhat-duong' ? 1 : heSoGiap;
  const nguyenTo = c.nguyenTo && hs.linhCan.he.includes(c.nguyenTo) ? c.nguyenTo : null;
  const h = hs.linhCan.hieuLuc;
  if (nguyenTo === 'kim') chung *= 1 + 0.2 * h;
  const baoKich = () => rng() < 0.05 + (0.1 * hs.rThanPhap) / (hs.rThanPhap + 1);
  let tong = 0;
  let hoi = 0;
  let coBao = false;
  const danh = (heSo: number) => {
    const bao = baoKich();
    coBao ||= bao;
    const d = Math.round(goc * heSo * chung * giap * (0.9 + rng() * 0.2) * (bao ? 1.6 : 1));
    tong += d;
    vfx.push({ loai: 'so', so: d, kieu: bao ? 'bao' : 'thuong', ben: 'dich' });
    return d;
  };

  if (loai === 'vo-ky') {
    let heSo = c.heSo;
    if (st.minh['truy-phong']) {
      heSo *= 1.3;
      st.minh = bo(st.minh, 'truy-phong');
    }
    danh(heSo);
    vfx.unshift({ loai: 'vet', id: c.he, ben: 'dich' });
    const pha: string[] = [];
    if (c.id === 'luu-van-kiem') {
      st.dich = them(st.dich, 'kiem-thuong', 1, lt);
      pha.push('Kiếm thương');
    } else if (c.id === 'cuong-lan-dao' && rng() < 0.6 + coThem) {
      st.dich = them(st.dich, 'pha-giap', 1, lt);
      pha.push('Phá giáp');
    } else if (c.id === 'bon-loi-thuong') {
      st.minh = them(st.minh, 'lien-kich', 1, 0);
    } else if (c.id === 'khai-son-quyen') {
      st.dich = them(st.dich, 'chan-dong', 1, lt);
      if (tang(st.dich, 'chan-dong') >= 3 && st.choangCho <= 0) {
        // luot 2: mất lượt kế của địch, rồi vẫn còn trong lượt kế của người chơi (để Bá Vương Quyền ăn ×1,5)
        st.dich = them(bo(st.dich, 'chan-dong'), 'choang', 1, 2);
        st.choangCho = 5;
        vfx.push({ loai: 'phu', id: 'choang', ben: 'dich' });
        pha.push('CHOÁNG');
      }
    } else if (c.id === 'han-bang-chuong') {
      st.dich = them(st.dich, 'noi-thuong', 1, lt);
      pha.push('Nội thương');
    } else if (c.id === 'kinh-hong-chi' && rng() < 0.7 + coThem) {
      st.dich = them(st.dich, 'diem-huyet', 1, lt);
      pha.push('Điểm huyệt');
    }
    dong.push(`Ngươi dùng ${c.ten}: −${tong}${coBao ? ' (bạo kích!)' : ''}.${pha.length ? ` ${pha.join(', ')}.` : ''}`);
  } else {
    vfx.unshift({ loai: 'tuyet', id: c.he, ben: 'dich' }, { loai: 'rung' });
    let chu = '';
    if (c.id === 'van-kiem') {
      const n = tang(st.dich, 'kiem-thuong');
      danh(c.heSo * (1 + 0.3 * n));
      st.dich = bo(st.dich, 'kiem-thuong');
      chu = n ? ` Nổ ${n} tầng Kiếm thương.` : '';
    } else if (c.id === 'pha-thien') {
      danh(c.heSo * (1 + 0.25 * tang(st.dich, 'pha-giap')));
    } else if (c.id === 'long-dang') {
      for (let i = 0; i < 3; i++) {
        danh(c.heSo * (1 + 0.1 * tang(st.minh, 'lien-kich')) / (1 + 0.1 * tang(st0.minh, 'lien-kich')));
        st.minh = them(st.minh, 'lien-kich', 1, 0);
      }
    } else if (c.id === 'ba-vuong') {
      const choang = !!st.dich.choang;
      danh(c.heSo * (choang ? 1.5 : 1));
      if (choang) chu = ' Địch đang choáng: ×1,5.';
    } else if (c.id === 'thai-cuc') {
      danh(c.heSo);
      const n = tang(st.dich, 'noi-thuong');
      if (n) {
        const no = Math.round(mauMaxDich * 0.02 * n * 2);
        tong += no;
        vfx.push({ loai: 'so', so: no, kieu: 'dot', ben: 'dich' });
        chu = ` Kích nổ Nội thương: −${no}.`;
      }
    } else if (c.id === 'nhat-duong') {
      const n = tang(st.dich, 'diem-huyet');
      danh(c.heSo * (1 + 0.2 * n));
      if (n) {
        hoi += Math.round(hs.mauMax * 0.05 * n);
        st.dich = bo(st.dich, 'diem-huyet');
        chu = ` Tiêu ${n} tầng Điểm huyệt.`;
      }
    } else danh(c.heSo);
    const kt = tang(st.minh, 'khi-the');
    st.hoi = Math.max(1, c.hoi - kt);
    st.minh = bo(st.minh, 'khi-the');
    dong.push(`Ngươi tung tuyệt chiêu ${c.ten}: −${tong}${coBao ? ' (bạo kích!)' : ''}.${chu}`);
  }
  if (loai === 'vo-ky' && st.hoi > 0) st.hoi -= 1;

  // hiệu ứng linh căn của chiêu (chỉ khi chiêu cùng hệ với linh căn)
  if (nguyenTo) {
    vfx.push({ loai: 'nguyen-to', id: nguyenTo, ben: nguyenTo === 'moc' || nguyenTo === 'tho' ? 'minh' : 'dich' });
    if (nguyenTo === 'moc') hoi += Math.round(hs.mauMax * 0.03 * h);
    else if (nguyenTo === 'thuy') st.dich = them(st.dich, 'han-khi', 1, 2);
    else if (nguyenTo === 'hoa') st.dich = them(st.dich, 'thieu-dot', 1, lt);
    else if (nguyenTo === 'tho') st.khien = Math.min(hs.mauMax * 0.3, st.khien + Math.round(hs.mauMax * 0.08 * h));
    else if (nguyenTo === 'loi' && rng() < 0.25 * h) {
      const set = Math.round(tong * 0.4);
      tong += set;
      vfx.push({ loai: 'so', so: set, kieu: 'thuong', ben: 'dich' });
      dong.push(`Lôi kích: −${set}.`);
    }
  }
  if (hoi > 0) vfx.push({ loai: 'so', so: hoi, kieu: 'hoi', ben: 'minh' }, { loai: 'phu', id: 'hoi', ben: 'minh' });
  if (coBao) vfx.push({ loai: 'phu', id: 'bao', ben: 'dich' }, { loai: 'rung' });
  return { st, dmg: tong, hoi, dong, vfx };
}

/** Người chơi thủ thế: mất Liên kích, +1 Khí thế, tuyệt chiêu vẫn hồi. */
export function thuThe(st: ChienTran, hs: HoSo): ChienTran {
  const nguyen = Math.min(nguyenToiDa(hs), nguyenNay(st, hs) + NGUYEN.hoiMoiLuot + NGUYEN.hoiKhiThu);
  return { ...st, minh: them(bo(st.minh, 'lien-kich'), 'khi-the', 1, 0), hoi: Math.max(0, st.hoi - 1), luot: st.luot + 1, nguyen };
}
/** Dùng đan: mất Liên kích, tuyệt chiêu vẫn hồi. `nguyenThem`: Hồi Nguyên Đan. */
export function dungDanTran(st: ChienTran, hs: HoSo, nguyenThem = 0): ChienTran {
  const nguyen = Math.min(nguyenToiDa(hs), nguyenNay(st, hs) + NGUYEN.hoiMoiLuot + nguyenThem);
  return { ...st, minh: bo(st.minh, 'lien-kich'), hoi: Math.max(0, st.hoi - 1), luot: st.luot + 1, nguyen };
}

/** Đầu lượt của địch: trạng thái rút máu, đếm lùi thời hạn. Trả về địch có đang choáng không (mất lượt). */
export function dauLuotDich(st0: ChienTran, mauMaxDich: number, hs: HoSo): { st: ChienTran; dmg: number; choang: boolean; dong: string[]; vfx: Vfx[] } {
  let st: ChienTran = { ...st0, dich: { ...st0.dich }, choangCho: Math.max(0, st0.choangCho - 1) };
  const vfx: Vfx[] = [];
  const ktt = tang(st.dich, 'kiem-thuong');
  const nt = tang(st.dich, 'noi-thuong');
  const td = tang(st.dich, 'thieu-dot');
  const dmg = Math.round(mauMaxDich * (0.015 * ktt + 0.02 * nt + 0.015 * td * hs.linhCan.hieuLuc));
  const dong: string[] = [];
  if (dmg > 0) {
    vfx.push({ loai: 'so', so: dmg, kieu: 'dot', ben: 'dich' });
    if (td) vfx.push({ loai: 'nguyen-to', id: 'hoa', ben: 'dich' });
    dong.push(`Vết thương trên địch rút −${dmg}.`);
  }
  const choang = st.dich.choang?.luot === 2;
  for (const id of Object.keys(st.dich) as TtId[]) {
    const t = st.dich[id]!;
    if (t.luot <= 0) continue;
    if (t.luot <= 1) st.dich = bo(st.dich, id);
    else st.dich = { ...st.dich, [id]: { ...t, luot: t.luot - 1 } };
  }
  if (choang) dong.push('Địch choáng váng, mất lượt.');
  return { st, dmg, choang, dong, vfx };
}

/** Người chơi hứng một đòn của địch: né (thân pháp), giảm vì Điểm huyệt, khiên đỡ trước. `dmgGoc` đã tính phòng ngự. */
export function hungDon(hs: HoSo, st0: ChienTran, dmgGoc: number, rng: () => number): { st: ChienTran; dmg: number; ne: boolean; dong: string[]; vfx: Vfx[] } {
  let st: ChienTran = { ...st0, minh: { ...st0.minh } };
  const vfx: Vfx[] = [];
  let ne = rng() < Math.min(0.3, (0.3 * hs.rThanPhap) / (hs.rThanPhap + 1)) + (hs.thanPhap === 'lang-ba' ? 0.08 : 0);
  if (hs.thanPhap === 'lang-ba' && st.luot > 0 && st.luot % 5 === 0) ne = true;
  if (ne) {
    if (hs.thanPhap === 'truy-phong') st.minh = them(st.minh, 'truy-phong', 1, 0);
    if (hs.thanPhap === 'huyen-anh') st.minh = them(st.minh, 'khi-the', 1, 0);
    vfx.push({ loai: 'phu', id: 'ne', ben: 'minh' }, { loai: 'so', so: 0, kieu: 'ne', ben: 'minh' });
    return { st, dmg: 0, ne: true, dong: ['Ngươi né được!'], vfx };
  }
  let dmg = dmgGoc * (1 - 0.12 * tang(st.dich, 'diem-huyet'));
  const dong: string[] = [];
  if (st.khien > 0) {
    const hut = Math.min(st.khien, dmg);
    st.khien -= hut;
    dmg -= hut;
    vfx.push({ loai: 'phu', id: 'khien', ben: 'minh' }, { loai: 'so', so: Math.round(hut), kieu: 'khien', ben: 'minh' });
    dong.push(`Hộ thể đỡ ${Math.round(hut)}.`);
  }
  dmg = Math.round(dmg);
  if (dmg > 0) vfx.push({ loai: 'so', so: dmg, kieu: 'thuong', ben: 'minh' });
  return { st, dmg, ne: false, dong, vfx };
}

/** Máy chọn chiêu khi tự đánh: tuyệt chiêu khi sẵn và đáng dùng, còn lại võ kỹ. */
export function mayChon(hs: HoSo, st: ChienTran, moTuyet: boolean): 'vo-ky' | 'tuyet-chieu' | 'thuong' {
  if (!tuyetChieuSan(hs, st, moTuyet)) return duNguyen(hs, st, 'vo-ky') ? 'vo-ky' : 'thuong';
  if (!duNguyen(hs, st, 'vo-ky')) return 'tuyet-chieu';
  const id = hs.tuyetChieu!.id;
  if (id === 'van-kiem') return tang(st.dich, 'kiem-thuong') >= 3 ? 'tuyet-chieu' : 'vo-ky';
  if (id === 'pha-thien') return tang(st.dich, 'pha-giap') >= 2 ? 'tuyet-chieu' : 'vo-ky';
  if (id === 'thai-cuc') return tang(st.dich, 'noi-thuong') >= 2 ? 'tuyet-chieu' : 'vo-ky';
  if (id === 'nhat-duong') return tang(st.dich, 'diem-huyet') >= 2 || hs.mauNay < hs.mauMax * 0.5 ? 'tuyet-chieu' : 'vo-ky';
  if (id === 'ba-vuong') return st.dich.choang ? 'tuyet-chieu' : tang(st.dich, 'chan-dong') >= 2 ? 'vo-ky' : 'tuyet-chieu';
  return tang(st.minh, 'lien-kich') >= 2 ? 'tuyet-chieu' : 'vo-ky';
}

// ---------- tự đánh ----------

export interface DichTuDong {
  ten: string;
  mauMax: number;
  /** Sát thương 100% của người chơi lên con này (ngoại gia / nội gia). */
  donChuan: (ngoai: boolean) => number;
  /** Sát thương một đòn của nó lên người chơi (đã tính phòng ngự, chưa né). */
  dmgDanh: number;
  /** Mất bấy nhiêu phần máu tối đa trong trận thì bị đánh lui (thua, nhưng chưa chết). */
  nguongLui: number;
}
export interface LuotTuDong {
  dong: string[];
  vfx: Vfx[];
  mauDich: number;
  mauMinh: number;
}
export interface KetTuDong {
  thang: boolean;
  /** Hết lượt mà chưa phân thắng bại: địch bỏ đi. */
  hoa: boolean;
  /** Mất quá nhiều máu, bị đánh lui. */
  lui: boolean;
  luot: LuotTuDong[];
  mauMaxDich: number;
  mauMinh: number;
  /** Số lần người chơi bị đánh trúng (để nơi gọi gieo trạng thái của quái). */
  trung: number;
  /** Chiêu đã dùng (để cộng luyện thục). */
  daDung: { voKy: boolean; tuyetChieu: boolean };
}
export interface ThuTuDong {
  ten: string;
  /** Sát thương linh thú gây ra mỗi lần đánh hộ. */
  dmg: number;
}

/** Mô phỏng trọn một trận tự đánh (tối đa `toiDa` lượt). Không đổi kho: nơi gọi tự trừ máu, gieo trạng thái. */
export function tuDanh(hs0: HoSo, dich: DichTuDong, moTuyet: boolean, thu: ThuTuDong | null, rng: () => number, toiDa = 12): KetTuDong {
  let hs = { ...hs0 };
  let st = chienMoi(nguyenToiDa(hs0));
  let mauDich = dich.mauMax;
  const luot: LuotTuDong[] = [];
  let trung = 0;
  const daDung = { voKy: false, tuyetChieu: false };
  for (let n = 1; n <= toiDa; n++) {
    const dong: string[] = [];
    const vfx: Vfx[] = [];
    const chon = mayChon(hs, st, moTuyet);
    if (chon !== 'thuong') daDung[chon === 'vo-ky' ? 'voKy' : 'tuyetChieu'] = true;
    const d = raDon(hs, st, chon, dich.donChuan, dich.mauMax, 1, rng);
    st = d.st;
    mauDich -= d.dmg;
    hs = { ...hs, mauNay: Math.min(hs.mauMax, hs.mauNay + d.hoi) };
    dong.push(...d.dong);
    vfx.push(...d.vfx);
    if (thu && n % 3 === 0 && mauDich > 0) {
      mauDich -= thu.dmg;
      dong.push(`${thu.ten} lao vào: −${thu.dmg}.`);
      vfx.push({ loai: 'so', so: thu.dmg, kieu: 'thuong', ben: 'dich' });
    }
    if (mauDich > 0) {
      const dl = dauLuotDich(st, dich.mauMax, hs);
      st = dl.st;
      mauDich -= dl.dmg;
      dong.push(...dl.dong);
      vfx.push(...dl.vfx);
      if (mauDich > 0 && !dl.choang) {
        if (thu && n % 5 === 0) dong.push(`${thu.ten} đỡ hộ một đòn.`);
        else {
          // quái đánh thất thường, thỉnh thoảng tung đòn hiểm
          const hiem = rng() < 0.2;
          const h = hungDon(hs, st, dich.dmgDanh * (0.7 + rng() * 0.6) * (hiem ? 1.8 : 1), rng);
          st = h.st;
          hs = { ...hs, mauNay: hs.mauNay - h.dmg };
          if (!h.ne) trung += 1;
          dong.push(...(h.ne ? h.dong : h.dmg > 0 ? [`${dich.ten} ${hiem ? 'tung đòn hiểm' : 'đánh trả'}: −${h.dmg}.`, ...h.dong] : [`${dich.ten} ${hiem ? 'tung đòn hiểm' : 'đánh trả'}, Hộ thể đỡ trọn.`]));
          if (hiem && !h.ne) vfx.push({ loai: 'rung' });
          vfx.push(...h.vfx);
        }
      }
    }
    luot.push({ dong, vfx, mauDich: Math.max(0, mauDich), mauMinh: Math.max(0, hs.mauNay) });
    if (mauDich <= 0) return { thang: true, hoa: false, lui: false, luot, mauMaxDich: dich.mauMax, mauMinh: hs.mauNay, trung, daDung };
    if (hs.mauNay <= 0) return { thang: false, hoa: false, lui: false, luot, mauMaxDich: dich.mauMax, mauMinh: 0, trung, daDung };
    if (hs0.mauNay - hs.mauNay >= dich.nguongLui * hs.mauMax) {
      luot[luot.length - 1].dong.push('Ngươi bị đánh lui!');
      return { thang: false, hoa: false, lui: true, luot, mauMaxDich: dich.mauMax, mauMinh: hs.mauNay, trung, daDung };
    }
  }
  return { thang: false, hoa: true, lui: false, luot, mauMaxDich: dich.mauMax, mauMinh: hs.mauNay, trung, daDung };
}

