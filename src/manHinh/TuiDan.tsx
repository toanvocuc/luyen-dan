// Túi đan: mỗi loại đan ở mỗi phẩm là một dòng riêng, bán lẻ theo số lượng tự chọn.
import { useState } from 'react';
import { DAN_PHUONG, LUAT, TEN_PHAM, anhDan, giaBan, type PhamThat } from '../game/duLieu.ts';
import { banDan, banLe, giaTriTui, loiTheKho, type Kho } from '../game/kho.ts';

type Loai = PhamThat | 'dv';

export function TuiDan({ kho, doiKho, onDong }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; onDong: () => void }) {
  /** Số lượng muốn bán của từng dòng (khoá = id đan | phẩm); chưa chỉnh thì là 1. */
  const [soBan, datSoBan] = useState<Record<string, number>>({});
  const heSo = loiTheKho(kho).heSoBan;
  const tongGiaTri = DAN_PHUONG.reduce((s, p) => s + giaTriTui(kho, p.id), 0);

  const dong: { khoa: string; id: string; ten: string; loai: Loai; co: number; gia: number }[] = [];
  for (const p of DAN_PHUONG) {
    // phẩm cao đứng trước
    const dv = kho.danVan[p.id] ?? 0;
    if (dv > 0) dong.push({ khoa: `${p.id}|dv`, id: p.id, ten: p.ten, loai: 'dv', co: dv, gia: giaBan(p, 3, true, heSo) });
    for (const ph of [3, 2, 1, 0] as PhamThat[]) {
      const co = kho.tuiDan[p.id][ph];
      if (co > 0) dong.push({ khoa: `${p.id}|${ph}`, id: p.id, ten: p.ten, loai: ph, co, gia: giaBan(p, ph, false, heSo) });
    }
  }

  return (
    <div className="lop-phu" onClick={onDong}>
      <div className="bang tam" onClick={(e) => e.stopPropagation()}>
        <h2>Túi đan</h2>
        <p className="chu-nho">
          Bán lẻ ở phường thị chỉ được {Math.round(LUAT.heSoBan * 100)}% giá trị. Đã luyện {kho.thongKe.soMe} mẻ, nổ lò {kho.thongKe.noLo} lần.
        </p>
        {dong.length === 0 && <p className="chu-nho">Chưa có viên đan nào. Hãy khai lò luyện một mẻ.</p>}
        {dong.map((d) => {
          const n = Math.min(d.co, Math.max(1, soBan[d.khoa] ?? 1));
          const dat = (x: number) => datSoBan((c) => ({ ...c, [d.khoa]: Math.min(d.co, Math.max(1, x)) }));
          return (
            <div key={d.khoa} className="dong-tui dong-ban">
              <img src={anhDan(d.id)} alt="" />
              <div className="than-dong">
                <b>{d.ten}</b>
                <div className="hang-pham">
                  <span className={d.loai === 'dv' ? 'pham-dv' : `pham-${d.loai}`}>
                    {d.loai === 'dv' ? 'Đan văn' : TEN_PHAM[d.loai]} ×{d.co}
                  </span>
                  <span>{d.gia}/viên</span>
                </div>
              </div>
              <span className="chinh-so">
                <button className="nut-nho" disabled={n <= 1} onClick={() => dat(n - 1)} aria-label="Bớt">
                  −
                </button>
                <button className="so" onClick={() => dat(n >= d.co ? 1 : d.co)} title="Chạm để chọn tất cả">
                  {n}
                </button>
                <button className="nut-nho" disabled={n >= d.co} onClick={() => dat(n + 1)} aria-label="Thêm">
                  +
                </button>
              </span>
              <button className="nut-nho nut-ban" onClick={() => doiKho((k) => banLe(k, d.id, d.loai, n))}>
                Bán {d.gia * n}
              </button>
            </div>
          );
        })}
        <div className="hang-nut">
          {tongGiaTri > 0 && (
            <button
              className="nut-nho nguy-hiem"
              onClick={() => {
                if (confirm(`Bán toàn bộ đan trong túi lấy ${tongGiaTri} linh thạch?`)) doiKho((k) => DAN_PHUONG.reduce((kk, p) => banDan(kk, p.id), k));
              }}
            >
              Bán hết ({tongGiaTri})
            </button>
          )}
          <button className="nut-nho" onClick={onDong}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
