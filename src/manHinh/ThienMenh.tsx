// Màn mở đầu và màn thiên mệnh (tạo nhân vật hoàn toàn ngẫu nhiên — người chơi không được chọn gì).
import { useEffect, useMemo, useState } from 'react';
import {
  GIOI_DIEN,
  LINH_CAN,
  THE_CHAT,
  XUAT_THAN,
  hiemChiSo,
  taoNhanVat,
  timGioiDien,
  timLinhCan,
  timTheChat,
  timXuatThan,
  type DoHiem,
  type NhanVat,
} from '../game/nhanVat.ts';
import { BupBe } from './BupBe.tsx';

export function ManMoDau({ daCoNhanVat, onVao, onSaoLuu }: { daCoNhanVat: boolean; onVao: () => void; onSaoLuu: () => void }) {
  return (
    <>
      <button className="man-mo-dau" onClick={onVao}>
        <span className="an-tu-tien">
          <i />
          <b>丹</b>
        </span>
        <h1>Luyện Đan</h1>
        <p>{daCoNhanVat ? 'Chạm để trở về động phủ' : 'Chạm để khai mở thiên mệnh'}</p>
      </button>
      <button className="nut-nho nut-sao-luu" onClick={onSaoLuu}>
        Cài đặt · Sao lưu
      </button>
    </>
  );
}

export interface DongThienMenh {
  nhan: string;
  giaTri: string;
  moTa: string;
  hiem: DoHiem;
  /** Các giá trị có thể ra — dùng cho hiệu ứng chữ nhảy lúc đang quay. */
  kho: string[];
}

/** Bảy dòng thuộc tính của một nhân vật, dùng cho cả màn tạo lẫn bảng xem lại. */
export function dongThienMenh(nv: NhanVat): DongThienMenh[] {
  const gd = timGioiDien(nv.gioiDien);
  const xt = timXuatThan(nv.xuatThan);
  const lc = timLinhCan(nv.linhCan);
  const tc = timTheChat(nv.theChat);
  const so = Array.from({ length: 12 }, (_, i) => String(7 + i * 8));
  return [
    { nhan: 'Giới diện', giaTri: gd.ten, moTa: gd.moTa, hiem: gd.hiem, kho: GIOI_DIEN.map((d) => d.ten) },
    { nhan: 'Giới tính', giaTri: nv.gioiTinh, moTa: '', hiem: 0, kho: ['Nam'] },
    { nhan: 'Xuất thân', giaTri: xt.ten, moTa: xt.moTa, hiem: xt.hiem, kho: XUAT_THAN.map((d) => d.ten) },
    { nhan: 'Linh căn', giaTri: lc.ten, moTa: lc.moTa, hiem: lc.hiem, kho: LINH_CAN.map((d) => d.ten) },
    { nhan: 'Thể chất', giaTri: tc.ten, moTa: tc.moTa, hiem: tc.hiem, kho: THE_CHAT.map((d) => d.ten) },
    { nhan: 'Tư chất', giaTri: `${nv.tuChat} / 100`, moTa: 'Tư chất cao thì con lắc chậm hơn và khoảng xanh rộng hơn khi tôi đan.', hiem: hiemChiSo(nv.tuChat), kho: so },
    { nhan: 'Khí vận', giaTri: `${nv.khiVan} / 100`, moTa: 'Khí vận cao thì phẩm đan khi mở lò tốt hơn và dễ vượt đan kiếp hơn.', hiem: hiemChiSo(nv.khiVan), kho: so },
  ];
}

const NHIP_MOI_DONG = 700; // mili giây quay mỗi dòng

export function ManThienMenh({ onXong }: { onXong: (nv: NhanVat) => void }) {
  // số mệnh đã định ngay từ lúc mở màn; phần "quay" chỉ là lật từng dòng ra
  const nv = useMemo(() => taoNhanVat(), []);
  const dong = useMemo(() => dongThienMenh(nv), [nv]);
  const [soHien, datSoHien] = useState(0);
  const [nhay, datNhay] = useState(0);
  const xong = soHien >= dong.length;

  useEffect(() => {
    if (xong) return;
    const id = setTimeout(() => datSoHien((n) => n + 1), NHIP_MOI_DONG);
    return () => clearTimeout(id);
  }, [soHien, xong]);

  useEffect(() => {
    if (xong) return;
    const id = setInterval(() => datNhay((n) => n + 1), 70);
    return () => clearInterval(id);
  }, [xong]);

  return (
    <div className="man-thien-menh">
      <header>
        <small>Thiên mệnh quyển</small>
        <h1>Thiên mệnh sơ khai</h1>
      </header>

      <div className={`khung-bup-be ${xong ? 'hien' : ''}`}>
        <BupBe dang={nv.dang} an={!xong} />
        <div className="ten-nhan-vat">{xong ? nv.ten : '· · ·'}</div>
      </div>

      <div className="bang-thien-menh">
        {dong.map((d, i) => {
          const daHien = i < soHien;
          const dangQuay = i === soHien;
          return (
            <div key={d.nhan} className={`dong ${daHien ? 'da-hien' : ''}`}>
              <span className="nhan">{d.nhan}</span>
              <span className={`gia-tri ${daHien ? `hiem-${d.hiem}` : 'cho'}`}>{daHien ? d.giaTri : dangQuay ? d.kho[nhay % d.kho.length] : '—'}</span>
              {daHien && d.moTa && <small>{d.moTa}</small>}
            </div>
          );
        })}
      </div>

      <div className="chan-thien-menh">
        {xong ? (
          <button className="nut chinh" onClick={() => onXong(nv)}>
            Bước vào tiên lộ
          </button>
        ) : (
          <p className="chu-nho">Đang dệt số mệnh…</p>
        )}
      </div>
    </div>
  );
}
