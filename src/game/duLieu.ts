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
}

const DAN_GOC: readonly DanPhuong[] = [
  {
    id: 'tu-khi-dan',
    ten: 'Tụ Khí Đan',
    moTa: 'Đan nhập môn, giúp tu sĩ Luyện Khí tụ linh khí.',
    bac: 'Luyện Khí',
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
    lieu: ['chu-qua', 'han-bang-hoa', 'linh-thao'],
    doKho: 0.3,
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
    lieu: ['dia-tam-sam', 'han-bang-hoa', 'tu-van-chi'],
    doKho: 0.6,
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
    lieu: ['han-bang-hoa', 'long-tu-thao', 'tu-van-chi'],
    doKho: 0.85,
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
    doKho: 1.1,
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
    lieu: ['huyet-lien', 'long-tu-thao', 'kim-diep-truc'],
    doKho: 1.4,
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
 * Bù lại, tu sĩ cảnh giới cao được cộng lợi thế luyện đan (xem LUAT.canhGioi), nên độ khó thực tế chỉ nhích dần.
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
    doKho: dau ? -0.2 : +(1.1 + 0.2 * (dich - 2)).toFixed(2),
    rongVung: dau ? 22 : Math.max(9, 14 - 0.5 * (dich - 2)),
    xungDot: dau ? 1 : Math.min(8, 4 + Math.floor((dich - 2) / 2)),
    doan,
    giaGoc: dau ? 8 : Math.round((200 * 1.8 ** (dich - 2)) / 10) * 10,
    dotPha: dich,
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
   */
  chinh: { trong: 1.75, lanh: -1.5, nongAp: 18, nongTangToc: 0.6, xaAp: 3 },
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
    phamMoiCap: 0.28,
  },

  /** Đường cong phẩm cấp: tâm = goc + doc * chatLuong/100 - doKho + cấp tôi, trên thang 0 (phế) … 4 (cực phẩm). */
  phamGoc: 0.4,
  phamDoc: 2.6,
  phamDoRong: 0.85,


  /** Luyện thành bấy nhiêu mẻ thì mở "luyện nhanh". */
  thongThao: 5,
  /** Chất lượng khống hỏa giả định khi luyện nhanh (phần thời gian giữ trong vùng). */
  luyenNhanhTrongVung: 0.6,

  /** Sửa lò sau khi nổ. */
  giaSuaLo: 30,
  /** Bán đan ở phường thị được bấy nhiêu phần giá trị (đơn hàng sẽ trả cao hơn). */
  heSoBan: 0.7,
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
  dotPha: { tiLe: [0.5, 0.7, 0.85, 0.95], khiVan: 0.002, matTuVi: 0.3 },
  /** Lợi thế luyện đan theo cảnh giới (thần thức mạnh dần): mỗi cảnh giới trên Luyện Khí cộng bấy nhiêu. */
  canhGioi: { pham: 0.18, rongVung: 0.4 },
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
}
export const LOI_THE_GOC: LoiThe = { chatLuong: 0, rongVung: 0, heSoAp: 1, xanh: 0, heSoQuet: 1, vuotKiep: 0.5, phamCong: 0, heSoMua: 1, heSoBan: 1, tocDoTuLuyen: 1 };

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

export const timDuocLieu = (id: string) => DUOC_LIEU.find((d) => d.id === id)!;
export const timDanPhuong = (id: string) => DAN_PHUONG.find((d) => d.id === id)!;
export const timPhuLieu = (id: string | null) => (id ? PHU_LIEU.find((d) => d.id === id) ?? null : null);

/** Giá bán một viên ở phường thị. */
export function giaBan(phuong: DanPhuong, pham: PhamThat, danVan = false, heSo = 1): number {
  return Math.round(phuong.giaGoc * HE_SO_GIA[pham] * (danVan ? HE_SO_DAN_VAN : 1) * LUAT.heSoBan * heSo);
}
