// Tải trước ảnh: lúc mở game tải phần CỐT (thấy ngay ở động phủ, đan phòng, thanh nút) kèm thanh phần trăm ở màn mở đầu;
// vào game rồi thì tải NGẦM phần còn lại (vườn, đan, bản đồ, kỳ ngộ) từng ít một, để mở tới đâu ảnh đã sẵn tới đó.
import { DANH_SACH_ANH } from './game/danhSachAnh.ts';
import type { Kho } from './game/kho.ts';

const daTai = new Set<string>();
/** Giữ tham chiếu để trình duyệt không bỏ ảnh đã giải mã. */
const giu: HTMLImageElement[] = [];

function taiMot(duong: string): Promise<void> {
  if (daTai.has(duong)) return Promise.resolve();
  return new Promise((xong) => {
    const im = new Image();
    im.decoding = 'async';
    const ket = () => {
      daTai.add(duong);
      xong();
    };
    im.onload = () => {
      // giải mã sẵn để lúc hiện lên không bị khựng
      if (im.decode) void im.decode().catch(() => {}).finally(ket);
      else ket();
    };
    im.onerror = ket; // thiếu ảnh thì bỏ qua, không chặn màn tải
    im.src = './' + duong;
    giu.push(im);
  });
}

/** Tải một loạt ảnh, mỗi lúc `song` ảnh; báo tiến độ 0..1. */
async function taiLoat(ds: readonly string[], song: number, baoTienDo?: (x: number) => void): Promise<void> {
  let xong = 0;
  let i = 0;
  const tho = async () => {
    while (i < ds.length) {
      const d = ds[i++];
      await taiMot(d);
      xong++;
      baoTienDo?.(xong / ds.length);
    }
  };
  baoTienDo?.(ds.length ? 0 : 1);
  await Promise.all(Array.from({ length: Math.min(song, ds.length) }, tho));
}

/** Ảnh cần ngay khi vào game (theo nhân vật và lò đang dùng). */
export function anhCot(k: Kho): string[] {
  const thuMucNv = k.nhanVat?.gioiTinh === 'Nữ' ? 'hinh/nhan-vat-nu/' : 'hinh/nhan-vat/';
  const lo = `hinh/lo/${k.loDan.dung}.webp`;
  return DANH_SACH_ANH.filter(
    (d) =>
      d.startsWith('hinh/ui/') ||
      d.startsWith('hinh/hieu-ung/') ||
      d.startsWith('hinh/nen/') ||
      d.startsWith(thuMucNv) ||
      d === lo ||
      d === 'hinh/lo-dan.webp' ||
      d === 'hinh/nen-dan-phong.webp' ||
      d === 'hinh/ky-ngo/khung.webp',
  );
}

/** Tải phần cốt; quá `toiDa` mili giây thì coi như xong để mạng chậm không giữ người chơi ở màn tải mãi. */
export function taiCot(k: Kho, baoTienDo: (x: number) => void, toiDa = 12000): Promise<void> {
  return Promise.race([taiLoat(anhCot(k), 6, baoTienDo), new Promise<void>((xong) => setTimeout(xong, toiDa))]);
}

let dangNgam = false;
/** Tải ngầm phần còn lại, ít một, theo thứ tự hay mở tới trước. Gọi nhiều lần cũng chỉ chạy một lượt. */
export function taiNgam(): void {
  if (dangNgam) return;
  dangNgam = true;
  const thuTu = ['hinh/vuon/', 'hinh/duoc-lieu/', 'hinh/dan/', 'hinh/nguyen-lieu/', 'hinh/ban-do/', 'hinh/ky-ngo/nv-', 'hinh/ky-ngo/', 'hinh/'];
  const conLai = DANH_SACH_ANH.filter((d) => !daTai.has(d));
  const xep = [...conLai].sort((a, b) => thuTu.findIndex((t) => a.startsWith(t)) - thuTu.findIndex((t) => b.startsWith(t)));
  // đợi màn đầu vẽ xong rồi mới tải, mỗi lúc hai ảnh để không tranh băng thông với ảnh đang cần
  setTimeout(() => void taiLoat(xep, 2), 1500);
}
