// Màn hình lò đan: phối liệu -> khống hỏa -> ngưng đan (thu hay luyện thêm) -> mở lò.
import { useEffect, useRef, useState } from 'react';
import {
  DAN_PHUONG,
  LUAT,
  PHU_LIEU,
  TEN_PHAM_NGAN,
  TEN_TUOI_NGAN,
  laDanThat,
  timDanPhuong,
  timDuocLieu,
  timPhuLieu,
  type DanPhuong,
  type Tuoi,
} from '../game/duLieu.ts';
import { duLieu, nhanKetQua, truNguyenLieu, type Kho } from '../game/kho.ts';
import {
  batDauMe,
  coTheLuyenThem,
  giuLua,
  luyenNhanh,
  moLo,
  rongVung,
  thanhTiLe,
  tinhTiLe,
  vaoChuThien,
  type KetQua,
  type Me,
  type Vung,
} from '../game/luyenDan.ts';
import { ThanhTiLe } from './ThanhTiLe.tsx';

type Pha = 'phoi' | 'lua' | 'ngung' | 'mo';

const kep = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const muot = (x: number) => {
  const t = kep(x, 0, 1);
  return t * t * (3 - 2 * t);
};

/** Tâm vùng hỏa hầu tại giây thứ t của vòng khống hỏa chính, kèm chỉ số đoạn đang chạy. */
function tamVongChinh(phuong: DanPhuong, t: number): { tam: number; doan: number } {
  let dau = 0;
  for (let i = 0; i < phuong.doan.length; i++) {
    const d = phuong.doan[i];
    if (t < dau + d.giay || i === phuong.doan.length - 1) {
      const truoc = i > 0 ? phuong.doan[i - 1].tam : d.tam;
      // chuyển đoạn trong 1,5 giây đầu để người chơi kịp đuổi theo
      const tam = truoc + (d.tam - truoc) * muot((t - dau) / 1.5);
      return { tam: tam + phuong.doKho * 5 * Math.sin(t * 1.9), doan: i };
    }
    dau += d.giay;
  }
  return { tam: 50, doan: 0 };
}

/** Chu thiên luyện thêm: vùng hỏa hầu đung đưa liên tục, vòng sau nhanh và rộng biên hơn vòng trước. */
function tamChuThien(n: number, t: number): number {
  return 50 + (18 + 3 * n) * Math.sin((2 * Math.PI * t) / (6 - 0.5 * n));
}

export function LoDan({ kho, doiKho }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void }) {
  const [phuongId, datPhuongId] = useState(DAN_PHUONG[0].id);
  const phuong = timDanPhuong(phuongId);
  const [tuoi, datTuoi] = useState<[Tuoi, Tuoi, Tuoi]>([0, 0, 0]);
  const [phuLieuId, datPhuLieuId] = useState<string | null>(null);
  const [pha, datPha] = useState<Pha>('phoi');
  const [luot, datLuot] = useState(0);
  const [me, datMe] = useState<Me | null>(null);
  const [vung, datVung] = useState<Vung>('trong');
  const [tenDoan, datTenDoan] = useState('');
  const [ketQua, datKetQua] = useState<KetQua | null>(null);
  const [soHien, datSoHien] = useState(0);

  const meRef = useRef<Me | null>(null);
  const giuRef = useRef(false);
  const kimRef = useRef<HTMLDivElement>(null);
  const vungRef = useRef<HTMLDivElement>(null);
  const tienDoRef = useRef<HTMLDivElement>(null);
  const canhRef = useRef<HTMLDivElement>(null);

  const nangCap = kho.nangCap;
  const phuLieu = timPhuLieu(phuLieuId);
  const meXem = pha === 'phoi' || !me ? batDauMe(tuoi, phuLieu, nangCap) : me;
  const tiLe = thanhTiLe(tinhTiLe(phuong, meXem, nangCap));
  const duNguyenLieu = duLieu(kho, phuong.lieu, tuoi, phuLieuId);
  const daThongThao = (kho.thongThao[phuong.id] ?? 0) >= LUAT.thongThao;

  // ---- vòng lặp khống hỏa ----
  useEffect(() => {
    if (pha !== 'lua' || !meRef.current) return;
    const chuThien = meRef.current.chuThien;
    const tong = chuThien > 0 ? LUAT.chuThien.giay : phuong.doan.reduce((s, d) => s + d.giay, 0);
    const rong = rongVung(phuong, meRef.current, nangCap);
    const tamTai = (t: number) => (chuThien > 0 ? { tam: tamChuThien(chuThien, t), doan: -1 } : tamVongChinh(phuong, t));

    let t = 0;
    let truoc = performance.now();
    let lanVe = 0;
    let doanCu = -2;
    let nhiet = tamTai(0).tam;
    let vanToc = 0;
    let raf = 0;
    giuRef.current = false;

    const buoc = (now: number) => {
      const dt = Math.min(0.05, (now - truoc) / 1000);
      truoc = now;
      t += dt;

      // nhiệt có quán tính nhẹ: nhấn giữ thì lên, thả thì xuống
      const dich = giuRef.current ? 62 : -46;
      vanToc += (dich - vanToc) * Math.min(1, dt * 7);
      nhiet = kep(nhiet + vanToc * dt, 0, 100);
      if (nhiet === 0 || nhiet === 100) vanToc = 0;

      const { tam, doan } = tamTai(t);
      const tamKep = kep(tam, rong / 2, 100 - rong / 2);
      const v: Vung = nhiet > tamKep + rong / 2 ? 'nong' : nhiet < tamKep - rong / 2 ? 'lanh' : 'trong';
      // giây đầu tiên không tính điểm, cho người chơi kịp đặt tay
      if (t >= 1) meRef.current = giuLua(meRef.current!, v, dt);

      if (kimRef.current) kimRef.current.style.bottom = `${nhiet}%`;
      if (vungRef.current) {
        vungRef.current.style.bottom = `${tamKep - rong / 2}%`;
        vungRef.current.style.height = `${rong}%`;
      }
      if (tienDoRef.current) tienDoRef.current.style.width = `${kep(t / tong, 0, 1) * 100}%`;
      if (canhRef.current) canhRef.current.style.setProperty('--lua', String(nhiet / 100));

      if (doan !== doanCu) {
        doanCu = doan;
        datTenDoan(doan >= 0 ? phuong.doan[doan].ten : `Chu thiên thứ ${chuThien}`);
      }
      if (now - lanVe > 100) {
        lanVe = now;
        datMe(meRef.current);
        datVung(v);
      }
      if (t >= tong) {
        datMe(meRef.current);
        datPha('ngung');
        return;
      }
      raf = requestAnimationFrame(buoc);
    };
    raf = requestAnimationFrame(buoc);

    const phimXuong = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        giuRef.current = true;
        e.preventDefault();
      }
    };
    const phimLen = (e: KeyboardEvent) => {
      if (e.code === 'Space') giuRef.current = false;
    };
    window.addEventListener('keydown', phimXuong);
    window.addEventListener('keyup', phimLen);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', phimXuong);
      window.removeEventListener('keyup', phimLen);
    };
    // chỉ chạy lại khi bắt đầu một lượt khống hỏa mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pha, luot]);

  // ---- mở lò: hiện từng viên một ----
  useEffect(() => {
    if (pha !== 'mo' || !ketQua || ketQua.noLo) return;
    datSoHien(0);
    const id = setInterval(() => datSoHien((n) => (n >= ketQua.vien.length ? n : n + 1)), 420);
    return () => clearInterval(id);
  }, [pha, ketQua]);

  const khaiLo = (nhanh: boolean) => {
    if (!duNguyenLieu) return;
    doiKho((k) => truNguyenLieu(k, phuong.lieu, tuoi, phuLieuId));
    let m = batDauMe(tuoi, phuLieu, nangCap);
    if (nhanh) {
      m = luyenNhanh(phuong, m);
      meRef.current = m;
      datMe(m);
      datPha('ngung');
      return;
    }
    meRef.current = m;
    datMe(m);
    datLuot((l) => l + 1);
    datPha('lua');
  };

  const luyenThem = () => {
    if (!meRef.current) return;
    const m = vaoChuThien(meRef.current);
    meRef.current = m;
    datMe(m);
    datLuot((l) => l + 1);
    datPha('lua');
  };

  const thuDan = () => {
    if (!meRef.current) return;
    const kq = moLo(phuong, meRef.current, nangCap);
    datKetQua(kq);
    datPha('mo');
    doiKho((k) => nhanKetQua(k, phuong.id, kq));
  };

  const meMoi = () => {
    meRef.current = null;
    datMe(null);
    datKetQua(null);
    datPha('phoi');
  };

  const doiTuoi = (i: number) =>
    datTuoi((c) => {
      const m = [...c] as [Tuoi, Tuoi, Tuoi];
      m[i] = ((c[i] + 1) % 3) as Tuoi;
      return m;
    });

  const giu = (dangGiu: boolean) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (pha !== 'lua') return;
    giuRef.current = dangGiu;
    if (dangGiu) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // một số trình duyệt từ chối bắt con trỏ; vẫn giữ lửa được, chỉ là kéo tay ra ngoài sẽ nhả
      }
    }
  };

  const themNoLo = me && coTheLuyenThem(me) ? tinhTiLe(phuong, vaoChuThien(me), nangCap).noLo - tinhTiLe(phuong, me, nangCap).noLo : 0;
  const moXong = !!ketQua && (ketQua.noLo || soHien >= ketQua.vien.length);

  return (
    <main className="lo-dan">
      <div
        ref={canhRef}
        className={`canh pha-${pha} ${pha === 'mo' && ketQua?.noLo ? 'no-lo' : ''}`}
        onPointerDown={giu(true)}
        onPointerUp={giu(false)}
        onPointerCancel={giu(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="lua-tam" />
        <img className="lo" src="./hinh/lo-dan.png" alt="Lò đan" draggable={false} />

        {pha === 'lua' && (
          <>
            <div className="nhiet-ke">
              <span className="nhan tren">Nóng</span>
              <div className="ong">
                <div ref={vungRef} className="vung" />
                <div ref={kimRef} className={`kim ${vung}`} />
              </div>
              <span className="nhan duoi">Nguội</span>
            </div>
            <div className={`trang-thai-lua ${vung}`}>
              {vung === 'trong' ? 'Hỏa hầu vừa đẹp' : vung === 'nong' ? 'Quá nóng — áp lò đang tăng' : 'Quá nguội — đan khí đang rò'}
            </div>
          </>
        )}

        {pha === 'mo' && ketQua && (
          <div className="ket-qua">
            {ketQua.noLo ? (
              <div className="chu-no-lo">Nổ lò!</div>
            ) : (
              <div className="day-vien">
                {ketQua.vien.slice(0, soHien).map((v, i) => (
                  <div key={i} className={`vien ${v.pham < 0 ? 'phe' : `pham-${v.pham}`} ${v.danVan ? 'dan-van' : ''}`}>
                    <img src="./hinh/dan.png" alt="" style={{ filter: v.pham < 0 ? 'grayscale(1) brightness(.5)' : `hue-rotate(${phuong.xoayMau}deg)` }} />
                    <span>{laDanThat(v.pham) ? TEN_PHAM_NGAN[v.pham] : 'Phế'}</span>
                    {v.danVan && <em>Đan văn</em>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <section className="bang day">
        <ThanhTiLe tiLe={tiLe} />

        {pha === 'phoi' && (
          <>
            <div className="hang-chon">
              {DAN_PHUONG.map((p) => (
                <button key={p.id} className={`the ${p.id === phuongId ? 'chon' : ''}`} onClick={() => datPhuongId(p.id)}>
                  {p.ten}
                </button>
              ))}
            </div>
            <div className="hang-lieu">
              {phuong.lieu.map((id, i) => {
                const d = timDuocLieu(id);
                const con = kho.duocLieu[id]?.[tuoi[i]] ?? 0;
                return (
                  <button key={i} className={`o-lieu ${con < 1 ? 'thieu' : ''}`} onClick={() => doiTuoi(i)}>
                    <img src="./hinh/duoc-lieu.png" alt="" style={{ filter: `hue-rotate(${d.xoayMau}deg)` }} />
                    <b>{d.ten}</b>
                    <span className={`tuoi tuoi-${tuoi[i]}`}>
                      {TEN_TUOI_NGAN[tuoi[i]]} · còn {con}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="hang-chon">
              <button className={`the nho ${phuLieuId === null ? 'chon' : ''}`} onClick={() => datPhuLieuId(null)}>
                Không phụ liệu
              </button>
              {PHU_LIEU.map((p) => (
                <button
                  key={p.id}
                  className={`the nho ${phuLieuId === p.id ? 'chon' : ''}`}
                  disabled={(kho.phuLieu[p.id] ?? 0) < 1}
                  onClick={() => datPhuLieuId(p.id)}
                  title={p.moTa}
                >
                  {p.ten} ({kho.phuLieu[p.id] ?? 0})
                </button>
              ))}
            </div>
            <p className={`chu-nho ${phuLieu ? '' : 'an-khi-thap'}`}>{phuLieu ? phuLieu.moTa + '.' : 'Chạm vào dược liệu để đổi tuổi thuốc. Thuốc càng lâu năm, phẩm đan càng cao.'}</p>
            <div className="hang-nut">
              <button className="nut chinh" disabled={!duNguyenLieu} onClick={() => khaiLo(false)}>
                {duNguyenLieu ? 'Khai lò' : 'Thiếu dược liệu'}
              </button>
              {daThongThao && (
                <button className="nut" disabled={!duNguyenLieu} onClick={() => khaiLo(true)}>
                  Luyện nhanh
                </button>
              )}
            </div>
          </>
        )}

        {pha === 'lua' && (
          <>
            <div className="ten-doan">{tenDoan}</div>
            <div className="tien-do">
              <div ref={tienDoRef} />
            </div>
            <p className="chu-nho">Nhấn giữ màn hình để tăng lửa, thả tay để hạ lửa. Giữ kim trong vùng sáng.</p>
          </>
        )}

        {pha === 'ngung' && me && (
          <>
            <div className="ten-doan">Đan khí đã tụ — thu đan hay luyện tiếp?</div>
            <div className="hang-nut">
              <button className="nut chinh" onClick={thuDan}>
                Thu đan ({me.soVien} viên)
              </button>
              <button className="nut" disabled={!coTheLuyenThem(me)} onClick={luyenThem}>
                {coTheLuyenThem(me) ? `Luyện thêm (${me.chuThien}/${LUAT.chuThien.toiDa})` : 'Đã luyện tối đa'}
              </button>
            </div>
            <p className="chu-nho">
              {coTheLuyenThem(me)
                ? `Luyện thêm một chu thiên: phẩm đan cao hơn, nhưng nổ lò tăng ngay ${(themNoLo * 100).toFixed(1)}%.`
                : 'Lò đã tới giới hạn, không thể luyện thêm.'}
            </p>
          </>
        )}

        {pha === 'mo' && ketQua && (
          <>
            <div className="ten-doan">
              {ketQua.noLo
                ? 'Áp lò quá cao, cả mẻ đan đã tan thành khói.'
                : moXong
                  ? `Thu được ${ketQua.vien.filter((v) => v.pham >= 0).length} viên ${phuong.ten}.`
                  : 'Đang mở lò…'}
            </div>
            <div className="hang-nut">
              <button className="nut chinh" disabled={!moXong} onClick={meMoi}>
                Luyện mẻ mới
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
