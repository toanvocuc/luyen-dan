// Túi đan: giao đan theo đơn hàng của tông môn (trả đủ giá) hoặc bán lẻ ở phường thị (mất nửa giá).
import { useState } from 'react';
import { daHetLuotThu } from '../anhLoi.ts';
import { DAN_DUOC, DAN_PHUONG, LUAT, TEN_MOC, TEN_PHAM, TONG_MON, anhDan, bacSo, giaBan, mocChuyen, timDanPhuong, timTongMon, type PhamThat } from '../game/duLieu.ts';
import { banChuyen, banDan, banLe, danDotPha, doiDanDuoc, dsChuyen, giaDanDuoc, yeuCauDotPha, giaChuyen, giaTriTui, giaoDon, loiTheKho, soVienHopDon, thuongDon, tuChoiDon, vienSeGiao, type Kho } from '../game/kho.ts';
import { dongHo, useBayGio } from './PhuongThi.tsx';

type Loai = PhamThat | 'dv';
type Trang = 'don' | 'ban-le' | 'tang-bao';
/** Một dòng trong túi: viên thường (theo phẩm) hoặc viên đã dưỡng (có `bac` chuyển). */
interface DongTui {
  khoa: string;
  id: string;
  ten: string;
  loai: Loai;
  co: number;
  gia: number;
  bac?: number;
  choDon: boolean;
  dotPhaKe: boolean;
}

/** Huy hiệu tông môn: có ảnh public/hinh/ui/tong-<id>.webp thì dùng, chưa có thì hiện một chữ. */
function HuyHieu({ id }: { id: string }) {
  const [coAnh, datCoAnh] = useState(true);
  return (
    <span className="huy-hieu">{coAnh ? <img src={`./hinh/ui/tong-${id}.webp`} alt="" onError={(e) => daHetLuotThu(e.currentTarget) && datCoAnh(false)} /> : <b>{timTongMon(id).chu}</b>}</span>
  );
}

export function TuiDan({ kho, doiKho, onDong, trangDau = 'don' }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; onDong: () => void; trangDau?: Trang }) {
  const [trang, datTrang] = useState<Trang>(trangDau);
  /** Số lượng muốn bán của từng dòng (khoá = id đan | phẩm); chưa chỉnh thì là 1. */
  const [soBan, datSoBan] = useState<Record<string, number>>({});
  const luc = useBayGio();
  const heSo = loiTheKho(kho).heSoBan;
  const tongGiaTri = DAN_PHUONG.reduce((s, p) => s + giaTriTui(kho, p.id), 0);
  const tongDanhVong = TONG_MON.reduce((s, t) => s + (kho.danhVong[t.id] ?? 0), 0);

  const chuyen = dsChuyen(kho);
  // ---- túi thông minh: lọc theo loại / phẩm, sắp xếp, và đánh dấu viên nên giữ ----
  const [loc, datLoc] = useState<'tat-ca' | 'uong' | 'dot-pha' | 'chuyen'>('tat-ca');
  const [locPham, datLocPham] = useState<-1 | 0 | 1 | 2 | 3>(-1);
  const [xep, datXep] = useState<'gia' | 'so' | 'bac'>('gia');
  /** Viên này đang có tông môn đặt (đúng loại, phẩm đạt yêu cầu). */
  const choDon = (id: string, loai: Loai) => kho.donHang.ds.some((d) => d && d.phuongId === id && (loai === 'dv' ? 3 : loai) >= d.pham);
  const dotPhaKe = danDotPha(kho)?.id;
  const tatCa: DongTui[] = [];
  for (const p of DAN_PHUONG) {
    const dv = kho.danVan[p.id] ?? 0;
    if (dv > 0) tatCa.push({ khoa: `${p.id}|dv`, id: p.id, ten: p.ten, loai: 'dv', co: dv, gia: giaBan(p, 3, true, heSo), choDon: choDon(p.id, 'dv'), dotPhaKe: p.id === dotPhaKe });
    for (const ph of [3, 2, 1, 0] as PhamThat[]) {
      const co = kho.tuiDan[p.id][ph];
      if (co > 0) tatCa.push({ khoa: `${p.id}|${ph}`, id: p.id, ten: p.ten, loai: ph, co, gia: giaBan(p, ph, false, heSo), choDon: choDon(p.id, ph), dotPhaKe: p.id === dotPhaKe });
    }
  }
  for (const c of chuyen) {
    tatCa.push({ khoa: c.khoa, id: c.phuongId, ten: timDanPhuong(c.phuongId).ten, loai: c.loai, co: c.co, gia: giaChuyen(kho, c.phuongId, c.loai, c.bac), bac: c.bac, choDon: false, dotPhaKe: false });
  }
  const hien = tatCa
    .filter((d) => {
      const p = timDanPhuong(d.id);
      if (loc === 'uong' && (!p.uong || d.bac)) return false;
      if (loc === 'dot-pha' && (!p.dotPha || d.bac)) return false;
      if (loc === 'chuyen' && !d.bac) return false;
      if (locPham >= 0 && (d.loai === 'dv' ? 3 : d.loai) !== locPham) return false;
      return true;
    })
    .sort((a, b) =>
      xep === 'so' ? b.co - a.co || b.gia - a.gia : xep === 'bac' ? bacSo(timDanPhuong(b.id)) - bacSo(timDanPhuong(a.id)) || b.gia - a.gia : b.gia * (b.bac ? 1 : b.co) - a.gia * (a.bac ? 1 : a.co),
    );
  /** Hạ phẩm "thừa": không có đơn cần, không phải đan đột phá kế tiếp. */
  const haThua = tatCa.filter((d) => d.loai === 0 && !d.bac && !d.choDon && !d.dotPhaKe);
  const giaHaThua = haThua.reduce((s, d) => s + d.gia * d.co, 0);

  return (
    <div className="lop-phu" onClick={onDong}>
      <div className="bang tam" onClick={(e) => e.stopPropagation()}>
        <h2>Túi đan</h2>
        <div className="hang-chon">
          <button className={`the nho ${trang === 'don' ? 'chon' : ''}`} onClick={() => datTrang('don')}>
            Đơn hàng tông môn
          </button>
          <button className={`the nho ${trang === 'tang-bao' ? 'chon' : ''}`} onClick={() => datTrang('tang-bao')}>
            Tàng Bảo Các
          </button>
          <button className={`the nho ${trang === 'ban-le' ? 'chon' : ''}`} onClick={() => datTrang('ban-le')}>
            Bán lẻ ({tatCa.reduce((s, d) => s + d.co, 0)})
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

        {trang === 'tang-bao' && (
          <>
            <p className="chu-nho">
              Tàng Bảo Các các tông môn: đổi danh vọng lấy dẫn dược, thứ bắt buộc khi đột phá từ Kim Đan trở lên. Muốn có danh vọng của tông môn nào thì giao đơn cho tông môn đó.
            </p>
            {DAN_DUOC.map((d) => {
              const gia = giaDanDuoc(kho);
              const co = kho.danhVong[d.tongMon] ?? 0;
              const can = yeuCauDotPha(kho).danDuoc.includes(d.id);
              return (
                <div key={d.id} className={`dong-tui dong-ban ${can ? 'can-dot-pha' : ''}`}>
                  <img src={`./hinh/nguyen-lieu/${d.id}.webp`} alt="" />
                  <div className="than-dong">
                    <b>
                      {d.ten} ×{kho.danDuoc[d.id] ?? 0}
                    </b>
                    <div className="hang-pham">
                      <span>
                        {timTongMon(d.tongMon).ten} · danh vọng {co}
                      </span>
                      {can && <span className="nhan-tui dot-pha">Cần cho đột phá</span>}
                    </div>
                  </div>
                  <button className="nut-nho nut-ban" disabled={co < gia} onClick={() => doiKho((k) => doiDanDuoc(k, d.id))}>
                    Đổi {gia} DV
                  </button>
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
            <div className="hang-chon loc-tui">
              {(
                [
                  ['tat-ca', 'Tất cả'],
                  ['uong', 'Đan uống'],
                  ['dot-pha', 'Đột phá'],
                  ['chuyen', 'Đã dưỡng'],
                ] as const
              ).map(([id, ten]) => (
                <button key={id} className={`the nho ${loc === id ? 'chon' : ''}`} onClick={() => datLoc(id)}>
                  {ten}
                </button>
              ))}
            </div>
            <div className="hang-chon loc-tui">
              {([-1, 0, 1, 2, 3] as const).map((ph) => (
                <button key={ph} className={`the nho ${locPham === ph ? 'chon' : ''} ${ph >= 0 ? `pham-${ph}` : ''}`} onClick={() => datLocPham(ph)}>
                  {ph < 0 ? 'Mọi phẩm' : ph === 3 ? 'Cực / văn' : TEN_PHAM[ph as PhamThat].replace(' phẩm', '')}
                </button>
              ))}
            </div>
            <div className="hang-chon loc-tui xep-tui">
              <small>Xếp theo</small>
              {(
                [
                  ['gia', 'Giá'],
                  ['so', 'Số lượng'],
                  ['bac', 'Bậc'],
                ] as const
              ).map(([id, ten]) => (
                <button key={id} className={`the nho ${xep === id ? 'chon' : ''}`} onClick={() => datXep(id)}>
                  {ten}
                </button>
              ))}
            </div>
            {hien.length === 0 && <p className="chu-nho">{tatCa.length ? 'Không có viên nào khớp bộ lọc.' : 'Chưa có viên đan nào. Hãy khai lò luyện một mẻ.'}</p>}
            {hien.map((d) => {
              const n = Math.min(d.co, Math.max(1, soBan[d.khoa] ?? 1));
              const dat = (x: number) => datSoBan((c) => ({ ...c, [d.khoa]: Math.min(d.co, Math.max(1, x)) }));
              const moc = d.bac ? mocChuyen(d.bac) : 0;
              return (
                <div key={d.khoa} className={`dong-tui dong-ban ${d.bac ? `dong-chuyen moc-${moc}` : ''}`}>
                  <img src={anhDan(d.id)} alt="" />
                  <div className="than-dong">
                    <b>
                      {d.ten}
                      {d.bac ? ` · ${d.bac} chuyển${moc ? ` · ${TEN_MOC[moc]}` : ''}` : ''}
                    </b>
                    <div className="hang-pham">
                      <span className={d.loai === 'dv' ? 'pham-dv' : `pham-${d.loai}`}>
                        {d.loai === 'dv' ? 'Đan văn' : TEN_PHAM[d.loai]} ×{d.co}
                      </span>
                      <span>{d.gia}/viên</span>
                      {d.choDon && <span className="nhan-tui don">Cần cho đơn</span>}
                      {d.dotPhaKe && <span className="nhan-tui dot-pha">Để đột phá</span>}
                    </div>
                  </div>
                  {!d.bac && (
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
                  )}
                  <button
                    className="nut-nho nut-ban"
                    onClick={() => doiKho((k) => (d.bac ? banChuyen(k, d.khoa, 1) : banLe(k, d.id, d.loai, n)))}
                  >
                    Bán {d.bac ? d.gia : d.gia * n}
                  </button>
                </div>
              );
            })}
          </>
        )}

        <div className="hang-nut">
          {trang === 'ban-le' && giaHaThua > 0 && (
            <button
              className="nut-nho"
              onClick={() => {
                if (confirm(`Bán ${haThua.reduce((s, d) => s + d.co, 0)} viên hạ phẩm thừa lấy ${giaHaThua} linh thạch? (Giữ lại viên cần cho đơn và đan đột phá kế tiếp.)`))
                  doiKho((k) => haThua.reduce((kk, d) => banLe(kk, d.id, d.loai, d.co), k));
              }}
            >
              Bán hạ phẩm thừa ({giaHaThua})
            </button>
          )}
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
