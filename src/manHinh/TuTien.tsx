// Động phủ: nhân vật ngồi tu luyện, tu vi tự tăng; từ đây mở hành trang, xem thiên mệnh, sang đan phòng.
import { useState } from 'react';
import { QUA, tacDungQua } from '../game/quaMoDau.ts';
import { phat } from '../amThanh.ts';
import { CANH_GIOI, CHI_SO, DAN_DUOC, timDanDuoc, timTongMon, DAN_PHUONG, DUOC_LIEU, LUAT, PHU_LIEU, TEN_MOC, TEN_PHAM, TEN_TUOI_NGAN, anhDan, anhDuocLieu, mocChuyen, timDanPhuong, type PhamThat } from '../game/duLieu.ts';
import { chiSo, chiSoDan, danBinhCanh, dangBinhCanh, giayTauHoa, phaBinhCanh, tiLeBinhCanh, heSoTrungDoc, luaChonDotPha, thieuDotPha, yeuCauDotPha, danDotPha, docHienTai, dotPha, dsChuyen, duocLucChuyen, mauHienTai, mauToiDa, soTang, tocDoTuVi, tuViCan, uongChuyen, uongDan, vienMan, xemUong, xemUongChuyen, type Kho } from '../game/kho.ts';
import type { NhanVat } from '../game/nhanVat.ts';
import { dongHo, useBayGio } from './PhuongThi.tsx';
import { BupBe } from './BupBe.tsx';
import { dongThienMenh } from './ThienMenh.tsx';
import { giayKhoaMatHon, giayYeuMatHon } from '../game/kyNgo.ts';
import { NutAnh } from './DieuHuong.tsx';
import { AnhThu } from './LinhThuVien.tsx';
import { VAT_VUC, anhVatVuc, dotBua, timVatVuc } from '../game/vucTham.ts';
import { anhThu, noHienTai, thuXuatChien, timLoaiThu } from '../game/linhThu.ts';
import { NHIEM_VU, chuThuong, nhanThuongDan, nhiemVuNay, type NoiLam } from '../game/danDuong.ts';

type Bang = null | 'hanh-trang' | 'thien-menh' | 'dot-pha' | 'chi-so' | 'binh-canh';

export function TuTien({
  kho,
  nhanVat,
  doiKho,
  donDu,
  onDiToi,
  onDanThu,
  onTangBao,
  onLinhThu,
  onLuyenDan,
  onMonPhai,
  onCaiDat,
  onChoiLai,
}: {
  kho: Kho;
  nhanVat: NhanVat;
  doiKho: (ham: (k: Kho) => Kho) => void;
  /** Số đơn tông môn đang đủ đan để giao (chấm đỏ trên nút Đơn hàng). */
  donDu: number;
  /** Mở sổ tay đan dược. */
  onDanThu: () => void;
  /** Đi tới chỗ làm nhiệm vụ (màn khác hoặc bảng của màn cha). */
  onDiToi: (noi: NoiLam) => void;
  /** Mở Tàng Bảo Các (đổi danh vọng lấy dẫn dược). */
  onTangBao: () => void;
  /** Mở Linh Thú Viên (nuôi thú, ấp trứng). */
  onLinhThu: () => void;
  onLuyenDan: () => void;
  /** Mở bảng đơn hàng của các tông môn. */
  onMonPhai: () => void;
  /** Mở bảng cài đặt (âm thanh, sao lưu). */
  onCaiDat: () => void;
  onChoiLai: () => void;
}) {
  const [bang, datBang] = useState<Bang>(null);
  const can = tuViCan(kho.tuVi.tang, kho.tuVi.canhGioi);
  /** Kết quả lần đột phá vừa rồi, để dựng cảnh báo tin; bấm vào là tắt. */
  const [ketQuaDotPha, datKetQuaDotPha] = useState<null | { thanh: boolean; ten: string; luot: number; giuLai: number; hoDao: boolean; dai: boolean; binhCanh?: boolean }>(null);
  const danCan = danDotPha(kho);
  const phamNhan = kho.tuVi.canhGioi === 0;

  const thuDotPha = (pham: PhamThat, danVan: boolean) => {
    // quay số ở đây rồi mới ghi vào kho, để cảnh báo tin và kho luôn khớp nhau
    const kq = dotPha(kho, pham, danVan, Math.random());
    if (!kq) return;
    doiKho(() => kq.kho);
    phat(kq.thanh ? 'dot-pha' : 'toi-truot');
    datBang(null);
    datKetQuaDotPha({ thanh: kq.thanh, ten: CANH_GIOI[kho.tuVi.canhGioi + 1], luot: Date.now(), giuLai: kq.giuLai, hoDao: kq.hoDao, dai: yeuCauDotPha(kho).dai });
  };
  const day = vienMan(kho);
  const tocDo = tocDoTuVi(kho);
  const luc = useBayGio();
  /** Đan đã dưỡng lên chuyển, uống từng viên một. */
  const danDaDuong = dsChuyen(kho);
  const docNay = docHienTai(kho, luc);
  const yeuMatHon = giayYeuMatHon(kho, luc);
  const nhiemVu = nhiemVuNay(kho);
  const binhCanh = dangBinhCanh(kho);
  const thu = thuXuatChien(kho);
  /** Chấm đỏ nút Linh thú: có thú vừa nở chờ nhận, hoặc thú xuất chiến đang đói. */
  const chamThu = !!kho.thuMoiNo || (!!thu && noHienTai(thu, luc) < 25);
  /** Thẻ nhiệm vụ đang mở hay thu gọn thành cuộn thư (mặc định thu gọn để không che màn). */
  const [moNhiemVu, datMoNhiemVu] = useState(false);
  /** Câu tả lần đốt Bùa Vực Thẳm vừa rồi. */
  const [baoBua, datBaoBua] = useState('');
  const diToi = (noi: NoiLam) => {
    datMoNhiemVu(false);
    if (noi === 'tui-do') datBang('hanh-trang');
    else if (noi === 'dong-phu') {
      if (day && danCan) datBang('dot-pha');
    } else onDiToi(noi);
  };
  /** Số viên muốn uống của từng dòng trong hành trang (khoá = id đan | phẩm); chưa chỉnh thì là 1. */
  const [soUong, datSoUong] = useState<Record<string, number>>({});
  // mỗi loại đan ở mỗi phẩm là một dòng, phẩm cao đứng trước
  const dongDan: { khoa: string; id: string; ten: string; loai: PhamThat | 'dv'; co: number }[] = [];
  for (const p of DAN_PHUONG) {
    const dv = kho.danVan[p.id] ?? 0;
    if (dv > 0) dongDan.push({ khoa: `${p.id}|dv`, id: p.id, ten: p.ten, loai: 'dv', co: dv });
    for (const ph of [3, 2, 1, 0] as PhamThat[]) {
      const co = kho.tuiDan[p.id][ph];
      if (co > 0) dongDan.push({ khoa: `${p.id}|${ph}`, id: p.id, ten: p.ten, loai: ph, co });
    }
  }
  const coLieu = DUOC_LIEU.filter((d) => kho.duocLieu[d.id].some((n) => n > 0));
  const coPhu = PHU_LIEU.filter((p) => (kho.phuLieu[p.id] ?? 0) > 0);
  const coHat = DUOC_LIEU.filter((d) => (kho.hatGiong[d.id] ?? 0) > 0);

  return (
    <main className="tu-tien">
      <header className="dau-tu-tien">
        <div>
          <button className="bien-ten" onClick={() => datBang('chi-so')} title="Xem chỉ số">
            {nhanVat.ten}
          </button>
          <small>
            {CANH_GIOI[kho.tuVi.canhGioi]} tầng {kho.tuVi.tang}/{soTang(kho.tuVi.canhGioi)}
          </small>
        </div>
        <span className="nhom-nut">
          <span className="linh-thach">
            <i className="cham-linh-thach" />
            {kho.linhThach}
          </span>
          <button className="nut-nho nut-cai-dat" onClick={onCaiDat} aria-label="Cài đặt" title="Cài đặt">
            ⚙
          </button>
        </span>
      </header>

      <div className="cot-nut">
        <NutAnh anh="tui-do" ten="Túi đồ" chu="囊" onClick={() => datBang('hanh-trang')} />
        <NutAnh anh="mon-phai" ten="Đơn hàng" chu="門" so={donDu} onClick={onMonPhai} />
        <NutAnh anh="dan-thu" ten="Đan thư" chu="書" onClick={onDanThu} />
        <NutAnh anh="tang-bao-cac" ten="Tàng Bảo" chu="寶" onClick={onTangBao} />
      </div>

      <div className="cot-nut trai nut-nhiem-vu">
        {nhiemVu && <NutAnh anh="nhiem-vu" ten="Nhiệm vụ" chu="卷" dang={moNhiemVu} cham={kho.danDuong.xong} onClick={() => datMoNhiemVu((x) => !x)} />}
        <NutAnh anh="linh-thu" ten="Linh thú" chu="獸" cham={chamThu} onClick={onLinhThu} />
      </div>
      {nhiemVu && moNhiemVu && (
        <section className={`the-nhiem-vu ${kho.danDuong.xong ? 'xong' : ''}`}>
          <button className="dong-nhiem-vu" onClick={() => datMoNhiemVu(false)} aria-label="Thu gọn">
            ×
          </button>
          <button className="dau-nhiem-vu" onClick={() => !kho.danDuong.xong && diToi(nhiemVu.den)}>
            <small>
              Dẫn đường {kho.danDuong.buoc + 1}/{NHIEM_VU.length}
            </small>
            <b>{nhiemVu.ten}</b>
            {!kho.danDuong.xong && <span className="goi-y-nhiem-vu">{nhiemVu.goiY}</span>}
          </button>
          {kho.danDuong.xong ? (
            <button
              className="nut-nho nut-nhan-thuong"
              onClick={() => {
                phat('linh-thach');
                doiKho(nhanThuongDan);
              }}
            >
              Nhận: {chuThuong(nhiemVu.thuong)}
            </button>
          ) : (
            nhiemVu.den !== 'dong-phu' && (
              <button className="nut-nho nut-di-toi" onClick={() => diToi(nhiemVu.den)}>
                Đi làm ›
              </button>
            )
          )}
        </section>
      )}

      <div className={`san-tu-luyen ${yeuMatHon > 0 ? 'mat-hon' : ''}`}>
        <div className={`hao-quang ${day ? 'day' : ''}`} />
        <BupBe dang={nhanVat.dang} gioiTinh={nhanVat.gioiTinh} />
        {thu && (
          <button className={`thu-dong-phu dang-${thu.dang}`} onClick={onLinhThu} aria-label={timLoaiThu(thu.loai).ten}>
            <AnhThu src={anhThu(thu.loai, thu.dang)} ten={timLoaiThu(thu.loai).ten} />
          </button>
        )}
      </div>

      <section className="bang day tu-vi">
        <div className="dong-tu-vi">
          <span>Tu vi</span>
          <b>
            {Math.floor(kho.tuVi.diem)} / {can}
          </b>
        </div>
        <div className="tien-do">
          <div style={{ width: `${Math.min(100, (kho.tuVi.diem / can) * 100)}%` }} />
        </div>
        {(docNay >= 0.5 || kho.tangToc.giay > 0) && (
          <div className="dong-doc">
            <span>Đan độc</span>
            <div className="tien-do doc">
              <div style={{ width: `${Math.min(100, (docNay / LUAT.doc.day) * 100)}%` }} />
            </div>
            <b>
              {Math.round(docNay)}/{LUAT.doc.day}
            </b>
          </div>
        )}
        {giayTauHoa(kho, luc) > 0 && <p className="chu-nho bao-mat-hon">Tẩu hỏa: tu luyện chỉ còn một nửa, còn {dongHo(giayTauHoa(kho, luc))}.</p>}
        {heSoTrungDoc(docNay) < 1 && (
          <p className="chu-nho bao-mat-hon">
            Trúng độc: mọi chỉ số chỉ còn {Math.round(heSoTrungDoc(docNay) * 100)}%. Độc tự tan {Math.round(3600 / LUAT.doc.giayMoiDiem)} điểm mỗi giờ.
          </p>
        )}
        {yeuMatHon > 0 && (
          <p className="chu-nho bao-mat-hon">
            Mất hồn: mọi chỉ số chỉ còn một nửa, còn {dongHo(yeuMatHon)}.
            {giayKhoaMatHon(kho, luc) > 0 ? ` Du ngoạn lại được sau ${dongHo(giayKhoaMatHon(kho, luc))}.` : ''}
          </p>
        )}
        <p className="chu-nho">
          {binhCanh
            ? `Chạm bình cảnh trung kỳ: tu vi tạm dừng ở tầng ${LUAT.binhCanh.tang}. Dùng một viên đan bậc ${CANH_GIOI[kho.tuVi.canhGioi]} để phá.`
            : day
            ? danCan
              ? `${CANH_GIOI[kho.tuVi.canhGioi]} đã viên mãn. Dùng ${danCan.ten} để đột phá lên ${CANH_GIOI[kho.tuVi.canhGioi + 1]}.`
              : 'Đã đứng trên đỉnh tiên lộ.'
            : phamNhan
              ? `Đang rèn thân dưỡng khí: +${tocDo.toFixed(1)} tu vi mỗi giây.`
              : kho.tangToc.giay > 0
                ? `Đan lực đang vận hành: +${tocDo.toFixed(1)} tu vi mỗi giây, còn ${dongHo(Math.ceil(kho.tangToc.giay))}.`
                : `Đang thổ nạp linh khí: +${tocDo.toFixed(1)} tu vi mỗi giây.`}
        </p>
        {binhCanh && (
          <button className="nut chinh nut-binh-canh" onClick={() => datBang('binh-canh')}>
            Phá bình cảnh trung kỳ
          </button>
        )}
        {day && danCan && (
          <button className="nut chinh nut-dot-pha" onClick={() => datBang('dot-pha')}>
            Đột phá lên {CANH_GIOI[kho.tuVi.canhGioi + 1]}
          </button>
        )}
      </section>

      {bang === 'dot-pha' && danCan && (() => {
        const yc = yeuCauDotPha(kho);
        const ds = luaChonDotPha(kho);
        const thieu = thieuDotPha(kho);
        const duDan = ds.some((o) => o.du);
        const c = LUAT.daiDotPha;
        const matTuVi = yc.dai ? Math.min(c.matTuViToiDa, LUAT.dotPha.matTuVi + c.matTuViThem * (yc.dich - c.tu)) : LUAT.dotPha.matTuVi;
        return (
          <div className="lop-phu" onClick={() => datBang(null)}>
            <div className="bang tam bang-dot-pha" onClick={(e) => e.stopPropagation()}>
              <h2>Đột phá lên {CANH_GIOI[yc.dich]}</h2>
              {yc.dai ? (
                <ul className="dieu-kien-dp">
                  <li className={duDan ? 'du' : 'thieu'}>
                    {yc.soVien} viên {danCan.ten} cùng một phẩm, từ {TEN_PHAM[yc.phamToiThieu].toLowerCase()} trở lên
                  </li>
                  {yc.danDuoc.map((id) => (
                    <li key={id} className={(kho.danDuoc[id] ?? 0) >= 1 ? 'du' : 'thieu'}>
                      <img src={`./hinh/nguyen-lieu/${id}.webp`} alt="" />1 {timDanDuoc(id).ten} ({timTongMon(timDanDuoc(id).tongMon).ten}) · có {kho.danDuoc[id] ?? 0}
                    </li>
                  ))}
                  {yc.vatVuc.map(([id, n]) => (
                    <li key={id} className={(kho.vatVuc[id] ?? 0) >= n ? 'du' : 'thieu'}>
                      <img src={anhVatVuc(id)} alt="" />
                      {n} {timVatVuc(id).ten} (Vực Thẳm) · có {kho.vatVuc[id] ?? 0}
                    </li>
                  ))}
                  <li className={kho.linhThach >= yc.phi ? 'du' : 'thieu'}>Phí lập trận hộ pháp: {yc.phi} linh thạch</li>
                  <li className={kho.hoDao ? 'du' : 'tuy'}>{kho.hoDao ? 'Đã uống Hộ Đạo Đan' : 'Hộ Đạo Đan (không bắt buộc): uống trước để thất bại vẫn giữ nửa số đan'}</li>
                </ul>
              ) : (
                <p className="chu-nho">Chọn một viên {danCan.ten} để dùng. Phẩm càng cao càng dễ thành.</p>
              )}
              <p className="chu-nho canh-bao-dp">
                {yc.dai
                  ? `Thất bại: mất hết đan, dẫn dược và phí; hao ${Math.round(matTuVi * 100)}% tu vi${kho.hoDao ? ' (Hộ Đạo Đan: giữ nửa số đan, không hao tu vi)' : ''}; tẩu hỏa ${Math.round(c.tauHoaGiay / 60)} phút.`
                  : `Thất bại thì mất viên đan và hao ${Math.round(LUAT.dotPha.matTuVi * 100)}% tu vi của tầng này.`}
              </p>
              {ds.length === 0 && <p className="chu-nho trai">Chưa có viên {danCan.ten} nào đủ phẩm. Hãy sang đan phòng luyện thêm.</p>}
              {ds.map((o) => (
                <div key={String(o.loai)} className="dong-tui">
                  <img src={anhDan(danCan.id)} alt="" />
                  <div className="than-dong">
                    <b className={o.loai === 'dv' ? 'pham-dv' : `pham-${o.loai}`}>
                      {o.loai === 'dv' ? 'Đan văn' : TEN_PHAM[o.loai]} ×{o.co}
                    </b>
                    <div className="hang-pham">
                      <span>
                        Thành công {Math.round(o.tiLe * 100)}%{o.chuyen ? ` (+${Math.round(o.chuyen * c.moiChuyen * 100)}% nhờ đan đã dưỡng)` : ''}
                      </span>
                    </div>
                  </div>
                  <button className="nut-nho" disabled={!o.du || thieu.length > 0} onClick={() => thuDotPha(o.loai === 'dv' ? 3 : o.loai, o.loai === 'dv')}>
                    {!o.du ? `Cần ${yc.soVien}` : thieu.length ? 'Thiếu đồ' : 'Đột phá'}
                  </button>
                </div>
              ))}
              {thieu.length > 0 && <p className="chu-nho trai thieu-dp">Còn thiếu: {thieu.join(', ')}. Dẫn dược đổi bằng danh vọng ở Tàng Bảo Các.</p>}
              <div className="hang-nut">
                <button className="nut-nho" onClick={onLuyenDan}>
                  Đan phòng
                </button>
                {yc.dai && (
                  <button className="nut-nho" onClick={onTangBao}>
                    Tàng Bảo Các
                  </button>
                )}
                <button className="nut-nho" onClick={() => datBang(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {bang === 'binh-canh' && (
        <div className="lop-phu" onClick={() => datBang(null)}>
          <div className="bang tam" onClick={(e) => e.stopPropagation()}>
            <h2>Bình cảnh trung kỳ</h2>
            <p className="chu-nho">
              Tu vi đã chạm bình cảnh ở tầng {LUAT.binhCanh.tang}. Dùng một viên đan bậc {CANH_GIOI[kho.tuVi.canhGioi]} để phá: phẩm càng cao càng dễ, cảnh giới càng cao càng
              khó. Thất bại thì mất viên đan và hao {Math.round(LUAT.binhCanh.matTuVi * 100)}% tu vi của tầng này.
            </p>
            {danBinhCanh(kho).length === 0 && <p className="chu-nho trai">Chưa có viên đan bậc {CANH_GIOI[kho.tuVi.canhGioi]} nào. Hãy sang đan phòng luyện một mẻ.</p>}
            {danBinhCanh(kho).map((d) => (
              <div key={`${d.id}|${d.loai}`} className="dong-tui">
                <img src={anhDan(d.id)} alt="" />
                <div className="than-dong">
                  <b>{timDanPhuong(d.id).ten}</b>
                  <div className="hang-pham">
                    <span className={d.loai === 'dv' ? 'pham-dv' : `pham-${d.loai}`}>
                      {d.loai === 'dv' ? 'Đan văn' : TEN_PHAM[d.loai]} ×{d.co}
                    </span>
                    <span>Thành công {Math.round(tiLeBinhCanh(kho, d.loai) * 100)}%</span>
                  </div>
                </div>
                <button
                  className="nut-nho"
                  onClick={() => {
                    const kq = phaBinhCanh(kho, d.id, d.loai, Math.random());
                    if (!kq) return;
                    doiKho(() => kq.kho);
                    phat(kq.thanh ? 'dot-pha' : 'toi-truot');
                    datBang(null);
                    datKetQuaDotPha({ thanh: kq.thanh, ten: `${CANH_GIOI[kho.tuVi.canhGioi]} tầng ${LUAT.binhCanh.tang + 1}`, luot: Date.now(), giuLai: 0, hoDao: false, dai: false, binhCanh: true });
                  }}
                >
                  Dùng
                </button>
              </div>
            ))}
            <div className="hang-nut">
              <button className="nut-nho" onClick={onLuyenDan}>
                Đan phòng
              </button>
              <button className="nut-nho" onClick={() => datBang(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {ketQuaDotPha && (
        <div key={ketQuaDotPha.luot} className={`canh-dot-pha ${ketQuaDotPha.thanh ? 'thanh' : 'bai'} ${ketQuaDotPha.dai ? 'thien-kiep' : ''}`} onClick={() => datKetQuaDotPha(null)}>
          {ketQuaDotPha.thanh && (
            <>
              <i className="dp-tia" />
              <i className="dp-vong" />
              <i className="dp-vong tre" />
            </>
          )}
          <div className="dp-chu">
            <small>{ketQuaDotPha.binhCanh ? (ketQuaDotPha.thanh ? 'Phá bình cảnh' : 'Bình cảnh chưa phá') : ketQuaDotPha.thanh ? 'Đột phá thành công' : 'Đột phá thất bại'}</small>
            <b>{ketQuaDotPha.thanh ? ketQuaDotPha.ten : 'Linh khí tán loạn'}</b>
            <span>
              {ketQuaDotPha.thanh
                ? 'Chạm để tiếp tục'
                : ketQuaDotPha.binhCanh
                  ? `Viên đan đã tan, tu vi hao ${Math.round(LUAT.binhCanh.matTuVi * 100)}%. Chạm để tiếp tục.`
                  : ketQuaDotPha.dai
                  ? ketQuaDotPha.hoDao
                    ? `Dẫn dược đã tan, nhưng Hộ Đạo Đan giữ lại ${ketQuaDotPha.giuLai} viên đan và tu vi vẹn nguyên. Chạm để tiếp tục.`
                    : 'Đan dược và dẫn dược đều đã tan, tu vi hao tổn. Chạm để tiếp tục.'
                  : `Viên đan đã tan, tu vi hao ${Math.round(LUAT.dotPha.matTuVi * 100)}%. Chạm để tiếp tục.`}
            </span>
          </div>
        </div>
      )}

      {bang === 'chi-so' && (
        <div className="lop-phu" onClick={() => datBang(null)}>
          <div className="bang tam" onClick={(e) => e.stopPropagation()}>
            <h2>{nhanVat.ten}</h2>
            <p className="chu-nho">
              {CANH_GIOI[kho.tuVi.canhGioi]} tầng {kho.tuVi.tang}/{soTang(kho.tuVi.canhGioi)} · Tư chất {nhanVat.tuChat} · Khí vận {nhanVat.khiVan}
            </p>
            <div className="dong-mau">
              <span>Máu</span>
              <div className="tien-do mau">
                <div style={{ width: `${Math.min(100, (mauHienTai(kho, luc) / Math.max(1, mauToiDa(kho))) * 100)}%` }} />
              </div>
              <b>
                {mauHienTai(kho, luc)}/{mauToiDa(kho)}
              </b>
            </div>
            {CHI_SO.map((cs) => {
              const tuDan = chiSoDan(kho, cs.id);
              return (
                <div key={cs.id} className="dong-chi-so">
                  <div className="than-dong">
                    <b>{cs.ten}</b>
                    <small>{cs.moTa}</small>
                  </div>
                  <span className="so-chi-so">
                    <b>{chiSo(kho, cs.id)}</b>
                    {tuDan >= 0.05 && <em>+{tuDan.toFixed(1)} nhờ đan</em>}
                  </span>
                </div>
              );
            })}
            <p className="chu-nho">Chỉ số lớn dần theo cảnh giới. Uống đan cộng thêm một ít, nhưng càng uống nhiều một loại càng nhờn thuốc.</p>
            <div className="hang-nut">
              <button className="nut-nho" onClick={() => datBang('thien-menh')}>
                Thiên mệnh
              </button>
              <button className="nut-nho" onClick={() => datBang(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {bang === 'thien-menh' && (
        <div className="lop-phu" onClick={() => datBang(null)}>
          <div className="bang tam" onClick={(e) => e.stopPropagation()}>
            <h2>Thiên mệnh của {nhanVat.ten}</h2>
            <div className="bang-thien-menh gon">
              {dongThienMenh(nhanVat).map((d) => (
                <div key={d.nhan} className="dong da-hien">
                  <span className="nhan">{d.nhan}</span>
                  <span className={`gia-tri hiem-${d.hiem}`}>{d.giaTri}</span>
                  {d.moTa && <small>{d.moTa}</small>}
                </div>
              ))}
            </div>
            <div className="hang-nut">
              <button
                className="nut-nho nguy-hiem"
                onClick={() => {
                  if (confirm('Bỏ nhân vật này và toàn bộ tiến trình để luân hồi sang một kiếp mới?')) onChoiLai();
                }}
              >
                Luân hồi (chơi lại)
              </button>
              <button className="nut-nho" onClick={() => datBang(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {bang === 'hanh-trang' && (
        <div className="lop-phu" onClick={() => datBang(null)}>
          <div className="bang tam" onClick={(e) => e.stopPropagation()}>
            <h2>Hành trang</h2>
            <p className="chu-nho">{kho.linhThach} linh thạch</p>

            {(kho.quaMoDau || kho.trung) && (
              <>
                <h3>Bảo vật</h3>
                {kho.quaMoDau && kho.quaMoDau.loai !== 'linh-thu' && (
                  <div className="dong-tui">
                    <img src={`./hinh/mo-dau/${QUA[kho.quaMoDau.loai].anh}.webp`} alt="" />
                    <div className="than-dong">
                      <b>{QUA[kho.quaMoDau.loai].ten} (đã dung hợp)</b>
                      <div className="hang-pham">
                        <span>{tacDungQua(kho.quaMoDau.loai, kho.quaMoDau.nhe).join(' · ')}</span>
                      </div>
                    </div>
                  </div>
                )}
                {kho.trung && (
                  <div className="dong-tui">
                    <img src="./hinh/mo-dau/dan-linh-thu.webp" alt="" />
                    <div className="than-dong">
                      <b>Trứng Dực Quang Thần Thú</b>
                      <div className="hang-pham">
                        <span>Linh khí của trứng: tu luyện nhanh +{Math.round(LUAT.qua.trung.tocDo * 100)}%. Mang tới Linh Thú Viên để ấp nở.</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {VAT_VUC.some((d) => (kho.vatVuc[d.id] ?? 0) > 0) && (
              <>
                <h3>Vực Thẳm</h3>
                {baoBua && <p className="chu-nho bao-thu">{baoBua}</p>}
                {VAT_VUC.filter((d) => (kho.vatVuc[d.id] ?? 0) > 0).map((d) => (
                  <div key={d.id} className="dong-tui">
                    <img src={anhVatVuc(d.id)} alt="" />
                    <div className="than-dong">
                      <b>
                        {d.ten} ×{kho.vatVuc[d.id]}
                      </b>
                      <div className="hang-pham">
                        <span>{d.moTa}</span>
                      </div>
                    </div>
                    {d.id === 'bua-vuc-tham' && (
                      <button
                        className="nut-nho"
                        onClick={() => {
                          const r = dotBua(kho);
                          if (!r) return;
                          doiKho(() => r.kho);
                          phat('dot-pha');
                          datBaoBua(r.chu);
                        }}
                      >
                        Đốt bùa
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}

            {DAN_DUOC.some((d) => (kho.danDuoc[d.id] ?? 0) > 0) && (
              <>
                <h3>Dẫn dược</h3>
                {DAN_DUOC.filter((d) => (kho.danDuoc[d.id] ?? 0) > 0).map((d) => (
                  <div key={d.id} className="dong-tui">
                    <img src={`./hinh/nguyen-lieu/${d.id}.webp`} alt="" />
                    <div className="than-dong">
                      <b>
                        {d.ten} ×{kho.danDuoc[d.id]}
                      </b>
                      <div className="hang-pham">
                        <span>{d.moTa}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            <h3>Đan dược</h3>
            <p className="chu-nho trai">
              Đan độc {Math.round(docNay)}/{LUAT.doc.day} — tự tan {Math.round(3600 / LUAT.doc.giayMoiDiem)} điểm mỗi giờ. Đan phẩm càng cao càng ít độc. Vượt {LUAT.doc.day} vẫn uống được nhưng sẽ trúng độc, mọi chỉ số giảm cho tới khi độc tan.
            </p>
            {dongDan.length === 0 && danDaDuong.length === 0 && <p className="chu-nho trai">Chưa có viên đan nào.</p>}
            {danDaDuong.map((c) => {
              const xem = xemUongChuyen(kho, c.khoa, luc);
              const moc = mocChuyen(c.bac);
              const uongDuoc = xem.moTa !== '';
              return (
                <div key={c.khoa} className="dong-uong">
                  <div className={`dong-tui dong-ban dong-chuyen moc-${moc}`}>
                    <img src={anhDan(c.phuongId)} alt="" />
                    <div className="than-dong">
                      <b>{timDanPhuong(c.phuongId).ten}</b>
                      <div className="hang-pham">
                        <span className={c.loai === 'dv' ? 'pham-dv' : `pham-${c.loai}`}>
                          {c.loai === 'dv' ? 'Đan văn' : TEN_PHAM[c.loai]} · {c.bac} chuyển{moc ? ` · ${TEN_MOC[moc]}` : ''} ×{c.co}
                        </span>
                      </div>
                    </div>
                    {uongDuoc && (
                      <button className="nut-nho nut-ban" disabled={!xem.duoc} onClick={() => doiKho((k) => uongChuyen(k, c.khoa))}>
                        Uống
                      </button>
                    )}
                  </div>
                  <div className={`tac-dung ${xem.duoc ? '' : 'khong'}`}>
                    {uongDuoc ? (
                      <>
                        <span>
                          Dược lực ×{duocLucChuyen(c.loai, c.bac).toFixed(2)} · {xem.moTa}
                        </span>
                        <span className={xem.docSau > LUAT.doc.day ? 'qua-doc' : 'doc'}>
                          Độc +{Math.round(xem.docThem)} → {Math.round(xem.docSau)}/{LUAT.doc.day}
                        </span>
                        {xem.lyDo && <em>{xem.lyDo}</em>}
                      </>
                    ) : (
                      <span>{xem.lyDo}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {dongDan.map((d) => {
              const n = Math.min(d.co, Math.max(1, soUong[d.khoa] ?? 1));
              const dat = (x: number) => datSoUong((c) => ({ ...c, [d.khoa]: Math.min(d.co, Math.max(1, x)) }));
              const xem = xemUong(kho, d.id, d.loai, n, luc);
              const uongDuoc = xem.moTa !== '';
              return (
                <div key={d.khoa} className="dong-uong">
                  <div className="dong-tui dong-ban">
                    <img src={anhDan(d.id)} alt="" />
                    <div className="than-dong">
                      <b>{d.ten}</b>
                      <div className="hang-pham">
                        <span className={d.loai === 'dv' ? 'pham-dv' : `pham-${d.loai}`}>
                          {d.loai === 'dv' ? 'Đan văn' : TEN_PHAM[d.loai]} ×{d.co}
                        </span>
                      </div>
                    </div>
                    {uongDuoc && (
                      <>
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
                        <button className="nut-nho nut-ban" disabled={!xem.duoc} onClick={() => doiKho((k) => uongDan(k, d.id, d.loai, n))}>
                          Uống
                        </button>
                      </>
                    )}
                  </div>
                  <div className={`tac-dung ${xem.duoc ? '' : 'khong'}`}>
                    {uongDuoc ? (
                      <>
                        <span>{xem.moTa}</span>
                        <span className={xem.docSau > LUAT.doc.day ? 'qua-doc' : 'doc'}>
                          Độc +{Math.round(xem.docThem)} → {Math.round(xem.docSau)}/{LUAT.doc.day}
                        </span>
                        {xem.lyDo && <em>{xem.lyDo}</em>}
                      </>
                    ) : (
                      <span>{xem.lyDo}</span>
                    )}
                  </div>
                </div>
              );
            })}

            <h3>Dược liệu</h3>
            {coLieu.length === 0 && <p className="chu-nho trai">Kho dược liệu đang trống.</p>}
            {coLieu.map((d) => (
              <div key={d.id} className="dong-tui">
                <img src={anhDuocLieu(d.id)} alt="" />
                <div className="than-dong">
                  <b>{d.ten}</b>
                  <div className="hang-pham">
                    {TEN_TUOI_NGAN.map((ten, t) => kho.duocLieu[d.id][t] > 0 && (
                      <span key={ten} className={`tuoi-chu-${t}`}>
                        {ten} ×{kho.duocLieu[d.id][t]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {coHat.length > 0 && <h3>Hạt giống</h3>}
            {coHat.map((d) => (
              <div key={d.id} className="dong-tui">
                <img src={anhDuocLieu(d.id)} alt="" />
                <div className="than-dong">
                  <b>Hạt {d.ten}</b>
                  <div className="hang-pham">
                    <span>×{kho.hatGiong[d.id]} · gieo ở vườn dược</span>
                  </div>
                </div>
              </div>
            ))}

            {coPhu.length > 0 && <h3>Phụ liệu</h3>}
            {coPhu.map((p) => (
              <div key={p.id} className="dong-tui">
                <div className="than-dong">
                  <b>
                    {p.ten} ×{kho.phuLieu[p.id]}
                  </b>
                  <div className="hang-pham">
                    <span>{p.moTa}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="hang-nut">
              <button className="nut-nho" onClick={() => datBang(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
