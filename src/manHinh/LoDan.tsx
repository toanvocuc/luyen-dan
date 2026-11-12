// Màn hình lò đan: phối liệu -> khống hỏa -> tôi đan (quay xác suất, liều hay chốt) -> mở lò.
import { useEffect, useRef, useState } from 'react';
import {
  DAN_PHUONG,
  LUAT,
  PHU_LIEU,
  TEN_PHAM_NGAN,
  TEN_TUOI_NGAN,
  anhDan,
  anhDuocLieu,
  laDanThat,
  timDanPhuong,
  timDuocLieu,
  timPhuLieu,
  type DanPhuong,
  type Tuoi,
} from '../game/duLieu.ts';
import { duLieu, nhanKetQua, suaLo, truNguyenLieu, type Kho } from '../game/kho.ts';
import {
  batDauMe,
  coTheToi,
  giuLua,
  luyenNhanh,
  moLo,
  quaAp,
  rongVung,
  tiLeToi,
  tiLeVien,
  toiDan,
  type KetQua,
  type KetQuaToi,
  type Me,
  type Vung,
} from '../game/luyenDan.ts';
import { ThanhTiLe, doanPham, doanToi } from './ThanhTiLe.tsx';

type Pha = 'phoi' | 'lua' | 'toi' | 'mo';

/** Số mẻ phải luyện thành ở đan phương trước thì mới mở đan phương kế. */
const ME_DE_MO_KHOA = 3;

const kep = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const muot = (x: number) => {
  const t = kep(x, 0, 1);
  return t * t * (3 - 2 * t);
};

/** Tâm vùng hỏa hầu tại giây thứ t, kèm chỉ số đoạn đang chạy. */
function tamVong(phuong: DanPhuong, t: number): { tam: number; doan: number } {
  let dau = 0;
  for (let i = 0; i < phuong.doan.length; i++) {
    const d = phuong.doan[i];
    if (t < dau + d.giay || i === phuong.doan.length - 1) {
      const truoc = i > 0 ? phuong.doan[i - 1].tam : d.tam;
      // chuyển đoạn trong 1,5 giây đầu để người chơi kịp đuổi theo
      return { tam: truoc + (d.tam - truoc) * muot((t - dau) / 1.5), doan: i };
    }
    dau += d.giay;
  }
  return { tam: 50, doan: 0 };
}

const CHU_TOI: Record<KetQuaToi, string> = {
  no: 'Nổ lò!',
  ton: 'Tổn một viên',
  giu: 'Không đổi',
  thanh: 'Thành! +1',
  'dai-thanh': 'Đại thành! +2',
};

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
  const [xungDot, datXungDot] = useState(0);
  const [ketQua, datKetQua] = useState<KetQua | null>(null);
  const [soHien, datSoHien] = useState(0);
  const [quay, datQuay] = useState<{ den: number; luot: number } | null>(null);
  const [dangQuay, datDangQuay] = useState(false);
  const [baoToi, datBaoToi] = useState<{ loai: KetQuaToi; luot: number } | null>(null);

  const meRef = useRef<Me | null>(null);
  const giuRef = useRef(false);
  const kimRef = useRef<HTMLDivElement>(null);
  const vungRef = useRef<HTMLDivElement>(null);
  const apRef = useRef<HTMLDivElement>(null);
  const tienDoRef = useRef<HTMLDivElement>(null);
  const canhRef = useRef<HTMLDivElement>(null);

  const nangCap = kho.nangCap;
  const phuLieu = timPhuLieu(phuLieuId);
  const meXem = pha === 'phoi' || !me ? batDauMe(tuoi, phuLieu, nangCap) : me;
  const duNguyenLieu = duLieu(kho, phuong.lieu, tuoi, phuLieuId);
  const daThongThao = (kho.thongThao[phuong.id] ?? 0) >= LUAT.thongThao;

  const daMo = (i: number) => i === 0 || (kho.thongThao[DAN_PHUONG[i - 1].id] ?? 0) >= ME_DE_MO_KHOA;

  const ketThuc = (kq: KetQua) => {
    datKetQua(kq);
    datPha('mo');
    doiKho((k) => nhanKetQua(k, phuong.id, kq));
  };

  // ---- vòng lặp khống hỏa ----
  useEffect(() => {
    if (pha !== 'lua' || !meRef.current) return;
    const tong = phuong.doan.reduce((s, d) => s + d.giay, 0);
    const rong = rongVung(phuong, nangCap);

    // lịch "dược tính xung đột": rải đều trong mẻ, tránh 3 giây đầu và 2 giây cuối
    const lich: number[] = [];
    for (let i = 0; i < phuong.xungDot; i++) {
      const khoang = (tong - 5) / phuong.xungDot;
      lich.push(3 + khoang * i + Math.random() * khoang * 0.8);
    }
    let lech = 0;
    let lechDich = 0;

    let t = 0;
    let truoc = performance.now();
    let lanVe = 0;
    let doanCu = -1;
    let nhiet = tamVong(phuong, 0).tam;
    let vanToc = 0;
    let raf = 0;
    giuRef.current = false;

    const buoc = (now: number) => {
      const dt = Math.min(0.05, (now - truoc) / 1000);
      truoc = now;
      t += dt;

      // nhiệt có quán tính: nhấn giữ là gia tốc lên, thả là gia tốc xuống — phải đoán trước, không bật/tắt được
      vanToc += (giuRef.current ? LUAT.lua.tangToc : -LUAT.lua.giamToc) * dt;
      vanToc *= Math.max(0, 1 - LUAT.lua.can * dt);
      nhiet = kep(nhiet + vanToc * dt, 0, 100);
      if (nhiet === 0 || nhiet === 100) vanToc = 0;

      if (lich.length && t >= lich[0]) {
        lich.shift();
        // nhảy sang phía còn nhiều chỗ, tối thiểu 60% biên độ
        const bien = LUAT.xungDotBien * (0.6 + Math.random() * 0.4);
        lechDich = lechDich > 0 ? -bien : lechDich < 0 ? bien : Math.random() < 0.5 ? bien : -bien;
        datXungDot((n) => n + 1);
      }
      lech += (lechDich - lech) * Math.min(1, dt * 6);

      const { tam, doan } = tamVong(phuong, t);
      const tamKep = kep(tam + lech, rong / 2, 100 - rong / 2);
      const v: Vung = nhiet > tamKep + rong / 2 ? 'nong' : nhiet < tamKep - rong / 2 ? 'lanh' : 'trong';
      // giây đầu tiên không tính điểm, cho người chơi kịp đặt tay
      if (t >= 1) meRef.current = giuLua(meRef.current!, v, dt);

      if (kimRef.current) kimRef.current.style.bottom = `${nhiet}%`;
      if (vungRef.current) {
        vungRef.current.style.bottom = `${tamKep - rong / 2}%`;
        vungRef.current.style.height = `${rong}%`;
      }
      if (apRef.current) apRef.current.style.height = `${kep(meRef.current!.apLo / LUAT.apNoLo, 0, 1) * 100}%`;
      if (tienDoRef.current) tienDoRef.current.style.width = `${kep(t / tong, 0, 1) * 100}%`;
      if (canhRef.current) canhRef.current.style.setProperty('--lua', String(nhiet / 100));

      if (doan !== doanCu) {
        doanCu = doan;
        datTenDoan(phuong.doan[doan].ten);
      }
      if (now - lanVe > 100) {
        lanVe = now;
        datMe(meRef.current);
        datVung(v);
      }
      if (quaAp(meRef.current!)) {
        datMe(meRef.current);
        ketThuc({ noLo: true, vien: [] });
        return;
      }
      if (t >= tong) {
        datMe(meRef.current);
        datPha('toi');
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
    const id = setInterval(() => datSoHien((n) => (n >= ketQua.vien.length ? n : n + 1)), 480);
    return () => clearInterval(id);
  }, [pha, ketQua]);

  const khaiLo = (nhanh: boolean) => {
    if (!duNguyenLieu || kho.loHu) return;
    doiKho((k) => truNguyenLieu(k, phuong.lieu, tuoi, phuLieuId));
    let m = batDauMe(tuoi, phuLieu, nangCap);
    datQuay(null);
    datBaoToi(null);
    if (nhanh) {
      m = luyenNhanh(phuong, m);
      meRef.current = m;
      datMe(m);
      datPha('toi');
      return;
    }
    meRef.current = m;
    datMe(m);
    datXungDot(0);
    datLuot((l) => l + 1);
    datPha('lua');
  };

  // ---- tôi đan: kim chạy trên thanh rồi dừng ở đúng số quay được ----
  const toi = () => {
    if (!meRef.current || dangQuay || !coTheToi(meRef.current)) return;
    const r = Math.random();
    const kq = toiDan(phuong, meRef.current, nangCap, r);
    datDangQuay(true);
    datQuay((q) => ({ den: r, luot: (q?.luot ?? 0) + 1 }));
    setTimeout(() => {
      meRef.current = kq.me;
      datMe(kq.me);
      datBaoToi((b) => ({ loai: kq.loai, luot: (b?.luot ?? 0) + 1 }));
      datDangQuay(false);
      if (kq.loai === 'no') ketThuc({ noLo: true, vien: [] });
      else if (kq.me.soVien <= 0) ketThuc({ noLo: false, vien: [] });
    }, 650);
  };

  const thuDan = () => {
    if (!meRef.current || dangQuay) return;
    ketThuc(moLo(phuong, meRef.current));
  };

  const meMoi = () => {
    meRef.current = null;
    datMe(null);
    datKetQua(null);
    datQuay(null);
    datBaoToi(null);
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

  const moXong = !!ketQua && (ketQua.noLo || soHien >= ketQua.vien.length);
  const soDanThat = ketQua ? ketQua.vien.filter((v) => v.pham >= 0).length : 0;

  return (
    <main className="lo-dan">
      <div
        ref={canhRef}
        className={`canh pha-${pha} ${pha === 'mo' && ketQua?.noLo ? 'lo-no' : ''}`}
        onPointerDown={giu(true)}
        onPointerUp={giu(false)}
        onPointerCancel={giu(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="lua-tam" />
        <img className="lo" src="./hinh/lo-dan.png" alt="Lò đan" draggable={false} />

        {pha === 'lua' && (
          <>
            <div className="cot ap-lo">
              <span className="nhan">Áp lò</span>
              <div className="ong">
                <div ref={apRef} className="muc-ap" />
              </div>
              <span className="nhan">Đầy là nổ</span>
            </div>
            <div className="cot nhiet-ke">
              <span className="nhan">Nóng</span>
              <div className="ong">
                <div ref={vungRef} className="vung" />
                <div ref={kimRef} className={`kim ${vung}`} />
              </div>
              <span className="nhan">Nguội</span>
            </div>
            <div className={`trang-thai-lua ${vung}`}>
              {vung === 'trong' ? 'Hỏa hầu vừa đẹp' : vung === 'nong' ? 'Quá nóng — áp lò đang tăng' : 'Quá nguội — đan khí đang rò'}
            </div>
            {xungDot > 0 && (
              <div key={xungDot} className="bao-xung-dot">
                Dược tính xung đột!
              </div>
            )}
          </>
        )}

        {pha === 'toi' && baoToi && (
          <div key={baoToi.luot} className={`bao-toi toi-${baoToi.loai}`}>
            {CHU_TOI[baoToi.loai]}
          </div>
        )}

        {pha === 'mo' && ketQua && (
          <div className="ket-qua">
            {ketQua.noLo ? (
              <div className="chu-no-lo">Nổ lò!</div>
            ) : (
              <div className="day-vien">
                {ketQua.vien.slice(0, soHien).map((v, i) => (
                  <div key={i} className={`vien ${laDanThat(v.pham) ? `pham-${v.pham}` : 'phe'} ${v.danVan ? 'dan-van' : ''} ${v.vuotKiep !== undefined ? 'qua-kiep' : ''}`}>
                    <span className="anh-vien">
                      <img src={anhDan(phuong.id)} alt="" />
                    </span>
                    <span>{v.danVan ? 'Cực' : laDanThat(v.pham) ? TEN_PHAM_NGAN[v.pham] : 'Phế'}</span>
                    {v.vuotKiep === true && <em>Vượt kiếp</em>}
                    {v.vuotKiep === false && <em className="tan">Kiếp tán</em>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <section className="bang day">
        {pha === 'phoi' && (
          <>
            <ThanhTiLe doan={doanPham(tiLeVien(phuong, meXem))} />
            <div className="hang-phuong">
              {DAN_PHUONG.map((p, i) => (
                <button
                  key={p.id}
                  className={`the-phuong ${p.id === phuongId ? 'chon' : ''}`}
                  disabled={!daMo(i)}
                  onClick={() => datPhuongId(p.id)}
                  title={daMo(i) ? p.moTa : `Luyện thành ${ME_DE_MO_KHOA} mẻ ${DAN_PHUONG[i - 1].ten} để mở`}
                >
                  <img src={anhDan(p.id)} alt="" />
                  <span>{daMo(i) ? p.ten : 'Chưa mở'}</span>
                </button>
              ))}
            </div>
            <div className="hang-lieu">
              {phuong.lieu.map((id, i) => {
                const d = timDuocLieu(id);
                const con = kho.duocLieu[id]?.[tuoi[i]] ?? 0;
                return (
                  <button key={i} className={`o-lieu tuoi-${tuoi[i]} ${con < 1 ? 'thieu' : ''}`} onClick={() => doiTuoi(i)}>
                    <img src={anhDuocLieu(id)} alt="" />
                    <b>{d.ten}</b>
                    <span className="tuoi">
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
            <p className="chu-nho an-khi-thap">{phuLieu ? phuLieu.moTa + '.' : phuong.moTa + ' Chạm dược liệu để đổi tuổi thuốc.'}</p>
            <div className="hang-nut">
              {kho.loHu ? (
                <button className="nut chinh" onClick={() => doiKho(suaLo)}>
                  Sửa lò ({Math.min(kho.linhThach, LUAT.giaSuaLo)} linh thạch)
                </button>
              ) : (
                <>
                  <button className="nut chinh" disabled={!duNguyenLieu} onClick={() => khaiLo(false)}>
                    {duNguyenLieu ? 'Khai lò' : 'Thiếu dược liệu'}
                  </button>
                  {daThongThao && (
                    <button className="nut" disabled={!duNguyenLieu} onClick={() => khaiLo(true)}>
                      Luyện nhanh
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {pha === 'lua' && me && (
          <>
            <ThanhTiLe doan={doanPham(tiLeVien(phuong, me))} />
            <div className="ten-doan">{tenDoan}</div>
            <div className="tien-do">
              <div ref={tienDoRef} />
            </div>
            <p className="chu-nho">Nhấn giữ màn hình để tăng lửa, thả tay để hạ lửa. Lửa có đà — hãy đón trước vùng sáng.</p>
          </>
        )}

        {pha === 'toi' && me && (
          <>
            <div className="dau-toi">
              <b>Tôi đan +{me.cap}</b>
              <span className="cham-cap">
                {Array.from({ length: LUAT.toi.capToiDa }, (_, i) => (
                  <i key={i} className={i < me.cap ? 'day' : ''} />
                ))}
              </span>
              <span>{me.soVien} viên</span>
            </div>
            <ThanhTiLe doan={doanToi(tiLeToi(phuong, me, nangCap))} kim={quay} />
            <div className="neu-thu">
              <span>Nếu thu bây giờ:</span>
              <ThanhTiLe doan={doanPham(tiLeVien(phuong, me))} gon />
            </div>
            <div className="hang-nut">
              <button className="nut chinh" disabled={dangQuay || !coTheToi(me)} onClick={toi}>
                {coTheToi(me) ? 'Tôi đan' : 'Đã tới đỉnh'}
              </button>
              <button className="nut" disabled={dangQuay} onClick={thuDan}>
                Thu đan
              </button>
            </div>
          </>
        )}

        {pha === 'mo' && ketQua && (
          <>
            <div className="ten-doan">
              {ketQua.noLo
                ? 'Lò nổ tung, cả mẻ đan tan thành khói. Lò cần sửa.'
                : ketQua.vien.length === 0
                  ? 'Đan khí tan hết trong lúc tôi luyện — không còn viên nào.'
                  : moXong
                    ? `Thu được ${soDanThat} viên ${phuong.ten}.`
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
