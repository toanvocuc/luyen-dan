// Nhân vật ngồi thiền: mỗi bộ trang phục là một ảnh trọn vẹn (public/hinh/nhan-vat-thien/<gioi>-<bo>.webp).
// Trang phục đổi theo bậc cảnh giới, cùng nhịp với ảnh nền động phủ (bacNen).
import { bacNen } from '../game/duLieu.ts';
import type { NhanVat } from '../game/nhanVat.ts';

/** Bộ trang phục theo bậc nền 1–5. Bộ "ma-tu" đã có ảnh, để dành cho Vực Thẳm / cửa hàng trang phục. */
const BO_THEO_BAC = ['pham-y', 'thanh-van', 'dan-su', 'kiem-tu', 'tien-bao'] as const;

/** Đường dẫn ảnh nhân vật ngồi thiền theo giới tính và cảnh giới. */
export function anhNhanVat(gioiTinh: NhanVat['gioiTinh'] | undefined, canhGioi: number): string {
  return `./hinh/nhan-vat-thien/${gioiTinh === 'Nữ' ? 'nu' : 'nam'}-${BO_THEO_BAC[bacNen(canhGioi) - 1]}.webp`;
}

/** Ảnh nhân vật đứng (trang nhân vật), cùng bộ trang phục với ảnh ngồi thiền. */
export function anhNhanVatDung(gioiTinh: NhanVat['gioiTinh'] | undefined, canhGioi: number): string {
  return `./hinh/nhan-vat-dung/${gioiTinh === 'Nữ' ? 'nu' : 'nam'}-${BO_THEO_BAC[bacNen(canhGioi) - 1]}.webp`;
}

export function BupBe({
  gioiTinh = 'Nam',
  canhGioi = 0,
  an = false,
}: {
  gioiTinh?: NhanVat['gioiTinh'];
  canhGioi?: number;
  /** Chưa định hình: chỉ hiện bóng thân. */
  an?: boolean;
}) {
  return (
    <div className={`bup-be ${an ? 'chua-dinh-hinh' : ''}`}>
      <img src={anhNhanVat(gioiTinh, canhGioi)} alt="" draggable={false} />
    </div>
  );
}
