import { useCallback, useEffect, useRef, useState } from 'react';
import { datNhac, phat } from './amThanh.ts';
import { DAN_PHUONG, anhNen } from './game/duLieu.ts';
import { danhDauXong, nhiemVuNay, vuaXong } from './game/danDuong.ts';
import { vaoBanDo } from './game/kyNgo.ts';
import { dsChuyen, khoMoi, lamMoiDon, luuKho, napKho, soVienHopDon, tuLuyen, type Kho } from './game/kho.ts';
import { BanDo } from './manHinh/BanDo.tsx';
import { DuongDan } from './manHinh/DuongDan.tsx';
import { LoDan } from './manHinh/LoDan.tsx';
import { PhuongThi } from './manHinh/PhuongThi.tsx';
import { SaoLuu } from './manHinh/SaoLuu.tsx';
import { ManMoDau, ManThienMenh } from './manHinh/ThienMenh.tsx';
import { TuiDan } from './manHinh/TuiDan.tsx';
import { TuTien } from './manHinh/TuTien.tsx';
import { VuonDuoc } from './manHinh/VuonDuoc.tsx';

/** Luồng màn hình: mở đầu -> (lần đầu) thiên mệnh -> động phủ tu tiên <-> đan phòng / vườn dược / bản đồ du ngoạn. */
type Man = 'mo-dau' | 'thien-menh' | 'tu-tien' | 'lo-dan' | 'vuon' | 'ban-do';
type Bang = null | 'tui' | 'don' | 'phuong-thi' | 'sao-luu' | 'duong';

export function UngDung() {
  const [kho, datKho] = useState<Kho>(napKho);
  const [man, datMan] = useState<Man>('mo-dau');
  const [bang, datBang] = useState<Bang>(null);
  const [dangLuyen, datDangLuyen] = useState(false);

  useEffect(() => luuKho(kho), [kho]);

  // nhạc nền theo màn: đan phòng và vườn dược có bản riêng, còn lại dùng bản của động phủ
  useEffect(() => {
    datNhac(man === 'lo-dan' ? 'dan-phong' : man === 'vuon' ? 'vuon' : 'dong-phu');
  }, [man]);

  // linh thạch đổi (mua, bán, giao đơn) thì kêu một tiếng; đổi nhân vật hay nạp bản lưu thì không
  const linhThachCu = useRef({ so: kho.linhThach, ten: kho.nhanVat?.ten });
  useEffect(() => {
    const cu = linhThachCu.current;
    if (cu.ten === kho.nhanVat?.ten && cu.so !== kho.linhThach) phat('linh-thach');
    linhThachCu.current = { so: kho.linhThach, ten: kho.nhanVat?.ten };
  }, [kho.linhThach, kho.nhanVat?.ten]);

  const doiKho = useCallback((ham: (k: Kho) => Kho) => datKho(ham), []);

  // nhiệm vụ dẫn đường: mỗi lần kho đổi thì xét nhiệm vụ đang làm đã xong chưa, xong thì báo một dòng ở đầu màn
  const [baoXong, datBaoXong] = useState<null | { ten: string; luot: number }>(null);
  const khoTruoc = useRef(kho);
  useEffect(() => {
    const truoc = khoTruoc.current.nhanVat?.ten === kho.nhanVat?.ten ? khoTruoc.current : kho;
    khoTruoc.current = kho;
    if (!kho.nhanVat || !vuaXong(truoc, kho)) return;
    const ten = nhiemVuNay(kho)!.ten;
    datKho((k) => danhDauXong(k));
    // lúc mới mở game (màn mở đầu) thì chỉ đánh dấu lặng lẽ, thẻ nhiệm vụ ở động phủ sẽ tự sáng
    if (man === 'mo-dau' || man === 'thien-menh') return;
    phat('toi-trung');
    datBaoXong({ ten, luot: Date.now() });
    // chỉ xét khi kho đổi; đổi màn không cần xét lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kho]);
  useEffect(() => {
    if (!baoXong) return;
    const id = setTimeout(() => datBaoXong(null), 3500);
    return () => clearTimeout(id);
  }, [baoXong]);
  const theBao = baoXong && (
    <div key={baoXong.luot} className="bao-nhiem-vu" onClick={() => datBaoXong(null)}>
      <small>Nhiệm vụ hoàn thành</small>
      <b>{baoXong.ten}</b>
      <span>Về động phủ nhận thưởng</span>
    </div>
  );

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
        <ManMoDau daCoNhanVat={coNhanVat} onVao={() => datMan(coNhanVat ? 'tu-tien' : 'thien-menh')} onSaoLuu={() => datBang('sao-luu')} />
        {bang === 'sao-luu' && <SaoLuu kho={kho} onNap={(k) => datKho(k)} onDong={() => datBang(null)} />}
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
          onDuNgoan={() => {
            datKho((k) => vaoBanDo(k));
            datMan('ban-do');
          }}
          onMonPhai={() => datBang('tui')}
          onCaiDat={() => datBang('sao-luu')}
          onChoiLai={() => {
            datKho(khoMoi());
            datMan('mo-dau');
          }}
        />
        {bang === 'tui' && <TuiDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
        {bang === 'sao-luu' && <SaoLuu kho={kho} onNap={(k) => datKho(k)} onDong={() => datBang(null)} />}
      </div>
    );
  }

  if (man === 'ban-do') {
    return (
      <div className="ung-dung nen-giay">
        <BanDo kho={kho} doiKho={doiKho} onVe={() => datMan('tu-tien')} />
        {theBao}
      </div>
    );
  }

  const tongDan = DAN_PHUONG.reduce((s, p) => {
    const t = kho.tuiDan[p.id];
    return s + t[0] + t[1] + t[2] + t[3] + (kho.danVan[p.id] ?? 0);
  }, dsChuyen(kho).reduce((s, c) => s + c.co, 0));
  const oVuon = man === 'vuon';
  /** Số đơn tông môn đang đủ đan để giao. */
  const donDu = kho.donHang.ds.filter((d) => d && soVienHopDon(kho, d) >= d.soLuong).length;

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
      {/* thanh trên đã chật nên nút đơn hàng và dưỡng đan nằm riêng ngay bên dưới; đang luyện dở thì ẩn nút dưỡng */}
      {!oVuon && (
        <div className="nut-duong-noi">
          <button className={`nut-nho ${donDu ? 'co-don' : ''}`} onClick={() => datBang('don')}>
            Đơn tông môn{donDu ? ` (${donDu})` : ''}
          </button>
          {!dangLuyen && (
            <button className="nut-nho" onClick={() => datBang('duong')}>
              Dưỡng đan
            </button>
          )}
        </div>
      )}

      {oVuon ? <VuonDuoc kho={kho} doiKho={doiKho} /> : <LoDan kho={kho} doiKho={doiKho} onDangLuyen={datDangLuyen} />}

      {bang === 'tui' && <TuiDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} trangDau="ban-le" />}
      {bang === 'don' && <TuiDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
      {bang === 'phuong-thi' && <PhuongThi kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
      {(bang === 'duong' || kho.duong) && <DuongDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
      {theBao}
    </div>
  );
}
