// Động phủ: nhân vật ngồi tu luyện, tu vi tự tăng; từ đây mở hành trang, xem thiên mệnh, sang đan phòng.
import { useState } from 'react';
import { CANH_GIOI, DAN_PHUONG, DUOC_LIEU, LUAT, PHU_LIEU, TEN_PHAM, TEN_TUOI_NGAN, anhDan, anhDuocLieu, type PhamThat } from '../game/duLieu.ts';
import { danDotPha, dotPha, soTang, tiLeDotPha, tuViCan, vienMan, type Kho } from '../game/kho.ts';
import { loiThe, type NhanVat } from '../game/nhanVat.ts';
import { BupBe } from './BupBe.tsx';
import { dongThienMenh } from './ThienMenh.tsx';

type Bang = null | 'hanh-trang' | 'thien-menh' | 'dot-pha';

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
  onChoiLai,
}: {
  kho: Kho;
  nhanVat: NhanVat;
  doiKho: (ham: (k: Kho) => Kho) => void;
  onLuyenDan: () => void;
  onVuon: () => void;
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
    datBang(null);
    datKetQuaDotPha({ thanh: kq.thanh, ten: CANH_GIOI[kho.tuVi.canhGioi + 1], luot: Date.now() });
  };
  const day = vienMan(kho);
  const tocDo = LUAT.tuViMoiGiay * loiThe(nhanVat).tocDoTuLuyen;
  const coDan = DAN_PHUONG.filter((p) => kho.tuiDan[p.id].some((n) => n > 0) || (kho.danVan[p.id] ?? 0) > 0);
  const coLieu = DUOC_LIEU.filter((d) => kho.duocLieu[d.id].some((n) => n > 0));
  const coPhu = PHU_LIEU.filter((p) => (kho.phuLieu[p.id] ?? 0) > 0);
  const coHat = DUOC_LIEU.filter((d) => (kho.hatGiong[d.id] ?? 0) > 0);

  return (
    <main className="tu-tien">
      <header className="dau-tu-tien">
        <div>
          <b className="bien-ten">{nhanVat.ten}</b>
          <small>
            {CANH_GIOI[kho.tuVi.canhGioi]} tầng {kho.tuVi.tang}/{soTang(kho.tuVi.canhGioi)}
          </small>
        </div>
        <span className="linh-thach">
          <i className="cham-linh-thach" />
          {kho.linhThach}
        </span>
      </header>

      <div className="san-tu-luyen">
        <div className={`hao-quang ${day ? 'day' : ''}`} />
        <BupBe dang={nhanVat.dang} />
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
        <p className="chu-nho">
          {day
            ? danCan
              ? `${CANH_GIOI[kho.tuVi.canhGioi]} đã viên mãn. Dùng ${danCan.ten} để đột phá lên ${CANH_GIOI[kho.tuVi.canhGioi + 1]}.`
              : 'Đã đứng trên đỉnh tiên lộ.'
            : phamNhan
              ? `Đang rèn thân dưỡng khí: +${tocDo.toFixed(1)} tu vi mỗi giây.`
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
          <NutTron id="mon-phai" ten="Môn phái" chu="門" />
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
            {coDan.length === 0 && <p className="chu-nho trai">Chưa có viên đan nào.</p>}
            {coDan.map((p) => (
              <div key={p.id} className="dong-tui">
                <img src={anhDan(p.id)} alt="" />
                <div className="than-dong">
                  <b>{p.ten}</b>
                  <div className="hang-pham">
                    {TEN_PHAM.map((ten, i) => kho.tuiDan[p.id][i] > 0 && (
                      <span key={ten} className={`pham-${i}`}>
                        {ten} ×{kho.tuiDan[p.id][i]}
                      </span>
                    ))}
                    {(kho.danVan[p.id] ?? 0) > 0 && <span className="pham-dv">Đan văn ×{kho.danVan[p.id]}</span>}
                  </div>
                </div>
              </div>
            ))}

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
