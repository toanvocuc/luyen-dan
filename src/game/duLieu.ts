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
export const TEN_TUOI = ['Mười năm', 'Trăm năm', 'Ngàn năm'] as const;
export const TEN_TUOI_NGAN = ['10 năm', '100 năm', '1000 năm'] as const;
/** Chất lượng khởi điểm mà mỗi tuổi thuốc đóng góp (lấy trung bình ba vị). */
export const CHAT_LUONG_THEO_TUOI = [20, 35, 50] as const;

export interface DuocLieu {
  id: string;
  ten: string;
  /** Xoay màu ảnh mẫu để phân biệt tạm, cho tới khi có ảnh riêng từng vị. */
  xoayMau: number;
  /** Giá mua theo tuổi thuốc. */
  gia: readonly [number, number, number];
}

export const DUOC_LIEU: readonly DuocLieu[] = [
  { id: 'linh-thao', ten: 'Linh Thảo', xoayMau: 0, gia: [4, 18, 90] },
  { id: 'chu-qua', ten: 'Chu Quả', xoayMau: 200, gia: [6, 26, 130] },
  { id: 'han-bang-hoa', ten: 'Hàn Băng Hoa', xoayMau: 50, gia: [8, 34, 170] },
  { id: 'dia-tam-sam', ten: 'Địa Tâm Sâm', xoayMau: 250, gia: [10, 44, 220] },
  { id: 'tu-van-chi', ten: 'Tử Vân Chi', xoayMau: 120, gia: [14, 60, 300] },
];

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
  /** Độ khó: kéo phẩm cấp xuống và làm vùng hỏa hầu lắc lư. */
  doKho: number;
  /** Bề rộng vùng hỏa hầu (đơn vị nhiệt 0–100). */
  rongVung: number;
  /** Tỉ lệ nổ lò gốc (0–1). */
  noLoGoc: number;
  doan: readonly DoanHoa[];
  /** Giá bán một viên hạ phẩm. */
  giaGoc: number;
  xoayMau: number;
}

export const DAN_PHUONG: readonly DanPhuong[] = [
  {
    id: 'tu-khi-dan',
    ten: 'Tụ Khí Đan',
    moTa: 'Đan nhập môn, giúp tu sĩ Luyện Khí tụ linh khí.',
    lieu: ['linh-thao', 'linh-thao', 'chu-qua'],
    doKho: 0,
    rongVung: 26,
    noLoGoc: 0.02,
    doan: [
      { ten: 'Văn hỏa', tam: 34, giay: 8 },
      { ten: 'Vũ hỏa', tam: 70, giay: 7 },
      { ten: 'Thu hỏa', tam: 46, giay: 5 },
    ],
    giaGoc: 12,
    xoayMau: 0,
  },
  {
    id: 'hoi-xuan-dan',
    ten: 'Hồi Xuân Đan',
    moTa: 'Chữa thương, hồi phục khí huyết sau khi giao đấu.',
    lieu: ['chu-qua', 'han-bang-hoa', 'linh-thao'],
    doKho: 0.35,
    rongVung: 22,
    noLoGoc: 0.03,
    doan: [
      { ten: 'Văn hỏa', tam: 30, giay: 6 },
      { ten: 'Vũ hỏa', tam: 76, giay: 6 },
      { ten: 'Văn hỏa', tam: 40, giay: 5 },
      { ten: 'Thu hỏa', tam: 58, giay: 4 },
    ],
    giaGoc: 26,
    xoayMau: 300,
  },
  {
    id: 'tay-tuy-dan',
    ten: 'Tẩy Tủy Đan',
    moTa: 'Gột tạp chất trong kinh mạch, chuẩn bị cho Trúc Cơ.',
    lieu: ['dia-tam-sam', 'han-bang-hoa', 'tu-van-chi'],
    doKho: 0.7,
    rongVung: 19,
    noLoGoc: 0.05,
    doan: [
      { ten: 'Vũ hỏa', tam: 78, giay: 5 },
      { ten: 'Văn hỏa', tam: 28, giay: 6 },
      { ten: 'Vũ hỏa', tam: 84, giay: 5 },
      { ten: 'Thu hỏa', tam: 50, giay: 5 },
    ],
    giaGoc: 60,
    xoayMau: 190,
  },
];

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
  { id: 'hoa-tinh', ten: 'Hỏa Tinh', moTa: 'Phẩm cấp tăng mạnh, lò dễ nổ hơn', chatLuong: 15, apLo: 12, soVien: 0, gia: 40 },
  { id: 'ngung-than-thao', ten: 'Ngưng Thần Thảo', moTa: 'Lò ổn định hơn, ít hơn một viên', chatLuong: 0, apLo: -15, soVien: -1, gia: 25 },
];

/** Hệ số giá theo phẩm cấp (nhân với giaGoc của đan phương). */
export const HE_SO_GIA = [1, 2.5, 7, 20] as const;
/** Viên có đan văn bán gấp bấy nhiêu lần. */
export const HE_SO_DAN_VAN = 3;

/** Các hằng số của cơ chế luyện đan. */
export const LUAT = {
  soVienGoc: 5,
  /** Vòng khống hỏa chính: mỗi giây trong vùng / quá nguội / quá nóng. */
  chinh: { trong: 1.75, lanh: -0.5, nongAp: 1.5 },
  /** Mỗi chu thiên luyện thêm. */
  chuThien: { giay: 10, trong: 1.0, lanh: -0.5, nongAp: 2, apCoDinh: 8, hepVung: 3, toiDa: 3 },
  /** Mỗi điểm áp lò cộng bấy nhiêu vào tỉ lệ nổ lò. */
  noLoMoiDiemAp: 0.006,
  noLoToiDa: 0.6,
  /** Đường cong phẩm cấp: tâm = goc + doc * chatLuong/100 - doKho, trên thang 0 (phế) … 4 (cực phẩm). */
  phamGoc: 0.4,
  phamDoc: 2.6,
  phamDoRong: 0.85,
  /** Xác suất một viên cực phẩm mang đan văn. */
  danVan: 0.1,
  /** Luyện thành công bấy nhiêu mẻ thì mở "luyện nhanh". */
  thongThao: 5,
  /** Chất lượng khống hỏa giả định khi luyện nhanh (phần thời gian giữ trong vùng). */
  luyenNhanhTrongVung: 0.7,
} as const;

/** Nâng cấp đan phòng — cấp 0 là chưa nâng. */
export interface NangCap {
  /** Lò chịu áp: giảm tỉ lệ nổ lò. */
  lo: number;
  /** Linh hỏa: vùng hỏa hầu rộng hơn. */
  lua: number;
  /** Tay nghề: thêm viên mỗi mẻ. */
  tayNghe: number;
}
export const NANG_CAP_GOC: NangCap = { lo: 0, lua: 0, tayNghe: 0 };
export const NANG_CAP_TOI_DA = 5;

export const timDuocLieu = (id: string) => DUOC_LIEU.find((d) => d.id === id)!;
export const timDanPhuong = (id: string) => DAN_PHUONG.find((d) => d.id === id)!;
export const timPhuLieu = (id: string | null) => (id ? PHU_LIEU.find((d) => d.id === id) ?? null : null);
