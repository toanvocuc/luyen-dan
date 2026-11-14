// Toàn bộ số liệu của game nằm ở đây — chỉnh cân bằng thì chỉ sửa file này.
import { ANH_DAN_CO_SAN } from './anhDanCoSan.ts';

/** Phẩm cấp một viên đan. -1 là phế đan. */
export type Pham = -1 | 0 | 1 | 2 | 3;
/** Phẩm cấp của một viên đan thật (không phải phế đan). */
export type PhamThat = 0 | 1 | 2 | 3;
export const laDanThat = (p: Pham): p is PhamThat => p >= 0;
export const TEN_PHAM = ['Hạ phẩm', 'Trung phẩm', 'Thượng phẩm', 'Cực phẩm'] as const;
export const TEN_PHAM_NGAN = ['Hạ', 'Trung', 'Thượng', 'Cực'] as const;

/** Tuổi thuốc: 0 = mười năm, 1 = trăm năm, 2 = ngàn năm. */
export type Tuoi = 0 | 1 | 2;
export const TEN_TUOI_NGAN = ['10 năm', '100 năm', '1000 năm'] as const;
/** Chất lượng khởi điểm mà mỗi tuổi thuốc đóng góp (lấy trung bình ba vị). */
export const CHAT_LUONG_THEO_TUOI = [20, 35, 50] as const;

export interface DuocLieu {
  id: string;
  ten: string;
  /** Giá mua theo tuổi thuốc. */
  gia: readonly [number, number, number];
}

export const DUOC_LIEU: readonly DuocLieu[] = [
  { id: 'linh-thao', ten: 'Linh Thảo', gia: [4, 18, 90] },
  { id: 'chu-qua', ten: 'Chu Quả', gia: [6, 26, 130] },
  { id: 'han-bang-hoa', ten: 'Hàn Băng Hoa', gia: [8, 34, 170] },
  { id: 'dia-tam-sam', ten: 'Địa Tâm Sâm', gia: [10, 44, 220] },
  { id: 'tu-van-chi', ten: 'Tử Vân Chi', gia: [14, 60, 300] },
  { id: 'long-tu-thao', ten: 'Long Tu Thảo', gia: [16, 70, 350] },
  { id: 'huyet-lien', ten: 'Huyết Liên', gia: [18, 80, 400] },
  { id: 'kim-diep-truc', ten: 'Kim Diệp Trúc', gia: [22, 95, 480] },
];
export const anhDuocLieu = (id: string) => `./hinh/duoc-lieu/${id}.png`;
/** Giá một hạt giống ở phường thị (chưa tính lợi thế mua bán của nhân vật). */
export const giaHatGiong = (d: DuocLieu) => d.gia[0] * LUAT.vuon.heSoGiaHat;

/** Năm chỉ số của nhân vật. Kỳ ngộ sau này sẽ so các chỉ số này để định thành bại. */
export const CHI_SO = [
  { id: 'khiHuyet', ten: 'Khí huyết', moTa: 'Lượng máu tối đa. Máu tự hồi dần, đan chữa thương hồi nhanh hơn.' },
  { id: 'luc', ten: 'Lực', moTa: 'Sức công phá khi phải ra tay.' },
  { id: 'phongNgu', ten: 'Phòng ngự', moTa: 'Sức chịu đòn, giảm thương tổn phải nhận.' },
  { id: 'thanPhap', ten: 'Thân pháp', moTa: 'Độ nhanh nhẹn: né tránh, chạy thoát, ra tay trước.' },
  { id: 'thanThuc', ten: 'Thần thức', moTa: 'Trí lực và pháp lực: nhìn thấu cạm bẫy, điều khiển pháp thuật.' },
] as const;
export type ChiSo = (typeof CHI_SO)[number]['id'];

/** Một đoạn hỏa hầu: tâm vùng nhiệt (0–100) và thời lượng. */
export interface DoanHoa {
  ten: string;
  tam: number;
  giay: number;
}

/** Mười bốn cảnh giới tu tiên, từ thấp lên cao. */
export const CANH_GIOI = [
  'Phàm Nhân', 'Luyện Khí', 'Trúc Cơ', 'Kim Đan', 'Nguyên Anh', 'Hóa Thần', 'Luyện Hư',
  'Hợp Thể', 'Đại Thừa', 'Chân Tiên', 'Kim Tiên', 'Huyền Tiên', 'Tiên Vương', 'Tiên Đế',
] as const;

/** Bậc của một đan phương = cảnh giới của tu sĩ luyện và dùng nó. */
export type Bac = (typeof CANH_GIOI)[number];

export interface DanPhuong {
  id: string;
  ten: string;
  moTa: string;
  /** Bậc của đan (theo cảnh giới người dùng) — dùng để gom nhóm trong bảng chọn đan phương. */
  bac: Bac;
  /** Ba vị dược liệu cần bỏ vào lò. */
  lieu: readonly [string, string, string];
  /** Độ khó: kéo phẩm cấp xuống, thu hẹp khoảng xanh khi tôi đan. */
  doKho: number;
  /** Bề rộng vùng hỏa hầu (đơn vị nhiệt 0–100). */
  rongVung: number;
  /** Số lần "dược tính xung đột" (vùng hỏa hầu nhảy đột ngột) trong một mẻ. */
  xungDot: number;
  doan: readonly DoanHoa[];
  /** Giá bán một viên hạ phẩm. */
  giaGoc: number;
  /** Đan đột phá: uống khi viên mãn để bước lên cảnh giới có chỉ số này (trong CANH_GIOI). */
  dotPha?: number;
  /** Tuổi thuốc thấp nhất mà đan phương chịu nhận (đan bậc cao không luyện được bằng thuốc non). */
  tuoiToiThieu?: Tuoi;
  /** Chưa có ảnh riêng thì mượn ảnh của đan phương này. */
  anh?: string;
  /** Tác dụng khi người chơi tự uống. Không có = đan này không uống được (đan đột phá dùng ở nút Đột phá). */
  uong?: TacDung;
  /** Chỉ số được cộng vĩnh viễn khi uống một viên hạ phẩm (phẩm cao nhân thêm LUAT.chiSo.heSoPham; uống nhiều thì nhờn thuốc). */
  chiSo?: Partial<Record<ChiSo, number>>;
}

/**
 * Tác dụng khi uống một viên, giá trị theo phẩm [hạ, trung, thượng, cực, đan văn]:
 * - 'tang-toc': tu vi mỗi giây được cộng thêm bấy nhiêu lần tốc độ gốc, kéo dài `giay` giây mỗi viên (uống nhiều viên thì nối dài thời gian);
 * - 'tu-vi': lập tức được bấy nhiêu phần tu vi của tầng đang đứng;
 * - 'tu-chat': tư chất tăng vĩnh viễn bấy nhiêu điểm;
 * - 'dot-pha': lần đột phá kế tiếp được cộng bấy nhiêu vào tỉ lệ thành công (cộng dồn tới LUAT.dotPha.congToiDa);
 * - 'hoi-mau': hồi ngay bấy nhiêu phần máu tối đa.
 * `doc` nhân vào lượng độc tố của viên đan (đan càng mạnh càng độc).
 */
export interface TacDung {
  loai: 'tang-toc' | 'tu-vi' | 'tu-chat' | 'dot-pha' | 'hoi-mau';
  giaTri: readonly [number, number, number, number, number];
  giay?: number;
  doc?: number;
}

const DAN_GOC: readonly DanPhuong[] = [
  {
    id: 'tu-khi-dan',
    ten: 'Tụ Khí Đan',
    moTa: 'Đan nhập môn, giúp tu sĩ Luyện Khí tụ linh khí.',
    bac: 'Luyện Khí',
    uong: { loai: 'tang-toc', giaTri: [1, 1.5, 2.5, 4, 6], giay: 120 },
    chiSo: { luc: 0.4 },
    lieu: ['linh-thao', 'linh-thao', 'chu-qua'],
    doKho: 0,
    rongVung: 20,
    xungDot: 2,
    doan: [
      { ten: 'Văn hỏa', tam: 34, giay: 8 },
      { ten: 'Vũ hỏa', tam: 70, giay: 7 },
      { ten: 'Thu hỏa', tam: 46, giay: 5 },
    ],
    giaGoc: 12,
  },
  {
    id: 'hoi-xuan-dan',
    ten: 'Hồi Xuân Đan',
    moTa: 'Chữa thương, hồi phục khí huyết sau khi giao đấu.',
    bac: 'Luyện Khí',
    uong: { loai: 'hoi-mau', giaTri: [0.25, 0.4, 0.6, 0.85, 1] },
    chiSo: { khiHuyet: 0.4 },
    lieu: ['chu-qua', 'han-bang-hoa', 'linh-thao'],
    doKho: 0.27,
    rongVung: 18,
    xungDot: 3,
    doan: [
      { ten: 'Văn hỏa', tam: 30, giay: 6 },
      { ten: 'Vũ hỏa', tam: 76, giay: 6 },
      { ten: 'Văn hỏa', tam: 40, giay: 5 },
      { ten: 'Thu hỏa', tam: 58, giay: 4 },
    ],
    giaGoc: 26,
  },
  {
    id: 'tay-tuy-dan',
    ten: 'Tẩy Tủy Đan',
    moTa: 'Gột tạp chất trong kinh mạch, chuẩn bị cho Trúc Cơ.',
    bac: 'Luyện Khí',
    uong: { loai: 'tu-chat', giaTri: [1, 2, 3, 5, 8], doc: 2 },
    chiSo: { phongNgu: 0.4, khiHuyet: 0.2 },
    lieu: ['dia-tam-sam', 'han-bang-hoa', 'tu-van-chi'],
    doKho: 0.55,
    rongVung: 16,
    xungDot: 3,
    doan: [
      { ten: 'Vũ hỏa', tam: 78, giay: 5 },
      { ten: 'Văn hỏa', tam: 28, giay: 6 },
      { ten: 'Vũ hỏa', tam: 84, giay: 5 },
      { ten: 'Thu hỏa', tam: 50, giay: 5 },
    ],
    giaGoc: 60,
  },
  {
    id: 'bang-tam-dan',
    ten: 'Băng Tâm Đan',
    moTa: 'Tĩnh tâm ngưng thần, giúp tu sĩ chống lại tâm ma.',
    bac: 'Trúc Cơ',
    uong: { loai: 'dot-pha', giaTri: [0.04, 0.07, 0.11, 0.16, 0.22] },
    chiSo: { thanThuc: 0.4 },
    lieu: ['han-bang-hoa', 'long-tu-thao', 'tu-van-chi'],
    doKho: 0.75,
    rongVung: 15,
    xungDot: 4,
    doan: [
      { ten: 'Hàn hỏa', tam: 22, giay: 6 },
      { ten: 'Vũ hỏa', tam: 62, giay: 5 },
      { ten: 'Hàn hỏa', tam: 18, giay: 6 },
      { ten: 'Thu hỏa', tam: 44, giay: 5 },
    ],
    giaGoc: 110,
  },
  {
    id: 'truc-co-dan',
    ten: 'Trúc Cơ Đan',
    moTa: 'Đan đột phá: giúp tu sĩ Luyện Khí viên mãn bước lên Trúc Cơ.',
    bac: 'Luyện Khí',
    dotPha: 2,
    lieu: ['dia-tam-sam', 'kim-diep-truc', 'huyet-lien'],
    doKho: 1.0,
    rongVung: 14,
    xungDot: 4,
    doan: [
      { ten: 'Văn hỏa', tam: 36, giay: 5 },
      { ten: 'Vũ hỏa', tam: 82, giay: 5 },
      { ten: 'Văn hỏa', tam: 30, giay: 4 },
      { ten: 'Vũ hỏa', tam: 74, giay: 5 },
      { ten: 'Thu hỏa', tam: 52, giay: 5 },
    ],
    giaGoc: 200,
  },
  {
    id: 'pha-chuong-dan',
    ten: 'Phá Chướng Đan',
    moTa: 'Phá vỡ bình cảnh. Đan khó luyện nhất, cũng quý nhất.',
    bac: 'Trúc Cơ',
    uong: { loai: 'tu-vi', giaTri: [0.2, 0.35, 0.6, 1, 1], doc: 1.5 },
    chiSo: { luc: 0.3, thanPhap: 0.3 },
    lieu: ['huyet-lien', 'long-tu-thao', 'kim-diep-truc'],
    doKho: 1.25,
    rongVung: 13,
    xungDot: 5,
    doan: [
      { ten: 'Vũ hỏa', tam: 84, giay: 5 },
      { ten: 'Hàn hỏa', tam: 20, giay: 5 },
      { ten: 'Vũ hỏa', tam: 78, giay: 4 },
      { ten: 'Văn hỏa', tam: 34, giay: 5 },
      { ten: 'Thu hỏa', tam: 56, giay: 5 },
    ],
    giaGoc: 380,
  },
];

/**
 * Đan đột phá cho từng lần lên cảnh giới (trừ Trúc Cơ Đan đã viết tay ở trên).
 * [cảnh giới đích, id, tên, ba vị dược liệu, ảnh mượn tạm]
 */
const BANG_DOT_PHA: readonly [number, string, string, readonly [string, string, string], string][] = [
  [1, 'dan-khi-dan', 'Dẫn Khí Đan', ['linh-thao', 'linh-thao', 'chu-qua'], 'tu-khi-dan'],
  [3, 'ket-kim-dan', 'Kết Kim Đan', ['kim-diep-truc', 'dia-tam-sam', 'long-tu-thao'], 'pha-chuong-dan'],
  [4, 'hoa-anh-dan', 'Hóa Anh Đan', ['huyet-lien', 'tu-van-chi', 'dia-tam-sam'], 'bang-tam-dan'],
  [5, 'hoa-than-dan', 'Hóa Thần Đan', ['tu-van-chi', 'long-tu-thao', 'han-bang-hoa'], 'tay-tuy-dan'],
  [6, 'pha-hu-dan', 'Phá Hư Đan', ['han-bang-hoa', 'kim-diep-truc', 'tu-van-chi'], 'hoi-xuan-dan'],
  [7, 'dung-the-dan', 'Dung Thể Đan', ['huyet-lien', 'dia-tam-sam', 'long-tu-thao'], 'truc-co-dan'],
  [8, 'dai-thua-dan', 'Đại Thừa Đan', ['kim-diep-truc', 'huyet-lien', 'tu-van-chi'], 'pha-chuong-dan'],
  [9, 'do-kiep-dan', 'Độ Kiếp Đan', ['long-tu-thao', 'kim-diep-truc', 'han-bang-hoa'], 'bang-tam-dan'],
  [10, 'cuu-chuyen-kim-dan', 'Cửu Chuyển Kim Đan', ['kim-diep-truc', 'kim-diep-truc', 'huyet-lien'], 'truc-co-dan'],
  [11, 'huyen-nguyen-dan', 'Huyền Nguyên Đan', ['tu-van-chi', 'tu-van-chi', 'long-tu-thao'], 'tay-tuy-dan'],
  [12, 'vuong-dao-dan', 'Vương Đạo Đan', ['long-tu-thao', 'huyet-lien', 'kim-diep-truc'], 'pha-chuong-dan'],
  [13, 'de-menh-dan', 'Đế Mệnh Đan', ['huyet-lien', 'kim-diep-truc', 'long-tu-thao'], 'truc-co-dan'],
];
/** Các mức nhiệt xen kẽ thấp – cao, dùng để dựng chuỗi hỏa hầu cho đan đột phá. */
const NHIET_MAU = [34, 78, 26, 84, 44, 72, 20, 60] as const;

/**
 * Dựng một đan đột phá theo công thức: cảnh giới đích càng cao thì đan càng khó (phẩm bị kéo xuống,
 * vùng hỏa hầu hẹp lại, dược tính xung đột nhiều hơn, chuỗi hỏa hầu dài hơn) và đòi thuốc lâu năm hơn.
 * Bù lại, tu sĩ cảnh giới cao được cộng lợi thế luyện đan (xem LUAT.canhGioi), và lợi thế đó lớn hơn phần khó thêm, nên càng lên cao tay nghề càng thấy rõ.
 */
function taoDanDotPha([dich, id, ten, lieu, anh]: (typeof BANG_DOT_PHA)[number]): DanPhuong {
  const dau = dich === 1;
  const soDoan = dau ? 2 : Math.min(7, 5 + Math.floor((dich - 2) / 4));
  const doan: DoanHoa[] = [];
  for (let j = 0; j < soDoan; j++) {
    const cuoi = j === soDoan - 1;
    const tam = dau ? [38, 60][j] : cuoi ? 46 + ((dich * 3) % 12) : NHIET_MAU[(j + dich) % NHIET_MAU.length];
    doan.push({ ten: cuoi ? 'Thu hỏa' : tam < 28 ? 'Hàn hỏa' : tam < 50 ? 'Văn hỏa' : 'Vũ hỏa', tam, giay: dau ? 6 : soDoan >= 6 && j % 2 ? 4 : 5 });
  }
  return {
    id,
    ten,
    moTa: `Đan đột phá: giúp tu sĩ ${CANH_GIOI[dich - 1]} viên mãn bước lên ${CANH_GIOI[dich]}.`,
    bac: CANH_GIOI[dich - 1],
    lieu,
    doKho: dau ? -0.2 : +(1.0 + 0.18 * (dich - 2)).toFixed(2),
    rongVung: dau ? 22 : Math.max(9, 14 - 0.5 * (dich - 2)),
    xungDot: dau ? 1 : Math.min(8, 4 + Math.floor((dich - 2) / 2)),
    doan,
    giaGoc: dau ? 8 : Math.round((200 * 1.8 ** (dich - 2)) / 10) * 10,
    dotPha: dich,
    ...(dau ? { uong: { loai: 'hoi-mau', giaTri: [0.1, 0.15, 0.25, 0.4, 0.5] } as TacDung, chiSo: { thanPhap: 0.4 } } : {}),
    tuoiToiThieu: dich >= 10 ? 2 : dich >= 5 ? 1 : 0,
    anh,
  };
}

/** Mọi đan phương, xếp theo bậc từ thấp lên cao; trong một bậc, đan đột phá đứng cuối. */
export const DAN_PHUONG: readonly DanPhuong[] = [...DAN_GOC, ...BANG_DOT_PHA.map(taoDanDotPha)]
  .map((p, i) => ({ p, i }))
  .sort((a, b) => CANH_GIOI.indexOf(a.p.bac) - CANH_GIOI.indexOf(b.p.bac) || (a.p.dotPha ? 1 : 0) - (b.p.dotPha ? 1 : 0) || a.i - b.i)
  .map((x) => x.p);
/** Các bậc có đan phương, từ thấp lên cao. */
export const CAC_BAC: readonly Bac[] = CANH_GIOI.filter((b) => DAN_PHUONG.some((p) => p.bac === b));
/** Chỉ số cảnh giới của bậc một đan phương. */
export const bacSo = (p: DanPhuong) => CANH_GIOI.indexOf(p.bac);

/** Ảnh viên đan: có ảnh riêng (xem anhDanCoSan.ts, do scripts/xu-ly-anh.py ghi) thì dùng, chưa có thì mượn ảnh ghi ở trường anh. */
export const anhDan = (id: string) => `./hinh/dan/${ANH_DAN_CO_SAN.has(id) ? id : (DAN_PHUONG.find((d) => d.id === id)?.anh ?? id)}.png`;

export interface PhuLieu {
  id: string;
  ten: string;
  moTa: string;
  /** Cộng vào chất lượng. */
  chatLuong: number;
  /** Cộng vào áp lò. */
  apLo: number;
  /** Cộng vào số viên mỗi mẻ. */
  soVien: number;
  gia: number;
}

export const PHU_LIEU: readonly PhuLieu[] = [
  { id: 'hoa-tinh', ten: 'Hỏa Tinh', moTa: 'Phẩm đan tăng mạnh, nhưng lò khai sẵn một phần tư áp', chatLuong: 15, apLo: 25, soVien: 0, gia: 40 },
  { id: 'ngung-than-thao', ten: 'Ngưng Thần Thảo', moTa: 'Lò chịu thêm một phần tư áp, đổi lại ít hơn một viên', chatLuong: 0, apLo: -25, soVien: -1, gia: 25 },
];

/** Hệ số giá theo phẩm cấp (nhân với giaGoc của đan phương). */
export const HE_SO_GIA = [1, 2.5, 7, 20] as const;
/** Viên có đan văn bán gấp bấy nhiêu lần. */
export const HE_SO_DAN_VAN = 3;

/**
 * Ảnh nền có 5 bậc, cảnh giới càng cao nền càng tiên khí:
 * 1 = Phàm Nhân–Luyện Khí, 2 = Trúc Cơ–Kim Đan, 3 = Nguyên Anh–Luyện Hư, 4 = Hợp Thể–Chân Tiên, 5 = Kim Tiên–Tiên Đế.
 */
export function bacNen(canhGioi: number): number {
  if (canhGioi <= 1) return 1;
  if (canhGioi <= 3) return 2;
  if (canhGioi <= 6) return 3;
  if (canhGioi <= 9) return 4;
  return 5;
}
/**
 * Giá trị CSS background-image cho một màn (dong-phu hoặc dan-phong) ở cảnh giới cho trước.
 * Xếp chồng từ bậc hiện tại lùi dần về bậc 1 rồi tới ảnh gốc: bậc nào chưa có ảnh thì trình duyệt tự rơi xuống lớp dưới.
 */
export function anhNen(man: 'dong-phu' | 'dan-phong', canhGioi: number): string {
  const lop: string[] = [];
  for (let b = bacNen(canhGioi); b >= 1; b--) lop.push(`url(./hinh/nen/${man}-${b}.jpg)`);
  if (man === 'dong-phu') lop.push('url(./hinh/nen/dan-phong-1.jpg)');
  lop.push('url(./hinh/nen-dan-phong.jpg)');
  return lop.join(', ');
}

/** Các hằng số của cơ chế luyện đan. */
export const LUAT = {
  soVienGoc: 5,

  /** Khống hỏa: nhiệt có quán tính — nhấn giữ là gia tốc lên, thả là gia tốc xuống. */
  lua: { tangToc: 150, giamToc: 120, can: 2.6 },
  /**
   * Khống hỏa, tính theo giây:
   * - trong vùng: chất lượng +trong, áp lò xả bớt xaAp;
   * - quá nguội: chất lượng +lanh (âm);
   * - quá nóng: áp lò +nongAp, và càng nằm lì ngoài vùng càng dâng nhanh (nhân thêm nongTangToc mỗi giây liên tục).
   *   Nhưng nếu người chơi đã thả tay (lửa đang hạ, không làm gì hơn được nữa) thì áp chỉ dâng nongThaTay phần và không tính là nằm lì:
   *   áp lò phạt việc còn đốt khi đã quá nóng, không phạt việc vùng hỏa hầu tụt xuống nhanh hơn lửa hạ kịp.
   * Vùng hỏa hầu: sang đoạn mới thì trượt tới chỗ mới với tốc độ trung bình tocVung đơn vị nhiệt mỗi giây (ít nhất chuyenToiThieu giây),
   * chậm hơn tốc độ hạ lửa, nên bám theo được; dược tính xung đột kéo vùng lệch đi với nhịp xungDotToc (càng nhỏ càng từ từ).
   */
  chinh: { trong: 1.75, lanh: -1.5, nongAp: 18, nongTangToc: 0.6, xaAp: 3, nongThaTay: 0.35, tocVung: 24, chuyenToiThieu: 1.5, xungDotToc: 2.5 },
  /** Áp lò chạm ngưỡng này là nổ lò tại chỗ — cả lúc khống hỏa lẫn lúc tôi đan. */
  apNoLo: 100,
  /** Dược tính xung đột: vùng hỏa hầu lệch đi tối đa bấy nhiêu. */
  xungDotBien: 24,

  /**
   * Tôi đan: con lắc chạy qua lại trên thanh, người chơi bấm để dừng.
   * Dừng trong khoảng vàng = đại thành (+2), khoảng xanh = thành (+1),
   * sát ngoài khoảng xanh = trượt (áp lò tăng), xa hơn = lệch (mất một viên, áp lò tăng mạnh).
   * Bề rộng tính theo phần của thanh (0–1).
   */
  toi: {
    capToiDa: 9,
    xanhGoc: 0.28,
    xanhMoiCap: 0.022,
    xanhDoKho: 0.03,
    xanhMoiChatLuong: 0.0006,
    xanhToiThieu: 0.06,
    vangGoc: 0.07,
    vangMoiCap: 0.006,
    vangToiThieu: 0.015,
    /** Dải "trượt" mỗi bên khoảng xanh. */
    gan: 0.06,
    /** Thời gian con lắc đi hết một lượt từ đầu này sang đầu kia (giây). */
    quetGoc: 1.3,
    quetMoiCap: 0.09,
    quetToiThieu: 0.45,
    apTruot: 18,
    apLech: 40,
    /** Mỗi cấp tôi đan đẩy tâm phẩm cấp lên bấy nhiêu. */
    phamMoiCap: 0.12,
  },

  /** Đường cong phẩm cấp: tâm = goc + doc * chatLuong/100 - doKho + cấp tôi, trên thang 0 (phế) … 4 (cực phẩm). */
  phamGoc: 0.4,
  phamDoc: 2.2,
  phamDoRong: 0.7,


  /** Luyện thành bấy nhiêu mẻ thì mở "luyện nhanh". */
  thongThao: 5,
  /** Chất lượng khống hỏa giả định khi luyện nhanh (phần thời gian giữ trong vùng). */
  luyenNhanhTrongVung: 0.6,

  /** Sửa lò sau khi nổ. */
  giaSuaLo: 30,
  /** Bán lẻ hay bán cả lô ở phường thị chỉ được bấy nhiêu phần giá trị (đơn hàng sẽ trả đủ giá). */
  heSoBan: 0.5,
  /** Trợ cấp tông môn khi cạn túi. */
  troCap: 40,

  /** Tu luyện: mỗi cảnh giới có bấy nhiêu tầng; lên tầng n cần n × tuViMoiTang điểm; mỗi giây được tuViMoiGiay điểm (nhân với linh căn). */
  soTang: 9,
  tuViMoiTang: 60,
  tuViMoiGiay: 1,
  /** Phàm Nhân chỉ có bấy nhiêu tầng và cần ít tu vi hơn — đoạn mở đầu, để người chơi sớm nếm lần đột phá đầu tiên. */
  soTangPhamNhan: 3,
  heSoTuViPhamNhan: 0.5,
  /** Từ Trúc Cơ trở lên, mỗi cảnh giới cần gấp bấy nhiêu lần tu vi của cảnh giới trước. */
  heSoTuViMoiCanhGioi: 1.5,

  /**
   * Đột phá: tỉ lệ thành công theo phẩm viên đan [hạ, trung, thượng, cực]; đan văn chắc chắn thành.
   * Mỗi điểm khí vận lệch khỏi 50 cộng/trừ khiVan. Thất bại mất viên đan và hao matTuVi phần tu vi của tầng hiện tại.
   */
  dotPha: { tiLe: [0.5, 0.7, 0.85, 0.95], khiVan: 0.002, matTuVi: 0.3, congToiDa: 0.3 },
  /**
   * Đan độc: mỗi viên uống vào cộng moiVien[phẩm] điểm độc ([hạ, trung, thượng, cực, đan văn]) — phẩm càng cao càng ít độc
   * nhưng không bao giờ hết hẳn. Thanh độc đầy ở `day`; viên nào làm vượt mức đó thì không uống được.
   * Độc tự tan giayMoiDiem giây một điểm theo đồng hồ thật, kể cả lúc tắt game.
   */
  doc: { day: 100, moiVien: [12, 8, 4, 2, 1], giayMoiDiem: 30 },
  /**
   * Chỉ số nhân vật. Phần gốc = goc × moiCanhGioi^cảnh giới × (1 + moiTang × (tầng − 1)), nhân hệ số bẩm sinh;
   * Khí huyết nhân thêm heSoMau. Đan cộng thêm một ít: mỗi viên cho lượng ghi ở đan phương × heSoPham[phẩm],
   * và nhờn thuốc dần — viên thứ n của cùng một loại chỉ còn 1 / (1 + n / khangDuoc).
   * Máu tự hồi hoiMau phần của máu tối đa mỗi giây (đồng hồ thật).
   */
  chiSo: { goc: 10, moiCanhGioi: 1.5, moiTang: 0.04, heSoMau: 10, heSoPham: [1, 1.5, 2.5, 4, 6], khangDuoc: 20, hoiMau: 0.002 },
  /** Lợi thế luyện đan theo cảnh giới (thần thức mạnh dần): mỗi cảnh giới trên Luyện Khí cộng bấy nhiêu. */
  canhGioi: { pham: 0.26, rongVung: 0.4 },

  /**
   * Vườn dược: gieo một hạt giống, sau giay[0] giây thành thuốc 10 năm, giay[1] thành 100 năm, giay[2] thành 1000 năm
   * (tính theo đồng hồ thật, kể cả lúc tắt game). Hái lúc nào được thuốc tuổi lúc đó, mỗi ô sanLuong phần,
   * có themTiLe cơ hội được thêm một phần (khí vận lệch khỏi 50 thì cộng/trừ themKhiVan mỗi điểm).
   */
  vuon: { giay: [180, 1200, 7200], sanLuong: 2, themTiLe: 0.3, themKhiVan: 0.004, soODau: 3, soOToiDa: 9, giaO: 200, giaONhan: 2, heSoGiaHat: 3 },

  /**
   * Đơn hàng tông môn: luôn có soDon chỗ. Mỗi đơn đòi một loại đan từ một phẩm trở lên (phamTiLe là xác suất của từng phẩm),
   * số viên trong khoảng soLuong[phẩm], và trả heSo lần giá trị gốc — tức gấp đôi trở lên so với bán lẻ.
   * Giao viên phẩm cao hơn yêu cầu thì viên đó được trả theo đúng phẩm của nó (xem thuongDon), không bao giờ thiệt so với bán lẻ.
   * Giao xong hoặc từ chối thì chỗ đó trống choMoi giây (đồng hồ thật) rồi mới có đơn khác.
   */
  /**
   * Dưỡng đan: lượt luyện thêm cho đan đã có trong túi (vào từ đan phòng, lúc nào cũng được), chỉ cho viên từ phamToiThieu trở lên
   * và chưa dưỡng lần nào; mỗi lượt dưỡng tối đa soVienToiDa viên. Mỗi lần bấm, từng viên tự quay riêng:
   * trúng thì lên một chuyển, trượt thì tụt `tut` chuyển; trượt quá truotToiDa lần thì viên đan vỡ.
   * tiLe[b] = tỉ lệ gốc để lên từ chuyển b sang b+1 (từ 12 lên 13 chỉ còn 1%); quá bảng thì mỗi chuyển lại nhân giamSauBang.
   * Tư chất 100 nhân tỉ lệ thêm `tuChat` lần, viên đan văn nhân `danVan` lần.
   * Giá và dược lực nhân `gia` cho mỗi chuyển; chạm mốc cuối (đan huyền thoại) nhân thêm giaHuyenThoai.
   * moc = các chuyển mà viên đan đổi màu và có hào quang.
   * Uống viên đã chuyển: chỉ số được cộng nhân theo dược lực (heSoChuyen, viên đan văn nhân thêm duocLucDanVan),
   * và tốc độ tu luyện tăng vĩnh viễn tocDo mỗi chuyển (đan văn nhân duocLucDanVan), cộng dồn tối đa tocDoToiDa.
   */
  duong: {
    phamToiThieu: 2,
    soVienToiDa: 6,
    tiLe: [0.95, 0.9, 0.85, 0.8, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15, 0.06, 0.01],
    giamSauBang: 0.5,
    tut: 3,
    truotToiDa: 3,
    tuChat: 0.2,
    danVan: 1.3,
    tiLeToiDa: 0.95,
    gia: 1.25,
    moc: [5, 7, 10, 12, 13],
    giaHuyenThoai: 5,
    duocLucDanVan: 2,
    tocDo: 0.004,
    tocDoToiDa: 1,
  },
  don: {
    soDon: 5,
    choMoi: 30,
    heSo: [1, 1.3],
    phamTiLe: [0.55, 0.33, 0.1, 0.02],
    soLuong: [[2, 6], [1, 4], [1, 2], [1, 1]],
  },

  /**
   * Phường thị đổi hàng mỗi gioDoiHang giờ. Mỗi kỳ, từng vị thuốc có tiLe[tuổi] cơ hội được bày bán
   * với số lượng trong khoảng soLuong[tuổi]; hạt giống tương tự. Các vị trong luonCo thì thuốc 10 năm và hạt giống kỳ nào cũng có,
   * để người mới không bao giờ kẹt nguyên liệu của đan nhập môn.
   */
  cho: {
    gioDoiHang: 3,
    tiLe: [0.8, 0.4, 0.12],
    soLuong: [[4, 10], [1, 3], [1, 1]],
    hatTiLe: 0.85,
    hatSoLuong: [2, 5],
    luonCo: ['linh-thao', 'chu-qua'],
    luonCoSoLuong: 12,
    /** Trả linh thạch để đổi hàng ngay: mỗi ngày luotMoiNgay lượt, lượt đầu giá `gia`, mỗi lượt sau trong ngày đắt gấp `nhan`. */
    lamMoi: { luotMoiNgay: 5, gia: 100, nhan: 1.5 },
    /**
     * Đan bày bán: chỉ đan thường (không phải đan đột phá) cùng bậc với cảnh giới người chơi, cao nhất tới phẩm phamCao.
     * tiLe[phẩm] là cơ hội có hàng, soLuong[phẩm] là khoảng số viên; giá bằng giá trị gốc của viên đan nhân một số trong khoảng heSoGia.
     */
    dan: { phamCao: 2, tiLe: [0.7, 0.45, 0.2], soLuong: [[2, 5], [1, 3], [1, 1]], heSoGia: [1.5, 1.6] },
  },
} as const;

/**
 * Lợi thế bẩm sinh của nhân vật (từ thiên mệnh: xuất thân, thể chất, tư chất, khí vận, giới diện…),
 * đã quy ra các hệ số mà phần luyện đan dùng trực tiếp. Xem hàm loiThe trong nhanVat.ts.
 */
export interface LoiThe {
  /** Cộng vào chất lượng khởi điểm của mẻ. */
  chatLuong: number;
  /** Cộng vào bề rộng vùng hỏa hầu. */
  rongVung: number;
  /** Nhân vào lượng áp lò tăng lên. */
  heSoAp: number;
  /** Cộng vào bề rộng khoảng xanh khi tôi đan. */
  xanh: number;
  /** Nhân vào thời gian quét của con lắc (lớn hơn 1 = chậm hơn = dễ hơn). */
  heSoQuet: number;
  /** Xác suất vượt đan kiếp. */
  vuotKiep: number;
  /** Cộng vào tâm phẩm cấp khi mở lò. */
  phamCong: number;
  /** Nhân vào giá mua dược liệu / giá bán đan. */
  heSoMua: number;
  heSoBan: number;
  /** Nhân vào tốc độ tăng tu vi. */
  tocDoTuLuyen: number;
  /** Cộng vào số viên mỗi mẻ. */
  soVien: number;
}
export const LOI_THE_GOC: LoiThe = { chatLuong: 0, rongVung: 0, heSoAp: 1, xanh: 0, heSoQuet: 1, vuotKiep: 0.5, phamCong: 0, heSoMua: 1, heSoBan: 1, tocDoTuLuyen: 1, soVien: 0 };

/** Nâng cấp đan phòng — cấp 0 là chưa nâng. */
export interface NangCap {
  /** Lò chịu áp: mỗi cấp giảm 10% lượng áp lò tăng lên. */
  lo: number;
  /** Linh hỏa: vùng hỏa hầu rộng hơn. */
  lua: number;
  /** Tay nghề: thêm viên mỗi mẻ. */
  tayNghe: number;
  /** Lợi thế bẩm sinh của nhân vật; bỏ trống = không có lợi thế gì. */
  loiThe?: LoiThe;
}
export const NANG_CAP_GOC: NangCap = { lo: 0, lua: 0, tayNghe: 0 };

/** Các tông môn đặt đan. Ảnh huy hiệu: public/hinh/ui/tong-<id>.png, chưa có thì hiện một chữ. */
export const TONG_MON = [
  { id: 'thanh-van', ten: 'Thanh Vân Tông', chu: '雲' },
  { id: 'duoc-vuong', ten: 'Dược Vương Cốc', chu: '藥' },
  { id: 'thien-kiem', ten: 'Thiên Kiếm Môn', chu: '劍' },
  { id: 'van-bao', ten: 'Vạn Bảo Lâu', chu: '寶' },
  { id: 'huyen-am', ten: 'Huyền Âm Giáo', chu: '陰' },
] as const;
export const timTongMon = (id: string) => TONG_MON.find((t) => t.id === id) ?? TONG_MON[0];

/** Một chiếc lò đan mua được ở phường thị. Mỗi lò đổi tính chất của mọi mẻ luyện bằng nó. */
export interface LoDan {
  id: string;
  ten: string;
  moTa: string;
  gia: number;
  /** Cộng vào tâm phẩm cấp. */
  phamCong?: number;
  /** Nhân vào lượng áp lò tăng lên (lớn hơn 1 = lò dễ nổ hơn). */
  heSoAp?: number;
  /** Cộng vào bề rộng vùng hỏa hầu (âm = hẹp đi). */
  rongVung?: number;
  /** Cộng vào bề rộng khoảng xanh khi tôi đan. */
  xanh?: number;
  /** Nhân vào thời gian quét của con lắc (nhỏ hơn 1 = con lắc nhanh hơn). */
  heSoQuet?: number;
  /** Cộng vào xác suất vượt đan kiếp. */
  vuotKiep?: number;
  /** Cộng vào số viên mỗi mẻ. */
  soVien?: number;
}
/** Lò đầu tiên là lò ai cũng có. Ảnh: public/hinh/lo/<id>.png, chưa có thì dùng ảnh lò mặc định. */
export const LO_DAN: readonly LoDan[] = [
  { id: 'thanh-dong-lo', ten: 'Thanh Đồng Lô', moTa: 'Lò đồng xanh của người mới học. Không có gì đặc biệt.', gia: 0 },
  { id: 'han-ngoc-lo', ten: 'Hàn Ngọc Lô', moTa: 'Ngọc lạnh trấn hỏa: áp lò dâng chậm đi bốn phần mười, nhưng mỗi mẻ ít hơn một viên.', gia: 2500, heSoAp: 0.6, soVien: -1 },
  { id: 'hoa-long-lo', ten: 'Hỏa Long Lô', moTa: 'Long hỏa mãnh liệt: phẩm đan cao hơn hẳn, nhưng áp lò dâng nhanh gấp rưỡi và vùng hỏa hầu hẹp lại.', gia: 4000, phamCong: 0.35, heSoAp: 1.5, rongVung: -3 },
  { id: 'bat-quai-lo', ten: 'Bát Quái Lô', moTa: 'Trận văn ổn định: vùng hỏa hầu và khoảng xanh đều rộng ra, nhưng phẩm đan kém đi một chút.', gia: 5000, rongVung: 4, xanh: 0.03, phamCong: -0.15 },
  { id: 'tu-kim-lo', ten: 'Tử Kim Lô', moTa: 'Lò lớn bằng tử kim: mỗi mẻ thêm hai viên, nhưng con lắc tôi đan chạy nhanh hơn.', gia: 8000, soVien: 2, heSoQuet: 0.85 },
  { id: 'cuu-long-than-lo', ten: 'Cửu Long Thần Lô', moTa: 'Thần lô thượng cổ: phẩm đan cao, dễ vượt đan kiếp, thêm một viên mỗi mẻ; áp lò dâng nhanh hơn hai phần mười.', gia: 30000, phamCong: 0.5, vuotKiep: 0.2, soVien: 1, heSoAp: 1.2 },
];
export const timLoDan = (id: string) => LO_DAN.find((l) => l.id === id) ?? LO_DAN[0];
export const anhLoDan = (id: string) => `./hinh/lo/${id}.png`;

export const timDuocLieu = (id: string) => DUOC_LIEU.find((d) => d.id === id)!;
export const timDanPhuong = (id: string) => DAN_PHUONG.find((d) => d.id === id)!;
export const timPhuLieu = (id: string | null) => (id ? PHU_LIEU.find((d) => d.id === id) ?? null : null);

/** Viên đan đã qua mấy mốc đổi màu (0 = chưa mốc nào, 5 = đan huyền thoại). */
export const mocChuyen = (bac: number) => LUAT.duong.moc.filter((m) => bac >= m).length;
/** Tên của từng mốc, theo mocChuyen. */
export const TEN_MOC = ['', 'Linh đan', 'Bảo đan', 'Thánh đan', 'Tiên đan', 'Huyền thoại'] as const;
/** Giá và dược lực của viên đan nhân lên bấy nhiêu lần sau `bac` chuyển. */
export function heSoChuyen(bac: number): number {
  const d = LUAT.duong;
  return d.gia ** bac * (bac >= d.moc[d.moc.length - 1] ? d.giaHuyenThoai : 1);
}

/** Giá bán một viên ở phường thị. */
export function giaBan(phuong: DanPhuong, pham: PhamThat, danVan = false, heSo = 1): number {
  return Math.round(phuong.giaGoc * HE_SO_GIA[pham] * (danVan ? HE_SO_DAN_VAN : 1) * LUAT.heSoBan * heSo);
}
