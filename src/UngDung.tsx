import { useCallback, useEffect, useState } from 'react';
import { DAN_PHUONG, DUOC_LIEU, TEN_PHAM } from './game/duLieu.ts';
import { khoMoi, luuKho, napKho, type Kho } from './game/kho.ts';
import { LoDan } from './manHinh/LoDan.tsx';

export function UngDung() {
  const [kho, datKho] = useState<Kho>(napKho);
  const [moTui, datMoTui] = useState(false);

  useEffect(() => luuKho(kho), [kho]);

  const doiKho = useCallback((ham: (k: Kho) => Kho) => datKho(ham), []);

  const tongDan = Object.values(kho.tuiDan).reduce((s, t) => s + t[0] + t[1] + t[2] + t[3], 0);

  return (
    <div className="ung-dung">
      <header className="thanh-tren">
        <span className="linh-thach">
          <i className="cham-linh-thach" />
          {kho.linhThach} linh thạch
        </span>
        <button className="nut-nho" onClick={() => datMoTui(true)}>
          Túi đan ({tongDan})
        </button>
      </header>

      <LoDan kho={kho} doiKho={doiKho} />

      {moTui && (
        <div className="lop-phu" onClick={() => datMoTui(false)}>
          <div className="bang tui" onClick={(e) => e.stopPropagation()}>
            <h2>Túi đan</h2>
            {DAN_PHUONG.map((p) => {
              const t = kho.tuiDan[p.id];
              return (
                <div key={p.id} className="dong-tui">
                  <img src="./hinh/dan.png" alt="" style={{ filter: `hue-rotate(${p.xoayMau}deg)` }} />
                  <div>
                    <b>{p.ten}</b>
                    <div className="hang-pham">
                      {TEN_PHAM.map((ten, i) => (
                        <span key={ten} className={`pham pham-${i}`}>
                          {ten}: {t[i]}
                        </span>
                      ))}
                      {kho.danVan[p.id] > 0 && <span className="pham pham-dv">Đan văn: {kho.danVan[p.id]}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="chu-nho">
              Đã luyện {kho.thongKe.soMe} mẻ, nổ lò {kho.thongKe.noLo} lần.
            </p>
            <div className="hang-nut">
              <button
                className="nut-nho"
                onClick={() =>
                  doiKho((k) => {
                    const duocLieu = { ...k.duocLieu };
                    for (const d of DUOC_LIEU) {
                      const c = duocLieu[d.id];
                      duocLieu[d.id] = [c[0] + 10, c[1] + 4, c[2] + 1];
                    }
                    return { ...k, duocLieu, phuLieu: { 'hoa-tinh': (k.phuLieu['hoa-tinh'] ?? 0) + 2, 'ngung-than-thao': (k.phuLieu['ngung-than-thao'] ?? 0) + 2 } };
                  })
                }
              >
                + Dược liệu (bản thử)
              </button>
              <button
                className="nut-nho nguy-hiem"
                onClick={() => {
                  if (confirm('Xoá toàn bộ tiến trình và chơi lại từ đầu?')) datKho(khoMoi());
                }}
              >
                Chơi lại từ đầu
              </button>
              <button className="nut-nho" onClick={() => datMoTui(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
