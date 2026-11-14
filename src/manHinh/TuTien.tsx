// Động phủ: nhân vật ngồi tu luyện, tu vi tự tăng; từ đây mở hành trang, xem thiên mệnh, sang đan phòng.
import { useState } from 'react';
import { phat } from '../amThanh.ts';
import { CANH_GIOI, CHI_SO, DAN_PHUONG, DUOC_LIEU, LUAT, PHU_LIEU, TEN_MOC, TEN_PHAM, TEN_TUOI_NGAN, anhDan, anhDuocLieu, mocChuyen, timDanPhuong, type PhamThat } from '../game/duLieu.ts';
import { chiSo, chiSoDan, danDotPha, docHienTai, dotPha, dsChuyen, duocLucChuyen, mauHienTai, mauToiDa, soTang, tiLeDotPha, tocDoTuVi, tuViCan, uongChuyen, uongDan, vienMan, xemUong, xemUongChuyen, type Kho } from '../game/kho.ts';
import type { NhanVat } from '../game/nhanVat.ts';
import { dongHo, useBayGio } from './PhuongThi.tsx';
import { BupBe } from './BupBe.tsx';
import { dongThienMenh } from './ThienMenh.tsx';

type Bang = null | 'hanh-trang' | 'thien-menh' | 'dot-pha' | 'chi-so';

/**
 * Nút tròn ở đáy động phủ. Nếu có ảnh public/hinh/ui/nut-<id>.png thì dùng ảnh đó,
 * chưa có thì hiện một chữ trong vòng tròn. Không truyền onClick = tính năng chưa làm, nút bị khoá.
 */
function NutTron({ id, ten, chu, noiBat = false, onClick }: { id: string; ten: string; chu: string; noiBat?: boolean; onClick?: () => void }) {
  const [coAnh, datCoAnh] = useState(true);
  return (
    <button className={`nut-tron ${noiBat ? 'noi-bat' : ''}`} disabled={!onClick} onClick={onClick}>
      <span className="mat-nut">
        {coAnh ? <img src={`./hinh/ui/nut-${id}.png`} alt="" draggable={false} onError={() => datCoAnh(false)} /> : <b>{chu}</b>}
      </span>
      <span className="ten-nut">{ten}</span>
      {!onClick && <em>Sắp có</em>}
    </button>
  );
}

export function TuTien({
  kho,
  nhanVat,
  doiKho,
  onLuyenDan,
  onVuon,
  onMonPhai,
  onCaiDat,
  onChoiLai,
}: {
  kho: Kho;
  nhanVat: NhanVat;
  doiKho: (ham: (k: Kho) => Kho) => void;
  onLuyenDan: () => void;
  onVuon: () => void;
  /** Mở bảng đơn hàng của các tông môn. */
  onMonPhai: () => void;
  /** Mở bảng cài đặt (âm thanh, sao lưu). */
  onCaiDat: () => void;
  onChoiLai: () => void;
}) {
  const [bang, datBang] = useState<Bang>(null);
  const can = tuViCan(kho.tuVi.tang, kho.tuVi.canhGioi);
  /** Kết quả lần đột phá vừa rồi, để dựng cảnh báo tin; bấm vào là tắt. */
  const [ketQuaDotPha, datKetQuaDotPha] = useState<null | { thanh: boolean; ten: string; luot: number }>(null);
  const danCan = danDotPha(kho);
  const phamNhan = kho.tuVi.canhGioi === 0;

  const thuDotPha = (pham: PhamThat, danVan: boolean) => {
    // quay số ở đây rồi mới ghi vào kho, để cảnh báo tin và kho luôn khớp nhau
    const kq = dotPha(kho, pham, danVan, Math.random());
    if (!kq) return;
    doiKho(() => kq.kho);
    phat(kq.thanh ? 'dot-pha' : 'toi-truot');
    datBang(null);
    datKetQuaDotPha({ thanh: kq.thanh, ten: CANH_GIOI[kho.tuVi.canhGioi + 1], luot: Date.now() });
  };
  const day = vienMan(kho);
  const tocDo = tocDoTuVi(kho);
  const luc = useBayGio();
  /** Đan đã dưỡng lên chuyển, uống từng viên một. */
  const danDaDuong = dsChuyen(kho);
  const docNay = docHienTai(kho, luc);
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

      <div className="san-tu-luyen">
        <div className={`hao-quang ${day ? 'day' : ''}`} />
        <BupBe dang={nhanVat.dang} gioiTinh={nhanVat.gioiTinh} />
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
        <p className="chu-nho">
          {day
            ? danCan
              ? `${CANH_GIOI[kho.tuVi.canhGioi]} đã viên mãn. Dùng ${danCan.ten} để đột phá lên ${CANH_GIOI[kho.tuVi.canhGioi + 1]}.`
              : 'Đã đứng trên đỉnh tiên lộ.'
            : phamNhan
              ? `Đang rèn thân dưỡng khí: +${tocDo.toFixed(1)} tu vi mỗi giây.`
              : kho.tangToc.giay > 0
                ? `Đan lực đang vận hành: +${tocDo.toFixed(1)} tu vi mỗi giây, còn ${dongHo(Math.ceil(kho.tangToc.giay))}.`
                : `Đang thổ nạp linh khí: +${tocDo.toFixed(1)} tu vi mỗi giây.`}
        </p>
        {day && danCan && (
          <button className="nut chinh nut-dot-pha" onClick={() => datBang('dot-pha')}>
            Đột phá lên {CANH_GIOI[kho.tuVi.canhGioi + 1]}
          </button>
        )}
        <nav className="day-nut-tron">
          <NutTron id="tui-do" ten="Túi đồ" chu="囊" onClick={() => datBang('hanh-trang')} />
          <NutTron id="luyen-dan" ten="Luyện đan" chu="丹" noiBat onClick={onLuyenDan} />
          <NutTron id="mon-phai" ten="Đơn hàng" chu="門" onClick={onMonPhai} />
          <NutTron id="vuon-duoc" ten="Vườn dược" chu="草" onClick={onVuon} />
          <NutTron id="thien-menh" ten="Thiên mệnh" chu="命" onClick={() => datBang('thien-menh')} />
        </nav>
      </section>

      {bang === 'dot-pha' && danCan && (
        <div className="lop-phu" onClick={() => datBang(null)}>
          <div className="bang tam" onClick={(e) => e.stopPropagation()}>
            <h2>Đột phá lên {CANH_GIOI[kho.tuVi.canhGioi + 1]}</h2>
            <p className="chu-nho">
              Chọn một viên {danCan.ten} để dùng. Phẩm càng cao càng dễ thành. Thất bại thì mất viên đan và hao {Math.round(LUAT.dotPha.matTuVi * 100)}% tu vi của tầng này.
            </p>
            {kho.tuiDan[danCan.id].every((n) => n < 1) && (kho.danVan[danCan.id] ?? 0) < 1 && (
              <p className="chu-nho trai">Chưa có viên {danCan.ten} nào. Hãy sang đan phòng luyện một mẻ.</p>
            )}
            {([3, 2, 1, 0] as PhamThat[]).map((ph) => {
              const co = kho.tuiDan[danCan.id][ph];
              if (co < 1) return null;
              return (
                <div key={ph} className="dong-tui">
                  <img src={anhDan(danCan.id)} alt="" />
                  <div className="than-dong">
                    <b className={`pham-${ph}`}>
                      {TEN_PHAM[ph]} ×{co}
                    </b>
                    <div className="hang-pham">
                      <span>Thành công {Math.round(tiLeDotPha(kho, ph, false) * 100)}%</span>
                    </div>
                  </div>
                  <button className="nut-nho" onClick={() => thuDotPha(ph, false)}>
                    Dùng
                  </button>
                </div>
              );
            })}
            {(kho.danVan[danCan.id] ?? 0) > 0 && (
              <div className="dong-tui">
                <img src={anhDan(danCan.id)} alt="" />
                <div className="than-dong">
                  <b className="pham-dv">Đan văn ×{kho.danVan[danCan.id]}</b>
                  <div className="hang-pham">
                    <span>Thành công 100%</span>
                  </div>
                </div>
                <button className="nut-nho" onClick={() => thuDotPha(3, true)}>
                  Dùng
                </button>
              </div>
            )}
            <div className="hang-nut">
              <button className="nut-nho" onClick={onLuyenDan}>
                Sang đan phòng
              </button>
              <button className="nut-nho" onClick={() => datBang(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {ketQuaDotPha && (
        <div key={ketQuaDotPha.luot} className={`canh-dot-pha ${ketQuaDotPha.thanh ? 'thanh' : 'bai'}`} onClick={() => datKetQuaDotPha(null)}>
          {ketQuaDotPha.thanh && (
            <>
              <i className="dp-tia" />
              <i className="dp-vong" />
              <i className="dp-vong tre" />
            </>
          )}
          <div className="dp-chu">
            <small>{ketQuaDotPha.thanh ? 'Đột phá thành công' : 'Đột phá thất bại'}</small>
            <b>{ketQuaDotPha.thanh ? ketQuaDotPha.ten : 'Linh khí tán loạn'}</b>
            <span>{ketQuaDotPha.thanh ? 'Chạm để tiếp tục' : `Viên đan đã tan, tu vi hao ${Math.round(LUAT.dotPha.matTuVi * 100)}%. Chạm để tiếp tục.`}</span>
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

            <h3>Đan dược</h3>
            <p className="chu-nho trai">
              Đan độc {Math.round(docNay)}/{LUAT.doc.day} — tự tan {Math.round(3600 / LUAT.doc.giayMoiDiem)} điểm mỗi giờ. Đan phẩm càng cao càng ít độc.
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
