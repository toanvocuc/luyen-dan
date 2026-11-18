// Màn mở đầu và màn thiên mệnh (số mệnh quay ngẫu nhiên; người chơi tự chọn giới tính và được tạo lại 5 lần).
import { useEffect, useMemo, useState } from 'react';
import {
  GIOI_DIEN,
  LINH_CAN,
  THE_CHAT,
  XUAT_THAN,
  SO_LAN_TAO_LAI,
  hiemChiSo,
  taoNhanVat,
  tenNgauNhien,
  timGioiDien,
  timLinhCan,
  timTheChat,
  timXuatThan,
  type DoHiem,
  type NhanVat,
} from '../game/nhanVat.ts';
import { BupBe } from './BupBe.tsx';

export function ManMoDau({
  daCoNhanVat,
  tienDo,
  onVao,
  onSaoLuu,
}: {
  daCoNhanVat: boolean;
  /** Tiến độ tải ảnh cốt, 0..1; chưa tới 1 thì chưa cho vào. */
  tienDo: number;
  onVao: () => void;
  onSaoLuu: () => void;
}) {
  const dangTai = tienDo < 1;
  return (
    <>
      <button className="man-mo-dau tieu-de" disabled={dangTai} onClick={onVao}>
        <img className="nen-tieu-de" src="./hinh/mo-dau/man-tieu-de.webp" alt="" draggable={false} />
        <img className="logo-tieu-de" src="./hinh/mo-dau/logo.webp" alt="Heaven's Furnace" draggable={false} />
        {dangTai ? (
          <span className="dang-tai">
            <span className="thanh-tai">
              <i style={{ width: `${Math.round(tienDo * 100)}%` }} />
            </span>
            <small>Đang chuẩn bị đan lô… {Math.round(tienDo * 100)}%</small>
          </span>
        ) : (
          <p>{daCoNhanVat ? 'Chạm để trở về động phủ' : 'Chạm để bắt đầu'}</p>
        )}
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
  /** Ảnh minh hoạ (xuất thân). */
  anh?: string;
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
    { nhan: 'Giới tính', giaTri: nv.gioiTinh, moTa: '', hiem: 0, kho: ['Nam', 'Nữ'] },
    { nhan: 'Xuất thân', giaTri: xt.ten, moTa: xt.moTa, hiem: xt.hiem, kho: XUAT_THAN.filter((d) => d.trong > 0).map((d) => d.ten), anh: xt.anh ? `./hinh/xuat-than/${xt.id}.webp` : undefined },
    { nhan: 'Linh căn', giaTri: lc.ten, moTa: lc.moTa, hiem: lc.hiem, kho: LINH_CAN.map((d) => d.ten) },
    { nhan: 'Thể chất', giaTri: tc.ten, moTa: tc.moTa, hiem: tc.hiem, kho: THE_CHAT.map((d) => d.ten) },
    { nhan: 'Tư chất', giaTri: `${nv.tuChat} / 100`, moTa: 'Tư chất cao thì con lắc chậm hơn và khoảng xanh rộng hơn khi tôi đan.', hiem: hiemChiSo(nv.tuChat), kho: so },
    { nhan: 'Khí vận', giaTri: `${nv.khiVan} / 100`, moTa: 'Khí vận cao thì phẩm đan khi mở lò tốt hơn và dễ vượt đan kiếp hơn.', hiem: hiemChiSo(nv.khiVan), kho: so },
  ];
}

const NHIP_MOI_DONG = 700; // mili giây quay mỗi dòng

/** Nhân vật đang quay dở và số lần tạo lại đã dùng: lưu riêng để nạp lại trang không được quay thêm miễn phí. */
const KHOA_DANG_TAO = 'luyen-dan-thien-menh';
interface DangTao {
  nv: NhanVat;
  daDung: number;
}
function docDangTao(): DangTao | null {
  try {
    const s = localStorage.getItem(KHOA_DANG_TAO);
    const d = s ? (JSON.parse(s) as DangTao) : null;
    return d?.nv?.xuatThan ? d : null;
  } catch {
    return null;
  }
}
function ghiDangTao(d: DangTao | null) {
  try {
    if (d) localStorage.setItem(KHOA_DANG_TAO, JSON.stringify(d));
    else localStorage.removeItem(KHOA_DANG_TAO);
  } catch {
    // trình duyệt chặn lưu trữ: vẫn chơi được, chỉ là nạp lại trang thì quay lại từ đầu
  }
}

export function ManThienMenh({ onXong }: { onXong: (nv: NhanVat) => void }) {
  // số mệnh định sẵn rồi mới "lật" từng dòng ra; được tạo lại SO_LAN_TAO_LAI lần, giới tính thì tự chọn
  const [dangTao, datDangTao] = useState<DangTao>(() => docDangTao() ?? { nv: taoNhanVat(), daDung: 0 });
  useEffect(() => ghiDangTao(dangTao), [dangTao]);
  const { nv, daDung } = dangTao;
  const conLai = SO_LAN_TAO_LAI - daDung;
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

  const taoLai = () => {
    if (conLai <= 0) return;
    datDangTao({ nv: taoNhanVat(Math.random, nv.gioiTinh), daDung: daDung + 1 });
    datSoHien(0);
  };
  // đổi giới tính không tốn lượt: chỉ đổi dáng và tên, giữ nguyên số mệnh
  const doiGioi = (g: NhanVat['gioiTinh']) => {
    if (g !== nv.gioiTinh) datDangTao({ nv: { ...nv, gioiTinh: g, ten: tenNgauNhien(g) }, daDung });
  };

  return (
    <div className="man-thien-menh">
      <header>
        <small>Thiên mệnh quyển</small>
        <h1>Thiên mệnh sơ khai</h1>
      </header>

      <div className={`khung-bup-be ${xong ? 'hien' : ''}`}>
        <BupBe gioiTinh={nv.gioiTinh} an={!xong} />
        <div className="ten-nhan-vat">{xong ? nv.ten : '· · ·'}</div>
      </div>

      <div className="bang-thien-menh">
        {dong.map((d, i) => {
          const daHien = i < soHien;
          const dangQuay = i === soHien;
          if (d.nhan === 'Giới tính' && xong) {
            return (
              <div key={d.nhan} className="dong da-hien">
                <span className="nhan">{d.nhan}</span>
                <span className="chon-gioi">
                  {(['Nam', 'Nữ'] as const).map((g) => (
                    <button key={g} className={`nut-nho ${nv.gioiTinh === g ? 'dang-chon' : ''}`} onClick={() => doiGioi(g)}>
                      {g}
                    </button>
                  ))}
                </span>
              </div>
            );
          }
          return (
            <div key={d.nhan} className={`dong ${daHien ? 'da-hien' : ''}`}>
              <span className="nhan">{d.nhan}</span>
              <span className={`gia-tri ${daHien ? `hiem-${d.hiem}` : 'cho'}`}>{daHien ? d.giaTri : dangQuay ? d.kho[nhay % d.kho.length] : '—'}</span>
              {daHien && d.moTa && (
                <small className={d.anh ? 'co-anh' : ''}>
                  {d.anh && <img src={d.anh} alt="" draggable={false} />}
                  {d.moTa}
                </small>
              )}
            </div>
          );
        })}
      </div>

      <div className="chan-thien-menh">
        {xong ? (
          <>
            <button className="nut tao-lai" disabled={conLai <= 0} onClick={taoLai}>
              Tạo lại ({conLai})
            </button>
            <button
              className="nut chinh"
              onClick={() => {
                ghiDangTao(null);
                onXong(nv);
              }}
            >
              Bước vào tiên lộ
            </button>
          </>
        ) : (
          <p className="chu-nho">Đang dệt số mệnh…</p>
        )}
      </div>
    </div>
  );
}
