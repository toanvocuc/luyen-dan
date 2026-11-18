// Thẻ trạng thái: khi người chơi tự gây ra một trạng thái xấu (tẩu hỏa, trúng độc, mất hồn), một khung tranh kể lại chuyện gì vừa xảy ra.
// Chỉ có một nút "Đã hiểu". Ảnh: public/hinh/trang-thai/<loai>.webp (chưa có ảnh thì chỉ hiện chữ).
import { useEffect, useState } from 'react';
import { LUAT } from '../game/duLieu.ts';
import type { Kho } from '../game/kho.ts';

type Loai = NonNullable<Kho['thongBao']>['loai'];
const NOI_DUNG: Record<Loai, { ten: string; chu: () => string }> = {
  'tau-hoa': {
    ten: 'Tẩu hỏa nhập ma',
    chu: () =>
      `Linh khí đảo ngược, xé dọc kinh mạch. Trong ${Math.round(LUAT.daiDotPha.tauHoaGiay / 60)} phút tới, tu luyện chỉ còn một nửa.`,
  },
  'trung-doc': {
    ten: 'Đan độc công tâm',
    chu: () =>
      `Đan độc vượt ngưỡng: mọi chỉ số giảm, độc càng nặng càng yếu. Độc tự tan dần theo thời gian.`,
  },
  'mat-hon': {
    ten: 'Hồn lìa khỏi xác',
    chu: () => 'Hồn lìa khỏi xác. Phải tĩnh dưỡng một thời gian, trong lúc đó không thể du ngoạn.',
  },
};

export function TheTrangThai({ thongBao, onXong }: { thongBao: NonNullable<Kho['thongBao']>; onXong: () => void }) {
  // để cảnh vừa xảy ra (hiệu ứng đột phá, kết quả kỳ ngộ) hiện trước một nhịp rồi thẻ mới phủ lên
  const [hien, datHien] = useState(Date.now() - thongBao.luc > 1500);
  const [coAnh, datCoAnh] = useState(true);
  useEffect(() => {
    if (hien) return;
    const id = setTimeout(() => datHien(true), Math.max(0, 1500 - (Date.now() - thongBao.luc)));
    return () => clearTimeout(id);
  }, [hien, thongBao.luc]);
  if (!hien) return null;
  const nd = NOI_DUNG[thongBao.loai];
  return (
    <div className="lop-phu lop-trang-thai">
      <div className="the-trang-thai" onClick={(e) => e.stopPropagation()}>
        <h2>{nd.ten}</h2>
        {coAnh && <img className="anh-trang-thai" src={`./hinh/trang-thai/${thongBao.loai}.webp`} alt="" draggable={false} onError={() => datCoAnh(false)} />}
        <p>{nd.chu()}</p>
        <button className="nut chinh" onClick={onXong}>
          Đã hiểu
        </button>
      </div>
    </div>
  );
}
