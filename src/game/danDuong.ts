// Nhiệm vụ dẫn đường: chuỗi việc nhỏ dắt người mới đi qua từng hệ thống theo thứ tự cần biết.
// Mỗi nhiệm vụ xong khi trạng thái kho đạt điều kiện (dat), hoặc khi vừa có thay đổi đúng kiểu (xet: so kho trước và sau).
// Người chơi cũ đã làm rồi thì điều kiện trạng thái tự đúng, chỉ việc bấm nhận thưởng.
import { DAN_PHUONG, timDuocLieu, type PhamThat } from './duLieu.ts';
import type { Kho } from './kho.ts';

export interface ThuongDan {
  linhThach?: number;
  /** id dược liệu -> số hạt giống. */
  hat?: Record<string, number>;
  dan?: { id: string; pham: PhamThat; so: number };
}

/** Chỗ để làm nhiệm vụ: chạm vào nhiệm vụ là đi thẳng tới đó. */
export type NoiLam = 'lo-dan' | 'vuon' | 'phuong-thi' | 'ban-do' | 'tui-do' | 'don' | 'duong' | 'dong-phu';

export interface NhiemVu {
  id: string;
  /** Chạm vào nhiệm vụ thì mở chỗ này. */
  den: NoiLam;
  ten: string;
  /** Chỉ chỗ: bấm vào đâu, làm gì. */
  goiY: string;
  dat?: (k: Kho) => boolean;
  xet?: (truoc: Kho, sau: Kho) => boolean;
  thuong: ThuongDan;
}

const tong = (o: Record<string, number>) => Object.values(o).reduce((s, n) => s + (n ?? 0), 0);
const soCay = (k: Kho) => k.vuon.o.filter(Boolean).length;
const tongLieu = (k: Kho) => Object.values(k.duocLieu).reduce((s, t) => s + t[0] + t[1] + t[2], 0);
const coThuongPham = (k: Kho) =>
  DAN_PHUONG.some((p) => (k.tuiDan[p.id]?.[2] ?? 0) + (k.tuiDan[p.id]?.[3] ?? 0) + (k.danVan[p.id] ?? 0) > 0) || Object.keys(k.danChuyen).length > 0;

export const NHIEM_VU: readonly NhiemVu[] = [
  {
    id: 'luyen-dau',
    den: 'lo-dan',
    ten: 'Luyện mẻ đan đầu tiên',
    goiY: 'Bấm Đan phòng ở thanh dưới, chọn Dẫn Khí Đan rồi nhóm lửa. Giữ kim lửa nằm trong vùng hỏa hầu, tới lúc tôi đan thì bấm đúng nhịp.',
    dat: (k) => k.thongKe.soMe >= 1,
    thuong: { linhThach: 30 },
  },
  {
    id: 'mua-hat',
    den: 'phuong-thi',
    ten: 'Mua hạt giống ở phường thị',
    goiY: 'Bấm Phường thị ở thanh dưới, mua một hạt giống Linh Thảo.',
    dat: (k) => tong(k.hatGiong) > 0 || soCay(k) > 0,
    thuong: { linhThach: 20, hat: { 'linh-thao': 1 } },
  },
  {
    id: 'gieo',
    den: 'vuon',
    ten: 'Gieo hạt ở vườn dược',
    goiY: 'Bấm Vườn dược ở thanh dưới, chạm vào một ô đất trống rồi chọn hạt để gieo. Cây vẫn lớn khi ngươi tắt game.',
    dat: (k) => soCay(k) > 0,
    thuong: { linhThach: 20 },
  },
  {
    id: 'dot-pha-1',
    den: 'dong-phu',
    ten: 'Đột phá lên Luyện Khí',
    goiY: 'Ngồi ở động phủ cho tu vi đầy hết 3 tầng Phàm Nhân, rồi bấm Đột phá và dùng Dẫn Khí Đan. Phẩm đan càng cao càng dễ thành.',
    dat: (k) => k.tuVi.canhGioi >= 1,
    thuong: { linhThach: 60 },
  },
  {
    id: 'tu-khi',
    den: 'lo-dan',
    ten: 'Luyện thành Tụ Khí Đan',
    goiY: 'Lên Luyện Khí thì đan phòng mở thêm đan phương mới. Chọn Tụ Khí Đan và luyện một mẻ.',
    dat: (k) => (k.thongThao['tu-khi-dan'] ?? 0) >= 1,
    thuong: { linhThach: 40 },
  },
  {
    id: 'uong',
    den: 'tui-do',
    ten: 'Uống một viên đan',
    goiY: 'Bấm Túi đồ ở mép phải động phủ, uống một viên Tụ Khí Đan để tu luyện nhanh hơn một lúc. Uống nhiều quá thì đan độc tích lại, phải đợi tan.',
    dat: (k) => tong(k.daUong) > 0,
    thuong: { linhThach: 40 },
  },
  {
    id: 'thu-hoach',
    den: 'vuon',
    ten: 'Thu hoạch dược liệu',
    goiY: 'Vào Vườn dược, chạm vào cây đã chín để hái. Cây để càng lâu thì tuổi thuốc càng cao, luyện ra đan càng tốt.',
    xet: (truoc, sau) => soCay(sau) < soCay(truoc) && tongLieu(sau) > tongLieu(truoc),
    thuong: { hat: { 'linh-thao': 2, 'chu-qua': 1 } },
  },
  {
    id: 'don',
    den: 'don',
    ten: 'Giao một đơn tông môn',
    goiY: 'Bấm Đơn hàng ở mép phải. Các tông môn đặt mua đan; giao đủ số viên thì được linh thạch và danh vọng.',
    dat: (k) => tong(k.danhVong) > 0,
    thuong: { linhThach: 60 },
  },
  {
    id: 'du-ngoan',
    den: 'ban-do',
    ten: 'Du ngoạn Thanh Vân sơn',
    goiY: 'Bấm Du ngoạn ở thanh dưới, rồi chạm một điểm kề bên để đi tới. Mỗi bước tốn thể lực, thể lực tự hồi theo thời gian.',
    dat: (k) => k.banDo.daDen.length > 1,
    thuong: { linhThach: 40 },
  },
  {
    id: 'ky-ngo',
    den: 'ban-do',
    ten: 'Vượt qua một kỳ ngộ',
    goiY: 'Tới điểm có dấu ? trên bản đồ. Mỗi lựa chọn ghi rõ tỉ lệ thành; tỉ lệ thấp thì chọn phương án Chắc chắn hoặc rút lui. Máu dưới một nửa thì về động phủ dưỡng thương, máu về 0 là mất hồn.',
    dat: (k) => Object.keys(k.banDo.xong).length > 0,
    thuong: { dan: { id: 'hoi-xuan-dan', pham: 1, so: 1 } },
  },
  {
    id: 'npc',
    den: 'ban-do',
    ten: 'Làm quen một vị tu sĩ',
    goiY: 'Gặp Hạc Ông ở Đình Vọng Hồ hoặc Lâm Thanh Tuyết ở Thanh Vân Tông. Trò chuyện hay tặng đan đều tăng hảo cảm.',
    dat: (k) => (k.npc['lao-gia']?.haoCam ?? 0) > 0 || (k.npc['nu-tu']?.haoCam ?? 0) > 0,
    thuong: { linhThach: 40 },
  },
  {
    id: 'thuong-pham',
    den: 'lo-dan',
    ten: 'Luyện được một viên thượng phẩm',
    goiY: 'Giữ lửa trong vùng hỏa hầu thật lâu và tôi đan trúng tâm. Dược liệu tuổi cao và lò tốt cũng giúp ra phẩm cao.',
    dat: coThuongPham,
    thuong: { linhThach: 80 },
  },
  {
    id: 'duong',
    den: 'duong',
    ten: 'Dưỡng đan một lần',
    goiY: 'Ở đan phòng bấm Dưỡng đan ở mép phải, đặt viên thượng phẩm vào để nâng chuyển. Đan càng nhiều chuyển, uống vào càng mạnh.',
    dat: (k) => k.duong !== null || Object.keys(k.danChuyen).length > 0,
    thuong: { linhThach: 80 },
  },
  {
    id: 'truc-co',
    den: 'lo-dan',
    ten: 'Đột phá lên Trúc Cơ',
    goiY: 'Tu luyện viên mãn Luyện Khí, luyện Trúc Cơ Đan rồi đột phá. Phẩm đan càng cao, tỉ lệ thành càng lớn.',
    dat: (k) => k.tuVi.canhGioi >= 2,
    thuong: { linhThach: 300 },
  },
];

/** Nhiệm vụ đang làm (null = đã xong cả chuỗi). */
export const nhiemVuNay = (k: Kho): NhiemVu | null => NHIEM_VU[k.danDuong.buoc] ?? null;

/** Nhiệm vụ đang làm vừa hoàn thành chưa (so kho trước và sau một lần thay đổi). */
export function vuaXong(truoc: Kho, sau: Kho): boolean {
  const nv = nhiemVuNay(sau);
  if (!nv || sau.danDuong.xong) return false;
  return !!(nv.dat?.(sau) || nv.xet?.(truoc, sau));
}
export const danhDauXong = (k: Kho): Kho => ({ ...k, danDuong: { ...k.danDuong, xong: true } });

/** Chữ tả phần thưởng. */
export function chuThuong(t: ThuongDan): string {
  const ra: string[] = [];
  if (t.linhThach) ra.push(`${t.linhThach} linh thạch`);
  if (t.hat) for (const [id, n] of Object.entries(t.hat)) ra.push(`${n} hạt ${timDuocLieu(id).ten}`);
  if (t.dan) ra.push(`${t.dan.so} ${DAN_PHUONG.find((p) => p.id === t.dan!.id)?.ten ?? t.dan.id}`);
  return ra.join(', ');
}

/** Nhận thưởng nhiệm vụ đã xong rồi chuyển sang nhiệm vụ kế. */
export function nhanThuongDan(k: Kho): Kho {
  const nv = nhiemVuNay(k);
  if (!nv || !k.danDuong.xong) return k;
  const t = nv.thuong;
  let kho: Kho = { ...k, danDuong: { buoc: k.danDuong.buoc + 1, xong: false } };
  if (t.linhThach) kho = { ...kho, linhThach: kho.linhThach + t.linhThach };
  if (t.hat) {
    const hatGiong = { ...kho.hatGiong };
    for (const [id, n] of Object.entries(t.hat)) hatGiong[id] = (hatGiong[id] ?? 0) + n;
    kho = { ...kho, hatGiong };
  }
  if (t.dan) {
    const c = [...(kho.tuiDan[t.dan.id] ?? [0, 0, 0, 0])] as [number, number, number, number];
    c[t.dan.pham] += t.dan.so;
    kho = { ...kho, tuiDan: { ...kho.tuiDan, [t.dan.id]: c } };
  }
  return kho;
}
