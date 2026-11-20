// Hiệu ứng hình ảnh trong trận: vệt chiêu, hiệu ứng linh căn, số sát thương bay lên, hàng biểu tượng trạng thái.
// Ảnh hiệu ứng vẽ trên nền đen, ghép bằng mix-blend-mode: screen (chỗ đen biến mất, chỗ sáng phát quang).
import { useCallback, useEffect, useRef, useState } from 'react';
import { TT, anhTt, anhVfx, type BangTt, type TtId, type Vfx } from '../game/chienDau.ts';

interface MucVfx {
  khoa: number;
  v: Exclude<Vfx, { loai: 'rung' }>;
  /** Lệch ngang (để nhiều số không đè nhau). */
  lech: number;
}

/**
 * Hàng đợi hiệu ứng: phat(ds) cho chạy lần lượt (mỗi cái cách nhau `nhip` ms); mỗi cái tự biến mất sau `song` ms.
 * `onRung` được gọi khi gặp hiệu ứng rung màn.
 */
export function useHieuUng(onRung?: () => void, nhip = 90, song = 1000) {
  const [ds, datDs] = useState<MucVfx[]>([]);
  const dem = useRef(0);
  const henGio = useRef<number[]>([]);
  useEffect(() => () => henGio.current.forEach((id) => clearTimeout(id)), []);
  const phat = useCallback(
    (vfx: Vfx[], tre = 0) => {
      vfx.forEach((v, i) => {
        const id = window.setTimeout(() => {
          if (v.loai === 'rung') return onRung?.();
          const khoa = ++dem.current;
          datDs((c) => [...c, { khoa, v, lech: ((khoa * 37) % 5) - 2 }]);
          henGio.current.push(window.setTimeout(() => datDs((c) => c.filter((m) => m.khoa !== khoa)), song));
        }, tre + i * nhip);
        henGio.current.push(id);
      });
    },
    [onRung, nhip, song],
  );
  return { ds, phat };
}

/** Lớp phủ đặt trong khung sân đấu (position: relative). `ben`: chỉ vẽ hiệu ứng của bên này. */
export function LopHieuUng({ ds, ben }: { ds: MucVfx[]; ben: 'dich' | 'minh' }) {
  return (
    <div className={`lop-hieu-ung ben-${ben}`} aria-hidden>
      {ds
        .filter((m) => m.v.ben === ben)
        .map(({ khoa, v, lech }) =>
          v.loai === 'so' ? (
            <span key={khoa} className={`so-bay ${v.kieu}`} style={{ left: `${50 + lech * 9}%` }}>
              {v.kieu === 'ne' ? 'Né!' : v.kieu === 'khac' ? 'Khắc!' : v.kieu === 'hoi' ? `+${v.so}` : v.kieu === 'khien' ? `🛡${v.so}` : `−${v.so}`}
            </span>
          ) : (
            <img key={khoa} className={`vfx vfx-${v.loai}`} src={anhVfx(v.loai, v.id)} alt="" draggable={false} />
          ),
        )}
    </div>
  );
}

/** Hàng biểu tượng trạng thái (số = tầng). */
export function HangTrangThai({ bang, khien }: { bang: BangTt | undefined; khien?: number }) {
  const ds = (Object.keys(bang ?? {}) as TtId[]).filter((id) => (bang![id]?.tang ?? 0) > 0);
  if (!ds.length && !khien) return null;
  return (
    <div className="hang-tt-tran">
      {ds.map((id) => (
        <span key={id} className="tt-tran" title={`${TT[id].ten}: ${TT[id].moTa}`}>
          <img src={anhTt(TT[id].anh)} alt={TT[id].ten} draggable={false} />
          {bang![id]!.tang > 1 && <b>{bang![id]!.tang}</b>}
        </span>
      ))}
      {!!khien && khien > 0 && (
        <span className="tt-tran" title={`Hộ thể: khiên ${Math.round(khien)}`}>
          <img src={anhTt('ho-the')} alt="Hộ thể" draggable={false} />
          <b>{Math.round(khien)}</b>
        </span>
      )}
    </div>
  );
}
