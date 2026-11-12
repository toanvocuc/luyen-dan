// Toàn bộ số liệu của game nằm ở đây — chỉnh cân bằng thì chỉ sửa file này.

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

export interface DanPhuong {
  id: string;
  ten: string;
  moTa: string;
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
}

export const DAN_PHUONG: readonly DanPhuong[] = [
  {
    id: 'tu-khi-dan',
    ten: 'Tụ Khí Đan',
    moTa: 'Đan nhập môn, giúp tu sĩ Luyện Khí tụ linh khí.',
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
export const anhDan = (id: string) => `./hinh/dan/${id}.png`;

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

  /** Đan kiếp: xác suất một viên cực phẩm vượt kiếp (thành đan văn); không qua thì tụt xuống thượng phẩm. */
  vuotKiep: 0.5,

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
} as const;

/** Nâng cấp đan phòng — cấp 0 là chưa nâng. */
export interface NangCap {
  /** Lò chịu áp: mỗi cấp giảm 10% lượng áp lò tăng lên. */
  lo: number;
  /** Linh hỏa: vùng hỏa hầu rộng hơn. */
  lua: number;
  /** Tay nghề: thêm viên mỗi mẻ. */
  tayNghe: number;
}
export const NANG_CAP_GOC: NangCap = { lo: 0, lua: 0, tayNghe: 0 };

export const timDuocLieu = (id: string) => DUOC_LIEU.find((d) => d.id === id)!;
export const timDanPhuong = (id: string) => DAN_PHUONG.find((d) => d.id === id)!;
export const timPhuLieu = (id: string | null) => (id ? PHU_LIEU.find((d) => d.id === id) ?? null : null);

/** Giá bán một viên ở phường thị. */
export function giaBan(phuong: DanPhuong, pham: PhamThat, danVan = false): number {
  return Math.round(phuong.giaGoc * HE_SO_GIA[pham] * (danVan ? HE_SO_DAN_VAN : 1) * LUAT.heSoBan);
}
