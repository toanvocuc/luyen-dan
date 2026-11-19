// Màn tông môn kiểu bản đồ: nền lãnh địa của tông, các toà nhà bấm được.
// Tàng Kinh Các = bán bí tịch của tông; Nghị Sự Đường = giao đơn lấy danh vọng; Tàng Bảo Các = đổi danh vọng;
// Sơn Môn = thông tin tông, xin gia nhập / rời tông. Luyện Võ Trường, Y Quán: để dành.
import { useState } from 'react';
import { phat } from '../amThanh.ts';
import { TONG_MON, timTongMon } from '../game/duLieu.ts';
import type { Kho } from '../game/kho.ts';
import { LUAT_BT, TONG_MON_INFO, giaNhapTongMon, giayDoiTongMon, hangBtTongMon, lyDoKhongVao, roiTongMon } from '../game/nguonVoCong.ts';
import { HE } from '../game/voCong.ts';
import { HangBiTich } from './ChoBiTich.tsx';
import { dongHo, useBayGio } from './PhuongThi.tsx';

type ToaNha = 'nghi-su-duong' | 'tang-kinh-cac' | 'tang-bao-cac' | 'luyen-vo-truong' | 'y-quan' | 'son-mon';
const TOA_NHA: { id: ToaNha; ten: string }[] = [
  { id: 'nghi-su-duong', ten: 'Nghị Sự Đường' },
  { id: 'tang-kinh-cac', ten: 'Tàng Kinh Các' },
  { id: 'tang-bao-cac', ten: 'Tàng Bảo Các' },
  { id: 'luyen-vo-truong', ten: 'Luyện Võ Trường' },
  { id: 'y-quan', ten: 'Y Quán' },
  { id: 'son-mon', ten: 'Sơn Môn' },
];
/** Vị trí (% ngang, % dọc) bãi trống trên nền của từng tông, theo thứ tự TOA_NHA. Đáy toà nhà đặt ở điểm này. */
const VI_TRI: Record<string, [number, number][]> = {
  'thanh-van': [[50, 15], [17, 31], [78, 33], [47, 55], [15, 74], [70, 83]],
  'duoc-vuong': [[50, 11], [16, 21], [84, 30], [48, 52], [73, 79], [14, 88]],
  'thien-kiem': [[50, 13], [14, 33], [80, 36], [48, 53], [15, 78], [75, 82]],
  'van-bao': [[50, 12], [14, 27], [85, 30], [50, 48], [15, 76], [76, 74]],
  'huyen-am': [[42, 12], [14, 25], [85, 29], [40, 46], [15, 77], [75, 76]],
};

export function TongMon({
  kho,
  doiKho,
  onDong,
  onDonHang,
  onTangBao,
}: {
  kho: Kho;
  doiKho: (ham: (k: Kho) => Kho) => void;
  onDong: () => void;
  /** Nghị Sự Đường: mở bảng đơn hàng tông môn. */
  onDonHang: () => void;
  /** Tàng Bảo Các: mở bảng đổi danh vọng. */
  onTangBao: () => void;
}) {
  const luc = useBayGio();
  const tm = kho.voCong.tongMon;
  const [xem, datXem] = useState<string>(tm ?? TONG_MON[0].id);
  const [mo, datMo] = useState<ToaNha | null>(tm ? null : 'son-mon');
  const info = TONG_MON_INFO[xem];
  const laMinh = tm === xem;
  const ly = lyDoKhongVao(kho, xem, luc);
  const vt = VI_TRI[xem];

  const bamToa = (id: ToaNha) => {
    phat('nut-bam');
    if (!laMinh && id !== 'son-mon') return datMo('son-mon');
    if (id === 'nghi-su-duong') return onDonHang();
    if (id === 'tang-bao-cac') return onTangBao();
    datMo(id);
  };

  return (
    <div className="man-tong-mon">
      <div className="ban-do-tong-mon" style={{ backgroundImage: `url(./hinh/tong-mon/nen-${xem}.webp)` }}>
        {TOA_NHA.map((t, i) => (
          <button key={t.id} className={`toa-nha ${!laMinh && t.id !== 'son-mon' ? 'mo' : ''}`} style={{ left: `${vt[i][0]}%`, top: `${vt[i][1]}%` }} onClick={() => bamToa(t.id)}>
            <img src={`./hinh/tong-mon/${t.id}.webp`} alt="" draggable={false} />
            <span>{t.ten}</span>
          </button>
        ))}
      </div>

      <header className="dau-tong-mon">
        <div className="hang-tong-mon">
          {TONG_MON.map((t) => (
            <button
              key={t.id}
              className={`the nho ${xem === t.id ? 'chon' : ''}`}
              onClick={() => {
                datXem(t.id);
                datMo(tm === t.id ? null : 'son-mon');
              }}
            >
              {t.ten}
              {tm === t.id ? ' ✦' : ''}
            </button>
          ))}
        </div>
        <button className="nut-nho dong-tong-mon" onClick={onDong}>
          Đóng
        </button>
      </header>

      {mo && (
        <section className="the-tong-mon">
          <button className="dong-the" onClick={() => datMo(null)} aria-label="Thu gọn">
            ×
          </button>
          {mo === 'son-mon' && (
            <>
              <h2>{timTongMon(xem).ten}</h2>
              <p>
                <b>Võ học chính:</b> {info.he.map((h) => HE[h].dao).join(', ')}
              </p>
              <p>
                <b>Tôn chỉ:</b> {info.tonChi}
              </p>
              <p>
                <b>Môn quy:</b> {info.monQuy}
              </p>
              <p>
                <b>Danh vọng:</b> {kho.danhVong[xem] ?? 0}
              </p>
              {laMinh ? (
                <>
                  <p className="chu-nho">Ngươi là đệ tử của tông này. Giao đơn ở Nghị Sự Đường để có thêm danh vọng, mua bí tịch ở Tàng Kinh Các.</p>
                  <button
                    className="nut-nho nguy-hiem"
                    onClick={() => {
                      if (!confirm(`Rời ${timTongMon(xem).ten}? Mất ${Math.round(LUAT_BT.matDanhVongKhiRoi * 100)}% danh vọng với tông này, ${LUAT_BT.ngayDoiTongMon} ngày sau mới bái sư nơi khác.`)) return;
                      doiKho((k) => roiTongMon(k));
                      datMo('son-mon');
                    }}
                  >
                    Rời tông môn
                  </button>
                </>
              ) : (
                <>
                  <p className="chu-nho">
                    Điều kiện (một trong hai): thiên phú Khá ở {info.he.map((h) => HE[h].dao).join(' hoặc ')}; hoặc {LUAT_BT.danhVongVao} danh vọng với tông này.
                    {giayDoiTongMon(kho, luc) > 0 ? ` Vừa rời tông, đợi ${dongHo(giayDoiTongMon(kho, luc))}.` : ''}
                  </p>
                  {ly && <p className="chu-nho loi">{ly}</p>}
                  <button
                    className="nut chinh"
                    disabled={!!ly}
                    onClick={() => {
                      phat('thanh-cong');
                      doiKho((k) => giaNhapTongMon(k, xem));
                      datMo(null);
                    }}
                  >
                    Xin gia nhập
                  </button>
                </>
              )}
            </>
          )}
          {mo === 'tang-kinh-cac' && (
            <>
              <h2>Tàng Kinh Các</h2>
              <p className="chu-nho">
                Bí tịch {info.he.map((h) => HE[h].ten).join(', ')}, thân pháp, tâm pháp. Trả linh thạch và danh vọng (đang có {kho.danhVong[xem] ?? 0}). Đổi cùng kỳ hàng phường thị.
              </p>
              <div className="ds-tang-kinh">
                <HangBiTich kho={kho} doiKho={doiKho} ds={hangBtTongMon(kho)} />
              </div>
            </>
          )}
          {(mo === 'luyen-vo-truong' || mo === 'y-quan') && (
            <>
              <h2>{mo === 'y-quan' ? 'Y Quán' : 'Luyện Võ Trường'}</h2>
              <p className="chu-nho">Chưa mở. Sắp có: {mo === 'y-quan' ? 'chữa thương, giải độc' : 'luyện chiêu với hình nhân, tỉ thí đồng môn'}.</p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
