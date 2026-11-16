// Quà của Đan Lão ở đoạn mở đầu: người chơi chọn một trong ba viên thần đan mang sang thế giới mới.
// Người chơi MỚI nhận bản đầy đủ; người chơi đã có nhân vật từ trước khi có đoạn mở đầu nhận bản nhẹ (`nhe`),
// riêng quả trứng thì như nhau. Hiệu lực được tính ở kho.ts (chỉ số, máu, luyện đan, giá bán, tu luyện) và kyNgo.ts (mất hồn).
import { LUAT } from './duLieu.ts';
import type { Kho } from './kho.ts';

export type LoaiQua = 'le-than' | 'luyen-than' | 'linh-thu';
export interface QuaMoDau {
  loai: LoaiQua;
  /** Bản nhẹ cho người chơi cũ. */
  nhe: boolean;
}

export const QUA: Record<LoaiQua, { ten: string; anh: string; mau: string; tomTat: string }> = {
  'le-than': { ten: 'Lệ Thần Đan', anh: 'dan-le-than', mau: '#ff8c78', tomTat: 'Thân thể thần linh' },
  'luyen-than': { ten: 'Luyện Thần Đan', anh: 'dan-luyen-than', mau: '#ffd66e', tomTat: 'Bàn tay luyện thần' },
  'linh-thu': { ten: 'Linh Thú Thần Đan', anh: 'dan-linh-thu', mau: '#8cd2ff', tomTat: 'Thần thú hộ mệnh' },
};
export const THU_TU_QUA: readonly LoaiQua[] = ['le-than', 'luyen-than', 'linh-thu'];

/** Các dòng tác dụng (đúng với số đang dùng trong LUAT.qua). */
export function tacDungQua(loai: LoaiQua, nhe: boolean): string[] {
  const q = LUAT.qua;
  const pt = (x: number) => `${Math.round(x * 100)}%`;
  if (loai === 'le-than')
    return nhe
      ? [`Mọi chỉ số ×${q.leThan.chiSoNhe}`]
      : [`Mọi chỉ số ×${q.leThan.chiSo}`, `Máu tự hồi nhanh ×${q.leThan.hoiMau}`, `Mất hồn chỉ ${Math.round(q.leThan.khoaMatHonGiay / 60)} phút là hoàn hồn`];
  if (loai === 'luyen-than')
    return nhe
      ? [`Phẩm đan nhích lên một chút`, `Bán đan ở chợ +${pt(q.luyenThan.banNhe - 1)}`]
      : [`Phẩm đan cao hẳn, vùng hỏa hầu rộng hơn`, `Bán đan ở chợ +${pt(q.luyenThan.ban - 1)}`, `Thu nhập mỗi mẻ gần gấp rưỡi tới gấp đôi`];
  return [`Nhận Trứng Dực Quang Thần Thú`, `Linh khí của trứng: tu luyện nhanh +${pt(q.trung.tocDo)}`, `Ấp nở ở Linh Thú Viên (nút Linh thú ở động phủ)`];
}

/** Ghi nhận quà vào kho (chỉ một lần). */
export function nhanQua(k: Kho, loai: LoaiQua, nhe: boolean, luc = Date.now()): Kho {
  if (k.quaMoDau) return k;
  return { ...k, quaMoDau: { loai, nhe }, trung: loai === 'linh-thu' ? { luc } : k.trung };
}
