import { useCallback, useEffect, useState } from 'react';
import { DAN_PHUONG, DUOC_LIEU, LUAT, PHU_LIEU, TEN_PHAM, TEN_TUOI_NGAN, anhDan, anhDuocLieu, type Tuoi } from './game/duLieu.ts';
import { banDan, canTui, giaMua, giaMuaPhuLieu, giaTriTui, khoMoi, luuKho, muaDuocLieu, muaPhuLieu, napKho, nhanTroCap, tuLuyen, type Kho } from './game/kho.ts';
import { LoDan } from './manHinh/LoDan.tsx';
import { ManMoDau, ManThienMenh } from './manHinh/ThienMenh.tsx';
import { TuTien } from './manHinh/TuTien.tsx';

/** Luồng màn hình: mở đầu -> (lần đầu) thiên mệnh -> động phủ tu tiên <-> đan phòng. */
type Man = 'mo-dau' | 'thien-menh' | 'tu-tien' | 'lo-dan';
type Bang = null | 'tui' | 'phuong-thi';

export function UngDung() {
  const [kho, datKho] = useState<Kho>(napKho);
  const [man, datMan] = useState<Man>('mo-dau');
  const [bang, datBang] = useState<Bang>(null);
  const [dangLuyen, datDangLuyen] = useState(false);

  useEffect(() => luuKho(kho), [kho]);

  const doiKho = useCallback((ham: (k: Kho) => Kho) => datKho(ham), []);

  // tu vi tăng đều mỗi giây chừng nào game còn mở, dù đang ở động phủ hay đan phòng
  const coNhanVat = !!kho.nhanVat;
  useEffect(() => {
    if (!coNhanVat || man === 'mo-dau' || man === 'thien-menh') return;
    const id = setInterval(() => datKho((k) => tuLuyen(k, 1)), 1000);
    return () => clearInterval(id);
  }, [coNhanVat, man]);

  if (man === 'mo-dau') {
    return (
      <div className="ung-dung toi">
        <ManMoDau daCoNhanVat={coNhanVat} onVao={() => datMan(coNhanVat ? 'tu-tien' : 'thien-menh')} />
      </div>
    );
  }

  if (man === 'thien-menh' || !kho.nhanVat) {
    return (
      <div className="ung-dung toi">
        <ManThienMenh
          onXong={(nv) => {
            datKho(khoMoi(nv));
            datMan('tu-tien');
          }}
        />
      </div>
    );
  }

  if (man === 'tu-tien') {
    return (
      <div className="ung-dung">
        <TuTien
          kho={kho}
          nhanVat={kho.nhanVat}
          onLuyenDan={() => datMan('lo-dan')}
          onChoiLai={() => {
            datKho(khoMoi());
            datMan('mo-dau');
          }}
        />
      </div>
    );
  }

  const tongDan = DAN_PHUONG.reduce((s, p) => {
    const t = kho.tuiDan[p.id];
    return s + t[0] + t[1] + t[2] + t[3] + (kho.danVan[p.id] ?? 0);
  }, 0);
  const tongGiaTri = DAN_PHUONG.reduce((s, p) => s + giaTriTui(kho, p.id), 0);

  return (
    <div className="ung-dung">
      <header className="thanh-tren">
        <span className="nhom-nut">
          <button className="nut-nho" disabled={dangLuyen} onClick={() => datMan('tu-tien')} title={dangLuyen ? 'Đang luyện dở một mẻ' : 'Về động phủ'}>
            ‹ Động phủ
          </button>
          <span className="linh-thach">
            <i className="cham-linh-thach" />
            {kho.linhThach}
          </span>
        </span>
        <span className="nhom-nut">
          <button className="nut-nho" onClick={() => datBang('phuong-thi')}>
            Phường thị
          </button>
          <button className="nut-nho" onClick={() => datBang('tui')}>
            Túi đan ({tongDan})
          </button>
        </span>
      </header>

      <LoDan kho={kho} doiKho={doiKho} onDangLuyen={datDangLuyen} />

      {bang === 'tui' && (
        <div className="lop-phu" onClick={() => datBang(null)}>
          <div className="bang tam" onClick={(e) => e.stopPropagation()}>
            <h2>Túi đan</h2>
            {tongDan === 0 && <p className="chu-nho">Chưa có viên đan nào. Hãy khai lò luyện một mẻ.</p>}
            {DAN_PHUONG.map((p) => {
              const t = kho.tuiDan[p.id];
              const dv = kho.danVan[p.id] ?? 0;
              const gt = giaTriTui(kho, p.id);
              if (gt <= 0) return null;
              return (
                <div key={p.id} className="dong-tui">
                  <img src={anhDan(p.id)} alt="" />
                  <div className="than-dong">
                    <b>{p.ten}</b>
                    <div className="hang-pham">
                      {TEN_PHAM.map((ten, i) => t[i] > 0 && (
                        <span key={ten} className={`pham-${i}`}>
                          {ten} ×{t[i]}
                        </span>
                      ))}
                      {dv > 0 && <span className="pham-dv">Đan văn ×{dv}</span>}
                    </div>
                  </div>
                  <button className="nut-nho" onClick={() => doiKho((k) => banDan(k, p.id))}>
                    Bán {gt}
                  </button>
                </div>
              );
            })}
            {tongGiaTri > 0 && (
              <button className="nut chinh rong" onClick={() => doiKho((k) => DAN_PHUONG.reduce((kk, p) => banDan(kk, p.id), k))}>
                Bán tất cả lấy {tongGiaTri} linh thạch
              </button>
            )}
            <p className="chu-nho">
              Đã luyện {kho.thongKe.soMe} mẻ, nổ lò {kho.thongKe.noLo} lần. Phường thị thu mua {Math.round(LUAT.heSoBan * 100)}% giá trị.
            </p>
            <div className="hang-nut">
              <button className="nut-nho" onClick={() => datBang(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {bang === 'phuong-thi' && (
        <div className="lop-phu" onClick={() => datBang(null)}>
          <div className="bang tam" onClick={(e) => e.stopPropagation()}>
            <h2>Phường thị</h2>
            <p className="chu-nho">
              Đang có {kho.linhThach} linh thạch. Giá theo tuổi thuốc: {TEN_TUOI_NGAN.join(' / ')}.
            </p>
            {DUOC_LIEU.map((d) => (
              <div key={d.id} className="dong-tui">
                <img src={anhDuocLieu(d.id)} alt="" />
                <div className="than-dong">
                  <b>{d.ten}</b>
                  <div className="hang-pham">
                    <span>Đang có: {kho.duocLieu[d.id].join(' / ')}</span>
                  </div>
                </div>
                <span className="nhom-mua">
                  {([0, 1, 2] as Tuoi[]).map((t) => {
                    const g = giaMua(kho, d.id, t);
                    return (
                      <button key={t} className={`nut-nho tuoi-${t}`} disabled={kho.linhThach < g} onClick={() => doiKho((k) => muaDuocLieu(k, d.id, t))}>
                        {g}
                      </button>
                    );
                  })}
                </span>
              </div>
            ))}
            {PHU_LIEU.map((p) => {
              const g = giaMuaPhuLieu(kho, p.id);
              return (
                <div key={p.id} className="dong-tui">
                  <div className="than-dong">
                    <b>
                      {p.ten} <small>(có {kho.phuLieu[p.id] ?? 0})</small>
                    </b>
                    <div className="hang-pham">
                      <span>{p.moTa}</span>
                    </div>
                  </div>
                  <button className="nut-nho" disabled={kho.linhThach < g} onClick={() => doiKho((k) => muaPhuLieu(k, p.id))}>
                    {g}
                  </button>
                </div>
              );
            })}
            <div className="hang-nut">
              {canTui(kho) && (
                <button className="nut-nho" onClick={() => doiKho(nhanTroCap)}>
                  Xin tông môn trợ cấp (+{LUAT.troCap})
                </button>
              )}
              <button className="nut-nho" onClick={() => datBang(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
