// Hiển thị lực chiến: số vàng kim có quầng sáng, đếm lên khi lực chiến đổi; bấm vào để xem phần góp từng nguồn.
import { useEffect, useRef, useState } from 'react';
import type { Kho } from '../game/kho.ts';
import { lucChien } from '../game/lucChien.ts';

const dinhDang = (n: number) => Math.round(n).toLocaleString('vi-VN');

/** Số chạy từ giá trị cũ tới giá trị mới trong ~0,8 giây. */
function useSoChay(dich: number) {
  const [hien, datHien] = useState(dich);
  const cu = useRef(dich);
  useEffect(() => {
    const tu = cu.current;
    if (tu === dich) return;
    const dau = performance.now();
    let id = 0;
    const buoc = (t: number) => {
      const x = Math.min(1, (t - dau) / 800);
      const v = tu + (dich - tu) * (1 - (1 - x) ** 3);
      datHien(v);
      cu.current = v;
      if (x < 1) id = requestAnimationFrame(buoc);
      else cu.current = dich;
    };
    id = requestAnimationFrame(buoc);
    return () => cancelAnimationFrame(id);
  }, [dich]);
  return hien;
}

/** Bản lớn (trang nhân vật): nhãn, con số, bấm để xem chi tiết. */
export function LucChienLon({ kho }: { kho: Kho }) {
  const lc = lucChien(kho);
  const so = useSoChay(lc.tong);
  const [mo, datMo] = useState(false);
  const truocRef = useRef(lc.tong);
  const [tang, datTang] = useState(0);
  useEffect(() => {
    const d = lc.tong - truocRef.current;
    truocRef.current = lc.tong;
    if (d === 0) return;
    datTang(d);
    const id = setTimeout(() => datTang(0), 1600);
    return () => clearTimeout(id);
  }, [lc.tong]);
  return (
    <div className="luc-chien lon">
      <button className="the-luc-chien" onClick={() => datMo((x) => !x)} title="Bấm để xem lực chiến đến từ đâu">
        <span className="nhan-lc">Lực chiến</span>
        <b className="so-lc">{dinhDang(so)}</b>
        {tang !== 0 && <em className={`tang-lc ${tang > 0 ? 'len' : 'xuong'}`}>{tang > 0 ? `+${dinhDang(tang)}` : `−${dinhDang(-tang)}`}</em>}
        <i className="mo-lc">{mo ? '▴' : 'ⓘ'}</i>
      </button>
      {mo && (
        <div className="chi-tiet-lc">
          {lc.phan.map((p) => (
            <div key={p.ten} className={p.them > 0 ? '' : 'khong'}>
              <span>
                <b>{p.ten}</b>
                <small>{p.chu}</small>
              </span>
              <em>{p.them > 0 ? `+${dinhDang(p.them)}` : '—'}</em>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bản nhỏ (đầu động phủ). */
export function LucChienNho({ kho, onClick }: { kho: Kho; onClick?: () => void }) {
  const so = useSoChay(lucChien(kho).tong);
  return (
    <button className="luc-chien nho" onClick={onClick} title="Lực chiến">
      <span className="nhan-lc">Lực chiến</span>
      <b className="so-lc">{dinhDang(so)}</b>
    </button>
  );
}
