// Túi đan: giao đan theo đơn hàng của tông môn (trả đủ giá) hoặc bán lẻ ở phường thị (mất nửa giá).
import { useState } from 'react';
import { DAN_PHUONG, LUAT, TEN_MOC, TEN_PHAM, TONG_MON, anhDan, giaBan, mocChuyen, timDanPhuong, timTongMon, type PhamThat } from '../game/duLieu.ts';
import { banChuyen, banDan, banLe, dsChuyen, giaChuyen, giaTriTui, giaoDon, loiTheKho, soVienHopDon, thuongDon, tuChoiDon, vienSeGiao, type Kho } from '../game/kho.ts';
import { dongHo, useBayGio } from './PhuongThi.tsx';

type Loai = PhamThat | 'dv';
type Trang = 'don' | 'ban-le';

/** Huy hiệu tông môn: có ảnh public/hinh/ui/tong-<id>.png thì dùng, chưa có thì hiện một chữ. */
function HuyHieu({ id }: { id: string }) {
  const [coAnh, datCoAnh] = useState(true);
  return (
    <span className="huy-hieu">{coAnh ? <img src={`./hinh/ui/tong-${id}.png`} alt="" onError={() => datCoAnh(false)} /> : <b>{timTongMon(id).chu}</b>}</span>
  );
}

export function TuiDan({ kho, doiKho, onDong }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; onDong: () => void }) {
  const [trang, datTrang] = useState<Trang>('don');
  /** Số lượng muốn bán của từng dòng (khoá = id đan | phẩm); chưa chỉnh thì là 1. */
  const [soBan, datSoBan] = useState<Record<string, number>>({});
  const luc = useBayGio();
  const heSo = loiTheKho(kho).heSoBan;
  const tongGiaTri = DAN_PHUONG.reduce((s, p) => s + giaTriTui(kho, p.id), 0);
  const tongDanhVong = TONG_MON.reduce((s, t) => s + (kho.danhVong[t.id] ?? 0), 0);

  const chuyen = dsChuyen(kho);
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
        <div className="hang-chon">
          <button className={`the nho ${trang === 'don' ? 'chon' : ''}`} onClick={() => datTrang('don')}>
            Đơn hàng tông môn
          </button>
          <button className={`the nho ${trang === 'ban-le' ? 'chon' : ''}`} onClick={() => datTrang('ban-le')}>
            Bán lẻ ({dong.reduce((s, d) => s + d.co, 0) + chuyen.reduce((s, c) => s + c.co, 0)})
          </button>
        </div>

        {trang === 'don' && (
          <>
            <p className="chu-nho">
              Tông môn trả đủ giá, gấp đôi bán lẻ. Viên phẩm cao hơn yêu cầu vẫn giao được và được trả theo đúng phẩm của nó. Danh vọng đã tích: {tongDanhVong}.
            </p>
            {Array.from({ length: LUAT.don.soDon }, (_, i) => {
              const d = kho.donHang.ds[i] ?? null;
              if (!d) {
                const con = Math.max(0, Math.ceil(((kho.donHang.luc[i] ?? 0) - luc) / 1000));
                return (
                  <div key={i} className="the-don cho">
                    Đơn mới sau {dongHo(con)}
                  </div>
                );
              }
              const p = timDanPhuong(d.phuongId);
              const co = soVienHopDon(kho, d);
              const du = co >= d.soLuong;
              const giao = vienSeGiao(kho, d);
              const thuong = thuongDon(kho, d);
              // liệt kê đúng những viên sẽ bị lấy, để không ai lỡ tay giao mất viên quý mà không biết
              const seGiao = giao
                ? [...TEN_PHAM.map((ten, ph) => (giao.pham[ph] > 0 ? `${giao.pham[ph]} ${ten.replace(' phẩm', '')}` : '')), giao.danVan > 0 ? `${giao.danVan} Đan văn` : '']
                    .filter(Boolean)
                    .join(', ')
                : '';
              return (
                <div key={i} className={`the-don ${du ? 'du' : ''}`}>
                  <HuyHieu id={d.tongMon} />
                  <div className="than-dong">
                    <small>{timTongMon(d.tongMon).ten}</small>
                    <div className="yeu-cau">
                      <img src={anhDan(p.id)} alt="" />
                      <span>
                        <b>
                          {d.soLuong} {p.ten}
                        </b>{' '}
                        <span className={`pham-${d.pham}`}>{d.pham === 3 ? TEN_PHAM[3] : `${TEN_PHAM[d.pham]} trở lên`}</span>
                      </span>
                    </div>
                    <div className="thuong">
                      Thưởng {thuong} linh thạch · +{d.danhVong} danh vọng · đang có {Math.min(co, d.soLuong)}/{d.soLuong}
                    </div>
                    {giao && (
                      <small>
                        Sẽ giao: {seGiao}
                        {thuong > d.thuong ? ` — viên phẩm cao được trả thêm (đơn gốc ${d.thuong})` : ''}
                      </small>
                    )}
                  </div>
                  <span className="cot-nut-don">
                    <button className="nut-nho giao" disabled={!du} onClick={() => doiKho((k) => giaoDon(k, i))}>
                      Giao
                    </button>
                    <button className="nut-nho bo" onClick={() => doiKho((k) => tuChoiDon(k, i))}>
                      Từ chối
                    </button>
                  </span>
                </div>
              );
            })}
          </>
        )}

        {trang === 'ban-le' && (
          <>
            <p className="chu-nho">
              Bán lẻ ở phường thị chỉ được {Math.round(LUAT.heSoBan * 100)}% giá trị. Đã luyện {kho.thongKe.soMe} mẻ, nổ lò {kho.thongKe.noLo} lần.
            </p>
            {chuyen.map((c) => {
              const gia = giaChuyen(kho, c.phuongId, c.loai, c.bac);
              const moc = mocChuyen(c.bac);
              return (
                <div key={c.khoa} className={`dong-tui dong-ban dong-chuyen moc-${moc}`}>
                  <img src={anhDan(c.phuongId)} alt="" />
                  <div className="than-dong">
                    <b>
                      {timDanPhuong(c.phuongId).ten} · {c.bac} chuyển{moc ? ` · ${TEN_MOC[moc]}` : ''}
                    </b>
                    <div className="hang-pham">
                      <span className={c.loai === 'dv' ? 'pham-dv' : `pham-${c.loai}`}>
                        {c.loai === 'dv' ? 'Đan văn' : TEN_PHAM[c.loai]} ×{c.co}
                      </span>
                      <span>{gia}/viên</span>
                    </div>
                  </div>
                  <button className="nut-nho nut-ban" onClick={() => doiKho((k) => banChuyen(k, c.khoa, 1))}>
                    Bán {gia}
                  </button>
                </div>
              );
            })}
            {dong.length === 0 && chuyen.length === 0 && <p className="chu-nho">Chưa có viên đan nào. Hãy khai lò luyện một mẻ.</p>}
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
          </>
        )}

        <div className="hang-nut">
          {trang === 'ban-le' && tongGiaTri > 0 && (
            <button
              className="nut-nho nguy-hiem"
              onClick={() => {
                if (confirm(`Bán toàn bộ đan chưa dưỡng trong túi lấy ${tongGiaTri} linh thạch? (Đan đã lên chuyển được giữ lại.)`)) doiKho((k) => DAN_PHUONG.reduce((kk, p) => banDan(kk, p.id), k));
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
