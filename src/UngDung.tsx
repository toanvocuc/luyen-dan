import { useCallback, useEffect, useRef, useState } from 'react';
import { datNhac, phat } from './amThanh.ts';
import { DAN_PHUONG, anhNen } from './game/duLieu.ts';
import { danhDauXong, nhiemVuNay, vuaXong, type NoiLam } from './game/danDuong.ts';
import { lyDoKhongDi, vaoBanDo } from './game/kyNgo.ts';
import { taiCot, taiNgam } from './taiTruoc.ts';
import { dsChuyen, khoMoi, lamMoiDon, luuKho, napKho, soVienHopDon, tuLuyen, type Kho } from './game/kho.ts';
import { BanDo } from './manHinh/BanDo.tsx';
import { TheTrangThai } from './manHinh/TheTrangThai.tsx';
import { KhoiDau } from './manHinh/KhoiDau.tsx';
import { nhanQua, type LoaiQua } from './game/quaMoDau.ts';
import { ChiTay } from './manHinh/ChiTay.tsx';
import { NutAnh, ThanhDieuHuong, type ManChinh } from './manHinh/DieuHuong.tsx';
import { DanThu } from './manHinh/DanThu.tsx';
import { DuongDan } from './manHinh/DuongDan.tsx';
import { LoDan } from './manHinh/LoDan.tsx';
import { PhuongThi } from './manHinh/PhuongThi.tsx';
import { SaoLuu } from './manHinh/SaoLuu.tsx';
import { ManMoDau, ManThienMenh } from './manHinh/ThienMenh.tsx';
import { TuiDan } from './manHinh/TuiDan.tsx';
import { TuTien } from './manHinh/TuTien.tsx';
import { VuonDuoc } from './manHinh/VuonDuoc.tsx';

/** Luồng màn hình: mở đầu -> (lần đầu) thiên mệnh -> động phủ tu tiên <-> đan phòng / vườn dược / bản đồ du ngoạn. */
type Man = 'mo-dau' | 'khoi-dau' | 'thien-menh' | 'tu-tien' | 'lo-dan' | 'vuon' | 'ban-do';
type Bang = null | 'tui' | 'don' | 'phuong-thi' | 'sao-luu' | 'duong' | 'dan-thu' | 'tang-bao';

export function UngDung() {
  const [kho, datKho] = useState<Kho>(napKho);
  const [man, datMan] = useState<Man>('mo-dau');
  const [bang, datBang] = useState<Bang>(null);
  const [dangLuyen, datDangLuyen] = useState(false);
  /** Quà người chơi mới chọn ở đoạn mở đầu, chờ tạo xong nhân vật ở màn thiên mệnh. */
  const [quaCho, datQuaCho] = useState<LoaiQua | null>(null);
  /** Đan phương chọn sẵn khi mở đan phòng từ Đan thư. */
  const [chonSan, datChonSan] = useState<{ id: string; luot: number } | null>(null);

  useEffect(() => luuKho(kho), [kho]);

  // màn tải: ảnh cốt tải xong mới cho vào; vào game rồi thì tải ngầm phần còn lại
  const [tienDo, datTienDo] = useState(0);
  useEffect(() => {
    let huy = false;
    void taiCot(kho, (x) => !huy && datTienDo((c) => Math.max(c, Math.min(0.99, x)))).then(() => !huy && datTienDo(1));
    return () => {
      huy = true;
    };
    // chỉ tải một lần lúc mở game
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (man !== 'mo-dau') taiNgam();
  }, [man]);

  // nhạc nền theo màn: đan phòng và vườn dược có bản riêng, còn lại dùng bản của động phủ
  useEffect(() => {
    datNhac(man === 'lo-dan' ? 'dan-phong' : man === 'vuon' ? 'vuon' : man === 'ban-do' ? 'du-ngoan' : 'dong-phu');
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
        <ManMoDau daCoNhanVat={coNhanVat} tienDo={tienDo} onVao={() => datMan(!coNhanVat || !kho.quaMoDau ? 'khoi-dau' : 'tu-tien')} onSaoLuu={() => datBang('sao-luu')} />
        {bang === 'sao-luu' && <SaoLuu kho={kho} onNap={(k) => datKho(k)} onDong={() => datBang(null)} />}
      </div>
    );
  }

  // đoạn mở đầu: người chơi mới chọn quà rồi sang thiên mệnh; người chơi cũ chưa nhận quà thì nhận bản nhẹ rồi vào động phủ
  if (man === 'khoi-dau') {
    return (
      <div className="ung-dung toi">
        <KhoiDau
          cu={coNhanVat}
          onXong={(loai) => {
            if (coNhanVat) {
              datKho((k) => nhanQua(k, loai, true));
              datMan('tu-tien');
            } else {
              datQuaCho(loai);
              datMan('thien-menh');
            }
          }}
        />
      </div>
    );
  }

  if (man === 'thien-menh' || !kho.nhanVat) {
    return (
      <div className="ung-dung toi">
        <ManThienMenh
          onXong={(nv) => {
            datKho(quaCho ? nhanQua(khoMoi(nv), quaCho, false) : khoMoi(nv));
            datQuaCho(null);
            datMan('tu-tien');
          }}
        />
      </div>
    );
  }

  /** Số đơn tông môn đang đủ đan để giao. */
  const donDu = kho.donHang.ds.filter((d) => d && soVienHopDon(kho, d) >= d.soLuong).length;
  // thanh nút đáy dùng chung cho mọi màn chính; đang luyện dở một mẻ thì ẩn để không bỏ lò giữa chừng
  const coDay = !dangLuyen;
  const thanhDay = coDay && (
    <ThanhDieuHuong
      man={man as ManChinh}
      kho={kho}
      onChon={(m) => {
        datBang(null);
        if (m === man) return;
        if (m === 'ban-do') datKho((k) => vaoBanDo(k));
        datMan(m);
      }}
      onPhuongThi={() => datBang('phuong-thi')}
    />
  );
  const phuongThi = bang === 'phuong-thi' && <PhuongThi kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />;
  // Đan thư: "Luyện đan này" -> sang đan phòng với đúng đan phương đó
  const danThu = bang === 'dan-thu' && (
    <DanThu
      kho={kho}
      onDong={() => datBang(null)}
      onLuyen={(id) => {
        datBang(null);
        datChonSan((c) => ({ id, luot: (c?.luot ?? 0) + 1 }));
        datMan('lo-dan');
      }}
    />
  );
  /** Chạm nhiệm vụ: mở đúng chỗ cần làm. */
  const diToi = (noi: NoiLam) => {
    if (noi === 'phuong-thi') return datBang('phuong-thi');
    if (noi === 'don') return datBang('tui');
    if (noi === 'ban-do') {
      if (lyDoKhongDi(kho)) return;
      datKho((k) => vaoBanDo(k));
      return datMan('ban-do');
    }
    if (noi === 'duong') {
      datMan('lo-dan');
      return datBang('duong');
    }
    if (noi === 'lo-dan' || noi === 'vuon') datMan(noi);
  };
  // thẻ trạng thái (tẩu hỏa, trúng độc, mất hồn): phủ lên mọi màn chính, bấm "Đã hiểu" mới tắt
  const theTrangThai = kho.thongBao && <TheTrangThai key={kho.thongBao.luc} thongBao={kho.thongBao} onXong={() => datKho((k) => ({ ...k, thongBao: null }))} />;
  // chỉ tay lần đầu: phủ lên mọi màn chính
  const chiTay = <ChiTay daXem={kho.daChiTay} bat={!!kho.nhanVat} onXem={(ids) => datKho((k) => ({ ...k, daChiTay: [...new Set([...k.daChiTay, ...ids])] }))} />;

  if (man === 'tu-tien') {
    return (
      <div className={`ung-dung ${coDay ? 'co-day' : ''}`} style={{ backgroundImage: anhNen('dong-phu', kho.tuVi.canhGioi) }}>
        <TuTien
          kho={kho}
          nhanVat={kho.nhanVat}
          doiKho={doiKho}
          donDu={donDu}
          onDanThu={() => datBang('dan-thu')}
          onDiToi={diToi}
          onTangBao={() => datBang('tang-bao')}
          onLuyenDan={() => datMan('lo-dan')}
          onMonPhai={() => datBang('tui')}
          onCaiDat={() => datBang('sao-luu')}
          onChoiLai={() => {
            datKho(khoMoi());
            datMan('mo-dau');
          }}
        />
        {thanhDay}
        {bang === 'tui' && <TuiDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
        {bang === 'tang-bao' && <TuiDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} trangDau="tang-bao" />}
        {theTrangThai}
        {bang === 'sao-luu' && (
          <SaoLuu kho={kho} onNap={(k) => datKho(k)} onDong={() => datBang(null)} onXemLaiHuongDan={() => datKho((k) => ({ ...k, daChiTay: [] }))} />
        )}
        {phuongThi}
        {danThu}
        {chiTay}
      </div>
    );
  }

  if (man === 'ban-do') {
    return (
      <div className="ung-dung nen-giay co-day">
        <BanDo kho={kho} doiKho={doiKho} onVe={() => datMan('tu-tien')} />
        {thanhDay}
        {phuongThi}
        {theBao}
        {theTrangThai}
        {chiTay}
      </div>
    );
  }

  const tongDan = DAN_PHUONG.reduce((s, p) => {
    const t = kho.tuiDan[p.id];
    return s + t[0] + t[1] + t[2] + t[3] + (kho.danVan[p.id] ?? 0);
  }, dsChuyen(kho).reduce((s, c) => s + c.co, 0));
  const oVuon = man === 'vuon';

  return (
    <div className={`ung-dung ${coDay ? 'co-day' : ''}`} style={{ backgroundImage: oVuon ? 'url(./hinh/nen/vuon.webp)' : anhNen('dan-phong', kho.tuVi.canhGioi) }}>
      {/* thanh trên chỉ để thông tin; việc riêng của đan phòng là cột nút tròn ở mép phải */}
      <header className="thanh-tren">
        <b className="ten-man">{oVuon ? 'Vườn dược' : 'Đan phòng'}</b>
        <span className="linh-thach">
          <i className="cham-linh-thach" />
          {kho.linhThach}
        </span>
      </header>
      {!oVuon && !dangLuyen && (
        <div className="cot-nut">
          <NutAnh anh="tui-dan" ten="Túi đan" chu="囊" so={tongDan} onClick={() => datBang('tui')} />
          <NutAnh anh="mon-phai" ten="Đơn hàng" chu="門" so={donDu} onClick={() => datBang('don')} />
        </div>
      )}
      {/* màn thấp chỉ đủ chỗ hai nút mỗi bên trên bảng phối liệu, nên Dưỡng đan nằm bên trái */}
      {!oVuon && !dangLuyen && (
        <div className="cot-nut trai">
          <NutAnh anh="duong-dan" ten="Dưỡng đan" chu="養" onClick={() => datBang('duong')} />
          <NutAnh anh="dan-thu" ten="Đan thư" chu="書" onClick={() => datBang('dan-thu')} />
        </div>
      )}

      {oVuon ? <VuonDuoc kho={kho} doiKho={doiKho} /> : <LoDan kho={kho} doiKho={doiKho} onDangLuyen={datDangLuyen} chonSan={chonSan} />}

      {thanhDay}
      {bang === 'tui' && <TuiDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} trangDau="ban-le" />}
      {bang === 'don' && <TuiDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
      {phuongThi}
      {danThu}
      {(bang === 'duong' || kho.duong) && <DuongDan kho={kho} doiKho={doiKho} onDong={() => datBang(null)} />}
      {theBao}
      {theTrangThai}
      {chiTay}
    </div>
  );
}
