// Du ngoạn và kỳ ngộ: bản đồ điểm nối đường, thể lực, sự kiện thử chỉ số, NPC. Thuần tính toán, không dính giao diện.
// Số cân bằng nằm ở LUAT.kyNgo (duLieu.ts); dữ liệu bản đồ, sự kiện và NPC nằm ngay trong file này.
import { CHI_SO, DAN_PHUONG, DUOC_LIEU, LUAT, TEN_PHAM, bacSo, timDanPhuong, type ChiSo, type PhamThat, type Tuoi } from './duLieu.ts';
import { chiSo, coLeThanDay, dangMatHon, kyCho, mauHienTai, mauToiDa, tuLuyen, tuViCan, type Kho } from './kho.ts';
import { tacDungThu } from './linhThu.ts';

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
  /** Ảnh kể chuyện: public/hinh/ky-ngo/<anh>-N.webp. Sự kiện một bước: 1 = mở đầu, 2 = kết tốt, 3 = kết xấu. */
  anh: number;
  chu: string;
  thuong?: readonly Thuong[];
  /** Mất bấy nhiêu phần máu tối đa. */
  matMau?: number;
  /** Mất bấy nhiêu phần linh thạch đang có. */
  matLinhThach?: number;
  /** Mất bấy nhiêu điểm thể lực. */
  matTheLuc?: number;
  /** Đổi hảo cảm với nhân vật của sự kiện (SuKien.nv). */
  haoCam?: number;
  /** Chưa hết: còn bước này (khoá trong SuKien.buoc). */
  tiep?: string;
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

/** Một bước tiếp theo của kỳ ngộ nhiều bước. */
export interface Buoc {
  anh: number;
  mo: string;
  luaChon: readonly LuaChon[];
}

export type TiengGap = 'cuop' | 'tien-nu' | 'yeu-thu' | 'ma' | 'ky-ngo';

export interface SuKien {
  id: string;
  ten: string;
  /** Tiền tố ảnh kể chuyện. */
  anh: string;
  /** Nhân vật trong truyện (khoá trong NHAN_VAT hoặc NPC): hiện chân dung, nhận hảo cảm. */
  nv?: string;
  /** Tiếng báo khi kỳ ngộ mở ra (mặc định: kỳ ngộ thường). */
  tieng?: TiengGap;
  mo: string;
  luaChon: readonly LuaChon[];
  buoc?: Readonly<Record<string, Buoc>>;
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
    tieng: 'yeu-thu',
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
    tieng: 'yeu-thu',
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
    tieng: 'cuop',
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
  // ---------- kỳ ngộ nhiều bước, xoay quanh các nữ nhân vật ----------
  'ho-ly': {
    id: 'ho-ly',
    tieng: 'tien-nu',
    ten: 'Hồ ly dưới trăng',
    anh: 'ho-ly',
    nv: 'ho-ly',
    mo: 'Đêm trăng, bên dòng suối giữa rừng trúc, một thiếu nữ tóc bạc ngồi ôm gối khóc thút thít. Cổ chân nàng rướm máu, nhưng cái bóng in dưới nước lại có thêm một chiếc đuôi xù.',
    luaChon: [
      {
        chu: 'Lại gần hỏi han, băng bó cho nàng',
        thanh: {
          anh: 1,
          chu: 'Nàng giật mình lùi lại, rồi rụt rè chìa chân ra. “Đa tạ… ta tên Mị Nương.” Chưa kịp nói thêm, trong rừng đã vang lên tiếng chuông đồng lanh lảnh.',
          haoCam: 5,
          tiep: 'dao-si',
        },
      },
      {
        chu: 'Vận thần thức nhìn thấu chân thân',
        kiem: { chiSo: ['thanThuc'], muc: 'vua' },
        thanh: {
          anh: 1,
          chu: 'Dưới lớp ảo thuật là một con hồ ly trắng còn non, yêu khí thuần hậu, chưa từng nhiễm máu người. Biết mình bị nhìn thấu, nàng run rẩy cúi đầu. Đúng lúc ấy, tiếng chuông trấn yêu vọng tới.',
          thuong: [{ loai: 'tu-vi', phan: 0.05 }],
          tiep: 'dao-si',
        },
        bai: { anh: 1, chu: 'Ảo thuật của nàng tinh xảo hơn ngươi tưởng, nhìn mãi vẫn chỉ thấy một cô gái yếu ớt. Chưa kịp nghĩ thêm, tiếng chuông trấn yêu đã vọng tới.', tiep: 'dao-si' },
      },
      { chu: 'Chuyện không liên quan, bỏ đi', thanh: { anh: 1, chu: 'Ngươi quay lưng đi. Sau lưng, tiếng khóc nhỏ dần rồi tắt hẳn trong tiếng gió trúc.' } },
    ],
    buoc: {
      'dao-si': {
        anh: 2,
        mo: 'Một đạo sĩ áo đen cầm kiếm gỗ đào bước ra, tay kẹp mấy lá bùa vàng: “Yêu hồ này đã trốn ba đêm. Giao nó ra, bần đạo chia cho ngươi tiền thưởng.” Mị Nương nấp sau lưng ngươi, run như lá trúc.',
        luaChon: [
          {
            chu: 'Dùng thần thức che giấu yêu khí của nàng',
            kiem: { chiSo: ['thanThuc'], muc: 'kho' },
            thanh: {
              anh: 3,
              chu: 'La bàn trong tay đạo sĩ quay loạn rồi đứng im. Hắn hừ một tiếng bỏ đi. Mị Nương hiện nguyên hình bạch hồ, cúi đầu ba lần, để lại trên tảng đá một viên hồ châu còn ấm.',
              thuong: [{ loai: 'khi-van', tiLe: 0.5 }, { loai: 'linh-thach', heSo: 1 }],
              haoCam: 25,
            },
            bai: {
              anh: 4,
              chu: 'Yêu khí rỉ ra một chút, thế là đủ. Lưới bùa chụp xuống, kéo Mị Nương đi mất. Đạo sĩ còn tiện tay quật ngươi một kiếm vì tội bao che.',
              matMau: 0.25,
              haoCam: 5,
            },
          },
          {
            chu: 'Rút kiếm đuổi đạo sĩ đi',
            kiem: { chiSo: ['luc', 'phongNgu'], muc: 'kho' },
            thanh: {
              anh: 3,
              chu: 'Kiếm gỗ đào gãy đôi, đạo sĩ ôm tay chạy mất, đánh rơi cả túi tiền. Mị Nương hiện nguyên hình bạch hồ, cúi đầu tạ ơn rồi để lại một viên hồ châu.',
              thuong: [{ loai: 'khi-van', tiLe: 0.5 }, { loai: 'linh-thach', heSo: 1.5 }],
              haoCam: 25,
            },
            bai: { anh: 4, chu: 'Bùa vàng nổ tung trước ngực ngươi. Khi ngươi gượng dậy được, lưới bùa đã kéo Mị Nương vào rừng trúc tối om.', matMau: 0.4, haoCam: 5 },
          },
          {
            chu: 'Giao nàng ra, nhận tiền thưởng',
            thanh: {
              anh: 4,
              chu: 'Ngươi bước sang một bên. Lưới bùa chụp xuống. Ánh mắt Mị Nương lúc bị lôi đi, ngươi còn nhớ rất lâu.',
              thuong: [{ loai: 'linh-thach', heSo: 2.5 }],
              haoCam: -50,
            },
          },
        ],
      },
    },
  },
  'y-su': {
    id: 'y-su',
    tieng: 'tien-nu',
    ten: 'Y sư và giếng độc',
    anh: 'y-su',
    nv: 'y-su',
    mo: 'Mấy hôm nay làng chân núi có dịch, nhà nhà đóng cửa. Một nữ y sư áo xanh quỳ giữa sân, đút thuốc cho từng người bệnh. Nàng ngẩng lên: “Đạo hữu có mang đan dược không? Thuốc của ta sắp cạn rồi.”',
    luaChon: [
      {
        chu: 'Tặng nàng một viên Hồi Xuân Đan',
        can: { loai: 'dan', id: 'hoi-xuan-dan' },
        thanh: {
          anh: 1,
          chu: 'Nàng bẻ viên đan hoà vào nồi thuốc lớn, chia cho cả làng. “Ta là Liễu Thanh Y, đa tạ đạo hữu. Nhưng dịch này lạ lắm, ta nghi có gốc gác.”',
          haoCam: 10,
          tiep: 'gieng',
        },
      },
      {
        chu: 'Cùng nàng bắt mạch tìm bệnh',
        kiem: { chiSo: ['thanThuc'], muc: 'vua' },
        thanh: {
          anh: 1,
          chu: 'Mạch người bệnh nào cũng lạnh, như bị âm khí ngấm vào. Ngươi và nàng nhìn nhau, cùng nghĩ tới một chỗ: cái giếng chung giữa làng.',
          thuong: [{ loai: 'tu-vi', phan: 0.05 }],
          haoCam: 8,
          tiep: 'gieng',
        },
        bai: {
          anh: 1,
          chu: 'Bắt mạch mãi không ra bệnh, ngươi còn hít phải bệnh khí, đầu choáng váng. Liễu Thanh Y lắc đầu đưa ngươi chén thuốc, rồi kéo ngươi ra giếng làng: “Ta nghi chỗ này.”',
          matMau: 0.1,
          tiep: 'gieng',
        },
      },
      { chu: 'Chắp tay xin lỗi rồi đi tiếp', thanh: { anh: 1, chu: 'Ngươi rời làng. Sau lưng, tiếng ho vẫn vang mãi trong những ngôi nhà đóng kín cửa.' } },
    ],
    buoc: {
      gieng: {
        anh: 2,
        mo: 'Cái giếng đá cổ giữa làng bốc lên từng luồng hắc khí, dưới đáy có thứ gì đang cựa quậy. Liễu Thanh Y bịt miệng: “Không trừ được nó thì uống bao nhiêu thuốc cũng vô ích.”',
        luaChon: [
          {
            chu: 'Xuống giếng diệt yêu vật',
            kiem: { chiSo: ['khiHuyet'], muc: 'kho' },
            thanh: {
              anh: 3,
              chu: 'Dưới đáy giếng là một con độc thiềm to bằng cái nong. Ngươi diệt nó, độc khí tan dần. Mấy hôm sau cả làng khỏi bệnh; Liễu Thanh Y trao cho ngươi một tờ phương thuốc gia truyền.',
              thuong: [{ loai: 'tu-chat', tiLe: 0.4 }, { loai: 'linh-thach', heSo: 1.5 }],
              haoCam: 25,
            },
            bai: { anh: 4, chu: 'Độc khí dưới giếng đặc quánh, chưa xuống tới đáy ngươi đã ngã vật. Liễu Thanh Y phải vất vả lắm mới kéo được ngươi lên.', matMau: 0.45, haoCam: 5 },
          },
          {
            chu: 'Cùng nàng lập trận phong ấn miệng giếng',
            kiem: { chiSo: ['thanThuc'], muc: 'kho' },
            thanh: {
              anh: 3,
              chu: 'Trận văn khép lại, hắc khí bị nhốt chặt dưới đáy giếng. Dịch dứt hẳn. Liễu Thanh Y tặng ngươi mấy gốc dược liệu quý và một tờ phương thuốc.',
              thuong: [{ loai: 'tu-chat', tiLe: 0.3 }, { loai: 'duoc-lieu', tuoi: 1, so: 2 }],
              haoCam: 20,
            },
            bai: { anh: 4, chu: 'Trận văn vẽ lệch một nét, hắc khí phun ngược ra, trùm lấy ngươi.', matMau: 0.35, haoCam: 5 },
          },
          {
            chu: 'Gửi tin lên Thanh Vân Tông rồi đi',
            thanh: { anh: 2, chu: 'Mấy hôm sau nghe tin tông môn đã cho người xuống, dịch đã dứt. Công lao chẳng phải của ngươi, nhưng cũng được chút tiền thưởng báo tin.', thuong: [{ loai: 'linh-thach', heSo: 0.5 }], haoCam: 3 },
          },
        ],
      },
    },
  },
  'thanh-nu': {
    id: 'thanh-nu',
    tieng: 'tien-nu',
    ten: 'Thánh nữ trên cầu đá',
    anh: 'thanh-nu',
    nv: 'thanh-nu',
    mo: 'Sương đỏ phủ kín cây cầu đá bắc qua suối. Một nữ nhân áo đen viền đỏ ngồi vắt vẻo trên lan can, nâng chén rượu về phía ngươi: “Đường dài cô quạnh, đạo hữu uống với ta một chén chứ?”',
    luaChon: [
      {
        chu: 'Nhận chén rượu, uống cạn',
        kiem: { chiSo: ['khiHuyet'], muc: 'vua' },
        thanh: { anh: 1, chu: 'Rượu cay xé họng, trong có độc, nhưng khí huyết ngươi nén được. Nàng bật cười khanh khách: “Thú vị. Ngồi xuống đánh với ta một ván.”', haoCam: 10, tiep: 'co' },
        bai: { anh: 4, chu: 'Độc phát ngay trong bụng, ngươi quỵ xuống mặt cầu. Lúc gượng dậy được, nàng đã đi mất, túi linh thạch cũng nhẹ đi trông thấy.', matMau: 0.3, matLinhThach: 0.25 },
      },
      {
        chu: 'Khéo léo từ chối',
        kiem: { chiSo: ['thanThuc'], muc: 'vua' },
        thanh: { anh: 1, chu: 'Ngươi đưa chén lên mũi, khẽ cười rồi đặt xuống: “Rượu ngon, tiếc là có độc.” Nàng nheo mắt: “Tinh mắt đấy. Vậy đánh với ta một ván cờ.”', haoCam: 8, tiep: 'co' },
        bai: { anh: 4, chu: 'Lời từ chối vụng về làm nàng phật ý. Một làn hương đỏ phả qua mặt; ngươi tỉnh lại một mình trên cầu, túi linh thạch vơi đi.', matMau: 0.1, matLinhThach: 0.15 },
      },
      {
        chu: 'Rút kiếm: tà ma ngoại đạo!',
        kiem: { chiSo: ['luc', 'phongNgu'], muc: 'hiem' },
        thanh: {
          anh: 3,
          chu: 'Kiếm khí xé toang sương đỏ. Nàng đỡ ba chiêu rồi bật cười, hoá thành cánh hoa đỏ tan đi, để lại một quyển ma công xé dở: “Kiếm của ngươi khá đấy. Thưởng cho ngươi.”',
          thuong: [{ loai: 'chi-so', cs: 'luc', heSo: 1 }, { loai: 'linh-thach', heSo: 1 }],
          haoCam: 5,
        },
        bai: { anh: 4, chu: 'Nàng chỉ phất tay áo. Ngươi bay khỏi cầu như chiếc lá, tiếng cười của nàng còn văng vẳng trong sương.', matMau: 0.5 },
      },
    ],
    buoc: {
      co: {
        anh: 2,
        mo: 'Một bàn cờ hiện ra giữa mặt cầu. Nữ nhân đặt một túi linh thạch bên cạnh: “Ta là Hoa Nguyệt Dao. Cược nhỏ thôi: ngươi thắng thì túi này là của ngươi, thua thì để lại một phần linh thạch.”',
        luaChon: [
          {
            chu: 'Nhận cược, đánh cờ',
            kiem: { chiSo: ['thanThuc'], muc: 'kho' },
            thanh: {
              anh: 3,
              chu: 'Nước cuối của ngươi chặn đứng đại long. Nàng ngẩn ra rồi cười, để lại túi linh thạch cùng một tàn quyển ma công, rồi tan vào làn cánh hoa đỏ.',
              thuong: [{ loai: 'linh-thach', heSo: 2.5 }, { loai: 'chi-so', cs: 'luc', heSo: 1 }],
              haoCam: 20,
            },
            bai: { anh: 4, chu: 'Thế cờ của nàng như mạng nhện, càng giãy càng chặt. Nàng thu linh thạch, phẩy tay áo đi mất trong sương, tiếng cười còn vọng lại.', matLinhThach: 0.3, haoCam: 5 },
          },
          {
            chu: 'Không cược, chỉ đánh chơi',
            thanh: { anh: 2, chu: 'Hai người đánh tới khi trăng lặn, không ai thắng ai. Nàng đứng dậy phủi áo: “Lần sau gặp lại, nhớ mang theo gan.”', thuong: [{ loai: 'tu-vi', phan: 0.1 }], haoCam: 10 },
          },
        ],
      },
    },
  },
  'quan-tro': {
    id: 'quan-tro',
    tieng: 'cuop',
    ten: 'Quán trọ đêm mưa',
    anh: 'quan-tro',
    nv: 'chu-quan',
    mo: 'Mưa núi như trút. Bên đường có một quán trọ gỗ treo đèn lồng đỏ. Bà chủ áo đỏ tựa cửa cười lúng liếng: “Khách quan vào tránh mưa đi, rượu vừa hâm nóng.”',
    luaChon: [
      {
        chu: 'Vào quán, uống chén rượu ấm',
        kiem: { chiSo: ['khiHuyet'], muc: 'vua' },
        thanh: { anh: 1, chu: 'Rượu có pha thuốc mê, nhưng khí huyết ngươi đẩy được thuốc ra ngoài. Ngươi giả say gục xuống bàn. Bà chủ cười khẽ, dìu ngươi lên phòng.', tiep: 'dem' },
        bai: { anh: 4, chu: 'Ba chén vào bụng, trời đất quay cuồng. Sáng ra ngươi nằm dưới sàn, túi linh thạch nhẹ hẳn đi, quán trọ vắng tanh như chưa từng có ai.', matLinhThach: 0.3, matMau: 0.05 },
      },
      {
        chu: 'Nhận rượu nhưng lén đổ đi',
        kiem: { chiSo: ['thanThuc'], muc: 'vua' },
        thanh: { anh: 1, chu: 'Ngươi khéo léo đổ rượu vào chậu cây cạnh bàn rồi giả say. Bà chủ không hay biết gì, dìu ngươi lên phòng.', tiep: 'dem' },
        bai: { anh: 4, chu: 'Bà chủ đứng ngay sau lưng, tự tay rót đầy chén mới. Không đổ được, ngươi đành uống. Sáng ra túi linh thạch đã vơi đi một khoảng.', matLinhThach: 0.3, matMau: 0.05 },
      },
      { chu: 'Cảm ơn, nhưng đội mưa đi tiếp', thanh: { anh: 1, chu: 'Ngươi kéo cao cổ áo, đi tiếp vào màn mưa. Bà chủ nhìn theo, nụ cười như có chút tiếc nuối.' } },
    ],
    buoc: {
      dem: {
        anh: 2,
        mo: 'Nửa đêm, ánh đèn lồng đỏ in lên cửa giấy. Bà chủ dẫn hai gã cầm dao rón rén bước vào, thì thầm: “Nhẹ tay thôi, đừng để máu bẩn chăn.” Ngươi vẫn tỉnh như sáo.',
        luaChon: [
          {
            chu: 'Bật dậy đánh một trận',
            kiem: { chiSo: ['luc', 'phongNgu'], muc: 'vua' },
            thanh: {
              anh: 3,
              chu: 'Hai gã đầu bếp nằm sóng soài. Bà chủ lập tức đổi giọng, cười xoà rót trà bồi tội: “Ta là Phượng Cửu Nương, có mắt không tròng, mong khách quan bỏ qua.” Nàng dâng lên một túi tiền đền.',
              thuong: [{ loai: 'linh-thach', heSo: 2 }],
              haoCam: 5,
            },
            bai: { anh: 4, chu: 'Một chọi ba trong căn phòng hẹp, ngươi bị quật ngã. Sáng ra tỉnh dậy, túi linh thạch đã vơi.', matMau: 0.35, matLinhThach: 0.25 },
          },
          {
            chu: 'Mở lời bàn chuyện làm ăn',
            kiem: { chiSo: ['thanThuc'], muc: 'kho' },
            thanh: {
              anh: 3,
              chu: '“Giết ta, các người được một túi linh thạch. Để ta sống, tháng nào các người cũng có đan mà bán.” Bà chủ bật cười, gạt dao của gã đầu bếp đi. Đêm ấy hai người tính sổ tới sáng.',
              thuong: [{ loai: 'linh-thach', heSo: 3 }],
              haoCam: 25,
            },
            bai: { anh: 4, chu: 'Nàng nghe xong chỉ cười nhạt: “Miệng lưỡi khá lắm.” Gáy ngươi đau nhói rồi tối sầm.', matMau: 0.2, matLinhThach: 0.3 },
          },
          {
            chu: 'Phá cửa sổ trốn ra',
            kiem: { chiSo: ['thanPhap'], muc: 'vua' },
            thanh: { anh: 2, chu: 'Ngươi phóng qua cửa sổ, lăn xuống sườn dốc rồi chạy biến vào màn mưa. Sau lưng còn vọng lại tiếng bà chủ chửi rủa.' },
            bai: { anh: 4, chu: 'Cửa sổ đã bị chèn chặt từ bên ngoài. Ngươi bị đánh ngất; sáng ra túi linh thạch vơi đi.', matMau: 0.3, matLinhThach: 0.2 },
          },
        ],
      },
    },
  },
  'u-hon': {
    id: 'u-hon',
    tieng: 'ma',
    ten: 'U hồn miếu hoang',
    anh: 'u-hon',
    nv: 'u-hon',
    mo: 'Ngươi tạt vào miếu hoang trú đêm. Lửa vừa bén thì sau tượng thần vọng ra tiếng hát ai oán. Dưới ánh trăng, một nữ nhân áo trắng tóc xoã ngồi đó, thân hình mờ như sương.',
    luaChon: [
      {
        chu: 'Lên tiếng hỏi chuyện nàng',
        kiem: { chiSo: ['thanThuc'], muc: 'vua' },
        thanh: {
          anh: 1,
          chu: 'Thần thức ngươi vững vàng, âm khí không xâm nhập được. Nàng ngừng hát: “Ta là Vân Cơ. Ba mươi năm trước ta bị chôn dưới gốc hoè sau miếu, không người cúng tế, không siêu thoát được.”',
          haoCam: 10,
          tiep: 'dao',
        },
        bai: { anh: 4, chu: 'Ngươi vừa cất lời, âm khí đã tràn vào thần thức. Tiếng hát hoá tiếng thét, một luồng gió lạnh hất ngươi văng khỏi miếu.', matMau: 0.3 },
      },
      {
        chu: 'Bắt quyết trừ tà',
        kiem: { chiSo: ['luc', 'phongNgu'], muc: 'kho' },
        thanh: {
          anh: 1,
          chu: 'Linh quang bức nàng lùi tận góc miếu. Nàng không phản kháng, chỉ khóc: “Ta chưa hại ai… ta chỉ muốn được chôn cất tử tế.” Ngươi thu tay lại.',
          thuong: [{ loai: 'tu-vi', phan: 0.05 }],
          haoCam: -5,
          tiep: 'dao',
        },
        bai: { anh: 4, chu: 'Pháp quyết chạm vào nàng như chạm vào nước. Oán khí bị khuấy động, nàng hoá thành lệ quỷ gào thét lao tới.', matMau: 0.4 },
      },
      { chu: 'Bịt tai, cố mà ngủ', thanh: { anh: 1, chu: 'Ngươi trùm áo kín đầu. Sáng ra người lạnh toát, như bị rút mất mấy phần dương khí.', matMau: 0.15 } },
    ],
    buoc: {
      dao: {
        anh: 2,
        mo: 'Sau miếu có một cây hoè già, rễ ngoằn ngoèo như tay người. Vân Cơ đứng tựa thân cây, khẽ nói: “Ngay dưới này. Âm khí tích ba mươi năm, đạo hữu cẩn thận.”',
        luaChon: [
          {
            chu: 'Cầm xẻng đào, gồng mình chịu âm khí',
            kiem: { chiSo: ['khiHuyet'], muc: 'vua' },
            thanh: {
              anh: 3,
              chu: 'Hài cốt được đặt vào mộ mới, khói hương bay lên. Vân Cơ mỉm cười, tan thành những đốm sáng. Lúc trời rạng, một miếng ngọc bội nhẹ nhàng rơi vào lòng bàn tay ngươi.',
              thuong: [{ loai: 'khi-van', tiLe: 0.6 }, { loai: 'tu-vi', phan: 0.15 }],
              haoCam: 30,
            },
            bai: { anh: 4, chu: 'Chưa đào tới đáy, âm khí đã ngấm vào xương. Oán khí trong Vân Cơ bị khuấy lên, nàng hoá lệ quỷ, hất ngươi văng ngang miếu.', matMau: 0.45, haoCam: 5 },
          },
          {
            chu: 'Ngồi xa đọc chú siêu độ',
            kiem: { chiSo: ['thanThuc'], muc: 'kho' },
            thanh: {
              anh: 3,
              chu: 'Tiếng chú vang suốt đêm. Âm khí dưới gốc hoè tan dần, Vân Cơ mỉm cười tan vào nắng sớm, để lại một miếng ngọc bội.',
              thuong: [{ loai: 'khi-van', tiLe: 0.4 }, { loai: 'tu-vi', phan: 0.15 }],
              haoCam: 20,
            },
            bai: { anh: 4, chu: 'Chú đọc sai một chữ, oán khí bùng lên. Vân Cơ hoá lệ quỷ, gió lạnh quật ngươi ngã sóng soài.', matMau: 0.35, haoCam: 5 },
          },
          {
            chu: 'Từ chối, rời miếu ngay',
            kiem: { chiSo: ['thanPhap'], muc: 'vua' },
            thanh: { anh: 4, chu: 'Nàng hoá lệ quỷ đuổi theo, nhưng ngươi đã lao ra khỏi cổng miếu trước khi gió lạnh kịp chạm tới.', haoCam: -30 },
            bai: { anh: 4, chu: 'Chưa ra tới cổng, gió lạnh đã quật ngươi ngã. Tiếng thét của lệ quỷ còn ù trong tai rất lâu.', matMau: 0.4, haoCam: -30 },
          },
        ],
      },
    },
  },
  'tieu-thu': {
    id: 'tieu-thu',
    tieng: 'cuop',
    ten: 'Tiểu thư bị bắt cóc',
    anh: 'tieu-thu',
    nv: 'tieu-thu',
    mo: 'Trên đèo, một cỗ xe ngựa chạm trổ lật nghiêng bên đường. Hai tán tu đang trói một thiếu nữ áo lụa hồng, hành lý vương vãi khắp nơi. Nàng thấy ngươi nấp sau tảng đá, ánh mắt cầu cứu.',
    luaChon: [
      {
        chu: 'Xông ra đánh',
        kiem: { chiSo: ['luc', 'phongNgu'], muc: 'kho' },
        thanh: {
          anh: 1,
          chu: 'Hai tên tán tu bị đánh chạy tán loạn. Thiếu nữ vừa run vừa cố giữ dáng vẻ: “Ta là Mộ Dung Tuyết. Đưa ta về phủ, gia phụ tất có hậu tạ.”',
          thuong: [{ loai: 'linh-thach', heSo: 1 }],
          haoCam: 10,
          tiep: 'rung',
        },
        bai: { anh: 4, chu: 'Một chọi hai, ngươi bị đánh gục giữa đường. Chúng lôi thiếu nữ đi, tiếng kêu cứu xa dần dưới chân đèo.', matMau: 0.4 },
      },
      {
        chu: 'Lẻn ra cắt dây trói',
        kiem: { chiSo: ['thanPhap'], muc: 'vua' },
        thanh: {
          anh: 1,
          chu: 'Nhân lúc hai tên mải lục hành lý, ngươi cắt dây, kéo nàng chạy vào rừng. “Ta là Mộ Dung Tuyết… Đưa ta về phủ, gia phụ tất có hậu tạ.”',
          haoCam: 10,
          tiep: 'rung',
        },
        bai: { anh: 4, chu: 'Dây vừa đứt thì một tên quay lại. Ngươi lĩnh trọn một nhát đao; chúng lôi thiếu nữ đi mất.', matMau: 0.25 },
      },
      { chu: 'Không dây vào chuyện này', thanh: { anh: 1, chu: 'Ngươi lặng lẽ đi đường khác. Tiếng khóc trên đèo đuổi theo ngươi một quãng dài.' } },
    ],
    buoc: {
      rung: {
        anh: 2,
        mo: 'Trời tối, đường về phủ Mộ Dung phải xuyên qua rừng. Sau lùm cây, mấy cặp mắt xanh lè bám theo từng bước. Mộ Dung Tuyết nắm chặt tay áo ngươi.',
        luaChon: [
          {
            chu: 'Đứng chắn trước nàng, đánh lui yêu thú',
            kiem: { chiSo: ['luc', 'phongNgu'], muc: 'vua' },
            thanh: { anh: 2, chu: 'Mấy con yêu lang bị đánh lui, rên ư ử lẩn vào bóng tối. Mộ Dung Tuyết nhìn ngươi, ánh mắt đã khác hẳn lúc trên đèo.', haoCam: 10, tiep: 'phu' },
            bai: { anh: 2, chu: 'Một con yêu lang cắn trúng chân ngươi. Ngươi vẫn gắng đưa được nàng ra khỏi rừng, máu thấm đỏ ống quần.', matMau: 0.3, tiep: 'phu' },
          },
          {
            chu: 'Dẫn nàng đi đường vòng',
            kiem: { chiSo: ['thanThuc'], muc: 'vua' },
            thanh: { anh: 2, chu: 'Ngươi lần theo gió, tránh hẳn đường của bầy thú. Gần sáng, mái phủ Mộ Dung đã hiện ra cuối đường.', haoCam: 5, tiep: 'phu' },
            bai: { anh: 2, chu: 'Hai người lạc trong rừng tới gần sáng mới ra được đường lớn, chân tay rã rời.', matTheLuc: 20, tiep: 'phu' },
          },
        ],
      },
      phu: {
        anh: 3,
        mo: 'Trước cổng lớn phủ Mộ Dung, gia chủ đích thân ra đón con gái. Ông chắp tay cảm tạ, sai gia nhân khiêng ra một rương linh thạch. Mộ Dung Tuyết đứng sau phụ thân, khẽ liếc nhìn ngươi.',
        luaChon: [
          { chu: 'Nhận rương linh thạch', thanh: { anh: 3, chu: 'Ngươi nhận lễ tạ rồi cáo từ. Lúc ra tới cổng, Mộ Dung Tuyết còn đứng nhìn theo.', thuong: [{ loai: 'linh-thach', heSo: 4 }], haoCam: 5 } },
          {
            chu: 'Không nhận vàng, chỉ xin một lời hứa',
            thanh: {
              anh: 3,
              chu: 'Gia chủ ngạc nhiên rồi cười lớn: “Từ nay Mộ Dung gia nợ ngươi một ân tình.” Mộ Dung Tuyết cúi đầu, tháo miếng ngọc bội bên hông trao cho ngươi.',
              thuong: [{ loai: 'khi-van', tiLe: 0.6 }, { loai: 'linh-thach', heSo: 1 }],
              haoCam: 30,
            },
          },
        ],
      },
    },
  },
  tuyet: {
    id: 'tuyet',
    tieng: 'tien-nu',
    ten: 'Cùng Lâm Thanh Tuyết săn yêu xà',
    anh: 'tuyet',
    nv: 'nu-tu',
    mo: 'Trước sơn môn Thanh Vân Tông, Lâm Thanh Tuyết đeo kiếm đi tới, vẻ mặt nghiêm trọng: “Một con yêu xà dưới đầm phía đông vừa cắn bị thương ba sư đệ. Ngươi có dám đi cùng ta không?”',
    luaChon: [
      { chu: 'Nhận lời', thanh: { anh: 1, chu: 'Nàng gật đầu, ném cho ngươi một lá bùa hộ thân: “Theo sát ta.”', haoCam: 5, tiep: 'dau' } },
      { chu: 'Từ chối', thanh: { anh: 1, chu: 'Nàng nhìn ngươi một lúc, không nói gì, rồi quay người đi một mình.', haoCam: -5 } },
    ],
    buoc: {
      dau: {
        anh: 2,
        mo: 'Đầm lầy phía đông chìm trong sương, cây chết đứng trơ trọi. Dấu trườn của yêu xà lúc có lúc mất trên bùn.',
        luaChon: [
          {
            chu: 'Lần theo dấu vết',
            kiem: { chiSo: ['thanThuc'], muc: 'vua' },
            thanh: { anh: 2, chu: 'Ngươi nhận ra mấy mảnh vảy mắc trên rễ cây, lần tới một vũng nước đen. Mặt nước bắt đầu sủi bọt.', tiep: 'dam' },
            bai: { anh: 2, chu: 'Hai người đi vòng mãi trong sương, chân tay rã rời. Rốt cuộc chính yêu xà tìm tới các ngươi.', matTheLuc: 20, tiep: 'dam' },
          },
          { chu: 'Để Lâm Thanh Tuyết dẫn đường', thanh: { anh: 2, chu: 'Nàng dẫn đường chắc chắn nhưng đi vòng khá xa. Gần trưa, hai người mới tới được vũng nước đen giữa đầm.', matTheLuc: 10, tiep: 'dam' } },
        ],
      },
      dam: {
        anh: 2,
        mo: 'Một cái đầu rắn to bằng cái thùng nhô lên khỏi mặt đầm, mắt vàng rực. Lâm Thanh Tuyết rút kiếm: “Ngươi bên trái, ta bên phải!”',
        luaChon: [
          {
            chu: 'Song kiếm hợp kích',
            kiem: { chiSo: ['luc', 'phongNgu'], muc: 'kho' },
            thanh: {
              anh: 3,
              chu: 'Hai đạo kiếm quang cùng chém xuống, đầu yêu xà rơi tõm xuống đầm. Lâm Thanh Tuyết thở dốc rồi khẽ cười; lần đầu tiên ngươi thấy nàng cười.',
              thuong: [{ loai: 'linh-thach', heSo: 2 }, { loai: 'duoc-lieu', tuoi: 2, so: 1 }],
              haoCam: 25,
            },
            bai: { anh: 4, chu: 'Đuôi rắn quật trúng cả hai. Ngươi cõng Lâm Thanh Tuyết chạy trong mưa, sau lưng nước đầm sôi sục.', matMau: 0.4, haoCam: 10 },
          },
          {
            chu: 'Kéo nàng rút lui, đợi lần sau',
            kiem: { chiSo: ['thanPhap'], muc: 'vua' },
            thanh: { anh: 4, chu: 'Yêu xà quẫy mạnh, Lâm Thanh Tuyết trúng một đòn. Ngươi cõng nàng chạy một mạch ra khỏi đầm. Nàng tựa trên lưng ngươi, khẽ nói: “Đa tạ.”', thuong: [{ loai: 'tu-vi', phan: 0.05 }], haoCam: 15 },
            bai: { anh: 4, chu: 'Ngươi cõng nàng chạy trong mưa, nhưng đuôi rắn vẫn kịp quật trúng lưng ngươi một cú.', matMau: 0.35, haoCam: 10 },
          },
        ],
      },
    },
  },
  'tien-tu': {
    id: 'tien-tu',
    tieng: 'tien-nu',
    ten: 'Tiên tử bên thác',
    anh: 'tien-tu',
    nv: 'tien-tu',
    mo: 'Tiếng thác đổ ầm ầm. Trên tảng đá phẳng giữa hồ, một nữ tử áo trắng đang múa kiếm; dòng nước như bị kiếm dẫn đi, uốn thành từng dải lụa bạc. Ngươi nín thở nấp sau bụi cây.',
    luaChon: [
      {
        chu: 'Lặng lẽ quan sát kiếm pháp',
        kiem: { chiSo: ['thanThuc'], muc: 'kho' },
        thanh: { anh: 1, chu: 'Ngươi nhìn ra được vài đường kiếm, trong lòng như có gì vừa thông. Đúng lúc ấy, kiếm quang đột ngột dừng lại.', thuong: [{ loai: 'chi-so', cs: 'thanPhap', heSo: 0.5 }], tiep: 'kiem' },
        bai: { anh: 1, chu: 'Kiếm quá nhanh, mắt ngươi hoa lên chẳng nhìn ra gì. Chưa kịp lùi, kiếm quang đã quét về phía bụi cây.', tiep: 'kiem' },
      },
      { chu: 'Bước ra chắp tay chào', thanh: { anh: 1, chu: 'Ngươi vừa bước ra khỏi bụi cây thì một luồng kiếm phong đã ập tới.', tiep: 'kiem' } },
      { chu: 'Lặng lẽ rời đi', thanh: { anh: 1, chu: 'Có những thứ không nên nhìn lâu. Ngươi lùi dần ra xa, tiếng thác vẫn đổ sau lưng.' } },
    ],
    buoc: {
      kiem: {
        anh: 2,
        mo: 'Mũi kiếm lạnh buốt kề sát cổ họng ngươi. Nữ tử áo trắng nhìn xuống, giọng lạnh như nước hồ: “Kẻ nào dám nhìn trộm Thủy Nguyệt luyện kiếm?”',
        luaChon: [
          {
            chu: 'Xin đỡ ba chiêu để tỏ lòng',
            kiem: { chiSo: ['phongNgu', 'khiHuyet'], muc: 'kho' },
            thanh: {
              anh: 3,
              chu: 'Ba chiêu qua đi, ngươi vẫn đứng vững. Thủy Nguyệt thu kiếm, khoé môi khẽ động: “Căn cốt cũng tạm. Lại đây, thế kiếm vừa rồi ngươi nhìn sai mấy chỗ.”',
              thuong: [{ loai: 'chi-so', cs: 'thanPhap', heSo: 1 }, { loai: 'chi-so', cs: 'luc', heSo: 0.5 }],
              haoCam: 25,
            },
            bai: { anh: 4, chu: 'Tới chiêu thứ hai, kiếm phong đã hất ngươi bay khỏi tảng đá, rơi tõm xuống hồ.', matMau: 0.35, haoCam: 3 },
          },
          {
            chu: 'Cúi đầu xin lỗi, dâng một viên Tụ Khí Đan',
            can: { loai: 'dan', id: 'tu-khi-dan' },
            thanh: {
              anh: 3,
              chu: 'Nàng nhận viên đan, ngửi qua rồi thu kiếm: “Đan sư? Thôi được, coi như ngươi có lòng.” Trước khi đi, nàng tiện tay chỉnh lại thế cầm kiếm cho ngươi.',
              thuong: [{ loai: 'chi-so', cs: 'thanPhap', heSo: 0.5 }],
              haoCam: 15,
            },
          },
          {
            chu: 'Lộn người ra sau bỏ chạy',
            kiem: { chiSo: ['thanPhap'], muc: 'kho' },
            thanh: { anh: 1, chu: 'Ngươi lăn khỏi mũi kiếm, chạy một mạch không ngoái lại. Nàng không đuổi theo, chỉ hừ lạnh một tiếng.', haoCam: -5 },
            bai: { anh: 4, chu: 'Chưa chạy được ba bước, kiếm phong đã đuổi kịp, hất ngươi văng xuống hồ.', matMau: 0.3, haoCam: -5 },
          },
        ],
      },
    },
  },
};

/** Nhân vật chỉ xuất hiện trong kỳ ngộ (NPC đứng ở bản đồ nằm trong NPC). */
export const NHAN_VAT: Record<string, { ten: string; anh: string }> = {
  'ho-ly': { ten: 'Tô Mị Nương', anh: 'nv-ho-ly' },
  'y-su': { ten: 'Liễu Thanh Y', anh: 'nv-y-su' },
  'thanh-nu': { ten: 'Hoa Nguyệt Dao', anh: 'nv-thanh-nu' },
  'chu-quan': { ten: 'Phượng Cửu Nương', anh: 'nv-chu-quan' },
  'u-hon': { ten: 'Vân Cơ', anh: 'nv-u-hon' },
  'tieu-thu': { ten: 'Mộ Dung Tuyết', anh: 'nv-tieu-thu' },
  'tien-tu': { ten: 'Thủy Nguyệt', anh: 'nv-tien-tu' },
};
/** Tên và ảnh của một nhân vật, dù là NPC bản đồ hay nhân vật kỳ ngộ. */
export const timNhanVat = (id: string) => NPC[id] ?? NHAN_VAT[id];

export type LoaiDiem = 'cong' | 'ky-ngo' | 'linh-dia' | 'npc' | 'hiem-dia';
export interface Diem {
  id: number;
  ten: string;
  /** Ảnh địa điểm: public/hinh/ban-do/<anh>.webp */
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
  nen: 'nen-thanh-van-dai',
  diem: [
    // ba con đường tách hẳn nhau, chỉ gặp ở làng: muốn xem nhánh khác phải vòng về
    // Tây lộ: làng -> Rừng Tùng Cổ -> (ngả cụt Miếu hoang) / Ruộng Linh Thảo -> Vách Lang Nha -> Động Cổ -> Hắc Phong Uyên
    // Trung lộ: làng -> Đèo Hắc Phong -> Thanh Vân Tông
    // Đông lộ: làng -> Quán trọ -> Rừng Trúc -> (ngả cụt Đình Vọng Hồ) / Rừng Phong Ảnh -> Đỉnh Lôi Minh -> Thác Thủy Nguyệt
    { id: 0, ten: 'Làng chân núi', anh: 'lang-chan-nui', x: 50, y: 95, loai: 'cong', suKien: ['y-su'] },
    { id: 1, ten: 'Rừng Tùng Cổ', anh: 'rung-cay', x: 24, y: 85, loai: 'ky-ngo', suKien: ['huou'] },
    { id: 12, ten: 'Miếu hoang', anh: 'mieu-hoang', x: 12, y: 74, loai: 'ky-ngo', suKien: ['u-hon'] },
    { id: 4, ten: 'Ruộng Linh Thảo', anh: 'ruong-thuoc', x: 34, y: 64, loai: 'linh-dia' },
    { id: 6, ten: 'Vách Lang Nha', anh: 'vach-da', x: 18, y: 51, loai: 'ky-ngo', suKien: ['yeu-lang'] },
    { id: 8, ten: 'Động Cổ', anh: 'dong-co', x: 30, y: 36, loai: 'ky-ngo', suKien: ['dong-phu-co'] },
    { id: 11, ten: 'Hắc Phong Uyên', anh: 'hiem-dia', x: 16, y: 20, loai: 'hiem-dia', suKien: ['lang-vuong'] },
    { id: 3, ten: 'Đèo Hắc Phong', anh: 'deo-nui', x: 50, y: 79, loai: 'ky-ngo', suKien: ['cuop-duong', 'tieu-thu'] },
    { id: 9, ten: 'Thanh Vân Tông', anh: 'thanh-van-tong', x: 52, y: 46, loai: 'npc', npc: 'nu-tu', suKien: ['tuyet'] },
    { id: 13, ten: 'Quán trọ', anh: 'quan-tro', x: 78, y: 87, loai: 'ky-ngo', suKien: ['quan-tro'] },
    { id: 2, ten: 'Rừng Trúc', anh: 'rung-truc', x: 84, y: 73, loai: 'ky-ngo', suKien: ['huou', 'cuop-duong', 'ho-ly'] },
    { id: 5, ten: 'Đình Vọng Hồ', anh: 'dinh-ho', x: 67, y: 61, loai: 'npc', npc: 'lao-gia' },
    { id: 7, ten: 'Rừng Phong Ảnh', anh: 'rung-cay', x: 84, y: 50, loai: 'ky-ngo', suKien: ['huou', 'yeu-lang', 'thanh-nu'] },
    { id: 10, ten: 'Đỉnh Lôi Minh', anh: 'dinh-loi', x: 70, y: 34, loai: 'ky-ngo', suKien: ['loi-van'] },
    { id: 14, ten: 'Thác Thủy Nguyệt', anh: 'thac-nuoc', x: 84, y: 18, loai: 'ky-ngo', suKien: ['tien-tu'] },
  ],
  duong: [
    [0, 1], [1, 12], [1, 4], [4, 6], [6, 8], [8, 11],
    [0, 3], [3, 9],
    [0, 13], [13, 2], [2, 5], [2, 7], [7, 10], [10, 14],
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
  const nhanh = 1 + (k.linhThu?.length ? tacDungThu(k, luc).theLuc : 0);
  return Math.min(c.theLucToiDa, k.theLuc.diem + (Math.max(0, luc - k.theLuc.luc) / 1000 / c.giayHoiTheLuc) * nhanh);
}
/** Còn bao nhiêu giây nữa thì đủ thể lực cho một bước. */
export function giayDuBuoc(k: Kho, luc = Date.now()): number {
  const c = LUAT.kyNgo;
  return Math.max(0, Math.ceil((c.theLucMoiBuoc - theLucHienTai(k, luc)) * c.giayHoiTheLuc));
}
/** Máu đủ để du ngoạn chưa. */
export const duMau = (k: Kho, luc = Date.now()) => mauHienTai(k, luc) >= mauToiDa(k) * LUAT.kyNgo.mauVao;

/** Còn bao nhiêu giây nữa mới hết bị cấm du ngoạn vì mất hồn (0 = không bị cấm). */
export function giayKhoaMatHon(k: Kho, luc = Date.now()): number {
  if (!(k.matHon > 0)) return 0;
  const khoa = k.matHonNhe ? LUAT.kyNgo.matHon.khoaGiayLanDau : coLeThanDay(k) ? Math.min(LUAT.kyNgo.matHon.khoaGiay, LUAT.qua.leThan.khoaMatHonGiay) : LUAT.kyNgo.matHon.khoaGiay;
  return Math.max(0, Math.ceil((k.matHon + khoa * 1000 - luc) / 1000));
}
/** Còn bao nhiêu giây nữa thì chỉ số hồi lại như cũ (0 = không mất hồn). */
export function giayYeuMatHon(k: Kho, luc = Date.now()): number {
  if (!dangMatHon(k, luc)) return 0;
  return Math.max(0, Math.ceil((k.matHon + LUAT.kyNgo.matHon.yeuGiay * 1000 - luc) / 1000));
}
/** Du ngoạn được không, và nếu không thì vì sao (chữ ngắn để ghi lên nút). */
export function lyDoKhongDi(k: Kho, luc = Date.now()): string | null {
  if (!duocVao(k)) return 'cần Luyện Khí';
  if (k.vuc?.trong) return 'đang ở Vực Thẳm';
  if (giayKhoaMatHon(k, luc) > 0) return 'mất hồn';
  if (!duMau(k, luc)) return 'đang dưỡng thương';
  return null;
}

// ---------- bản đồ ----------

/** Điểm nhìn thấy được: đã đặt chân tới, hoặc nằm kề một điểm đã tới. Còn lại bị sương che. */
export function daThay(k: Kho, id: number): boolean {
  return k.banDo.daDen.includes(id) || k.banDo.daDen.some((d) => keNhau(d, id));
}

/** Sự kiện đang chờ ở một điểm trong kỳ này (null = không có, hoặc đã giải quyết rồi). */
export function suKienTai(k: Kho, id: number, luc = Date.now()): SuKien | null {
  const d = timDiem(id);
  if (!d.suKien?.length) return null;
  const ky = kyCho(luc);
  if (k.banDo.xong[id] === ky) return null;
  const goc = `${k.nhanVat?.ten ?? ''}|${ky}|${id}`;
  if (d.loai !== 'hiem-dia' && (bam(goc) % 10000) / 10000 >= LUAT.kyNgo.coKyNgo) return null;
  return SU_KIEN[d.suKien[bam(goc + '|loai') % d.suKien.length]] ?? null;
}

/** Cảnh đang chờ người chơi chọn ở một điểm: bước mở đầu của sự kiện mới, hoặc bước dở dang của kỳ ngộ nhiều bước. */
export interface Canh {
  sk: SuKien;
  /** null = bước mở đầu. */
  buoc: string | null;
  anh: number;
  mo: string;
  luaChon: readonly LuaChon[];
}
export function canhTai(k: Kho, id: number, luc = Date.now()): Canh | null {
  const dk = k.banDo.dangKe;
  if (dk && dk.diem === id && dk.ky === kyCho(luc)) {
    const sk = SU_KIEN[dk.sk];
    const b = sk?.buoc?.[dk.buoc];
    if (sk && b) return { sk, buoc: dk.buoc, anh: b.anh, mo: b.mo, luaChon: b.luaChon };
  }
  const sk = suKienTai(k, id, luc);
  return sk ? { sk, buoc: null, anh: 1, mo: sk.mo, luaChon: sk.luaChon } : null;
}
/** Linh địa / NPC tỷ thí… đã dùng trong kỳ này chưa. */
export const daXongKy = (k: Kho, id: number, luc = Date.now()) => k.banDo.xong[id] === kyCho(luc);

/** Vào vùng: bắt đầu từ cổng (điểm 0). */
/** Còn bao nhiêu giây nữa lượt du ngoạn hiện tại hết (0 = đã hết hoặc chưa bắt đầu: lần vào tới sẽ bắt đầu lại từ làng). */
export function giayConLuot(k: Kho, luc = Date.now()): number {
  const bd = k.banDo.batDau ?? 0;
  if (!bd) return 0;
  return Math.max(0, Math.ceil((bd + LUAT.kyNgo.giayLuot * 1000 - luc) / 1000));
}
/**
 * Vào vùng. Trong một lượt (LUAT.kyNgo.giayLuot) thì đứng lại đúng chỗ lần trước bỏ dở;
 * hết lượt (hoặc lần đầu) thì bắt đầu lượt mới từ cổng làng (điểm 0).
 */
export function vaoBanDo(k: Kho, luc = Date.now()): Kho {
  const daDen = k.banDo.daDen.includes(0) ? k.banDo.daDen : [...k.banDo.daDen, 0];
  if (giayConLuot(k, luc) > 0) return { ...k, banDo: { ...k.banDo, daDen } };
  return { ...k, banDo: { ...k.banDo, viTri: 0, batDau: luc, daDen } };
}

/** Đi sang một điểm kề bên. Không đi được (không kề, thiếu thể lực, thương nặng) thì trả lại đúng kho cũ. */
export function diToi(k: Kho, id: number, luc = Date.now()): Kho {
  const c = LUAT.kyNgo;
  const tl = theLucHienTai(k, luc);
  if (!keNhau(k.banDo.viTri, id) || tl < c.theLucMoiBuoc || lyDoKhongDi(k, luc)) return k;
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
  /** Máu về 0: mất hồn. */
  trongThuong: boolean;
  /** Kỳ ngộ còn bước tiếp theo. */
  tiep: boolean;
  /** Mất hồn lần này là lần nhẹ (lần đầu tiên). */
  matHonNhe: boolean;
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
  const canh = canhTai(k, id, luc);
  const lc = canh?.luaChon[i];
  if (!canh || !lc || !xetCan(k, lc.can).duoc) return null;
  const sk = canh.sk;
  let kho: Kho = { ...k, banDo: { ...k.banDo, xong: { ...k.banDo.xong, [id]: kyCho(luc) }, dangKe: null } };
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
  if (ketCuc.matTheLuc) {
    const tl = theLucHienTai(kho, luc);
    const n = Math.min(Math.floor(tl), ketCuc.matTheLuc);
    kho = { ...kho, theLuc: { diem: tl - n, luc } };
    if (n > 0) mat.push(`${n} thể lực`);
  }
  if (ketCuc.haoCam && sk.nv) {
    const nc = npcCua(kho, sk.nv);
    const moiHc = kep(nc.haoCam + ketCuc.haoCam, 0, HAO_CAM_TOI_DA);
    kho = datNpc(kho, sk.nv, { haoCam: moiHc });
    const ten = timNhanVat(sk.nv)?.ten ?? '';
    if (ketCuc.haoCam > 0) nhan.push(`Hảo cảm với ${ten} +${ketCuc.haoCam}`);
    else mat.push(`${-ketCuc.haoCam} hảo cảm với ${ten}`);
  }
  if (ketCuc.matMau) {
    const r = matMau(kho, ketCuc.matMau, luc);
    kho = r.kho;
    mat.push(`${r.mat} máu`);
  }
  const trongThuong = mauHienTai(kho, luc) <= 0;
  const tiep = !!ketCuc.tiep && !trongThuong && !!sk.buoc?.[ketCuc.tiep];
  if (tiep) kho = { ...kho, banDo: { ...kho.banDo, dangKe: { diem: id, ky: kyCho(luc), sk: sk.id, buoc: ketCuc.tiep! } } };
  if (trongThuong) {
    // mất hồn: bị đưa về cổng vùng; máu tính lại theo máu tối đa đã bị giảm, để hồi đều từ 0
    const nhe = (kho.soLanMatHon ?? 0) === 0;
    kho = { ...kho, matHon: luc, matHonNhe: nhe, soLanMatHon: (kho.soLanMatHon ?? 0) + 1, banDo: { ...kho.banDo, viTri: 0 }, thongBao: { loai: 'mat-hon', luc } };
    kho = { ...kho, mau: { thieu: mauToiDa(kho), luc } };
  }
  return { kho, kq: { thanh, coKiem: !!lc.kiem, ketCuc, nhan, mat, trongThuong, tiep, matHonNhe: trongThuong && kho.matHonNhe } };
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
