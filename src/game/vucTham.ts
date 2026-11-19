// Vực Thẳm: mê cung 50 tầng đi XUỐNG. Mỗi ngày (giờ Việt Nam) vực đổi hình một lần: mê cung mới, quái và boss sống lại, về miệng vực. Quái chặn đường (đánh / bỏ chạy / từ bỏ), bốn trạng thái xấu,
// chỗ nghỉ, lối thoát (cất đồ, ra khỏi vực), ba boss đánh theo lượt (linh thú xuất chiến cùng đánh và hộ thể).
// Thuần tính toán, không dính giao diện. Không khoá cảnh giới: quái tầng 1 đã ngang tu sĩ Kim Đan.
import { CANH_GIOI, CHI_SO, DAN_PHUONG, LUAT, LO_DAN, anhDan, timDanPhuong, type ChiSo, type PhamThat } from './duLieu.ts';
import { chiSo, hoSoChien, mauHienTai, mauToiDa, type Kho } from './kho.ts';
import { chienMoi, dauLuotDich, duNguyen, dungDanTran, hungDon, raDon, thuThe, tuDanh, tuyetChieuSan, type ChienTran, type DichTuDong, type KetTuDong, type Vfx } from './chienDau.ts';
import { MO_O, rngHat, themLuyenThuc } from './voCong.ts';
import { giayKhoaMatHon, theLucHienTai } from './kyNgo.ts';
import { chiSoThu, hieuLucThu, thuXuatChien, timLoaiThu } from './linhThu.ts';

// ---------- luật ----------

export const LUAT_VUC = {
  /** Cảnh giới thấp nhất được vào: không khoá. Người yếu vào cũng được, nhưng sẽ chết — để họ thấy bức tường mà biết phải mạnh lên. */
  canhGioi: 0,
  soTang: 50,
  /** Cảnh giới "chuẩn" của tầng 1 và tầng 50: quái ở giữa nội suy tuyến tính. */
  canhGioiDau: 3,
  canhGioiCuoi: 9,
  /** Quái thường mạnh hơn tu sĩ chuẩn cùng tầng bấy nhiêu lần (vực thẳm làm cho người chơi late game). */
  heSoQuai: 1.25,
  /** Quái giữ ngõ cụt mạnh hơn và rơi nhiều đồ hơn. */
  heSoCut: 1.15,
  heSoBoss: 1.3,
  /** Mỗi bước: nhiễm độc mất 3% máu tối đa, chảy máu mất 6%. Yếu đuối: Lực và Thần thức còn 70%. */
  docMoiBuoc: 0.03,
  mauMoiBuoc: 0.06,
  heSoYeu: 0.7,
  /** Hắc hoá đủ bấy nhiêu thì mất hồn. */
  hacToiDa: 100,
  /** Thua một trận với quái: mất matMau + matMauSau × (tầng/50) phần máu tối đa. */
  matMau: 0.1,
  matMauSau: 0.12,
  /** Trạng thái quái gây ra khi đánh trúng: số bước (độc, chảy máu, yếu) hoặc điểm hắc hoá. */
  tt: { doc: 4, mau: 4, yeu: 6, hac: 18 },
  /** Quái lang thang: đi qua chỗ đã dọn vẫn có thể gặp. */
  coLangThang: 0.1,
  /** Chỗ nghỉ dùng lại được sau bấy nhiêu giây (đồng hồ thật). */
  giayNghi: 3600,
  nghiTheLuc: 40,
  nghiHac: 30,
  /** Boss bị hạ thì sống lại sau bấy nhiêu giây (để săn đồ lần nữa); cổng đã phá thì đi qua thoải mái. */
  giayBossSongLai: 86400,
  /** Linh thú xuất chiến: cứ bấy nhiêu lượt thì đánh một đòn / đỡ trọn một đòn cho chủ. */
  thuDanhMoi: 3,
  thuDoMoi: 5,
  /** Đỡ đòn: chỉ nhận bấy nhiêu phần sát thương; đỡ trúng đòn lớn thì phản lại nửa đòn đánh thường. */
  doDon: 0.3,
} as const;

export const TANG_BOSS: Record<number, BossId> = { 16: 'hat-hau', 33: 'huyet-dang', 50: 'ma-long' };
const TANG_THOAT = [8, 17, 25, 34, 42];
const TANG_NGHI = [4, 12, 21, 29, 38, 46];
/** Tầng 1–16 Nông, 17–33 Sâu, 34–50 Sâu thẳm. */
export const lopTang = (t: number) => (t <= 16 ? 0 : t <= 33 ? 1 : 2);
export const TEN_LOP = ['Tầng Nông', 'Tầng Sâu', 'Tầng Sâu Thẳm'] as const;
export const NEN_TRAN = ['vuc-tran-nong', 'vuc-tran-sau', 'vuc-tran-tham'] as const;

/** Vật phẩm Vực Thẳm cần để đột phá đại cảnh giới (theo cảnh giới đích). */
export const VUC_DOT_PHA: Record<number, readonly (readonly [VatVucId, number])[]> = {
  5: [['uyen-cot', 3]],
  6: [['uyen-cot', 5]],
  7: [['huyet-tinh', 3]],
  8: [['huyet-tinh', 5]],
  9: [['hu-khong-tinh-hach', 3]],
  10: [['trai-tim-vuc-tham', 1], ['hu-khong-tinh-hach', 4]],
  11: [['hu-khong-tinh-hach', 5]],
  12: [['hu-khong-tinh-hach', 6]],
  13: [['hu-khong-tinh-hach', 8]],
};

// ---------- dữ liệu ----------

export type TrangThaiId = 'doc' | 'mau' | 'yeu' | 'hac';
export const TRANG_THAI: Record<TrangThaiId, { ten: string; anh: string; moTa: string }> = {
  doc: { ten: 'Nhiễm độc', anh: 'trang-thai-doc', moTa: 'Mỗi bước mất 3% máu. Giải bằng Giải Độc Đan hoặc nghỉ ngơi.' },
  mau: { ten: 'Chảy máu', anh: 'trang-thai-mau', moTa: 'Mỗi bước mất 6% máu. Cầm bằng Chỉ Huyết Đan hoặc nghỉ ngơi.' },
  yeu: { ten: 'Yếu đuối', anh: 'trang-thai-yeu', moTa: 'Lực và Thần thức chỉ còn 70%. Tự hết sau vài bước.' },
  hac: { ten: 'Hắc hoá', anh: 'trang-thai-hac-hoa', moTa: 'Ma khí ăn mòn tâm trí. Đủ 100% thì mất hồn. Thanh Tâm Đan và nghỉ ngơi làm giảm.' },
};

export type VatVucId = 'uyen-cot' | 'huyet-tinh' | 'hu-khong-tinh-hach' | 'uyen-huyet-dan' | 'bua-vuc-tham' | 'trai-tim-vuc-tham';
export const VAT_VUC: readonly { id: VatVucId; ten: string; moTa: string }[] = [
  { id: 'uyen-cot', ten: 'Uyên Cốt', moTa: 'Mảnh xương cổ khắc phù văn, nhặt ở Tầng Nông. Cần để đột phá Hóa Thần, Luyện Hư.' },
  { id: 'huyet-tinh', ten: 'Huyết Tinh', moTa: 'Tinh thể đỏ sẫm của Tầng Sâu. Cần để đột phá Hợp Thể, Đại Thừa.' },
  { id: 'hu-khong-tinh-hach', ten: 'Hư Không Tinh Hạch', moTa: 'Khối đen nuốt ánh sáng ở Tầng Sâu Thẳm. Cần để đột phá từ Chân Tiên trở lên.' },
  { id: 'uyen-huyet-dan', ten: 'Uyên Huyết Đan', moTa: 'Đan của vực thẳm: hồi 60% máu, giải độc và cầm máu. Chỉ rơi từ quái.' },
  { id: 'bua-vuc-tham', ten: 'Bùa Vực Thẳm', moTa: 'Đốt bùa: một chỉ số ngẫu nhiên tăng mạnh vĩnh viễn. Chỉ rơi từ boss.' },
  { id: 'trai-tim-vuc-tham', ten: 'Trái Tim Vực Thẳm', moTa: 'Tim của Ma Long chúa vực. Bắt buộc để đột phá Chân Tiên lên Kim Tiên.' },
];
export const timVatVuc = (id: string) => VAT_VUC.find((v) => v.id === id) ?? VAT_VUC[0];
export const anhVatVuc = (id: string) => `./hinh/vuc-tham/do/${id}.webp`;
const VAT_LOP: readonly VatVucId[] = ['uyen-cot', 'huyet-tinh', 'hu-khong-tinh-hach'];

export interface Quai {
  id: string;
  ten: string;
  lop: 0 | 1 | 2;
  /** Đánh thì so chỉ số này. */
  kiem: 'luc' | 'thanThuc';
  /** Thua thì dính trạng thái này. */
  tt: TrangThaiId;
  mo: string;
}
export const QUAI: readonly Quai[] = [
  { id: 'ngo-cong', ten: 'Thạch Ngô Công', lop: 0, kiem: 'luc', tt: 'doc', mo: 'Vách đá nứt toác. Một con rết đá dài như cây cầu bò ra, nọc đen nhỏ giọt.' },
  { id: 'thi-khoi', ten: 'Cổ Khôi Lỗi', lop: 0, kiem: 'luc', tt: 'yeu', mo: 'Một con rối gỗ mục cao gấp đôi người lê lại gần, đinh sắt cắm khắp thân.' },
  { id: 'hon-dang', ten: 'U Hồn Đăng', lop: 0, kiem: 'thanThuc', tt: 'hac', mo: 'Kẻ cầm đèn gầy như bộ xương. Trong mỗi lồng đèn là một hồn người đang gào.' },
  { id: 'bien-buc', ten: 'Huyết Âm Biên Bức', lop: 0, kiem: 'thanThuc', tt: 'mau', mo: 'Tiếng rít xé tai. Một con dơi quỷ sà xuống, tiếng kêu cứa thẳng vào thần thức.' },
  { id: 'ma-tri', ten: 'Diện Ma Tri', lop: 1, kiem: 'luc', tt: 'doc', mo: 'Trên trần hang, một mặt nạ sứ trắng mỉm cười. Rồi tám cái chân dài duỗi ra.' },
  { id: 'kinh-dien', ten: 'Kính Diện Yêu', lop: 1, kiem: 'thanThuc', tt: 'yeu', mo: 'Một bóng người cao lêu khêu đứng im. Mặt nó là tấm gương nứt, chỉ phản chiếu bóng tối.' },
  { id: 'huyet-dang', ten: 'Huyết Đằng Yêu', lop: 1, kiem: 'luc', tt: 'mau', mo: 'Dây leo đỏ sẫm phủ kín lối đi. Nụ hoa khổng lồ hé ra, bên trong toàn gai.' },
  { id: 'mong-diep', ten: 'Mộng Yểm Điệp', lop: 1, kiem: 'thanThuc', tt: 'hac', mo: 'Bụi xám rơi như tro. Trên cánh con bướm khổng lồ, hàng chục con mắt đều đang mở.' },
  { id: 'cot-long', ten: 'Cốt Long Hài', lop: 2, kiem: 'luc', tt: 'mau', mo: 'Bộ xương rồng cổ nằm vắt ngang vực. Lửa tím trong hốc mắt vụt bùng lên.' },
  { id: 'vo-dien-tang', ten: 'Vô Diện Tăng', lop: 2, kiem: 'thanThuc', tt: 'hac', mo: 'Nhà sư áo đen lơ lửng, tràng hạt sọ lách cách. Dưới mũ trùm không có mặt.' },
  { id: 'thach-ma', ten: 'Uyên Thạch Cự Ma', lop: 2, kiem: 'luc', tt: 'yeu', mo: 'Mặt đất rung từng nhịp. Gã khổng lồ đá đeo xiềng đứng dậy từ đáy vực.' },
  { id: 'thuy-mau', ten: 'U Uyên Thực Hồn Mẫu', lop: 2, kiem: 'thanThuc', tt: 'doc', mo: 'Vòm sứa nhợt nhạt trôi trong bóng tối, xúc tu móc câu dò dẫm về phía ngươi.' },
];
export const timQuai = (id: string) => QUAI.find((q) => q.id === id) ?? QUAI[0];
export const anhQuai = (id: string) => `./hinh/vuc-tham/quai-${id}.webp`;

export type BossId = 'hat-hau' | 'huyet-dang' | 'ma-long';
type LoaiChieu = 'thuong' | 'lon' | 'trang-thai' | 'buff' | 'hoi';
export interface Chieu {
  id: string;
  ten: string;
  loai: LoaiChieu;
  /** Ảnh boss khi ra chiêu này (hậu tố của boss-<id>-<anh>.webp). */
  anh: string;
  /** Sát thương: phần máu tối đa của người chơi (trước khi tính phòng ngự). */
  dmg?: number;
  tt?: Partial<Record<TrangThaiId, number>>;
  /** Câu báo trước ý đồ. */
  bao: string;
}
export interface Boss {
  id: BossId;
  ten: string;
  tang: number;
  /** Số đòn đánh thường của một tu sĩ chuẩn để hạ nó. */
  soDon: number;
  /** Hệ số sát thương nhận theo kiểu đánh (giáp dày: sức mạnh kém hiệu quả). */
  khang: { luc: number; thanThuc: number };
  mo: string;
  chieu: readonly Chieu[];
}
export const BOSS: Record<BossId, Boss> = {
  'hat-hau': {
    id: 'hat-hau',
    ten: 'Độc Hạt Hậu',
    tang: 16,
    soDon: 11,
    khang: { luc: 0.7, thanThuc: 1.2 },
    mo: 'Cổng đá vỡ vụn. Mặt nạ xương có sừng ngẩng lên, đuôi độc cong vút. Giáp quá dày: thần thức sẽ hiệu quả hơn.',
    chieu: [
      { id: 'thuong', ten: 'Kìm thép', loai: 'thuong', anh: 'dung', dmg: 0.1, bao: 'Nó giương đôi kìm, chuẩn bị kẹp tới.' },
      { id: 'doc-cham', ten: 'Độc Châm', loai: 'lon', anh: 'doc-cham', dmg: 0.26, tt: { doc: 4 }, bao: 'Chiếc đuôi cong hết cỡ, ngòi độc rỉ nọc đen. Đòn lớn sắp tới!' },
      { id: 'doc-vu', ten: 'Độc Vụ', loai: 'trang-thai', anh: 'doc-vu', dmg: 0.05, tt: { yeu: 4, doc: 2 }, bao: 'Khói độc bắt đầu rỉ ra từ dưới mặt nạ.' },
      { id: 'giap-hoa', ten: 'Giáp Hóa', loai: 'buff', anh: 'giap-hoa', bao: 'Nó thu mình, phù văn trên giáp sáng dần lên.' },
    ],
  },
  'huyet-dang': {
    id: 'huyet-dang',
    ten: 'Cửu Mục Thụ Yêu',
    tang: 33,
    soDon: 13,
    khang: { luc: 1.2, thanThuc: 0.75 },
    mo: 'Thân cây chết đen như than, chín con mắt lần lượt mở. Thần thức vô dụng với nó, nhưng thân gỗ thì chém được.',
    chieu: [
      { id: 'thuong', ten: 'Roi gai', loai: 'thuong', anh: 'dung', dmg: 0.11, bao: 'Những sợi dây gai quằn quại, sẵn sàng quất tới.' },
      { id: 'troi', ten: 'Huyết Đằng Trói', loai: 'lon', anh: 'troi', dmg: 0.24, tt: { mau: 4 }, bao: 'Hàng chục dây gai rút về, căng như dây cung. Đòn lớn sắp tới!' },
      { id: 'nhiep-hon', ten: 'Cửu Mục Nhiếp Hồn', loai: 'trang-thai', anh: 'nhiep-hon', dmg: 0.05, tt: { hac: 22 }, bao: 'Cả chín con mắt cùng nhìn chằm chằm vào ngươi.' },
      { id: 'hap-huyet', ten: 'Hấp Linh Hồi Xuân', loai: 'hoi', anh: 'hap-huyet', bao: 'Những quả đỏ trên cành bắt đầu teo lại: nó định hút linh khí hồi phục.' },
    ],
  },
  'ma-long': {
    id: 'ma-long',
    ten: 'U Uyên Ma Long',
    tang: 50,
    soDon: 14,
    khang: { luc: 1, thanThuc: 1 },
    mo: 'Đáy vực. Những vòng thân đen như núi chuyển động, xiềng xích loảng xoảng. Chúa vực đã thức giấc.',
    chieu: [
      { id: 'thuong', ten: 'Long trảo', loai: 'thuong', anh: 'dung', dmg: 0.13, bao: 'Móng vuốt khổng lồ cào xuống mặt đá.' },
      { id: 'hoa-tuc', ten: 'Hắc Diễm Long Tức', loai: 'lon', anh: 'hoa-tuc', dmg: 0.3, bao: 'Lửa đen dồn lên cổ họng nó, cả hang nóng rực. Đòn lớn sắp tới!' },
      { id: 'long-ngam', ten: 'Ma Uy Long Ngâm', loai: 'trang-thai', anh: 'long-ngam', dmg: 0.06, tt: { yeu: 4, hac: 15 }, bao: 'Nó ngẩng đầu, hít một hơi thật sâu.' },
      { id: 'nghich-lan', ten: 'Nghịch Lân Hóa Ma', loai: 'buff', anh: 'nghich-lan', bao: 'Vảy ngược dưới cổ nó đỏ rực. Xiềng xích bắt đầu rạn vỡ!' },
    ],
  },
};
export const anhBoss = (id: BossId, anh: string) => `./hinh/vuc-tham/boss-${id}-${anh}.webp`;
/** Tỉ lệ rơi của boss (theo thứ tự hat-hau, huyet-dang, ma-long). */
const ROI_BOSS: Record<BossId, { bua: number; lo: number }> = { 'hat-hau': { bua: 0.4, lo: 0.08 }, 'huyet-dang': { bua: 0.5, lo: 0.14 }, 'ma-long': { bua: 0.65, lo: 0.25 } };

// ---------- bản đồ mê cung ----------

export type LoaiDiemVuc = 'cua' | 'quai' | 'nghi' | 'thoat' | 'boss';
export interface DiemVuc {
  id: number;
  tang: number;
  /** Vị trí ngang, phần trăm. */
  x: number;
  loai: LoaiDiemVuc;
  /** Ngõ cụt: không có đường xuống; quái giữ ở đây mạnh hơn và rơi nhiều đồ hơn. */
  cut: boolean;
  quai?: string;
  boss?: BossId;
}
export interface BanDoVuc {
  diem: DiemVuc[];
  duong: [number, number][];
  ke: Map<number, number[]>;
}

function bam(chu: string): number {
  let h = 2166136261;
  for (let i = 0; i < chu.length; i++) h = Math.imul(h ^ chu.charCodeAt(i), 16777619);
  return h >>> 0;
}
function ngauNhien(hat: number) {
  let a = hat || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sinh mê cung theo tên nhân vật (mỗi người một vực, nhưng vực của một người thì không bao giờ đổi). */
export function taoBanDoVuc(hat: string): BanDoVuc {
  const r = ngauNhien(bam(hat + '|vuc-tham'));
  const diem: DiemVuc[] = [{ id: 0, tang: 0, x: 50, loai: 'cua', cut: false }];
  const theoTang: DiemVuc[][] = [[diem[0]]];
  const duong: [number, number][] = [];
  const noi = (a: number, b: number) => {
    if (a !== b && !duong.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) duong.push([a, b]);
  };
  for (let t = 1; t <= LUAT_VUC.soTang; t++) {
    const lop = lopTang(t);
    const hang: DiemVuc[] = [];
    if (TANG_BOSS[t]) hang.push({ id: diem.length, tang: t, x: 50, loai: 'boss', cut: false, boss: TANG_BOSS[t] });
    else {
      const w = t < 3 ? 2 : r() < 0.55 ? 3 : 2;
      const goc = w === 2 ? [30, 70] : [18, 50, 82];
      const dacBiet = TANG_THOAT.includes(t) ? 'thoat' : TANG_NGHI.includes(t) ? 'nghi' : null;
      const oDacBiet = dacBiet ? Math.floor(r() * w) : -1;
      const pool = QUAI.filter((q) => q.lop === lop);
      for (let i = 0; i < w; i++) {
        const loai: LoaiDiemVuc = i === oDacBiet ? (dacBiet as LoaiDiemVuc) : 'quai';
        hang.push({
          id: diem.length + i,
          tang: t,
          x: Math.round(goc[i] + (r() - 0.5) * (w === 2 ? 16 : 10)),
          loai,
          cut: false,
          quai: loai === 'quai' ? pool[Math.floor(r() * pool.length)].id : undefined,
        });
      }
      // ngõ cụt: một điểm quái không có đường xuống (người chơi phải quay lại tìm lối khác)
      const coTheCut = hang.filter((d) => d.loai === 'quai');
      if (w >= 2 && coTheCut.length && r() < 0.5) coTheCut[Math.floor(r() * coTheCut.length)].cut = true;
    }
    diem.push(...hang);
    theoTang.push(hang);
  }
  // nối tầng trên với tầng dưới
  for (let t = 1; t <= LUAT_VUC.soTang; t++) {
    const tren = theoTang[t - 1];
    const duoi = theoTang[t];
    const diDuoc = tren.filter((d) => !d.cut);
    if (tren.length === 1 || duoi.length === 1) {
      for (const a of diDuoc) for (const b of duoi) noi(a.id, b.id);
    } else {
      for (const a of diDuoc) {
        const xep = [...duoi].sort((p, q) => Math.abs(p.x - a.x) - Math.abs(q.x - a.x));
        noi(a.id, xep[0].id);
        if (r() < 0.4) noi(a.id, xep[1].id);
      }
      for (const b of duoi) {
        if (duong.some(([x, y]) => (y === b.id && tren.some((a) => a.id === x)) || (x === b.id && tren.some((a) => a.id === y)))) continue;
        const gan = [...diDuoc].sort((p, q) => Math.abs(p.x - b.x) - Math.abs(q.x - b.x))[0];
        noi(gan.id, b.id);
      }
    }
    // đường ngang trong một tầng (không nối vào ngõ cụt, kẻo hết là ngõ cụt)
    for (let i = 0; i + 1 < duoi.length; i++) if (!duoi[i].cut && !duoi[i + 1].cut && r() < 0.35) noi(duoi[i].id, duoi[i + 1].id);
  }
  const ke = new Map<number, number[]>();
  for (const d of diem) ke.set(d.id, []);
  for (const [a, b] of duong) {
    ke.get(a)!.push(b);
    ke.get(b)!.push(a);
  }
  return { diem, duong, ke };
}
const boNho = new Map<string, BanDoVuc>();
export function banDoVuc(k: Kho): BanDoVuc {
  // mỗi nhân vật mỗi ngày một mê cung
  const hat = `${k.nhanVat?.ten ?? ''}|${k.vuc.ngay}`;
  let bd = boNho.get(hat);
  if (!bd) {
    bd = taoBanDoVuc(hat);
    boNho.set(hat, bd);
  }
  return bd;
}
export const diemVuc = (k: Kho, id: number) => banDoVuc(k).diem[id] ?? banDoVuc(k).diem[0];
export const keVuc = (k: Kho, a: number, b: number) => banDoVuc(k).ke.get(a)?.includes(b) ?? false;
/** Điểm thấy được: đã tới, hoặc nằm kề một điểm đã tới. */
export function thayVuc(k: Kho, id: number): boolean {
  const v = k.vuc;
  if (v.daDen.includes(id)) return true;
  return (banDoVuc(k).ke.get(id) ?? []).some((x) => v.daDen.includes(x));
}

// ---------- trạng thái lưu ----------

export interface TranBoss {
  diem: number;
  boss: BossId;
  mau: number;
  mauMax: number;
  luot: number;
  /** Chiêu boss định dùng ở lượt tới (báo trước cho người chơi). */
  yDo: string;
  /** Ảnh boss đang hiện (chiêu vừa ra). */
  anh: string;
  /** Giáp Hóa còn bấy nhiêu lượt (nhận nửa sát thương). */
  giap: number;
  /** Ma Long đã hoá ma (đánh mạnh hơn). */
  cuong: boolean;
  /** Thụ Yêu còn bấy nhiêu lượt mới hồi máu lại được. */
  hoiCho: number;
  nhatKy: string[];
  /** Người chơi đã ra đòn, đang đợi boss đánh trả (giao diện chờ một nhịp rồi gọi bossDanh). */
  choBoss?: boolean;
  /** Lượt này người chơi đang đỡ / linh thú sẽ đỡ thay. */
  dangDo?: boolean;
  thuDo?: boolean;
  /** Các dòng tả nửa lượt của người chơi, chờ ghép với nửa lượt của boss. */
  dongNguoi?: string[];
  /** Trạng thái trận theo bộ máy chung (chienDau.ts): hiệu ứng trên boss và trên người chơi, hồi chiêu, khiên. */
  chien?: ChienTran;
}
export interface VucTrangThai {
  /** Ngày (giờ Việt Nam) của mê cung hiện tại; qua ngày thì vực đổi hình (xem lamMoiVuc). */
  ngay: number;
  /** Vực vừa đổi hình mà người chơi chưa đọc bảng báo. */
  doiHinh?: boolean;
  /** Đang ở trong vực (chỉ ra được ở lối thoát). Trong vực máu KHÔNG tự hồi. */
  trong: boolean;
  viTri: number;
  /** Điểm vừa rời đi (bỏ chạy thì lùi về đây). */
  truoc: number;
  /** Lối thoát gần nhất đã chạm: chết hay từ bỏ thì về đây, lần sau vào vực cũng bắt đầu ở đây. */
  moc: number;
  daDen: number[];
  /** Điểm quái đã dọn. */
  diet: number[];
  /** Boss: điểm -> lúc bị hạ gần nhất (đã có = cổng đã phá, đi qua được). */
  bossDiet: Record<number, number>;
  sauNhat: number;
  tt: { doc: number; mau: number; yeu: number; hac: number };
  /** Đồ nhặt được nhưng chưa mang ra lối thoát: chết là mất. */
  tui: Record<string, number>;
  /** Chỗ nghỉ: điểm -> lúc nghỉ gần nhất. */
  nghi: Record<number, number>;
  /** Quái đang chặn đường ở điểm hiện tại. */
  gap: { diem: number; quai: string; langThang: boolean } | null;
  tran: TranBoss | null;
}
/** Số thứ tự ngày theo giờ Việt Nam (UTC+7). */
export const ngayVuc = (luc = Date.now()) => Math.floor((luc + 7 * 3600 * 1000) / 86400000);
/** Còn bao nhiêu giây nữa thì vực đổi hình. */
export const giayDoiVuc = (luc = Date.now()) => Math.ceil(((ngayVuc(luc) + 1) * 86400000 - 7 * 3600 * 1000 - luc) / 1000);
export const vucMoi = (luc = Date.now()): VucTrangThai => ({
  ngay: ngayVuc(luc),
  trong: false,
  viTri: 0,
  truoc: 0,
  moc: 0,
  daDen: [0],
  diet: [],
  bossDiet: {},
  sauNhat: 0,
  tt: { doc: 0, mau: 0, yeu: 0, hac: 0 },
  tui: {},
  nghi: {},
  gap: null,
  tran: null,
});
export const buVuc = (v: Partial<VucTrangThai> | undefined): VucTrangThai => {
  const m = vucMoi();
  return { ...m, ...v, ngay: v?.ngay ?? m.ngay, tt: { ...m.tt, ...v?.tt }, tui: { ...v?.tui }, nghi: { ...v?.nghi }, bossDiet: { ...v?.bossDiet }, daDen: [...(v?.daDen ?? m.daDen)], diet: [...(v?.diet ?? [])] };
};

// ---------- tiện ích ----------

const kep = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const datVuc = (k: Kho, sua: Partial<VucTrangThai>): Kho => ({ ...k, vuc: { ...k.vuc, ...sua } });
/** Cảnh giới chuẩn (số thực) của một tầng. */
export const canhGioiTang = (t: number) => LUAT_VUC.canhGioiDau + ((LUAT_VUC.canhGioiCuoi - LUAT_VUC.canhGioiDau) * Math.max(0, t - 1)) / (LUAT_VUC.soTang - 1);
/** Chỉ số của tu sĩ chuẩn ở tầng t (tầng 5 của cảnh giới chuẩn, không đan, không bẩm sinh). */
export function chuanVuc(cs: ChiSo, t: number): number {
  const c = LUAT.chiSo;
  return c.goc * c.moiCanhGioi ** canhGioiTang(t) * (1 + c.moiTang * 4) * (cs === 'khiHuyet' ? c.heSoMau : 1);
}
/** Chỉ số người chơi trong vực (yếu đuối làm giảm Lực, Thần thức). */
export function chiSoVuc(k: Kho, cs: ChiSo, luc = Date.now()): number {
  const yeu = k.vuc.tt.yeu > 0 && (cs === 'luc' || cs === 'thanThuc');
  return chiSo(k, cs, luc) * (yeu ? LUAT_VUC.heSoYeu : 1);
}
function tiLe(k: Kho, cs: ChiSo, t: number, heSo: number, luc: number): number {
  const c = LUAT.kyNgo;
  const r = chiSoVuc(k, cs, luc) / Math.max(1, chuanVuc(cs, t) * heSo);
  return kep(r ** c.mu / (r ** c.mu + 1) + ((k.nhanVat?.khiVan ?? 50) - 50) * c.khiVan, c.tiLeMin, c.tiLeMax);
}
const heSoQuaiTai = (k: Kho, diem: number, langThang: boolean) => LUAT_VUC.heSoQuai * (diemVuc(k, diem).cut && !langThang ? LUAT_VUC.heSoCut : 1);
export function tiLeChay(k: Kho, luc = Date.now()): number {
  const g = k.vuc.gap;
  if (!g) return 0;
  return tiLe(k, 'thanPhap', diemVuc(k, g.diem).tang, 1, luc);
}
/** Mất một lượng máu tuyệt đối (trong vực máu không tự hồi nên chốt lại theo lúc này). */
function truMau(k: Kho, so: number, luc: number): Kho {
  const toiDa = mauToiDa(k);
  const nay = mauHienTai(k, luc);
  return { ...k, mau: { thieu: Math.min(toiDa, toiDa - nay + Math.max(0, Math.round(so))), luc } };
}
function hoiMau(k: Kho, phan: number, luc: number): Kho {
  const toiDa = mauToiDa(k);
  const nay = mauHienTai(k, luc);
  return { ...k, mau: { thieu: Math.max(0, toiDa - nay - Math.round(toiDa * phan)), luc } };
}
function themTui(tui: Record<string, number>, id: string, so: number) {
  if (so > 0) tui[id] = (tui[id] ?? 0) + so;
}
/** Câu tả một túi đồ. */
export function chuTui(tui: Record<string, number>): string[] {
  return Object.entries(tui)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => (id === 'linh-thach' ? `${n} linh thạch` : id === 'lo-vuc-tham' ? 'Lò Đan Vực Thẳm' : `${n} ${timVatVuc(id).ten}`));
}
/** Cất túi đồ mang theo vào kho (khi tới lối thoát). */
function catTui(k: Kho): Kho {
  const vatVuc = { ...k.vatVuc };
  let linhThach = k.linhThach;
  for (const [id, n] of Object.entries(k.vuc.tui)) {
    if (id === 'linh-thach') linhThach += n;
    else vatVuc[id] = (vatVuc[id] ?? 0) + n;
  }
  return { ...k, linhThach, vatVuc, vuc: { ...k.vuc, tui: {} } };
}
function themTrangThai(tt: VucTrangThai['tt'], them: Partial<Record<TrangThaiId, number>>, heSo = 1): VucTrangThai['tt'] {
  const m = { ...tt };
  for (const [id, n] of Object.entries(them) as [TrangThaiId, number][]) {
    if (id === 'hac') m.hac = Math.min(LUAT_VUC.hacToiDa, m.hac + Math.round(n * heSo));
    else m[id] = Math.max(m[id], Math.round(n * heSo));
  }
  return m;
}
export const laThoat = (k: Kho, id: number) => {
  const d = diemVuc(k, id);
  return d.loai === 'thoat' || d.loai === 'cua' || (d.boss === 'ma-long' && !!k.vuc.bossDiet[id]);
};
export const bossConSong = (k: Kho, id: number, luc = Date.now()) => {
  const t = k.vuc.bossDiet[id];
  return !t || luc - t > LUAT_VUC.giayBossSongLai * 1000;
};
export const giayChoNghi = (k: Kho, id: number, luc = Date.now()) => Math.max(0, Math.ceil(((k.vuc.nghi[id] ?? 0) + LUAT_VUC.giayNghi * 1000 - luc) / 1000));
export const coMau = (k: Kho, luc = Date.now()) => mauHienTai(k, luc) > 0;

// ---------- vào, ra, chết ----------

export function lyDoKhongVaoVuc(k: Kho, luc = Date.now()): string | null {
  if (k.tuVi.canhGioi < LUAT_VUC.canhGioi) return `cần ${CANH_GIOI[LUAT_VUC.canhGioi]}`;
  if (giayKhoaMatHon(k, luc) > 0) return 'mất hồn';
  if (!k.vuc.trong && mauHienTai(k, luc) < mauToiDa(k) * LUAT.kyNgo.mauVao) return 'đang dưỡng thương';
  return null;
}
/**
 * Qua ngày mới: vực đổi hình. Mê cung mới, quái và boss sống lại, chỗ nghỉ nhóm lại, mốc về miệng vực.
 * Đang ở dưới thì bị đẩy về miệng vực (cũng là lối thoát), đồ đang mang và trạng thái vẫn giữ. Kỷ lục "sâu nhất" giữ nguyên.
 */
export function lamMoiVuc(k: Kho, luc = Date.now()): Kho {
  const hom = ngayVuc(luc);
  if (k.vuc.ngay === hom) return k;
  // bản lưu chưa từng vào vực thì không cần báo
  const daVao = k.vuc.daDen.length > 1 || k.vuc.trong;
  return { ...k, vuc: { ...vucMoi(luc), sauNhat: k.vuc.sauNhat, trong: k.vuc.trong, tui: k.vuc.tui, tt: k.vuc.tt, doiHinh: daVao } };
}
/** Vào vực: ở trong rồi thì đứng nguyên chỗ cũ; mới vào thì bắt đầu ở lối thoát gần nhất. Máu ngừng tự hồi từ lúc này. */
export function vaoVuc(k0: Kho, luc = Date.now()): Kho {
  const k = lamMoiVuc(k0, luc);
  if (k.vuc.trong) return k;
  const toiDa = mauToiDa(k);
  const nay = mauHienTai(k, luc);
  return { ...k, mau: { thieu: toiDa - nay, luc }, vuc: { ...k.vuc, trong: true, viTri: k.vuc.moc, truoc: k.vuc.moc, gap: null, tran: null } };
}
/** Rời vực ở lối thoát: cất đồ, máu bắt đầu tự hồi lại. */
export function roiVuc(k: Kho, luc = Date.now()): Kho {
  if (!k.vuc.trong || !laThoat(k, k.vuc.viTri) || k.vuc.gap || k.vuc.tran) return k;
  const toiDa = mauToiDa(k);
  const nay = mauHienTai(k, luc);
  const sau = catTui(k);
  return { ...sau, mau: { thieu: toiDa - nay, luc }, vuc: { ...sau.vuc, trong: false, moc: k.vuc.viTri } };
}
/** Gục ngã hoặc hắc hoá đủ: mất đồ đang mang, bị ném ra khỏi vực, mất hồn như ở Thanh Vân sơn. */
function chet(k: Kho, luc: number): Kho {
  const nhe = (k.soLanMatHon ?? 0) === 0;
  let kho: Kho = {
    ...k,
    matHon: luc,
    matHonNhe: nhe,
    soLanMatHon: (k.soLanMatHon ?? 0) + 1,
    thongBao: { loai: 'mat-hon', luc },
    vuc: { ...k.vuc, trong: false, viTri: k.vuc.moc, truoc: k.vuc.moc, tui: {}, gap: null, tran: null, tt: { doc: 0, mau: 0, yeu: 0, hac: 0 } },
  };
  kho = { ...kho, mau: { thieu: mauToiDa(kho), luc } };
  return kho;
}
const daChet = (k: Kho, luc: number) => mauHienTai(k, luc) <= 0 || k.vuc.tt.hac >= LUAT_VUC.hacToiDa;
/** Chốt an toàn: đang ở trong vực mà máu đã cạn (hoặc hắc hoá đủ) thì xử là gục ngã, kẻo kẹt không đi được. */
export function kiemChet(k: Kho, luc = Date.now()): Kho | null {
  return k.vuc.trong && daChet(k, luc) ? chet(k, luc) : null;
}

// ---------- đi ----------

export interface KetBuoc {
  kho: Kho;
  /** Mất máu vì độc / chảy máu trên đường. */
  matMau: number;
  chet: boolean;
  /** Vừa tới lối thoát: đồ trong túi đã được cất. */
  catDo: string[];
}
/** Mỗi bước (hoặc mỗi lượt đánh boss): độc và chảy máu rút máu, các trạng thái hết dần. */
function tick(k: Kho, luc: number): { kho: Kho; mat: number } {
  const tt = k.vuc.tt;
  const toiDa = mauToiDa(k);
  const mat = Math.round(toiDa * ((tt.doc > 0 ? LUAT_VUC.docMoiBuoc : 0) + (tt.mau > 0 ? LUAT_VUC.mauMoiBuoc : 0)));
  let kho = mat > 0 ? truMau(k, mat, luc) : k;
  kho = datVuc(kho, { tt: { doc: Math.max(0, tt.doc - 1), mau: Math.max(0, tt.mau - 1), yeu: Math.max(0, tt.yeu - 1), hac: tt.hac } });
  return { kho, mat };
}
/** Đi sang điểm kề. Không đi được thì trả về null. */
export function diVuc(k: Kho, id: number, rng: () => number = Math.random, luc = Date.now()): KetBuoc | null {
  const v = k.vuc;
  const c = LUAT.kyNgo;
  if (!v.trong || v.gap || v.tran || v.ngay !== ngayVuc(luc) || !keVuc(k, v.viTri, id) || !coMau(k, luc)) return null;
  const tl = theLucHienTai(k, luc);
  if (tl < c.theLucMoiBuoc) return null;
  const tu = diemVuc(k, v.viTri);
  const toi = diemVuc(k, id);
  // chưa phá cổng boss thì không xuống tiếp được
  if (tu.loai === 'boss' && toi.tang > tu.tang && !v.bossDiet[tu.id]) return null;
  let kho: Kho = {
    ...k,
    theLuc: { diem: tl - c.theLucMoiBuoc, luc },
    vuc: { ...v, truoc: v.viTri, viTri: id, daDen: v.daDen.includes(id) ? v.daDen : [...v.daDen, id], sauNhat: Math.max(v.sauNhat, toi.tang) },
  };
  const t = tick(kho, luc);
  kho = t.kho;
  if (daChet(kho, luc)) return { kho: chet(kho, luc), matMau: t.mat, chet: true, catDo: [] };
  let catDo: string[] = [];
  if (laThoat(kho, id)) {
    catDo = chuTui(kho.vuc.tui);
    kho = { ...catTui(kho), vuc: { ...catTui(kho).vuc, moc: id } };
  } else if (toi.loai === 'quai') {
    if (!kho.vuc.diet.includes(id)) kho = datVuc(kho, { gap: { diem: id, quai: toi.quai!, langThang: false } });
    else if (rng() < LUAT_VUC.coLangThang) {
      const pool = QUAI.filter((q) => q.lop === lopTang(toi.tang));
      kho = datVuc(kho, { gap: { diem: id, quai: pool[Math.floor(rng() * pool.length)].id, langThang: true } });
    }
  }
  return { kho, matMau: t.mat, chet: false, catDo };
}

// ---------- chạm trán quái ----------

export interface KetGap {
  kho: Kho;
  thanh: boolean;
  nhan: string[];
  mat: string[];
  chet: boolean;
  /** Trạng thái vừa dính. */
  dinh: TrangThaiId | null;
  /** Diễn biến trận tự đánh (để giao diện phát lại từng lượt). */
  tuDong?: KetTuDong;
  /** Hết lượt mà chưa phân thắng bại: quái bỏ đi. */
  hoa?: boolean;
}
/** Đồ rơi của một con quái thường (vào túi mang theo). */
function roiQuai(k: Kho, diem: number, langThang: boolean, rng: () => number): Record<string, number> {
  const d = diemVuc(k, diem);
  const lop = lopTang(d.tang);
  const heSo = (langThang ? 0.5 : 1) * (d.cut && !langThang ? 1.6 : 1);
  const roi: Record<string, number> = {};
  themTui(roi, 'linh-thach', Math.round(LUAT.kyNgo.linhThachGoc * LUAT.kyNgo.heSoCanhGioi ** canhGioiTang(d.tang) * (0.4 + rng() * 0.5) * heSo));
  if (rng() < Math.min(0.9, 0.5 * heSo)) themTui(roi, VAT_LOP[lop], d.cut && !langThang ? 2 : 1);
  if (rng() < 0.12 * heSo) themTui(roi, 'uyen-huyet-dan', 1);
  return roi;
}
/** Bị quái đánh trúng: mất máu theo độ sâu và dính trạng thái của nó. */
function biQuaiDanh(k: Kho, quai: Quai, tang: number, heSo: number, luc: number): { kho: Kho; mat: string[] } {
  const toiDa = mauToiDa(k);
  const so = toiDa * (LUAT_VUC.matMau + (LUAT_VUC.matMauSau * tang) / LUAT_VUC.soTang) * heSo;
  let kho = truMau(k, so, luc);
  kho = datVuc(kho, { tt: themTrangThai(kho.vuc.tt, { [quai.tt]: LUAT_VUC.tt[quai.tt] }, heSo) });
  return { kho, mat: [`${Math.round(so)} máu`, quai.tt === 'hac' ? `hắc hoá +${Math.round(LUAT_VUC.tt.hac * heSo)}%` : TRANG_THAI[quai.tt].ten] };
}
/** Số đòn chuẩn (100%) để hạ một con quái thường ngang sức. */
const SO_DON_QUAI = 7.8;
/** Dựng con quái đang gặp thành đối thủ cho trận tự đánh. */
export function dichQuai(k: Kho, luc = Date.now()): DichTuDong | null {
  const g = k.vuc.gap;
  if (!g) return null;
  const quai = timQuai(g.quai);
  const tang = diemVuc(k, g.diem).tang;
  const heSo = heSoQuaiTai(k, g.diem, g.langThang);
  const mauMax = Math.round(chuanVuc('khiHuyet', tang) * heSo * 1.6);
  const donChuan = (ngoai: boolean) => {
    const cs = ngoai ? 'luc' : 'thanThuc';
    const r = chiSoVuc(k, cs, luc) / Math.max(1, chuanVuc(cs, tang) * heSo);
    // quái "so chỉ số nào" thì yếu trước kiểu đánh đó
    return (mauMax / SO_DON_QUAI) * r ** 0.85 * (quai.kiem === cs ? 1.15 : 0.85);
  };
  const giap = (chuanVuc('phongNgu', tang) * heSo) / Math.max(1, chiSo(k, 'phongNgu', luc));
  // ngưỡng bị đánh lui = mức mất máu khi thua của bản cũ; quái ngang sức đánh lui được người chơi sau khoảng 4 đòn
  const nguongLui = LUAT_VUC.matMau + (LUAT_VUC.matMauSau * tang) / LUAT_VUC.soTang;
  const dmgDanh = mauToiDa(k) * Math.min(0.45, (nguongLui / 4) * giap ** 0.7);
  return { ten: quai.ten, mauMax, donChuan, dmgDanh, nguongLui };
}
/** Cộng luyện thục cho võ kỹ / tuyệt chiêu vừa dùng trong trận. */
function congLuyenThuc(k: Kho, dung: { voKy: boolean; tuyetChieu: boolean }, diem: number): Kho {
  let vo = k.voCong;
  if (dung.voKy && vo.lap.voKy != null) vo = themLuyenThuc(vo, vo.lap.voKy, diem, k.nhanVat).vo;
  if (dung.tuyetChieu && vo.lap.tuyetChieu != null) vo = themLuyenThuc(vo, vo.lap.tuyetChieu, diem, k.nhanVat).vo;
  return vo === k.voCong ? k : { ...k, voCong: vo };
}
/** Đánh quái thường: trận tự đánh bằng bộ chiêu đang lắp. Thua thì mất máu theo diễn biến và có thể dính trạng thái của quái. */
export function danhQuai(k: Kho, rng: () => number = Math.random, luc = Date.now()): KetGap | null {
  const g = k.vuc.gap;
  const dich = dichQuai(k, luc);
  if (!g || !dich) return null;
  const quai = timQuai(g.quai);
  const hs = hoSoChien(k, chuanVuc('thanPhap', diemVuc(k, g.diem).tang) * heSoQuaiTai(k, g.diem, g.langThang), luc);
  const thu = thuRaTran(k, luc);
  const thuTd = thu
    ? { ten: timLoaiThu(thu.loai).ten, dmg: Math.round((dich.mauMax / SO_DON_QUAI) * (0.35 + 0.45 * hieuLucThu(thu, luc)) * (1 + 0.15 * timLoaiThu(thu.loai).bac)) }
    : null;
  const td = tuDanh(hs, dich, k.tuVi.canhGioi >= MO_O.tuyetChieu, thuTd, rng);
  // máu: chốt theo kết quả trận (kể cả phần hồi từ Mộc / Nhất Dương Chỉ)
  const nay = mauHienTai(k, luc);
  let kho = td.mauMinh >= nay ? hoiMau(k, (td.mauMinh - nay) / mauToiDa(k), luc) : truMau(k, nay - td.mauMinh, luc);
  kho = congLuyenThuc(kho, td.daDung, td.thang ? 2 : 1);
  // bị đánh trúng càng nhiều lần càng dễ dính trạng thái của quái
  let dinh: TrangThaiId | null = null;
  const mat: string[] = [];
  if (td.trung > 0 && rng() < 1 - 0.65 ** td.trung) {
    dinh = quai.tt;
    kho = datVuc(kho, { tt: themTrangThai(kho.vuc.tt, { [quai.tt]: LUAT_VUC.tt[quai.tt] }) });
    mat.push(quai.tt === 'hac' ? `hắc hoá +${LUAT_VUC.tt.hac}%` : TRANG_THAI[quai.tt].ten);
  }
  const matMau = nay - td.mauMinh;
  if (matMau > 0) mat.unshift(`${Math.round(matMau)} máu`);
  if (td.thang) {
    const roi = roiQuai(kho, g.diem, g.langThang, rng);
    const tui = { ...kho.vuc.tui };
    for (const [id, n] of Object.entries(roi)) themTui(tui, id, n);
    kho = datVuc(kho, { gap: null, tui, diet: g.langThang || kho.vuc.diet.includes(g.diem) ? kho.vuc.diet : [...kho.vuc.diet, g.diem] });
    return { kho, thanh: true, nhan: chuTui(roi), mat, chet: false, dinh, tuDong: td };
  }
  if (daChet(kho, luc) || td.mauMinh <= 0) return { kho: chet(kho, luc), thanh: false, nhan: [], mat, chet: true, dinh, tuDong: td };
  // hết lượt chưa ngã ngũ: quái bỏ đi, chỗ này vẫn chưa dọn
  if (td.hoa) kho = datVuc(kho, { gap: null });
  return { kho, thanh: false, nhan: [], mat, chet: false, dinh, tuDong: td, hoa: td.hoa };
}
/** Bỏ chạy: thành thì lùi về điểm vừa đi; hỏng thì lãnh nửa đòn rồi mới thoát được. */
export function chayTron(k: Kho, rng: () => number = Math.random, luc = Date.now()): KetGap | null {
  const g = k.vuc.gap;
  if (!g) return null;
  const ve = (kho: Kho) => datVuc(kho, { gap: null, viTri: kho.vuc.truoc === g.diem ? kho.vuc.moc : kho.vuc.truoc, truoc: g.diem });
  if (rng() < tiLeChay(k, luc)) return { kho: ve(k), thanh: true, nhan: [], mat: [], chet: false, dinh: null };
  const quai = timQuai(g.quai);
  const b = biQuaiDanh(k, quai, diemVuc(k, g.diem).tang, 0.5, luc);
  if (daChet(b.kho, luc)) return { kho: chet(b.kho, luc), thanh: false, nhan: [], mat: b.mat, chet: true, dinh: quai.tt };
  return { kho: ve(b.kho), thanh: false, nhan: [], mat: b.mat, chet: false, dinh: quai.tt };
}
/** Từ bỏ: chắc chắn thoát, nhưng bị đẩy ngược về lối thoát gần nhất phía trên. */
export function tuBo(k: Kho): Kho {
  if (!k.vuc.gap && !k.vuc.tran) return k;
  return datVuc(k, { gap: null, tran: null, viTri: k.vuc.moc, truoc: k.vuc.moc });
}

// ---------- chỗ nghỉ ----------

export function nghiNgoi(k: Kho, luc = Date.now()): Kho {
  const v = k.vuc;
  const d = diemVuc(k, v.viTri);
  if (!v.trong || d.loai !== 'nghi' || giayChoNghi(k, d.id, luc) > 0) return k;
  const tl = theLucHienTai(k, luc);
  return {
    ...k,
    mau: { thieu: 0, luc },
    theLuc: { diem: Math.min(LUAT.kyNgo.theLucToiDa, tl + LUAT_VUC.nghiTheLuc), luc },
    vuc: { ...v, nghi: { ...v.nghi, [d.id]: luc }, tt: { doc: 0, mau: 0, yeu: 0, hac: Math.max(0, v.tt.hac - LUAT_VUC.nghiHac) } },
  };
}

// ---------- dùng đan trong vực ----------

export interface MonDan {
  khoa: string;
  ten: string;
  anh: string;
  co: number;
  moTa: string;
}
const DAN_GIAI: Record<string, { ten: string; tt: TrangThaiId | null; hoi: readonly number[]; hac?: readonly number[] }> = {
  'giai-doc-dan': { ten: 'Giải Độc Đan', tt: 'doc', hoi: [0.05, 0.08, 0.12, 0.18, 0.25] },
  'chi-huyet-dan': { ten: 'Chỉ Huyết Đan', tt: 'mau', hoi: [0.08, 0.12, 0.16, 0.22, 0.3] },
  'thanh-tam-dan': { ten: 'Thanh Tâm Đan', tt: null, hoi: [0, 0, 0, 0, 0], hac: [25, 35, 45, 60, 80] },
};
const TEN_LOAI = ['Hạ phẩm', 'Trung phẩm', 'Thượng phẩm', 'Cực phẩm', 'Đan văn'];
const pt = (x: number) => `${Math.round(x * 100)}%`;
/** Những viên dùng được trong vực: đan hồi máu, ba đan giải trạng thái, Uyên Huyết Đan (trong túi hoặc trong kho). */
/** Chân nguyên Hồi Nguyên Đan hồi lại theo phẩm [hạ, trung, thượng, cực, đan văn]. */
export const HOI_NGUYEN = [30, 40, 55, 75, 100] as const;
export function dsDanVuc(k: Kho): MonDan[] {
  const ra: MonDan[] = [];
  const uyen = (k.vuc.tui['uyen-huyet-dan'] ?? 0) + (k.vatVuc['uyen-huyet-dan'] ?? 0);
  if (uyen > 0) ra.push({ khoa: 'uyen-huyet-dan', ten: 'Uyên Huyết Đan', anh: anhVatVuc('uyen-huyet-dan'), co: uyen, moTa: 'Hồi 60% máu, giải độc, cầm máu' });
  for (const p of DAN_PHUONG) {
    const giai = DAN_GIAI[p.id];
    const nguyen = p.id === 'hoi-nguyen-dan';
    if (nguyen && !k.vuc.tran) continue;
    if (!giai && !nguyen && p.uong?.loai !== 'hoi-mau') continue;
    const dong: [PhamThat | 'dv', number][] = [[3, k.tuiDan[p.id]?.[3] ?? 0], [2, k.tuiDan[p.id]?.[2] ?? 0], [1, k.tuiDan[p.id]?.[1] ?? 0], [0, k.tuiDan[p.id]?.[0] ?? 0]];
    dong.unshift(['dv', k.danVan[p.id] ?? 0]);
    for (const [loai, co] of dong) {
      if (co < 1) continue;
      const m = loai === 'dv' ? 4 : loai;
      const moTa = nguyen
        ? `Chân nguyên +${HOI_NGUYEN[m]}`
        : giai
        ? giai.tt
          ? `Giải ${TRANG_THAI[giai.tt].ten.toLowerCase()}, hồi ${pt(giai.hoi[m])} máu`
          : `Hắc hoá −${giai.hac![m]}%`
        : `Hồi ${pt(p.uong!.giaTri[m])} máu`;
      ra.push({ khoa: `${p.id}|${loai}`, ten: `${p.ten} · ${TEN_LOAI[m]}`, anh: anhDan(p.id), co, moTa });
    }
  }
  return ra;
}
/** Dùng một viên. Trả về kho mới và câu tả, hoặc null nếu không có viên đó. */
export function dungDanVuc(k: Kho, khoa: string, luc = Date.now()): { kho: Kho; chu: string; nguyen?: number } | null {
  if (khoa === 'uyen-huyet-dan') {
    let kho: Kho;
    if ((k.vuc.tui['uyen-huyet-dan'] ?? 0) > 0) kho = datVuc(k, { tui: { ...k.vuc.tui, 'uyen-huyet-dan': k.vuc.tui['uyen-huyet-dan'] - 1 } });
    else if ((k.vatVuc['uyen-huyet-dan'] ?? 0) > 0) kho = { ...k, vatVuc: { ...k.vatVuc, 'uyen-huyet-dan': k.vatVuc['uyen-huyet-dan'] - 1 } };
    else return null;
    kho = hoiMau(kho, 0.6, luc);
    kho = datVuc(kho, { tt: { ...kho.vuc.tt, doc: 0, mau: 0 } });
    return { kho, chu: 'Uyên Huyết Đan tan trong miệng: máu hồi lại, độc và vết thương đều lành.' };
  }
  const [id, l] = khoa.split('|');
  const loai: PhamThat | 'dv' = l === 'dv' ? 'dv' : (Number(l) as PhamThat);
  let kho: Kho;
  if (loai === 'dv') {
    if ((k.danVan[id] ?? 0) < 1) return null;
    kho = { ...k, danVan: { ...k.danVan, [id]: k.danVan[id] - 1 } };
  } else {
    if ((k.tuiDan[id]?.[loai] ?? 0) < 1) return null;
    const t = [...k.tuiDan[id]] as [number, number, number, number];
    t[loai] -= 1;
    kho = { ...k, tuiDan: { ...k.tuiDan, [id]: t } };
  }
  const m = loai === 'dv' ? 4 : loai;
  const p = timDanPhuong(id);
  const giai = DAN_GIAI[id];
  if (id === 'hoi-nguyen-dan') return { kho, chu: `${p.ten}: chân nguyên +${HOI_NGUYEN[m]}.`, nguyen: HOI_NGUYEN[m] };
  if (giai) {
    if (giai.tt) {
      kho = hoiMau(kho, giai.hoi[m], luc);
      kho = datVuc(kho, { tt: { ...kho.vuc.tt, [giai.tt]: 0 } });
      return { kho, chu: `${p.ten}: ${TRANG_THAI[giai.tt].ten.toLowerCase()} đã được giải, hồi ${pt(giai.hoi[m])} máu.` };
    }
    kho = datVuc(kho, { tt: { ...kho.vuc.tt, hac: Math.max(0, kho.vuc.tt.hac - giai.hac![m]) } });
    return { kho, chu: `${p.ten}: tâm trí sáng lại, hắc hoá giảm ${giai.hac![m]}%.` };
  }
  if (p.uong?.loai !== 'hoi-mau') return null;
  kho = hoiMau(kho, p.uong.giaTri[m], luc);
  return { kho, chu: `${p.ten}: hồi ${pt(p.uong.giaTri[m])} máu.` };
}

// ---------- boss đánh theo lượt ----------

const timChieu = (b: Boss, id: string) => b.chieu.find((c) => c.id === id) ?? b.chieu[0];
/** Chọn chiêu cho lượt `n` (báo trước cho người chơi). */
function chonYDo(t: TranBoss, n: number, rng: () => number): string {
  const b = BOSS[t.boss];
  if (t.boss === 'ma-long' && !t.cuong && t.mau < t.mauMax * 0.5) return 'nghich-lan';
  if (t.boss === 'huyet-dang' && t.mau < t.mauMax * 0.6 && t.hoiCho <= 0) return 'hap-huyet';
  if (t.boss === 'hat-hau' && n % 6 === 0 && t.giap <= 0) return 'giap-hoa';
  if (n % 4 === 3) return b.chieu.find((c) => c.loai === 'lon')!.id;
  if (n % 5 === 0 || rng() < 0.15) return b.chieu.find((c) => c.loai === 'trang-thai')!.id;
  return 'thuong';
}
export function batDauTran(k: Kho, rng: () => number = Math.random, luc = Date.now()): Kho {
  const v = k.vuc;
  const d = diemVuc(k, v.viTri);
  if (!v.trong || d.loai !== 'boss' || !d.boss || v.tran || !bossConSong(k, d.id, luc)) return k;
  const b = BOSS[d.boss];
  const mauMax = Math.round(chuanVuc('khiHuyet', b.tang) * 8);
  const tran: TranBoss = { diem: d.id, boss: b.id, mau: mauMax, mauMax, luot: 0, yDo: 'thuong', anh: 'dung', giap: 0, cuong: false, hoiCho: 0, nhatKy: [] };
  tran.yDo = chonYDo(tran, 1, rng);
  return datVuc(k, { tran });
}
/** Sát thương 100% một đòn của người chơi lên boss (chưa tính giáp hoá, chưa nhân ngẫu nhiên). */
export function donChuanBoss(k: Kho, t: TranBoss, cs: 'luc' | 'thanThuc', luc = Date.now()): number {
  const b = BOSS[t.boss];
  const r = chiSoVuc(k, cs, luc) / Math.max(1, chuanVuc(cs, b.tang) * LUAT_VUC.heSoBoss);
  return (t.mauMax / b.soDon) * r ** 0.85 * b.khang[cs];
}
/** Sát thương một đòn thường của người chơi (có tính giáp hoá). */
export const satThuong = (k: Kho, t: TranBoss, cs: 'luc' | 'thanThuc', luc = Date.now()) => donChuanBoss(k, t, cs, luc) * (t.giap > 0 ? 0.5 : 1);
/** Hồ sơ chiến đấu của người chơi trong trận boss. */
export const hoSoBoss = (k: Kho, t: TranBoss, luc = Date.now()) => hoSoChien(k, chuanVuc('thanPhap', BOSS[t.boss].tang) * LUAT_VUC.heSoBoss, luc);
/** Tuyệt chiêu dùng được lượt này chưa. */
export const tuyetChieuBossSan = (k: Kho, t: TranBoss, luc = Date.now()) => tuyetChieuSan(hoSoBoss(k, t, luc), t.chien ?? chienMoi(), k.tuVi.canhGioi >= MO_O.tuyetChieu);
/** Sát thương một chiêu của boss lên người chơi (chưa tính đỡ đòn). */
export function satThuongBoss(k: Kho, t: TranBoss, chieu: Chieu, luc = Date.now()): number {
  if (!chieu.dmg) return 0;
  const b = BOSS[t.boss];
  const giap = (chuanVuc('phongNgu', b.tang) * LUAT_VUC.heSoBoss) / Math.max(1, chiSo(k, 'phongNgu', luc));
  return Math.min(0.6, chieu.dmg * giap ** 0.7 * (t.cuong ? 1.4 : 1)) * mauToiDa(k);
}
/** Linh thú xuất chiến còn sức không (đói thì không ra trận). */
export function thuRaTran(k: Kho, luc = Date.now()) {
  const t = thuXuatChien(k);
  return t && hieuLucThu(t, luc) > 0 ? t : null;
}
export type HanhDong = { loai: 'vo-ky' | 'tuyet-chieu' | 'thuong' | 'do' } | { loai: 'dan'; khoa: string };
export interface KetLuot {
  kho: Kho;
  ket: 'tiep' | 'thang' | 'chet';
  /** Các dòng tả nửa lượt này. */
  dong: string[];
  /** Chiêu boss vừa ra (để giao diện phát tiếng, đổi ảnh). */
  chieu: Chieu | null;
  nhan: string[];
  /** Linh thú vừa đánh / vừa đỡ. */
  thuDanh: boolean;
  thuDo: boolean;
  dinh: TrangThaiId[];
  /** Hiệu ứng hình ảnh của nửa lượt này (vệt chiêu, số sát thương…). */
  vfx: Vfx[];
}
/**
 * Nửa lượt của người chơi: ra đòn (hoặc thủ, hoặc dùng đan), linh thú có thể đánh theo.
 * Boss chưa đánh trả ngay: trận chuyển sang chờ boss (choBoss), giao diện đợi một nhịp rồi gọi bossDanh.
 */
export function nguoiDanh(k: Kho, hd: HanhDong, rng: () => number = Math.random, luc = Date.now()): KetLuot | null {
  const t0 = k.vuc.tran;
  if (!t0 || t0.choBoss) return null;
  const b = BOSS[t0.boss];
  let kho = k;
  const t: TranBoss = { ...t0, luot: t0.luot + 1, nhatKy: [...t0.nhatKy] };
  let st = t0.chien ?? chienMoi();
  const dong: string[] = [];
  const vfx: Vfx[] = [];
  if (hd.loai === 'dan') {
    const r = dungDanVuc(kho, hd.khoa, luc);
    if (!r) return null;
    kho = r.kho;
    st = dungDanTran(st, hoSoBoss(kho, t, luc), r.nguyen ?? 0);
    dong.push(r.chu);
  } else if (hd.loai === 'vo-ky' || hd.loai === 'tuyet-chieu' || hd.loai === 'thuong') {
    const hs = hoSoBoss(kho, t, luc);
    if (hd.loai === 'tuyet-chieu' && !tuyetChieuSan(hs, st, kho.tuVi.canhGioi >= MO_O.tuyetChieu)) return null;
    if (hd.loai === 'vo-ky' && !duNguyen(hs, st, 'vo-ky')) return null;
    const d = raDon(hs, st, hd.loai, (ngoai) => donChuanBoss(kho, t, ngoai ? 'luc' : 'thanThuc', luc), t.mauMax, t.giap > 0 ? 0.5 : 1, rng);
    st = d.st;
    t.mau = Math.max(0, t.mau - d.dmg);
    if (d.hoi > 0) kho = hoiMau(kho, d.hoi / mauToiDa(kho), luc);
    dong.push(...d.dong);
    if (t.giap > 0) dong.push('(Giáp hoá: chỉ được nửa.)');
    vfx.push(...d.vfx);
  } else {
    st = thuThe(st, hoSoBoss(kho, t, luc));
    dong.push('Ngươi thủ thế, chờ đòn. +1 Khí thế.');
  }
  const thu = thuRaTran(kho, luc);
  const thuDanh = !!thu && t.luot % LUAT_VUC.thuDanhMoi === 0 && t.mau > 0;
  const thuDo = !!thu && t.luot % LUAT_VUC.thuDoMoi === 0;
  if (thu && thuDanh) {
    const l = timLoaiThu(thu.loai);
    const dmg = Math.round((t.mauMax / b.soDon) * (0.35 + 0.45 * hieuLucThu(thu, luc)) * (1 + 0.15 * l.bac) * (0.9 + rng() * 0.2) * (t.giap > 0 ? 0.5 : 1));
    t.mau = Math.max(0, t.mau - dmg);
    dong.push(`${l.ten} lao vào cắn xé: −${dmg}.`);
    vfx.push({ loai: 'so', so: dmg, kieu: 'thuong', ben: 'dich' });
  }
  t.chien = st;
  if (t.mau <= 0) {
    const w = thangTran(kho, t, rng, luc);
    return { kho: w.kho, ket: 'thang', dong: [...dong, `${b.ten} gục xuống.`], chieu: null, nhan: w.nhan, thuDanh, thuDo: false, dinh: [], vfx };
  }
  t.choBoss = true;
  t.dangDo = hd.loai === 'do';
  t.thuDo = thuDo;
  t.dongNguoi = dong;
  return { kho: datVuc(kho, { tran: t }), ket: 'tiep', dong, chieu: null, nhan: [], thuDanh, thuDo: false, dinh: [], vfx };
}
/** Nửa lượt của boss: ra chiêu đã báo trước, trạng thái rút máu, rồi báo trước chiêu kế tiếp. */
export function bossDanh(k: Kho, rng: () => number = Math.random, luc = Date.now()): KetLuot | null {
  const t0 = k.vuc.tran;
  if (!t0 || !t0.choBoss) return null;
  const b = BOSS[t0.boss];
  let kho = k;
  const t: TranBoss = { ...t0, choBoss: false, nhatKy: [...t0.nhatKy] };
  const dong: string[] = [];
  const thu = thuRaTran(kho, luc);
  const thuDo = !!t.thuDo && !!thu;
  const dangDo = !!t.dangDo;
  const chieu = timChieu(b, t.yDo);
  const dinh: TrangThaiId[] = [];
  const vfx: Vfx[] = [];
  const hs = hoSoBoss(kho, t, luc);
  const dl = dauLuotDich(t.chien ?? chienMoi(), t.mauMax, hs);
  let st = dl.st;
  t.mau = Math.max(0, t.mau - dl.dmg);
  dong.push(...dl.dong);
  vfx.push(...dl.vfx);
  if (t.mau > 0 && !dl.choang) t.anh = chieu.anh;
  if (t.mau <= 0 || dl.choang) {
    // boss gục vì vết thương, hoặc choáng mất lượt: không ra chiêu
  } else if (chieu.loai === 'buff') {
    if (chieu.id === 'giap-hoa') t.giap = 2;
    if (chieu.id === 'nghich-lan') t.cuong = true;
    dong.push(`${b.ten} dùng ${chieu.ten}!${chieu.id === 'giap-hoa' ? ' Hai lượt tới chỉ nhận nửa sát thương.' : ' Nó đánh mạnh hơn hẳn.'}`);
  } else if (chieu.loai === 'hoi') {
    const hoi = Math.round(t.mauMax * 0.15);
    t.mau = Math.min(t.mauMax, t.mau + hoi);
    t.hoiCho = 4;
    dong.push(`${b.ten} dùng ${chieu.ten}: hồi ${hoi} máu.`);
  } else if (thuDo && thu) {
    dong.push(`${timLoaiThu(thu.loai).ten} lao ra đỡ trọn ${chieu.ten}!`);
  } else {
    const h = hungDon(hs, st, satThuongBoss(kho, t, chieu, luc) * (0.9 + rng() * 0.2) * (dangDo ? LUAT_VUC.doDon : 1), rng);
    st = h.st;
    vfx.push(...h.vfx);
    const dmg = h.dmg;
    kho = truMau(kho, dmg, luc);
    if (h.ne) dong.push(`${b.ten} dùng ${chieu.ten}, nhưng ngươi né được!`);
    else dong.push(`${b.ten} dùng ${chieu.ten}: ngươi mất ${dmg} máu.${dangDo ? ' (đã đỡ)' : ''}`, ...h.dong);
    if (chieu.loai === 'lon' && !h.ne) vfx.push({ loai: 'rung' });
    if (chieu.tt && !h.ne) {
      kho = datVuc(kho, { tt: themTrangThai(kho.vuc.tt, chieu.tt, dangDo ? 0.5 : 1) });
      for (const id of Object.keys(chieu.tt) as TrangThaiId[]) dinh.push(id);
    }
    if (dangDo && chieu.loai === 'lon') {
      const phan = Math.round(satThuong(kho, t, 'luc', luc) * 0.5);
      t.mau = Math.max(0, t.mau - phan);
      dong.push(`Đỡ trúng đòn lớn, ngươi phản lại: −${phan}.`);
    }
  }
  t.chien = st;
  if (t.giap > 0 && chieu.id !== 'giap-hoa') t.giap -= 1;
  if (t.hoiCho > 0 && chieu.id !== 'hap-huyet') t.hoiCho -= 1;
  const tk = tick(kho, luc);
  kho = tk.kho;
  if (tk.mat > 0) dong.push(`Độc và vết thương rút thêm ${tk.mat} máu.`);
  if (t.mau <= 0) {
    const w = thangTran(kho, t, rng, luc);
    return { kho: w.kho, ket: 'thang', dong: [...dong, `${b.ten} gục xuống.`], chieu, nhan: w.nhan, thuDanh: false, thuDo, dinh, vfx };
  }
  if (daChet(kho, luc)) return { kho: chet(kho, luc), ket: 'chet', dong, chieu, nhan: [], thuDanh: false, thuDo, dinh, vfx };
  t.yDo = chonYDo(t, t.luot + 1, rng);
  // nhật ký: mỗi lượt một mục (người chơi rồi boss), lượt mới nhất đứng đầu; giữ cả trận để kéo xem lại
  t.nhatKy = [`Lượt ${t.luot}: ${[...(t.dongNguoi ?? []), ...dong].join(' ')}`, ...t.nhatKy].slice(0, 60);
  t.dongNguoi = [];
  t.dangDo = false;
  t.thuDo = false;
  return { kho: datVuc(kho, { tran: t }), ket: 'tiep', dong, chieu: dl.choang ? null : chieu, nhan: [], thuDanh: false, thuDo, dinh, vfx };
}
/** Hạ boss: đồ rơi vào túi (Ma Long thì cất luôn, vì đáy vực cũng là lối thoát). */
function thangTran(k0: Kho, t: TranBoss, rng: () => number, luc: number): { kho: Kho; nhan: string[] } {
  const k = congLuyenThuc(k0, { voKy: true, tuyetChieu: true }, 6);
  const b = BOSS[t.boss];
  const lop = lopTang(b.tang);
  const roi: Record<string, number> = {};
  themTui(roi, 'linh-thach', Math.round(LUAT.kyNgo.linhThachGoc * LUAT.kyNgo.heSoCanhGioi ** canhGioiTang(b.tang) * 12));
  themTui(roi, VAT_LOP[lop], 3 + Math.floor(rng() * 3));
  if (lop < 2) themTui(roi, VAT_LOP[lop + 1], 1);
  themTui(roi, 'uyen-huyet-dan', 2);
  const r = ROI_BOSS[b.id];
  if (rng() < r.bua) themTui(roi, 'bua-vuc-tham', 1);
  const lanDau = !k.vuc.bossDiet[t.diem];
  if (b.id === 'ma-long' && (lanDau || rng() < 0.3)) themTui(roi, 'trai-tim-vuc-tham', 1);
  let kho = k;
  const nhan = chuTui(roi);
  if (rng() < r.lo && !kho.loDan.co.includes('lo-vuc-tham')) {
    kho = { ...kho, loDan: { ...kho.loDan, co: [...kho.loDan.co, 'lo-vuc-tham'] } };
    nhan.push('Lò Đan Vực Thẳm');
  }
  const tui = { ...kho.vuc.tui };
  for (const [id, n] of Object.entries(roi)) themTui(tui, id, n);
  kho = datVuc(kho, { tran: null, tui, bossDiet: { ...kho.vuc.bossDiet, [t.diem]: luc } });
  if (b.id === 'ma-long') kho = { ...catTui(kho), vuc: { ...catTui(kho).vuc, moc: t.diem } };
  return { kho, nhan };
}
/** Rút lui khỏi trận boss: lùi về điểm vừa đi, boss hồi đầy máu. */
export function luiTran(k: Kho): Kho {
  if (!k.vuc.tran) return k;
  return datVuc(k, { tran: null, viTri: k.vuc.truoc === k.vuc.viTri ? k.vuc.moc : k.vuc.truoc, truoc: k.vuc.viTri });
}
export const chieuBoss = (t: TranBoss, id: string) => timChieu(BOSS[t.boss], id);

// ---------- vật phẩm, đột phá ----------

/** Đốt một Bùa Vực Thẳm: một chỉ số ngẫu nhiên tăng mạnh vĩnh viễn (theo cảnh giới hiện tại). */
export function dotBua(k: Kho, rng: () => number = Math.random): { kho: Kho; chu: string } | null {
  if ((k.vatVuc['bua-vuc-tham'] ?? 0) < 1) return null;
  const cs = CHI_SO[Math.floor(rng() * CHI_SO.length)];
  const c = LUAT.chiSo;
  const tho = +(0.15 * c.goc * c.moiCanhGioi ** k.tuVi.canhGioi * (0.8 + rng() * 0.4)).toFixed(1);
  return {
    kho: { ...k, vatVuc: { ...k.vatVuc, 'bua-vuc-tham': k.vatVuc['bua-vuc-tham'] - 1 }, chiSoCong: { ...k.chiSoCong, [cs.id]: (k.chiSoCong[cs.id] ?? 0) + tho } },
    chu: `Bùa cháy thành tro: ${cs.ten} +${(tho * (cs.id === 'khiHuyet' ? c.heSoMau : 1)).toFixed(1)} vĩnh viễn.`,
  };
}
/** Vật phẩm Vực Thẳm cần cho lần đột phá lên cảnh giới `dich`. */
export const vatCanDotPha = (dich: number) => VUC_DOT_PHA[dich] ?? [];
/** Lò rơi từ boss: không bán ở phường thị. */
export const LO_VUC_THAM = LO_DAN.find((l) => l.id === 'lo-vuc-tham');
/** Linh thú đang ra trận: sức mạnh hiển thị. */
export const sucThu = (k: Kho) => {
  const t = thuXuatChien(k);
  return t ? chiSoThu(t).sucManh : 0;
};

/** Ước tỉ lệ thắng con quái đang gặp (mô phỏng nhanh nhiều trận tự đánh, không đổi kho). */
export function uocTiLeDanh(k: Kho, lan = 60, luc = Date.now()): number {
  const g = k.vuc.gap;
  const dich = dichQuai(k, luc);
  if (!g || !dich) return 0;
  const hs = hoSoChien(k, chuanVuc('thanPhap', diemVuc(k, g.diem).tang) * heSoQuaiTai(k, g.diem, g.langThang), luc);
  const thu = thuRaTran(k, luc);
  const thuTd = thu ? { ten: '', dmg: Math.round((dich.mauMax / SO_DON_QUAI) * (0.35 + 0.45 * hieuLucThu(thu, luc)) * (1 + 0.15 * timLoaiThu(thu.loai).bac)) } : null;
  // hạt cố định: cùng tình thế thì cùng con số, không nhảy theo từng lần vẽ lại
  const rng = rngHat(g.diem * 7919 + 17);
  let thang = 0;
  for (let i = 0; i < lan; i++) if (tuDanh(hs, dich, k.tuVi.canhGioi >= MO_O.tuyetChieu, thuTd, rng).thang) thang++;
  return thang / lan;
}
