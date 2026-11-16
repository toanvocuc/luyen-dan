// Du ngoạn và kỳ ngộ: bản đồ điểm nối đường, thể lực, sự kiện thử chỉ số, NPC. Thuần tính toán, không dính giao diện.
// Số cân bằng nằm ở LUAT.kyNgo (duLieu.ts); dữ liệu bản đồ, sự kiện và NPC nằm ngay trong file này.
import { CHI_SO, DAN_PHUONG, DUOC_LIEU, LUAT, TEN_PHAM, bacSo, timDanPhuong, type ChiSo, type PhamThat, type Tuoi } from './duLieu.ts';
import { chiSo, kyCho, mauHienTai, mauToiDa, tuLuyen, tuViCan, type Kho } from './kho.ts';

// ---------- dữ liệu ----------

export type Muc = keyof typeof LUAT.kyNgo.muc;
export const TEN_MUC: Record<Muc, string> = { de: 'Dễ', vua: 'Vừa', kho: 'Khó', hiem: 'Hiểm' };

/** Phần thưởng của một kết cục. Linh thạch tính theo heSo (xem LUAT.kyNgo); chỉ số cộng heSo × 1,5^cảnh giới điểm thô. */
export type Thuong =
  | { loai: 'linh-thach'; heSo: number }
  | { loai: 'duoc-lieu'; tuoi: Tuoi; so: number }
  | { loai: 'hat-giong'; so: number }
  | { loai: 'tu-vi'; phan: number }
  | { loai: 'khi-van'; tiLe: number }
  | { loai: 'tu-chat'; tiLe: number }
  | { loai: 'chi-so'; cs: ChiSo; heSo: number };

export interface KetCuc {
  /** Ảnh kể chuyện: 1 = cảnh mở đầu, 2 = kết tốt, 3 = kết xấu (public/hinh/ky-ngo/<anh>-N.jpg). */
  anh: 1 | 2 | 3;
  chu: string;
  thuong?: readonly Thuong[];
  /** Mất bấy nhiêu phần máu tối đa. */
  matMau?: number;
  /** Mất bấy nhiêu phần linh thạch đang có. */
  matLinhThach?: number;
}

/** Thứ phải bỏ ra để chọn lựa chọn này (chắc chắn thành). */
export type Can = { loai: 'dan'; id: string } | { loai: 'linh-thach'; phan: number };

export interface LuaChon {
  chu: string;
  /** Thử chỉ số: cộng các chỉ số này lại rồi so với chuẩn × độ khó. Không có = chắc chắn ra kết cục `thanh`. */
  kiem?: { chiSo: readonly ChiSo[]; muc: Muc };
  can?: Can;
  thanh: KetCuc;
  bai?: KetCuc;
}

export interface SuKien {
  id: string;
  ten: string;
  /** Tiền tố ảnh kể chuyện. */
  anh: string;
  mo: string;
  luaChon: readonly LuaChon[];
}

export const SU_KIEN: Record<string, SuKien> = {
  huou: {
    id: 'huou',
    ten: 'Linh lộc trúng tên',
    anh: 'huou',
    mo: 'Giữa rừng tùng cổ, một con linh lộc nằm gục bên gốc cây, mũi tên của kẻ săn nào đó còn cắm trên sườn. Nó ngước nhìn ngươi, hơi thở yếu dần.',
    luaChon: [
      {
        chu: 'Đút cho nó một viên Hồi Xuân Đan',
        can: { loai: 'dan', id: 'hoi-xuan-dan' },
        thanh: {
          anh: 2,
          chu: 'Dược lực lan khắp thân lộc. Nó gượng đứng dậy, cúi đầu thật thấp trước ngươi rồi lững thững đi vào sương. Tâm cảnh ngươi bỗng thông suốt lạ thường.',
          thuong: [{ loai: 'tu-vi', phan: 0.3 }, { loai: 'khi-van', tiLe: 0.35 }],
        },
      },
      {
        chu: 'Vận linh lực rút tên, cầm máu cho nó',
        kiem: { chiSo: ['thanThuc'], muc: 'vua' },
        thanh: {
          anh: 2,
          chu: 'Linh lực ngươi dẫn dắt khéo léo, vết thương khép miệng. Linh lộc dụi đầu vào tay ngươi rồi rời đi; chỗ nó vừa nằm lộ ra mấy gốc linh thảo.',
          thuong: [{ loai: 'duoc-lieu', tuoi: 1, so: 2 }, { loai: 'tu-vi', phan: 0.1 }],
        },
        bai: {
          anh: 3,
          chu: 'Linh lực mất khống chế, máu càng tuôn ra. Linh lộc run lên một hồi rồi tắt thở. Ngươi bị linh lực dội ngược, đành lặng lẽ thu lấy thịt và gạc của nó.',
          thuong: [{ loai: 'linh-thach', heSo: 1 }],
          matMau: 0.1,
        },
      },
      {
        chu: 'Kết liễu nó, lấy thịt và gạc',
        thanh: { anh: 3, chu: 'Ngươi ra tay dứt khoát. Thịt linh lộc bổ khí, gạc của nó bán được giá ở phường thị.', thuong: [{ loai: 'linh-thach', heSo: 1.5 }] },
      },
    ],
  },
  'yeu-lang': {
    id: 'yeu-lang',
    ten: 'Yêu lang giữ linh thảo',
    anh: 'yeu-lang',
    mo: 'Dưới vách đá, một con yêu lang lớn bằng con trâu đang cuộn mình ngủ quanh một gốc linh thảo tỏa ánh sáng nhạt. Một bên mắt nó hé mở.',
    luaChon: [
      {
        chu: 'Rút kiếm giao chiến',
        kiem: { chiSo: ['luc', 'phongNgu'], muc: 'kho' },
        thanh: {
          anh: 2,
          chu: 'Sau một hồi ác chiến, yêu lang gục xuống. Ngươi nhổ trọn gốc linh thảo, rễ còn vương linh khí.',
          thuong: [{ loai: 'duoc-lieu', tuoi: 2, so: 1 }, { loai: 'linh-thach', heSo: 1 }],
        },
        bai: { anh: 3, chu: 'Yêu lang vồ tới nhanh như gió. Ngươi chỉ kịp lùi lại, vạt áo rách toạc, máu chảy ròng ròng, đành bỏ chạy khỏi vách đá.', matMau: 0.35 },
      },
      {
        chu: 'Nín thở lẻn tới hái trộm',
        kiem: { chiSo: ['thanPhap'], muc: 'vua' },
        thanh: { anh: 2, chu: 'Ngươi lướt tới nhẹ như lá rơi, ngắt lấy linh thảo rồi rút lui trước khi con thú kịp đứng dậy.', thuong: [{ loai: 'duoc-lieu', tuoi: 1, so: 2 }] },
        bai: { anh: 3, chu: 'Một cành khô gãy dưới chân. Yêu lang bật dậy, móng vuốt cào qua lưng ngươi.', matMau: 0.35 },
      },
      { chu: 'Lặng lẽ rút lui', thanh: { anh: 1, chu: 'Ngươi tự biết sức mình, lùi dần ra xa. Linh thảo quý thật, nhưng mạng còn quý hơn.' } },
    ],
  },
  'lang-vuong': {
    id: 'lang-vuong',
    ten: 'Lang vương Hắc Phong',
    anh: 'yeu-lang',
    mo: 'Sâu trong Hắc Phong Uyên, lang vương mắt đỏ canh giữ một gốc huyết linh chi ngàn năm. Khí tức của nó đè nặng lên ngực ngươi, từng hơi thở cũng thấy nặng nề.',
    luaChon: [
      {
        chu: 'Liều mạng giao chiến',
        kiem: { chiSo: ['luc', 'phongNgu'], muc: 'hiem' },
        thanh: {
          anh: 2,
          chu: 'Lang vương đổ xuống như núi lở. Ngươi đoạt được huyết linh chi, lại hấp thu một phần yêu khí tinh thuần của nó, gân cốt mạnh lên trông thấy.',
          thuong: [{ loai: 'duoc-lieu', tuoi: 2, so: 2 }, { loai: 'linh-thach', heSo: 3 }, { loai: 'chi-so', cs: 'luc', heSo: 1 }],
        },
        bai: { anh: 3, chu: 'Một cú vồ của lang vương xé toạc hộ thể linh quang. Ngươi lăn khỏi miệng vực, thoi thóp bò ra khỏi Hắc Phong Uyên.', matMau: 0.6 },
      },
      {
        chu: 'Tìm cách đánh lạc hướng rồi đoạt thảo',
        kiem: { chiSo: ['thanPhap'], muc: 'kho' },
        thanh: { anh: 2, chu: 'Ngươi ném một khúc gỗ tẩm máu ra xa, lang vương lao theo. Chỉ trong một hơi thở, huyết linh chi đã nằm trong tay ngươi.', thuong: [{ loai: 'duoc-lieu', tuoi: 2, so: 1 }, { loai: 'linh-thach', heSo: 1.5 }] },
        bai: { anh: 3, chu: 'Lang vương không mắc mưu. Nó quay đầu lại đúng lúc ngươi vừa chạm tới gốc linh chi.', matMau: 0.6 },
      },
      { chu: 'Rút lui khỏi Hắc Phong Uyên', thanh: { anh: 1, chu: 'Ngươi nén lòng tham, lùi từng bước ra khỏi vực. Đợi tu vi cao hơn rồi hẵng quay lại.' } },
    ],
  },
  'cuop-duong': {
    id: 'cuop-duong',
    ten: 'Tán tu chặn đường',
    anh: 'cuop-duong',
    mo: 'Đang đi qua đèo, ba tán tu mặt mũi bặm trợn từ sau tảng đá nhảy ra chặn đường. Gã cầm đao cười khẩy: “Để lại linh thạch, tha cho ngươi cái mạng.”',
    luaChon: [
      {
        chu: 'Đánh một trận',
        kiem: { chiSo: ['luc', 'phongNgu'], muc: 'kho' },
        thanh: { anh: 2, chu: 'Ba tên cướp lần lượt ngã gục. Trong túi chúng còn chút linh thạch cướp được của người khác.', thuong: [{ loai: 'linh-thach', heSo: 2 }] },
        bai: { anh: 3, chu: 'Một chọi ba, ngươi bị đánh quỳ xuống. Chúng lục túi lấy đi một phần linh thạch rồi cười hô hố bỏ đi.', matMau: 0.6, matLinhThach: 0.2 },
      },
      {
        chu: 'Tìm đường tháo chạy',
        kiem: { chiSo: ['thanPhap'], muc: 'vua' },
        thanh: { anh: 1, chu: 'Ngươi nhân lúc chúng sơ hở, lao xuống sườn đèo, chạy một mạch không ngoái đầu lại.' },
        bai: { anh: 3, chu: 'Chưa chạy được mấy bước đã bị đuổi kịp. Một nhát đao chém qua vai, túi linh thạch cũng bị giật mất một phần.', matMau: 0.35, matLinhThach: 0.2 },
      },
      {
        chu: 'Nộp linh thạch cho yên chuyện',
        can: { loai: 'linh-thach', phan: 0.15 },
        thanh: { anh: 3, chu: 'Ngươi ném túi linh thạch xuống đất. Chúng nhặt lấy, cười cợt rồi tránh đường.' },
      },
    ],
  },
  'dong-phu-co': {
    id: 'dong-phu-co',
    ten: 'Động phủ cổ',
    anh: 'dong-phu-co',
    mo: 'Sau lớp dây leo là một cánh cửa đá cổ, mặt khắc trận đồ tròn còn le lói linh quang. Hẳn là động phủ của vị tiền bối nào đó đã tọa hóa từ lâu.',
    luaChon: [
      {
        chu: 'Dò tìm sơ hở của trận pháp',
        kiem: { chiSo: ['thanThuc'], muc: 'kho' },
        thanh: {
          anh: 2,
          chu: 'Trận văn lần lượt tắt. Cửa đá trượt mở, bên trong là kệ ngọc giản và mấy vò thuốc còn niêm kín.',
          thuong: [{ loai: 'linh-thach', heSo: 2.5 }, { loai: 'duoc-lieu', tuoi: 2, so: 1 }, { loai: 'tu-chat', tiLe: 0.3 }],
        },
        bai: { anh: 3, chu: 'Trận pháp bị kích phát, một luồng lôi quang quật ngươi văng ra khỏi bậc đá.', matMau: 0.35 },
      },
      {
        chu: 'Dùng sức phá cửa',
        kiem: { chiSo: ['luc'], muc: 'kho' },
        thanh: { anh: 2, chu: 'Cửa đá vỡ toang. Nhiều thứ bên trong đã nát theo, ngươi chỉ cứu được ít linh thạch và dược liệu.', thuong: [{ loai: 'linh-thach', heSo: 1.5 }, { loai: 'duoc-lieu', tuoi: 1, so: 2 }] },
        bai: { anh: 3, chu: 'Trận pháp phản kích dữ dội, ngươi trọng thương văng xa mấy trượng.', matMau: 0.6 },
      },
      { chu: 'Ghi nhớ chỗ này rồi rời đi', thanh: { anh: 1, chu: 'Tu vi chưa đủ, ngươi không dám mạo hiểm. Cánh cửa đá vẫn lặng lẽ ở đó.' } },
    ],
  },
  'loi-van': {
    id: 'loi-van',
    ten: 'Lôi vân tụ đỉnh',
    anh: 'loi-van',
    mo: 'Mây đen cuộn trên đỉnh núi, sét giáng liên hồi vào cây cổ thụ trên chóp. Lôi kích mộc, thứ mà luyện khí sư nào cũng thèm khát, đang thành hình.',
    luaChon: [
      {
        chu: 'Xông lên giữa cơn giông',
        kiem: { chiSo: ['khiHuyet'], muc: 'kho' },
        thanh: {
          anh: 2,
          chu: 'Ngươi đội sét leo lên, bẻ được cành lôi kích mộc còn nổ lách tách. Lôi khí thấm vào kinh mạch, thân thể rắn rỏi hơn hẳn.',
          thuong: [{ loai: 'linh-thach', heSo: 2 }, { loai: 'chi-so', cs: 'khiHuyet', heSo: 1.5 }],
        },
        bai: { anh: 3, chu: 'Một tia sét giáng ngay bên cạnh. Ngươi bị hất văng xuống sườn núi, áo quần cháy xém.', matMau: 0.6 },
      },
      { chu: 'Chờ cơn giông tan', thanh: { anh: 2, chu: 'Mây tan, ngươi lên đỉnh nhặt được mấy mảnh cành vụn. Không bằng cả cành, nhưng bán cũng được giá.', thuong: [{ loai: 'linh-thach', heSo: 0.8 }] } },
    ],
  },
};

export type LoaiDiem = 'cong' | 'ky-ngo' | 'linh-dia' | 'npc' | 'hiem-dia';
export interface Diem {
  id: number;
  ten: string;
  /** Ảnh địa điểm: public/hinh/ban-do/<anh>.png */
  anh: string;
  /** Vị trí trên bản đồ, theo phần trăm bề ngang / bề dọc. */
  x: number;
  y: number;
  loai: LoaiDiem;
  /** Những sự kiện có thể xảy ra ở đây. */
  suKien?: readonly string[];
  npc?: string;
}
export interface BanDo {
  id: string;
  ten: string;
  /** Cảnh giới thấp nhất được vào; cũng là cảnh giới "chuẩn" để tính độ khó và phần thưởng của vùng. */
  canhGioi: number;
  /** Tầng chuẩn của vùng: tu sĩ ở đúng cảnh giới và tầng này, chỉ số bình thường, có 50% thành ở độ khó Vừa. */
  tangChuan: number;
  nen: string;
  diem: readonly Diem[];
  duong: readonly (readonly [number, number])[];
}

export const BAN_DO: BanDo = {
  id: 'thanh-van-son',
  ten: 'Thanh Vân sơn',
  canhGioi: 1,
  tangChuan: 5,
  nen: 'nen-thanh-van',
  diem: [
    { id: 0, ten: 'Làng chân núi', anh: 'lang-chan-nui', x: 50, y: 91, loai: 'cong' },
    { id: 1, ten: 'Rừng Tùng Cổ', anh: 'rung-cay', x: 22, y: 79, loai: 'ky-ngo', suKien: ['huou'] },
    { id: 2, ten: 'Rừng Trúc', anh: 'rung-truc', x: 78, y: 78, loai: 'ky-ngo', suKien: ['huou', 'cuop-duong'] },
    { id: 3, ten: 'Đèo Hắc Phong', anh: 'deo-nui', x: 50, y: 67, loai: 'ky-ngo', suKien: ['cuop-duong'] },
    { id: 4, ten: 'Ruộng Linh Thảo', anh: 'ruong-thuoc', x: 18, y: 59, loai: 'linh-dia' },
    { id: 5, ten: 'Đình Vọng Hồ', anh: 'dinh-ho', x: 82, y: 60, loai: 'npc', npc: 'lao-gia' },
    { id: 6, ten: 'Vách Lang Nha', anh: 'vach-da', x: 36, y: 48, loai: 'ky-ngo', suKien: ['yeu-lang'] },
    { id: 7, ten: 'Rừng Phong Ảnh', anh: 'rung-cay', x: 70, y: 45, loai: 'ky-ngo', suKien: ['huou', 'yeu-lang'] },
    { id: 8, ten: 'Động Cổ', anh: 'dong-co', x: 18, y: 32, loai: 'ky-ngo', suKien: ['dong-phu-co'] },
    { id: 9, ten: 'Thanh Vân Tông', anh: 'thanh-van-tong', x: 54, y: 29, loai: 'npc', npc: 'nu-tu' },
    { id: 10, ten: 'Đỉnh Lôi Minh', anh: 'dinh-loi', x: 84, y: 25, loai: 'ky-ngo', suKien: ['loi-van'] },
    { id: 11, ten: 'Hắc Phong Uyên', anh: 'hiem-dia', x: 34, y: 11, loai: 'hiem-dia', suKien: ['lang-vuong'] },
  ],
  duong: [
    [0, 1], [0, 2], [0, 3], [1, 3], [1, 4], [2, 3], [2, 5], [3, 6], [3, 7], [4, 6],
    [5, 7], [6, 8], [6, 9], [7, 9], [7, 10], [8, 11], [9, 11], [9, 10],
  ],
};

export interface Npc {
  id: string;
  ten: string;
  danhHieu: string;
  anh: string;
  /** Lời nói khi trò chuyện, chọn ngẫu nhiên. */
  loi: readonly string[];
  /** Đan yêu thích: tặng loại này được gấp đôi hảo cảm. */
  thich: string;
  /** Độ khó khi tỷ thí (Lực + Phòng ngự). */
  tyThi: Muc;
}
export const NPC: Record<string, Npc> = {
  'lao-gia': {
    id: 'lao-gia',
    ten: 'Hạc Ông',
    danhHieu: 'Lão nhân câu cá bên hồ',
    anh: 'nv-lao-gia',
    loi: [
      'Người trẻ à, đường tu tiên dài lắm, đừng vội.',
      'Hồ này cá chẳng cắn câu, nhưng lão cũng đâu cần cá.',
      'Nghe nói trên Đỉnh Lôi Minh, mỗi lần giông tới lại có lôi kích mộc thành hình. Khí huyết yếu thì đừng lên.',
      'Động cổ phía tây có trận pháp, thần thức kém thì đừng động vào.',
      'Đan tốt hay xấu, ngửi là biết. Ngươi có đan ngon thì để lão nếm thử.',
    ],
    thich: 'hoi-xuan-dan',
    tyThi: 'kho',
  },
  'nu-tu': {
    id: 'nu-tu',
    ten: 'Lâm Thanh Tuyết',
    danhHieu: 'Đệ tử Thanh Vân Tông',
    anh: 'nv-nu-tu',
    loi: [
      'Thanh Vân Tông không nhận kẻ lười biếng.',
      'Bên Vách Lang Nha có yêu lang, đệ tử bổn môn bị thương mấy người rồi.',
      'Hắc Phong Uyên ở phía bắc, tu vi chưa đủ thì đừng bén mảng.',
      'Đèo Hắc Phong dạo này lắm tán tu chặn đường, đi qua nhớ cẩn thận.',
      'Ngươi là đan sư sao? Bổn môn lúc nào cũng thiếu Tụ Khí Đan.',
    ],
    thich: 'tu-khi-dan',
    tyThi: 'vua',
  },
};

// ---------- tiện ích ----------

function bam(chu: string): number {
  let h = 2166136261;
  for (let i = 0; i < chu.length; i++) h = Math.imul(h ^ chu.charCodeAt(i), 16777619);
  return h >>> 0;
}
const kep = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const timDiem = (id: number) => BAN_DO.diem.find((d) => d.id === id) ?? BAN_DO.diem[0];
export const keNhau = (a: number, b: number) => BAN_DO.duong.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
export const duocVao = (k: Kho) => k.tuVi.canhGioi >= BAN_DO.canhGioi;

// ---------- thể lực, máu ----------

export function theLucHienTai(k: Kho, luc = Date.now()): number {
  const c = LUAT.kyNgo;
  return Math.min(c.theLucToiDa, k.theLuc.diem + Math.max(0, luc - k.theLuc.luc) / 1000 / c.giayHoiTheLuc);
}
/** Còn bao nhiêu giây nữa thì đủ thể lực cho một bước. */
export function giayDuBuoc(k: Kho, luc = Date.now()): number {
  const c = LUAT.kyNgo;
  return Math.max(0, Math.ceil((c.theLucMoiBuoc - theLucHienTai(k, luc)) * c.giayHoiTheLuc));
}
/** Máu đủ để du ngoạn chưa. */
export const duMau = (k: Kho, luc = Date.now()) => mauHienTai(k, luc) >= mauToiDa(k) * LUAT.kyNgo.mauVao;

// ---------- bản đồ ----------

/** Điểm nhìn thấy được: đã đặt chân tới, hoặc nằm kề một điểm đã tới. Còn lại bị sương che. */
export function daThay(k: Kho, id: number): boolean {
  return k.banDo.daDen.includes(id) || k.banDo.daDen.some((d) => keNhau(d, id));
}

/** Sự kiện đang chờ ở một điểm trong kỳ này (null = không có, hoặc đã giải quyết rồi). */
export function suKienTai(k: Kho, id: number, luc = Date.now()): SuKien | null {
  const d = timDiem(id);
  if (!d.suKien?.length || (d.loai !== 'ky-ngo' && d.loai !== 'hiem-dia')) return null;
  const ky = kyCho(luc);
  if (k.banDo.xong[id] === ky) return null;
  const goc = `${k.nhanVat?.ten ?? ''}|${ky}|${id}`;
  if (d.loai === 'ky-ngo' && (bam(goc) % 10000) / 10000 >= LUAT.kyNgo.coKyNgo) return null;
  return SU_KIEN[d.suKien[bam(goc + '|loai') % d.suKien.length]] ?? null;
}
/** Linh địa / NPC tỷ thí… đã dùng trong kỳ này chưa. */
export const daXongKy = (k: Kho, id: number, luc = Date.now()) => k.banDo.xong[id] === kyCho(luc);

/** Vào vùng: bắt đầu từ cổng (điểm 0). */
export function vaoBanDo(k: Kho): Kho {
  return { ...k, banDo: { ...k.banDo, viTri: 0, daDen: k.banDo.daDen.includes(0) ? k.banDo.daDen : [...k.banDo.daDen, 0] } };
}

/** Đi sang một điểm kề bên. Không đi được (không kề, thiếu thể lực, thương nặng) thì trả lại đúng kho cũ. */
export function diToi(k: Kho, id: number, luc = Date.now()): Kho {
  const c = LUAT.kyNgo;
  const tl = theLucHienTai(k, luc);
  if (!keNhau(k.banDo.viTri, id) || tl < c.theLucMoiBuoc || !duMau(k, luc)) return k;
  return {
    ...k,
    theLuc: { diem: tl - c.theLucMoiBuoc, luc },
    banDo: { ...k.banDo, viTri: id, daDen: k.banDo.daDen.includes(id) ? k.banDo.daDen : [...k.banDo.daDen, id] },
  };
}

// ---------- thử chỉ số ----------

/**
 * Chỉ số "chuẩn" của vùng: của một tu sĩ bình thường (không bẩm sinh, không đan) ở cảnh giới và tầng chuẩn của vùng.
 * Tính theo vùng chứ không theo người chơi, để người chơi lên cảnh giới thì kỳ ngộ trong vùng dễ dần.
 */
export function chiSoChuan(_k: Kho, cs: ChiSo): number {
  const c = LUAT.chiSo;
  return c.goc * c.moiCanhGioi ** BAN_DO.canhGioi * (1 + c.moiTang * (BAN_DO.tangChuan - 1)) * (cs === 'khiHuyet' ? c.heSoMau : 1);
}
/** Tỉ lệ thành của một lần thử chỉ số. */
export function tiLeKiem(k: Kho, kiem: NonNullable<LuaChon['kiem']>): number {
  const c = LUAT.kyNgo;
  const co = kiem.chiSo.reduce((s, cs) => s + chiSo(k, cs), 0);
  const can = kiem.chiSo.reduce((s, cs) => s + chiSoChuan(k, cs), 0) * c.muc[kiem.muc];
  const r = co / Math.max(1, can);
  const p = r ** c.mu / (r ** c.mu + 1) + ((k.nhanVat?.khiVan ?? 50) - 50) * c.khiVan;
  return kep(p, c.tiLeMin, c.tiLeMax);
}
export const tenChiSo = (ds: readonly ChiSo[]) => ds.map((cs) => CHI_SO.find((c) => c.id === cs)!.ten).join(' + ');

/** Viên đan sẽ bị lấy đi khi chọn lựa chọn cần đan: lấy phẩm thấp nhất đang có. */
function vienDanCan(k: Kho, id: string): PhamThat | 'dv' | null {
  const t = k.tuiDan[id];
  if (t) for (const ph of [0, 1, 2, 3] as PhamThat[]) if (t[ph] > 0) return ph;
  return (k.danVan[id] ?? 0) > 0 ? 'dv' : null;
}
/** Lựa chọn này chọn được không; không thì nói vì sao. */
export function xetCan(k: Kho, can: Can | undefined): { duoc: boolean; chu: string } {
  if (!can) return { duoc: true, chu: '' };
  if (can.loai === 'dan') {
    const ph = vienDanCan(k, can.id);
    const ten = timDanPhuong(can.id).ten;
    return ph === null ? { duoc: false, chu: `Cần 1 ${ten} (không có)` } : { duoc: true, chu: `Mất 1 ${ten} ${ph === 'dv' ? 'đan văn' : TEN_PHAM[ph].toLowerCase()}` };
  }
  return { duoc: true, chu: `Mất ${Math.floor(k.linhThach * can.phan)} linh thạch` };
}

// ---------- giải quyết sự kiện ----------

export interface KetQuaKyNgo {
  thanh: boolean;
  /** Có thử chỉ số không (để giao diện nói "thành"/"bại"). */
  coKiem: boolean;
  ketCuc: KetCuc;
  nhan: string[];
  mat: string[];
  /** Máu về 0. */
  trongThuong: boolean;
}

/** Phần thưởng theo cấp của vùng (không theo người chơi), để không cày vùng thấp lấy thưởng to. */
export const linhThachThuong = (_k: Kho, heSo: number) => Math.round(heSo * LUAT.kyNgo.linhThachGoc * LUAT.kyNgo.heSoCanhGioi ** BAN_DO.canhGioi);

/** Cộng phần thưởng vào kho, trả về câu tả từng món. */
function nhanThuong(k: Kho, ds: readonly Thuong[], rng: () => number): { kho: Kho; nhan: string[] } {
  let kho = k;
  const nhan: string[] = [];
  for (const t of ds) {
    if (t.loai === 'linh-thach') {
      const n = linhThachThuong(kho, t.heSo);
      kho = { ...kho, linhThach: kho.linhThach + n };
      nhan.push(`${n} linh thạch`);
    } else if (t.loai === 'duoc-lieu') {
      const duocLieu = { ...kho.duocLieu };
      const gom = new Map<string, number>();
      for (let i = 0; i < t.so; i++) {
        const d = DUOC_LIEU[Math.floor(rng() * DUOC_LIEU.length)];
        const c = [...duocLieu[d.id]] as [number, number, number];
        c[t.tuoi] += 1;
        duocLieu[d.id] = c;
        gom.set(d.ten, (gom.get(d.ten) ?? 0) + 1);
      }
      kho = { ...kho, duocLieu };
      for (const [ten, n] of gom) nhan.push(`${n} ${ten} ${['10', '100', '1000'][t.tuoi]} năm`);
    } else if (t.loai === 'hat-giong') {
      const hatGiong = { ...kho.hatGiong };
      for (let i = 0; i < t.so; i++) {
        const d = DUOC_LIEU[Math.floor(rng() * DUOC_LIEU.length)];
        hatGiong[d.id] = (hatGiong[d.id] ?? 0) + 1;
        nhan.push(`1 hạt ${d.ten}`);
      }
      kho = { ...kho, hatGiong };
    } else if (t.loai === 'tu-vi') {
      const them = Math.round(tuViCan(kho.tuVi.tang, kho.tuVi.canhGioi) * t.phan);
      kho = tuLuyen({ ...kho, tuVi: { ...kho.tuVi, diem: kho.tuVi.diem + them } }, 0);
      nhan.push(`${them} tu vi`);
    } else if (t.loai === 'khi-van' || t.loai === 'tu-chat') {
      const truong = t.loai === 'khi-van' ? 'khiVan' : 'tuChat';
      if (kho.nhanVat && rng() < t.tiLe && kho.nhanVat[truong] < 100) {
        kho = { ...kho, nhanVat: { ...kho.nhanVat, [truong]: kho.nhanVat[truong] + 1 } };
        nhan.push(`${t.loai === 'khi-van' ? 'Khí vận' : 'Tư chất'} +1 vĩnh viễn`);
      }
    } else {
      const tho = t.heSo * LUAT.chiSo.moiCanhGioi ** BAN_DO.canhGioi;
      kho = { ...kho, chiSoCong: { ...kho.chiSoCong, [t.cs]: (kho.chiSoCong[t.cs] ?? 0) + tho } };
      nhan.push(`${CHI_SO.find((c) => c.id === t.cs)!.ten} +${(tho * (t.cs === 'khiHuyet' ? LUAT.chiSo.heSoMau : 1)).toFixed(1)} vĩnh viễn`);
    }
  }
  return { kho, nhan };
}

/** Mất máu theo phần máu tối đa; trả về kho mới và lượng máu đã mất. */
export function matMau(k: Kho, phan: number, luc = Date.now()): { kho: Kho; mat: number } {
  const toiDa = mauToiDa(k);
  const nay = mauHienTai(k, luc);
  const mat = Math.min(nay, Math.round(toiDa * phan));
  return { kho: { ...k, mau: { thieu: toiDa - nay + mat, luc } }, mat };
}

/** Người chơi chọn lựa chọn thứ `i` của sự kiện đang chờ ở điểm `id`. Trả về null nếu không chọn được. */
export function chonLuaChon(k: Kho, id: number, i: number, rng: () => number = Math.random, luc = Date.now()): { kho: Kho; kq: KetQuaKyNgo } | null {
  const sk = suKienTai(k, id, luc);
  const lc = sk?.luaChon[i];
  if (!sk || !lc || !xetCan(k, lc.can).duoc) return null;
  let kho: Kho = { ...k, banDo: { ...k.banDo, xong: { ...k.banDo.xong, [id]: kyCho(luc) } } };
  const mat: string[] = [];
  if (lc.can?.loai === 'dan') {
    const ph = vienDanCan(kho, lc.can.id)!;
    if (ph === 'dv') kho = { ...kho, danVan: { ...kho.danVan, [lc.can.id]: kho.danVan[lc.can.id] - 1 } };
    else {
      const t = [...kho.tuiDan[lc.can.id]] as [number, number, number, number];
      t[ph] -= 1;
      kho = { ...kho, tuiDan: { ...kho.tuiDan, [lc.can.id]: t } };
    }
    mat.push(`1 ${timDanPhuong(lc.can.id).ten}`);
  } else if (lc.can?.loai === 'linh-thach') {
    const n = Math.floor(kho.linhThach * lc.can.phan);
    kho = { ...kho, linhThach: kho.linhThach - n };
    mat.push(`${n} linh thạch`);
  }
  const thanh = lc.kiem ? rng() < tiLeKiem(k, lc.kiem) : true;
  const ketCuc = thanh || !lc.bai ? lc.thanh : lc.bai;
  const { kho: sauThuong, nhan } = nhanThuong(kho, ketCuc.thuong ?? [], rng);
  kho = sauThuong;
  if (ketCuc.matLinhThach) {
    const n = Math.floor(kho.linhThach * ketCuc.matLinhThach);
    kho = { ...kho, linhThach: kho.linhThach - n };
    mat.push(`${n} linh thạch`);
  }
  if (ketCuc.matMau) {
    const r = matMau(kho, ketCuc.matMau, luc);
    kho = r.kho;
    mat.push(`${r.mat} máu`);
  }
  return { kho, kq: { thanh, coKiem: !!lc.kiem, ketCuc, nhan, mat, trongThuong: mauHienTai(kho, luc) <= 0 } };
}

// ---------- linh địa ----------

/** Hái thuốc ở linh địa, mỗi kỳ một lần: hai phần thuốc 10 năm, có khi thêm một phần 100 năm và một hạt giống. */
export function haiLinhDia(k: Kho, id: number, rng: () => number = Math.random, luc = Date.now()): { kho: Kho; nhan: string[] } | null {
  if (timDiem(id).loai !== 'linh-dia' || daXongKy(k, id, luc)) return null;
  const ds: Thuong[] = [{ loai: 'duoc-lieu', tuoi: 0, so: 2 }];
  if (rng() < 0.4) ds.push({ loai: 'duoc-lieu', tuoi: 1, so: 1 });
  if (rng() < 0.35) ds.push({ loai: 'hat-giong', so: 1 });
  const { kho, nhan } = nhanThuong({ ...k, banDo: { ...k.banDo, xong: { ...k.banDo.xong, [id]: kyCho(luc) } } }, ds, rng);
  return { kho, nhan };
}

// ---------- NPC ----------

export const HAO_CAM_TOI_DA = 100;
export const npcCua = (k: Kho, id: string) => k.npc[id] ?? { haoCam: 0, kyNoi: -1, kyTyThi: -1 };
const datNpc = (k: Kho, id: string, sua: Partial<Kho['npc'][string]>): Kho => ({ ...k, npc: { ...k.npc, [id]: { ...npcCua(k, id), ...sua } } });

/** Trò chuyện: lần đầu mỗi kỳ được thêm chút hảo cảm. */
export function troChuyen(k: Kho, id: string, rng: () => number = Math.random, luc = Date.now()): { kho: Kho; loi: string; them: number } {
  const n = NPC[id];
  const nc = npcCua(k, id);
  const ky = kyCho(luc);
  const them = nc.kyNoi === ky ? 0 : 3;
  const loi = n.loi[Math.floor(rng() * n.loi.length)];
  return { kho: datNpc(k, id, { haoCam: Math.min(HAO_CAM_TOI_DA, nc.haoCam + them), kyNoi: ky }), loi, them };
}

/** Tặng một viên đan được bao nhiêu hảo cảm: phẩm càng cao, đan bậc càng cao càng nhiều; đúng loại NPC thích thì gấp đôi. */
export function haoCamTang(npcId: string, phuongId: string, loai: PhamThat | 'dv'): number {
  const goc = [2, 4, 8, 14, 25][loai === 'dv' ? 4 : loai];
  const p = timDanPhuong(phuongId);
  return Math.round(goc * (1 + 0.5 * Math.max(0, bacSo(p) - 1)) * (NPC[npcId].thich === phuongId ? 2 : 1));
}
export function tangDan(k: Kho, id: string, phuongId: string, loai: PhamThat | 'dv'): Kho {
  const nc = npcCua(k, id);
  let kho: Kho;
  if (loai === 'dv') {
    if ((k.danVan[phuongId] ?? 0) < 1) return k;
    kho = { ...k, danVan: { ...k.danVan, [phuongId]: k.danVan[phuongId] - 1 } };
  } else {
    if ((k.tuiDan[phuongId]?.[loai] ?? 0) < 1) return k;
    const t = [...k.tuiDan[phuongId]] as [number, number, number, number];
    t[loai] -= 1;
    kho = { ...k, tuiDan: { ...k.tuiDan, [phuongId]: t } };
  }
  return datNpc(kho, id, { haoCam: Math.min(HAO_CAM_TOI_DA, nc.haoCam + haoCamTang(id, phuongId, loai)) });
}
/** Các viên đan trong túi tặng được (mọi phẩm), phẩm cao đứng trước. */
export function dsDanTang(k: Kho): { phuongId: string; loai: PhamThat | 'dv'; co: number }[] {
  const ra: { phuongId: string; loai: PhamThat | 'dv'; co: number }[] = [];
  for (const p of DAN_PHUONG) {
    if ((k.danVan[p.id] ?? 0) > 0) ra.push({ phuongId: p.id, loai: 'dv', co: k.danVan[p.id] });
    for (const ph of [3, 2, 1, 0] as PhamThat[]) if ((k.tuiDan[p.id]?.[ph] ?? 0) > 0) ra.push({ phuongId: p.id, loai: ph, co: k.tuiDan[p.id][ph] });
  }
  return ra;
}

export const KIEM_TY_THI = ['luc', 'phongNgu'] as const;
export const coTheTyThi = (k: Kho, id: string, luc = Date.now()) => npcCua(k, id).kyTyThi !== kyCho(luc);
/** Tỷ thí (mỗi kỳ một lần): thắng được tu vi và hảo cảm; thua mất một ít máu, không bao giờ chết. */
export function tyThi(k: Kho, id: string, rng: () => number = Math.random, luc = Date.now()): { kho: Kho; thang: boolean; nhan: string[]; mat: string[] } | null {
  if (!coTheTyThi(k, id, luc)) return null;
  const n = NPC[id];
  const nc = npcCua(k, id);
  const thang = rng() < tiLeKiem(k, { chiSo: KIEM_TY_THI, muc: n.tyThi });
  let kho = datNpc(k, id, { kyTyThi: kyCho(luc), haoCam: Math.min(HAO_CAM_TOI_DA, nc.haoCam + (thang ? 5 : 2)) });
  if (thang) {
    const r = nhanThuong(kho, [{ loai: 'tu-vi', phan: n.tyThi === 'kho' ? 0.35 : 0.2 }], rng);
    return { kho: r.kho, thang, nhan: [...r.nhan, `Hảo cảm +5`], mat: [] };
  }
  // tỷ thí là luận võ: không để người chơi tụt xuống dưới 1 máu
  const conLai = mauHienTai(kho, luc);
  const r = matMau(kho, Math.min(0.15, Math.max(0, (conLai - 1) / mauToiDa(kho))), luc);
  return { kho: r.kho, thang, nhan: ['Hảo cảm +2'], mat: r.mat > 0 ? [`${r.mat} máu`] : [] };
}
