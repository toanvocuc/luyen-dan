import { useCallback, useEffect, useState } from 'react';
import { DAN_PHUONG, anhNen } from './game/duLieu.ts';
import { khoMoi, lamMoiDon, luuKho, napKho, tuLuyen, type Kho } from './game/kho.ts';
import { LoDan } from './manHinh/LoDan.tsx';
import { PhuongThi } from './manHinh/PhuongThi.tsx';
import { ManMoDau, ManThienMenh } from './manHinh/ThienMenh.tsx';
import { TuiDan } from './manHinh/TuiDan.tsx';
import { TuTien } from './manHinh/TuTien.tsx';
import { VuonDuoc } from './manHinh/VuonDuoc.tsx';

/** Luồng màn hình: mở đầu -> (lần đầu) thiên mệnh -> động phủ tu tiên <-> đan phòng / vườn dược. */
type Man = 'mo-dau' | 'thien-menh' | 'tu-tien' | 'lo-dan' | 'vuon';
type Bang = null | 'tui' | 'phuong-thi';

export function UngDung() {
  const [kho, datKho] = useState<Kho>(napKho);
  const [man, datMan] = useState<Man>('mo-dau');
  const [bang, datBang] = useState<Bang>(null);
  const [dangLuyen, datDangLuyen] = useState(false);

  useEffect(() => luuKho(kho), [kho]);

  const doiKho = useCallback((ham: (k: Kho) => Kho) => datKho(ham), []);

  // tu vi tăng đều mỗi giây chừng nào game còn mở, dù đang ở động phủ, đan phòng hay vườn dược;
  // cùng nhịp đó, chỗ đơn hàng nào hết thời gian chờ thì có đơn mới
  const coNhanVat = !!kho.nhanVat;
  useEffect(() => {
    if (!coNhanVat || man === 'mo-dau' || man === 'thien-menh') return;
    datKho((k) => lamMoiDon(k));
    const id = setInterval(() => datKho((k) => lamMoiDon(tuLuyen(k, 1))), 1000);
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
      <div className="ung-dung" style={{ backgroundImage: anhNen('dong-phu', kho.tuVi.canhGioi) }}>
        <TuTien
          kho={kho}
          nhanVat={kho.nhanVat}
          doiKho={doiKho}
          onLuyenDan={() => datMan('lo-dan')}
          onVuon={() => datMan('vuon')}
          onMonPhai={() => datBang('tui')}
          onChoiLai={() => {
            datKho(khoMoi());
            datMan('mo-dau');
          }}
        />
        {bang === 'tui' && <TuiDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
      </div>
    );
  }

  const tongDan = DAN_PHUONG.reduce((s, p) => {
    const t = kho.tuiDan[p.id];
    return s + t[0] + t[1] + t[2] + t[3] + (kho.danVan[p.id] ?? 0);
  }, 0);
  const oVuon = man === 'vuon';

  return (
    <div className="ung-dung" style={{ backgroundImage: oVuon ? 'url(./hinh/nen/vuon.jpg)' : anhNen('dan-phong', kho.tuVi.canhGioi) }}>
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
          {!oVuon && (
            <button className="nut-nho" onClick={() => datBang('tui')}>
              Túi đan ({tongDan})
            </button>
          )}
        </span>
      </header>

      {oVuon ? <VuonDuoc kho={kho} doiKho={doiKho} /> : <LoDan kho={kho} doiKho={doiKho} onDangLuyen={datDangLuyen} />}

      {bang === 'tui' && <TuiDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
      {bang === 'phuong-thi' && <PhuongThi kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
    </div>
  );
}
