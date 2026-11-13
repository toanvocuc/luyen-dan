// Thiên mệnh: mọi thuộc tính của nhân vật đều quay ngẫu nhiên theo bảng có trọng số — người chơi không được chọn.
// Mỗi thuộc tính gắn với một lợi thế cụ thể trong luyện đan hoặc tu luyện (hàm loiThe ở cuối file).
import { LOI_THE_GOC, type LoiThe } from './duLieu.ts';

/** Độ hiếm để tô màu: 0 thường, 1 khá, 2 hiếm, 3 cực hiếm. */
export type DoHiem = 0 | 1 | 2 | 3;

interface Muc {
  id: string;
  ten: string;
  /** Trọng số: càng lớn càng hay gặp. */
  trong: number;
  hiem: DoHiem;
  moTa: string;
}

export interface GioiDien extends Muc {
  heSoMua: number;
  heSoBan: number;
  khiVan: number;
}
export const GIOI_DIEN: readonly GioiDien[] = [
  { id: 'thai-hoa', ten: 'Thái Hòa Giới', trong: 34, hiem: 0, moTa: 'Thiên hạ yên ổn, giá cả bình thường.', heSoMua: 1, heSoBan: 1, khiVan: 0 },
  { id: 'van-linh', ten: 'Vạn Linh Giới', trong: 24, hiem: 1, moTa: 'Linh khí dồi dào, dược liệu rẻ hơn 15%.', heSoMua: 0.85, heSoBan: 1, khiVan: 0 },
  { id: 'loan-the', ten: 'Loạn Thế Giới', trong: 20, hiem: 1, moTa: 'Chiến loạn liên miên: đan bán đắt hơn 20%, dược liệu đắt hơn 10%.', heSoMua: 1.1, heSoBan: 1.2, khiVan: 0 },
  { id: 'mat-phap', ten: 'Mạt Pháp Giới', trong: 14, hiem: 2, moTa: 'Linh khí suy kiệt: dược liệu đắt hơn 25%, đan bán đắt hơn 35%.', heSoMua: 1.25, heSoBan: 1.35, khiVan: 0 },
  { id: 'huyen-an', ten: 'Huyền Ẩn Giới', trong: 8, hiem: 3, moTa: 'Tiên duyên ẩn hiện khắp nơi: khí vận +12.', heSoMua: 1, heSoBan: 1, khiVan: 12 },
];

export interface XuatThan extends Muc {
  linhThach: number;
  /** Nhân số dược liệu khởi đầu. */
  heSoDuocLieu: number;
  /** Tay nghề luyện đan có sẵn (0–2): vùng hỏa hầu và khoảng xanh rộng hơn. */
  tayNghe: number;
  /** Cấp lò khởi đầu. */
  lo: number;
  tuChat: number;
  khiVan: number;
  heSoMua: number;
  /** Mở sẵn đan phương thứ hai. */
  moSanPhuong: boolean;
}
export const XUAT_THAN: readonly XuatThan[] = [
  { id: 'nong-ho', ten: 'Nông hộ nghèo', trong: 22, hiem: 0, moTa: 'Tay trắng lập nghiệp, chỉ có 80 linh thạch.', linhThach: 80, heSoDuocLieu: 1, tayNghe: 0, lo: 0, tuChat: 0, khiVan: 0, heSoMua: 1, moSanPhuong: false },
  { id: 'co-nhi', ten: 'Cô nhi', trong: 10, hiem: 0, moTa: 'Gần như không có gì, nhưng trời thương: khí vận +20.', linhThach: 40, heSoDuocLieu: 1, tayNghe: 0, lo: 0, tuChat: 0, khiVan: 20, heSoMua: 1, moSanPhuong: false },
  { id: 'duoc-nong', ten: 'Con nhà dược nông', trong: 16, hiem: 1, moTa: 'Kho dược liệu đầy gấp ba, mua dược liệu rẻ hơn 15%.', linhThach: 120, heSoDuocLieu: 3, tayNghe: 0, lo: 0, tuChat: 0, khiVan: 0, heSoMua: 0.85, moSanPhuong: false },
  { id: 'y-su', ten: 'Gia đình y sư', trong: 14, hiem: 1, moTa: 'Quen mùi thuốc từ nhỏ: tư chất +8, có 160 linh thạch.', linhThach: 160, heSoDuocLieu: 1, tayNghe: 0, lo: 0, tuChat: 8, khiVan: 0, heSoMua: 1, moSanPhuong: false },
  { id: 'tap-dich', ten: 'Tạp dịch tông môn', trong: 14, hiem: 1, moTa: 'Được tông môn cho mượn lò tốt: lò chịu áp cấp 1.', linhThach: 120, heSoDuocLieu: 1, tayNghe: 0, lo: 1, tuChat: 0, khiVan: 0, heSoMua: 1, moSanPhuong: false },
  { id: 'tan-tu', ten: 'Hậu duệ tán tu', trong: 10, hiem: 1, moTa: 'Thừa hưởng chút cơ duyên của tiền nhân: tư chất +5, khí vận +5.', linhThach: 150, heSoDuocLieu: 1, tayNghe: 0, lo: 0, tuChat: 5, khiVan: 5, heSoMua: 1, moSanPhuong: false },
  { id: 'thuong-gia', ten: 'Thương gia giàu có', trong: 8, hiem: 2, moTa: 'Gia tài sung túc: khởi đầu với 500 linh thạch.', linhThach: 500, heSoDuocLieu: 2, tayNghe: 0, lo: 0, tuChat: 0, khiVan: 0, heSoMua: 1, moSanPhuong: false },
  { id: 'dan-su', ten: 'Thế gia luyện đan', trong: 6, hiem: 3, moTa: 'Nghề gia truyền: giữ lửa và tôi đan dễ hơn hẳn, mở sẵn Hồi Xuân Đan.', linhThach: 250, heSoDuocLieu: 2, tayNghe: 2, lo: 0, tuChat: 0, khiVan: 0, heSoMua: 1, moSanPhuong: true },
];

export interface LinhCan extends Muc {
  /** Nhân tốc độ tu luyện. */
  tocDo: number;
}
export const LINH_CAN: readonly LinhCan[] = [
  { id: 'pham', ten: 'Phàm căn', trong: 15, hiem: 0, moTa: 'Gần như không cảm được linh khí: tu luyện chậm còn 60%.', tocDo: 0.6 },
  { id: 'ngu', ten: 'Ngũ linh căn', trong: 27, hiem: 0, moTa: 'Linh căn tạp: tu luyện chậm còn 80%.', tocDo: 0.8 },
  { id: 'tu', ten: 'Tứ linh căn', trong: 24, hiem: 0, moTa: 'Tư chất tu luyện bình thường.', tocDo: 1 },
  { id: 'tam', ten: 'Tam linh căn', trong: 18, hiem: 1, moTa: 'Tu luyện nhanh hơn 30%.', tocDo: 1.3 },
  { id: 'song', ten: 'Song linh căn', trong: 10, hiem: 2, moTa: 'Tu luyện nhanh hơn 70%.', tocDo: 1.7 },
  { id: 'thien', ten: 'Thiên linh căn', trong: 4, hiem: 3, moTa: 'Vạn người có một: tu luyện nhanh gấp 2,4 lần.', tocDo: 2.4 },
  { id: 'bien-di', ten: 'Biến dị linh căn', trong: 2, hiem: 3, moTa: 'Linh căn dị biến hiếm thấy: tu luyện nhanh gấp 3 lần.', tocDo: 3 },
];

export interface TheChat extends Muc {
  chatLuong: number;
  rongVung: number;
  heSoAp: number;
}
export const THE_CHAT: readonly TheChat[] = [
  { id: 'pham', ten: 'Phàm thể', trong: 62, hiem: 0, moTa: 'Thân thể người thường, không có gì đặc biệt.', chatLuong: 0, rongVung: 0, heSoAp: 1 },
  { id: 'thanh-moc', ten: 'Thanh Mộc Thể', trong: 12, hiem: 1, moTa: 'Thân cận thảo mộc: dược lực mỗi mẻ cao hơn.', chatLuong: 6, rongVung: 0, heSoAp: 1 },
  { id: 'hoa-linh', ten: 'Hỏa Linh Thể', trong: 12, hiem: 2, moTa: 'Trời sinh điều khiển lửa: vùng hỏa hầu rộng hơn.', chatLuong: 0, rongVung: 4, heSoAp: 1 },
  { id: 'bang-tam', ten: 'Băng Tâm Thể', trong: 10, hiem: 2, moTa: 'Tâm tĩnh như băng: áp lò dâng chậm hơn 25%.', chatLuong: 0, rongVung: 0, heSoAp: 0.75 },
  { id: 'dan-the', ten: 'Tiên Thiên Đan Thể', trong: 4, hiem: 3, moTa: 'Sinh ra để luyện đan: dược lực cao, hỏa hầu rộng, áp lò dâng chậm.', chatLuong: 5, rongVung: 3, heSoAp: 0.8 },
];

const HO = ['Tô', 'Lâm', 'Diệp', 'Hàn', 'Cố', 'Tiêu', 'Mộ', 'Thẩm', 'Lục', 'Bạch', 'Tần', 'Sở', 'Vân', 'Giang', 'Trần', 'Lý'];
const TEN = ['Vô Trần', 'Thanh Huyền', 'Trường Sinh', 'Minh Viễn', 'Tử Mặc', 'Hạo Nhiên', 'Vân Phi', 'Thiên Hành', 'Mặc Uyên', 'Cảnh Hành', 'Dật Trần', 'Thừa Phong', 'Vọng Thư', 'Tinh Hà', 'Bất Phàm', 'Quy Nhất'];

/** Số kiểu của mỗi lớp búp bê (ảnh mat-N, toc-N, ao-N trong public/hinh/nhan-vat). */
export const SO_KIEU = { mat: 3, toc: 3, ao: 3 } as const;

export interface NhanVat {
  ten: string;
  gioiTinh: 'Nam';
  gioiDien: string;
  xuatThan: string;
  linhCan: string;
  theChat: string;
  /** 1–100. */
  tuChat: number;
  /** 1–100. */
  khiVan: number;
  dang: { mat: number; toc: number; ao: number };
}

function chonTheoTrong<T extends { trong: number }>(ds: readonly T[], rng: () => number): T {
  let r = rng() * ds.reduce((s, d) => s + d.trong, 0);
  for (const d of ds) {
    r -= d.trong;
    if (r < 0) return d;
  }
  return ds[ds.length - 1];
}
const kep = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
/** Số 1–100 lệch về giữa (trung bình hai lần gieo), để 90+ và dưới 10 đều hiếm. */
const gieoChiSo = (rng: () => number) => Math.round(1 + ((rng() + rng()) / 2) * 99);
const boc = <T>(ds: readonly T[], rng: () => number) => ds[Math.floor(rng() * ds.length)];

export function taoNhanVat(rng: () => number = Math.random): NhanVat {
  const gd = chonTheoTrong(GIOI_DIEN, rng);
  const xt = chonTheoTrong(XUAT_THAN, rng);
  return {
    ten: `${boc(HO, rng)} ${boc(TEN, rng)}`,
    gioiTinh: 'Nam',
    gioiDien: gd.id,
    xuatThan: xt.id,
    linhCan: chonTheoTrong(LINH_CAN, rng).id,
    theChat: chonTheoTrong(THE_CHAT, rng).id,
    tuChat: kep(gieoChiSo(rng) + xt.tuChat, 1, 100),
    khiVan: kep(gieoChiSo(rng) + xt.khiVan + gd.khiVan, 1, 100),
    dang: {
      mat: 1 + Math.floor(rng() * SO_KIEU.mat),
      toc: 1 + Math.floor(rng() * SO_KIEU.toc),
      ao: 1 + Math.floor(rng() * SO_KIEU.ao),
    },
  };
}

export const timGioiDien = (id: string) => GIOI_DIEN.find((d) => d.id === id) ?? GIOI_DIEN[0];
export const timXuatThan = (id: string) => XUAT_THAN.find((d) => d.id === id) ?? XUAT_THAN[0];
export const timLinhCan = (id: string) => LINH_CAN.find((d) => d.id === id) ?? LINH_CAN[2];
export const timTheChat = (id: string) => THE_CHAT.find((d) => d.id === id) ?? THE_CHAT[0];

/** Độ hiếm của một chỉ số 1–100 để tô màu. */
export const hiemChiSo = (v: number): DoHiem => (v >= 90 ? 3 : v >= 75 ? 2 : v >= 55 ? 1 : 0);

/** Gộp mọi thuộc tính thành các hệ số mà phần luyện đan và tu luyện dùng trực tiếp. */
export function loiThe(nv: NhanVat | null): LoiThe {
  if (!nv) return LOI_THE_GOC;
  const xt = timXuatThan(nv.xuatThan);
  const tc = timTheChat(nv.theChat);
  const gd = timGioiDien(nv.gioiDien);
  return {
    chatLuong: tc.chatLuong,
    rongVung: tc.rongVung + xt.tayNghe * 1.5,
    heSoAp: tc.heSoAp,
    // tư chất 50 là mốc trung tính: mỗi điểm lệch làm khoảng xanh rộng/hẹp và con lắc chậm/nhanh một chút
    xanh: (nv.tuChat - 50) * 0.0006 + xt.tayNghe * 0.015,
    heSoQuet: 1 + (nv.tuChat - 50) / 300,
    // khí vận chỉ tác động lên các lần quay may rủi
    vuotKiep: kep(0.5 + (nv.khiVan - 50) * 0.004, 0.2, 0.85),
    phamCong: (nv.khiVan - 50) * 0.003,
    heSoMua: gd.heSoMua * xt.heSoMua,
    heSoBan: gd.heSoBan,
    tocDoTuLuyen: timLinhCan(nv.linhCan).tocDo,
    soVien: 0,
  };
}
