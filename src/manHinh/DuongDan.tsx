// Dưỡng đan: lượt luyện thêm cho đan từ thượng phẩm trở lên đang có trong túi. Vào từ đan phòng, lúc nào cũng được.
// Bước 1 chọn viên đem đi dưỡng; bước 2 chạm vào viên đan thì mọi viên chưa vỡ, không bị giữ lại đều quay một lần.
// Luật nằm ở LUAT.duong và bamDuong.
import { useRef, useState, type CSSProperties } from 'react';
import { phat } from '../amThanh.ts';
import { LUAT, TEN_MOC, TEN_PHAM, anhDan, heSoChuyen, mocChuyen, timDanPhuong } from '../game/duLieu.ts';
import { bamDuong, datGiuDuong, dsDuongDuoc, giaChuyen, thuDuong, tiLeDuong, vaoDuong, type KetQuaDuong, type Kho, type LoaiQuy } from '../game/kho.ts';

const tenLoai = (loai: LoaiQuy) => (loai === 'dv' ? 'Đan văn' : TEN_PHAM[loai]);
/** Tỉ lệ nhỏ thì hiện một số lẻ, để 1% không bị làm tròn thành 0 hay 2. */
const phanTram = (x: number) => (x < 0.1 ? (x * 100).toFixed(1) : String(Math.round(x * 100))) + '%';
const CHU_BAO = { thanh: 'Thành!', truot: `Trượt −${LUAT.duong.tut}`, vo: 'Vỡ đan!' } as const;
/** Cỡ viên đan (px) theo số viên dưỡng cùng lúc. */
const coVien = (n: number) => (n <= 1 ? 168 : n === 2 ? 128 : n === 3 ? 100 : n === 4 ? 78 : 72);

export function DuongDan({ kho, doiKho, onDong }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; onDong: () => void }) {
  return kho.duong ? <DangDuong kho={kho} doiKho={doiKho} /> : <ChonVien kho={kho} doiKho={doiKho} onDong={onDong} />;
}

/** Bước 1: chọn những viên trong túi đem đi dưỡng. */
function ChonVien({ kho, doiKho, onDong }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; onDong: () => void }) {
  /** Số viên đã chọn của từng dòng (khoá = id đan | loại). */
  const [chon, datChon] = useState<Record<string, number>>({});
  const toiDa = LUAT.duong.soVienToiDa;
  const ds = dsDuongDuoc(kho).map((d) => ({ ...d, khoa: `${d.phuongId}|${d.loai}` }));
  const so = (khoa: string, co: number) => Math.min(co, chon[khoa] ?? 0);
  const tong = ds.reduce((s, d) => s + so(d.khoa, d.co), 0);

  return (
    <div className="man-duong">
      <h2>Dưỡng đan</h2>
      <p className="chu-nho">
        Chọn đan từ thượng phẩm trở lên trong túi để dưỡng, mỗi lượt tối đa {toiDa} viên. Mỗi viên chỉ dưỡng được một lượt: thu về rồi là không dưỡng lại được nữa.
      </p>
      <div className="chon-duong">
        {ds.length === 0 && <p className="chu-nho">Trong túi chưa có viên nào từ thượng phẩm trở lên.</p>}
        {ds.map((d) => {
          const n = so(d.khoa, d.co);
          const tran = Math.min(d.co, n + toiDa - tong);
          const dat = (x: number) => datChon((c) => ({ ...c, [d.khoa]: Math.max(0, Math.min(tran, x)) }));
          return (
            <div key={d.khoa} className="dong-tui dong-ban">
              <img src={anhDan(d.phuongId)} alt="" />
              <div className="than-dong">
                <b>{timDanPhuong(d.phuongId).ten}</b>
                <div className="hang-pham">
                  <span className={d.loai === 'dv' ? 'pham-dv' : `pham-${d.loai}`}>
                    {tenLoai(d.loai)} ×{d.co}
                  </span>
                </div>
              </div>
              <span className="chinh-so">
                <button className="nut-nho" disabled={n <= 0} onClick={() => dat(n - 1)} aria-label="Bớt">
                  −
                </button>
                <button className="so" onClick={() => dat(n >= tran ? 0 : tran)} title="Chạm để chọn nhiều nhất có thể">
                  {n}
                </button>
                <button className="nut-nho" disabled={n >= tran} onClick={() => dat(n + 1)} aria-label="Thêm">
                  +
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <div className="hang-nut">
        <button className="nut" onClick={onDong}>
          Đóng
        </button>
        <button
          className="nut chinh"
          disabled={tong < 1}
          onClick={() => {
            const dem = ds.map((d) => ({ phuongId: d.phuongId, loai: d.loai, soLuong: so(d.khoa, d.co) })).filter((c) => c.soLuong > 0);
            datChon({});
            doiKho((k) => vaoDuong(k, dem));
          }}
        >
          Dưỡng {tong}/{toiDa} viên
        </button>
      </div>
    </div>
  );
}

/** Bước 2: chạm để dưỡng. */
function DangDuong({ kho, doiKho }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void }) {
  const [bao, datBao] = useState<{ luot: number; kq: KetQuaDuong[] }>({ luot: 0, kq: [] });
  /** Chặn bấm dồn: mỗi lần bấm phải cách nhau một nhịp để kịp nhìn kết quả. */
  const khoaRef = useRef(0);
  const d = kho.duong;
  if (!d) return null;
  const toiDa = LUAT.duong.truotToiDa;
  const conBam = d.vien.some((v) => !v.vo && !v.giu);
  const conNguyen = d.vien.filter((v) => !v.vo).length;

  const bam = () => {
    if (!conBam || performance.now() < khoaRef.current) return;
    khoaRef.current = performance.now() + 380;
    const r = d.vien.map(() => Math.random());
    const { kho: sau, kq } = bamDuong(kho, r);
    doiKho((k) => bamDuong(k, r).kho);
    datBao((b) => ({ luot: b.luot + 1, kq }));
    const quaMoc = kq.some((x, i) => x === 'thanh' && mocChuyen(sau.duong!.vien[i].bac) > mocChuyen(d.vien[i].bac));
    const caoNhat = Math.max(0, ...sau.duong!.vien.map((v) => v.bac));
    if (kq.includes('vo')) phat('no-lo', { am: 0.55, toc: 1.5 });
    else if (quaMoc) phat('mo-lo-quy');
    else if (kq.includes('thanh')) phat('toi-trung', { toc: Math.min(1.6, 1 + caoNhat * 0.05) });
    else phat('toi-truot', { toc: 0.85 });
  };

  return (
    <div className="man-duong">
      <h2>Dưỡng đan</h2>
      <p className="chu-nho">
        Chạm vào viên đan để dưỡng. Trúng thì lên 1 chuyển, trượt thì tụt {LUAT.duong.tut} chuyển; trượt quá {toiDa} lần thì đan vỡ.
        {d.vien.length > 1 ? ' Mỗi lần chạm, mọi viên cùng quay; viên nào muốn giữ thì bấm Giữ lại.' : ''}
      </p>

      <div className="than-duong">
        <div className="day-duong">
          {d.vien.map((v, i) => {
            const moc = mocChuyen(v.bac);
            const tl = tiLeDuong(kho, v);
            const kq = bao.kq[i];
            return (
              <div key={i} className={`vien-duong moc-${moc} ${v.vo ? 'vo' : ''} ${v.giu ? 'giu' : ''}`} style={{ '--co': `${coVien(d.vien.length)}px` } as CSSProperties}>
                <button className="than-vien" onClick={bam} disabled={v.vo || v.giu} aria-label="Dưỡng đan">
                  <img className="dai" src="./hinh/nguyen-lieu/dai-duong-dan.png" alt="" draggable={false} />
                  {moc >= 1 && <i className="hao-quang" />}
                  {moc >= 3 && <i className="tia-quay" />}
                  {moc >= 2 && <i className="vong-quay" />}
                  {!v.vo && <img key={`${bao.luot}-${kq ?? ''}`} className={`dan ${kq ? `vua-${kq}` : ''}`} src={anhDan(v.phuongId)} alt="" draggable={false} />}
                  {kq && (
                    <em key={bao.luot} className={`bao bao-${kq}`}>
                      {CHU_BAO[kq]}
                    </em>
                  )}
                </button>
                <b className="ten-chuyen">{v.vo ? 'Đã vỡ' : `${v.bac} chuyển${moc ? ` · ${TEN_MOC[moc]}` : ''}`}</b>
                {!v.vo && (
                  <>
                    <div className="thanh-duong" title="Tỉ lệ lên chuyển kế tiếp">
                      <i style={{ width: `${Math.max(2, tl * 100)}%` }} />
                      <span>{phanTram(tl)}</span>
                    </div>
                    <small className={v.truot >= toiDa ? 'nguy' : ''}>{v.truot >= toiDa ? 'Trượt nữa là vỡ!' : `Đã trượt ${v.truot}/${toiDa}`}</small>
                    {d.vien.length > 1 && (
                      <button className="nut-nho" onClick={() => doiKho((k) => datGiuDuong(k, i))}>
                        {v.giu ? 'Dưỡng tiếp' : 'Giữ lại'}
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="bang-duong">
          <div className="dong dau">
            <span>Viên đan</span>
            <span>Dược lực</span>
            <span>Giá bán</span>
          </div>
          {d.vien.map((v, i) => (
            <div key={i} className={`dong ${v.vo ? 'vo' : ''}`}>
              <span className={v.loai === 'dv' ? 'pham-dv' : `pham-${v.loai}`}>
                {timDanPhuong(v.phuongId).ten} · {tenLoai(v.loai).replace(' phẩm', '')} · {v.bac} chuyển
              </span>
              <span>{v.vo ? '—' : `×${(heSoChuyen(v.bac) * (v.loai === 'dv' ? 2 : 1)).toFixed(2)}`}</span>
              <span>{v.vo ? 'vỡ' : giaChuyen(kho, v.phuongId, v.loai, v.bac)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hang-nut">
        <button className="nut chinh" onClick={() => doiKho(thuDuong)}>
          {conNguyen ? `Thu đan (${conNguyen} viên)` : 'Đóng'}
        </button>
      </div>
    </div>
  );
}
