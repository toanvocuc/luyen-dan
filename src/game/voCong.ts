// Võ công: hệ võ, hệ linh căn (nguyên tố), thiên phú võ học, 20 bí tịch gốc và bí tịch người chơi đang có.
// Thiết kế: docs/thiet-ke-combat.md. Bộ máy trận đánh ở chienDau.ts.
import type { NhanVat } from './nhanVat.ts';

// ---------- hệ võ ----------

export type He = 'kiem' | 'dao' | 'thuong' | 'quyen' | 'chuong' | 'chi';
export const CAC_HE: readonly He[] = ['kiem', 'dao', 'thuong', 'quyen', 'chuong', 'chi'];
export const HE: Record<He, { ten: string; dao: string; ngoai: boolean }> = {
  kiem: { ten: 'Kiếm', dao: 'Kiếm đạo', ngoai: true },
  dao: { ten: 'Đao', dao: 'Đao đạo', ngoai: true },
  thuong: { ten: 'Thương', dao: 'Thương đạo', ngoai: true },
  quyen: { ten: 'Quyền', dao: 'Quyền đạo', ngoai: true },
  chuong: { ten: 'Chưởng', dao: 'Chưởng đạo', ngoai: false },
  chi: { ten: 'Chỉ', dao: 'Chỉ đạo', ngoai: false },
};

// ---------- hệ linh căn (nguyên tố) ----------

export type NguyenTo = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho' | 'loi';
export const NGU_HANH: readonly NguyenTo[] = ['kim', 'moc', 'thuy', 'hoa', 'tho'];
export const NGUYEN_TO: Record<NguyenTo, { ten: string; tac: string }> = {
  kim: { ten: 'Kim', tac: 'Xuyên giáp: sát thương +20%' },
  moc: { ten: 'Mộc', tac: 'Sinh cơ: trúng đòn hồi 3% máu' },
  thuy: { ten: 'Thủy', tac: 'Hàn khí: địch chịu thêm 10% sát thương' },
  hoa: { ten: 'Hỏa', tac: 'Thiêu đốt: địch mất máu mỗi lượt' },
  tho: { ten: 'Thổ', tac: 'Hộ thể: nhận khiên 8% máu' },
  loi: { ten: 'Lôi', tac: 'Lôi kích: 25% đánh thêm một tia sét' },
};

/** Số hệ và độ mạnh hiệu ứng nguyên tố theo loại linh căn (id trong LINH_CAN). */
const HE_LINH_CAN: Record<string, { so: number; hieuLuc: number }> = {
  pham: { so: 5, hieuLuc: 0.25 },
  ngu: { so: 5, hieuLuc: 0.4 },
  tu: { so: 4, hieuLuc: 0.55 },
  tam: { so: 3, hieuLuc: 0.7 },
  song: { so: 2, hieuLuc: 0.85 },
  thien: { so: 1, hieuLuc: 1 },
  'bien-di': { so: 1, hieuLuc: 1.2 },
};

/** Băm chuỗi thành số (để nhân vật cũ có hệ linh căn / thiên phú cố định, không đổi khi nạp lại). */
function bam(chu: string): number {
  let h = 2166136261;
  for (let i = 0; i < chu.length; i++) h = Math.imul(h ^ chu.charCodeAt(i), 16777619);
  return h >>> 0;
}
/** Bộ sinh số ngẫu nhiên có hạt (mulberry32). */
export function rngHat(hat: number): () => number {
  let a = hat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hệ linh căn của nhân vật: Biến dị luôn là Lôi; còn lại chọn ngẫu nhiên (cố định theo tên) từ ngũ hành. */
export function linhCanCua(nv: NhanVat | null): { he: NguyenTo[]; hieuLuc: number } {
  if (!nv) return { he: [], hieuLuc: 0 };
  const c = HE_LINH_CAN[nv.linhCan] ?? HE_LINH_CAN.tu;
  if (nv.linhCan === 'bien-di') return { he: ['loi'], hieuLuc: c.hieuLuc };
  const r = rngHat(bam(`${nv.ten}|linh-can`));
  const ds = [...NGU_HANH].sort(() => r() - 0.5);
  return { he: ds.slice(0, c.so), hieuLuc: c.hieuLuc };
}

// ---------- thiên phú võ học ----------

/** 0 Kém, 1 Thường, 2 Khá, 3 Giỏi, 4 Thiên tài. */
export type BacThienPhu = 0 | 1 | 2 | 3 | 4;
export const THIEN_PHU = [
  { ten: 'Kém', luyenThuc: 0.7, satThuong: -0.05 },
  { ten: 'Thường', luyenThuc: 1, satThuong: 0 },
  { ten: 'Khá', luyenThuc: 1.3, satThuong: 0.05 },
  { ten: 'Giỏi', luyenThuc: 1.6, satThuong: 0.1 },
  { ten: 'Thiên tài', luyenThuc: 2, satThuong: 0.15 },
] as const;
/** Xuất thân nghiêng thiên phú chính về hệ nào (60%). */
const XUAT_THAN_NGHIENG: Record<string, He> = {
  'nong-ho': 'quyen',
  'thu-huong': 'chi',
  'tho-san': 'thuong',
  'y-su': 'chuong',
  'tho-ren': 'dao',
  'dao-dong': 'kiem',
};

/** Quay thiên phú võ học: đúng một hệ chính (≥ Khá), có thể thêm một hệ phụ Khá, còn lại Thường, một hai hệ Kém. */
export function quayThienPhu(xuatThan: string, rng: () => number): Record<He, BacThienPhu> {
  const tp = { kiem: 1, dao: 1, thuong: 1, quyen: 1, chuong: 1, chi: 1 } as Record<He, BacThienPhu>;
  const nghieng = XUAT_THAN_NGHIENG[xuatThan];
  const chinh = nghieng && rng() < 0.6 ? nghieng : CAC_HE[Math.floor(rng() * CAC_HE.length)];
  const r = rng();
  tp[chinh] = r < 0.1 ? 4 : r < 0.45 ? 3 : 2;
  const con = CAC_HE.filter((h) => h !== chinh).sort(() => rng() - 0.5);
  if (rng() < 0.5) tp[con[0]] = 2;
  const soKem = rng() < 0.5 ? 1 : 2;
  for (let i = 0; i < soKem; i++) tp[con[con.length - 1 - i]] = 0;
  return tp;
}
/** Thiên phú của nhân vật; nhân vật tạo trước bản này thì quay cố định theo tên. */
export function thienPhuCua(nv: NhanVat | null): Record<He, BacThienPhu> {
  if (!nv) return { kiem: 1, dao: 1, thuong: 1, quyen: 1, chuong: 1, chi: 1 };
  return nv.thienPhu ?? quayThienPhu(nv.xuatThan, rngHat(bam(`${nv.ten}|thien-phu`)));
}
/** Hệ thiên phú cao nhất. */
export function heChinh(tp: Record<He, BacThienPhu>): He {
  return CAC_HE.reduce((a, b) => (tp[b] > tp[a] ? b : a), CAC_HE[0]);
}

// ---------- bí tịch ----------

export type LoaiBiTich = 'vo-ky' | 'tuyet-chieu' | 'than-phap' | 'tam-phap';
export interface BiTichGoc {
  id: string;
  ten: string;
  loai: LoaiBiTich;
  he?: He;
  /** Hệ số sát thương (1 = 100% đòn chuẩn). */
  heSo?: number;
  /** Hồi chiêu (lượt), chỉ tuyệt chiêu. */
  hoi?: number;
  moTa: string;
}
export const BI_TICH: readonly BiTichGoc[] = [
  { id: 'luu-van-kiem', ten: 'Lưu Vân Kiếm Pháp', loai: 'vo-ky', he: 'kiem', heSo: 1, moTa: 'Mỗi đòn gieo 1 tầng Kiếm thương.' },
  { id: 'cuong-lan-dao', ten: 'Cuồng Lan Đao', loai: 'vo-ky', he: 'dao', heSo: 1.15, moTa: '60% gieo Phá giáp.' },
  { id: 'bon-loi-thuong', ten: 'Bôn Lôi Thương', loai: 'vo-ky', he: 'thuong', heSo: 1, moTa: 'Mỗi đòn +1 tầng Liên kích (+10% sát thương mỗi tầng).' },
  { id: 'khai-son-quyen', ten: 'Khai Sơn Quyền', loai: 'vo-ky', he: 'quyen', heSo: 0.95, moTa: 'Mỗi đòn gieo 1 tầng Chấn động; đủ 3 tầng thì choáng.' },
  { id: 'han-bang-chuong', ten: 'Hàn Băng Chưởng', loai: 'vo-ky', he: 'chuong', heSo: 0.85, moTa: 'Mỗi đòn gieo 1 tầng Nội thương.' },
  { id: 'kinh-hong-chi', ten: 'Kinh Hồng Chỉ', loai: 'vo-ky', he: 'chi', heSo: 1, moTa: '70% gieo Điểm huyệt.' },
  { id: 'van-kiem', ten: 'Vạn Kiếm Quy Tông', loai: 'tuyet-chieu', he: 'kiem', heSo: 1.5, hoi: 4, moTa: 'Nổ toàn bộ Kiếm thương: mỗi tầng thêm 30%.' },
  { id: 'pha-thien', ten: 'Phá Thiên Nhất Đao', loai: 'tuyet-chieu', he: 'dao', heSo: 2.6, hoi: 4, moTa: 'Mỗi tầng Phá giáp thêm 25%.' },
  { id: 'long-dang', ten: 'Long Đằng Cửu Thiên', loai: 'tuyet-chieu', he: 'thuong', heSo: 0.8, hoi: 3, moTa: 'Đâm 3 lần, Liên kích tính cho từng lần.' },
  { id: 'ba-vuong', ten: 'Bá Vương Quyền', loai: 'tuyet-chieu', he: 'quyen', heSo: 2, hoi: 3, moTa: 'Địch đang choáng thì ×1,5.' },
  { id: 'thai-cuc', ten: 'Thái Cực Âm Dương Chưởng', loai: 'tuyet-chieu', he: 'chuong', heSo: 1.2, hoi: 4, moTa: 'Kích nổ Nội thương ngay 2 lượt.' },
  { id: 'nhat-duong', ten: 'Nhất Dương Chỉ', loai: 'tuyet-chieu', he: 'chi', heSo: 2.2, hoi: 3, moTa: 'Xuyên giáp hoá; tiêu Điểm huyệt: mỗi tầng +20% sát thương và hồi 5% máu.' },
  { id: 'lang-ba', ten: 'Lăng Ba Bộ', loai: 'than-phap', moTa: 'Né +8%; cứ 5 lượt né hẳn 1 đòn.' },
  { id: 'truy-phong', ten: 'Truy Phong Bộ', loai: 'than-phap', moTa: 'Né được thì võ kỹ lượt sau +30%.' },
  { id: 'huyen-anh', ten: 'Huyễn Ảnh Bộ', loai: 'than-phap', moTa: 'Né được thì +1 Khí thế.' },
  { id: 'kim-cuong', ten: 'Kim Cương Kinh', loai: 'tam-phap', moTa: 'Khí huyết +12%.' },
  { id: 'thanh-tam', ten: 'Thanh Tâm Quyết', loai: 'tam-phap', moTa: 'Thần thức +12%; gieo trạng thái +10%.' },
  { id: 'thiet-bo', ten: 'Thiết Bố Sam', loai: 'tam-phap', moTa: 'Phòng ngự +15%.' },
  { id: 'cuong-huyet', ten: 'Cuồng Huyết Lục', loai: 'tam-phap', moTa: 'Lực +12%; máu dưới 30% thì sát thương +20%.' },
  { id: 'hon-nguyen', ten: 'Hỗn Nguyên Công', loai: 'tam-phap', moTa: 'Trạng thái mình gieo kéo dài thêm 1 lượt.' },
];
export const timBiTich = (id: string) => BI_TICH.find((b) => b.id === id) ?? BI_TICH[0];
/** Võ kỹ / tuyệt chiêu khởi đầu của từng hệ. */
export const VO_KY_CUA: Record<He, string> = { kiem: 'luu-van-kiem', dao: 'cuong-lan-dao', thuong: 'bon-loi-thuong', quyen: 'khai-son-quyen', chuong: 'han-bang-chuong', chi: 'kinh-hong-chi' };
export const TUYET_CHIEU_CUA: Record<He, string> = { kiem: 'van-kiem', dao: 'pha-thien', thuong: 'long-dang', quyen: 'ba-vuong', chuong: 'thai-cuc', chi: 'nhat-duong' };

/** Sáu phẩm bí tịch. */
export const PHAM_BI_TICH = [
  { ten: 'Phàm', mau: '#9aa0a0', heSo: 1 },
  { ten: 'Linh', mau: '#5fbf6a', heSo: 1.12 },
  { ten: 'Huyền', mau: '#4f9bea', heSo: 1.25 },
  { ten: 'Địa', mau: '#a46be8', heSo: 1.4 },
  { ten: 'Thiên', mau: '#f0a33a', heSo: 1.6 },
  { ten: 'Tiên', mau: '#ea4f4f', heSo: 1.85 },
] as const;
export const CAP_LUYEN_THUC_TOI_DA = 10;
/** Điểm luyện thục cần để lên cấp kế (cấp hiện tại 1–9). */
export const knCan = (cap: number) => 6 + cap * 4;

/** Một cuốn bí tịch người chơi đang giữ. */
export interface BiTich {
  uid: number;
  id: string;
  pham: number;
  /** Cấp luyện thục 1–10. */
  cap: number;
  /** Điểm luyện thục đã tích trong cấp. */
  kn: number;
  /** Hệ linh căn của chiêu (chỉ võ kỹ / tuyệt chiêu). */
  nguyenTo?: NguyenTo;
}
export interface VoCongKho {
  tui: BiTich[];
  lap: { voKy: number | null; tuyetChieu: number | null; thanPhap: number | null; tamPhap: (number | null)[] };
  uidKe: number;
}
/** Cảnh giới mở từng ô. */
export const MO_O = { voKy: 0, tuyetChieu: 2, thanPhap: 3, tamPhap: [1, 5] } as const;

/** Hệ số sát thương đầy đủ của một chiêu: gốc × phẩm × luyện thục. */
export function heSoChieu(bt: BiTich): number {
  const g = timBiTich(bt.id);
  return (g.heSo ?? 1) * PHAM_BI_TICH[bt.pham].heSo * (1 + 0.04 * (bt.cap - 1));
}

/** Bí tịch khởi đầu: võ kỹ và tuyệt chiêu phẩm Phàm của hệ thiên phú chính, mang hệ linh căn đầu tiên của nhân vật. */
export function voCongKhoiDau(nv: NhanVat | null): VoCongKho {
  const tp = thienPhuCua(nv);
  const he = heChinh(tp);
  const nt = linhCanCua(nv).he[0];
  const tui: BiTich[] = [
    { uid: 1, id: VO_KY_CUA[he], pham: 0, cap: 1, kn: 0, nguyenTo: nt },
    { uid: 2, id: TUYET_CHIEU_CUA[he], pham: 0, cap: 1, kn: 0, nguyenTo: nt },
  ];
  return { tui, lap: { voKy: 1, tuyetChieu: 2, thanPhap: null, tamPhap: [null, null] }, uidKe: 3 };
}
export function buVoCong(v: Partial<VoCongKho> | undefined, nv: NhanVat | null): VoCongKho {
  if (!v?.tui || !v.lap) return voCongKhoiDau(nv);
  return { tui: v.tui, lap: { voKy: v.lap.voKy ?? null, tuyetChieu: v.lap.tuyetChieu ?? null, thanPhap: v.lap.thanPhap ?? null, tamPhap: [v.lap.tamPhap?.[0] ?? null, v.lap.tamPhap?.[1] ?? null] }, uidKe: v.uidKe ?? 1 + Math.max(0, ...v.tui.map((b) => b.uid)) };
}
export const timTrongTui = (v: VoCongKho, uid: number | null) => (uid == null ? null : v.tui.find((b) => b.uid === uid) ?? null);

/** Cộng điểm luyện thục cho một cuốn (nhân theo thiên phú hệ của nó); trả về số cấp vừa lên. */
export function themLuyenThuc(v: VoCongKho, uid: number, diem: number, nv: NhanVat | null): { vo: VoCongKho; len: number } {
  const bt = timTrongTui(v, uid);
  if (!bt || bt.cap >= CAP_LUYEN_THUC_TOI_DA) return { vo: v, len: 0 };
  const g = timBiTich(bt.id);
  const nhan = g.he ? THIEN_PHU[thienPhuCua(nv)[g.he]].luyenThuc : 1;
  let { cap, kn } = bt;
  kn += diem * nhan;
  let len = 0;
  while (cap < CAP_LUYEN_THUC_TOI_DA && kn >= knCan(cap)) {
    kn -= knCan(cap);
    cap += 1;
    len += 1;
  }
  if (cap >= CAP_LUYEN_THUC_TOI_DA) kn = 0;
  return { vo: { ...v, tui: v.tui.map((b) => (b.uid === uid ? { ...b, cap, kn } : b)) }, len };
}
