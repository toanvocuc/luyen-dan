// Màn hình lò đan: phối liệu -> khống hỏa -> tôi đan (dừng con lắc đúng khoảng xanh) -> mở lò.
import { useEffect, useRef, useState } from 'react';
import {
  CAC_BAC,
  DAN_PHUONG,
  LUAT,
  PHU_LIEU,
  TEN_PHAM_NGAN,
  TEN_TUOI_NGAN,
  anhDan,
  anhDuocLieu,
  giaBan,
  laDanThat,
  timDanPhuong,
  timDuocLieu,
  timPhuLieu,
  type Bac,
  type DanPhuong,
  type Tuoi,
} from '../game/duLieu.ts';
import { duLieu, nhanKetQua, suaLo, thieuGi, truNguyenLieu, type Kho } from '../game/kho.ts';
import {
  batDauMe,
  coTheToi,
  giuLua,
  luyenNhanh,
  moLo,
  quaAp,
  rongVung,
  tiLeVien,
  tocDoGoc,
  toiDan,
  viTriConLac,
  vungToi,
  type KetQua,
  type KetQuaToi,
  type Me,
  type Vung,
  type VungToi,
} from '../game/luyenDan.ts';
import { ThanhTiLe, doanPham } from './ThanhTiLe.tsx';

type Pha = 'phoi' | 'lua' | 'toi' | 'mo';

/** Số mẻ phải luyện thành ở đan phương trước thì mới mở đan phương kế. */
const ME_DE_MO_KHOA = 3;
/** Nhãn ngắn của tuổi thuốc trên nút chọn. */
const TEN_TUOI_SO = ['10', '100', '1000'] as const;
/** Con lắc đứng yên bấy nhiêu mili giây sau mỗi lần bấm để người chơi kịp thấy mình dừng ở đâu. */
const NGHI_SAU_BAM = 750;

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
  lech: 'Lệch! Tổn một viên',
  truot: 'Trượt! Áp lò tăng',
  thanh: 'Thành! +1',
  'dai-thanh': 'Đại thành! +2',
};

export function LoDan({ kho, doiKho }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void }) {
  const [phuongId, datPhuongId] = useState(DAN_PHUONG[0].id);
  const phuong = timDanPhuong(phuongId);
  const [tuoi, datTuoi] = useState<[Tuoi, Tuoi, Tuoi]>([0, 0, 0]);
  const [phuLieuId, datPhuLieuId] = useState<string | null>(null);
  const [pha, datPha] = useState<Pha>('phoi');
  const [moChon, datMoChon] = useState(false);
  const [locBac, datLocBac] = useState<Bac | null>(null);
  const [luot, datLuot] = useState(0);
  const [me, datMe] = useState<Me | null>(null);
  const [vung, datVung] = useState<Vung>('trong');
  const [tenDoan, datTenDoan] = useState('');
  const [xungDot, datXungDot] = useState(0);
  const [ketQua, datKetQua] = useState<KetQua | null>(null);
  const [soHien, datSoHien] = useState(0);
  const [vt, datVt] = useState<VungToi | null>(null);
  const [dangNghi, datDangNghi] = useState(false);
  const [baoToi, datBaoToi] = useState<{ loai: KetQuaToi; luot: number } | null>(null);

  const meRef = useRef<Me | null>(null);
  const giuRef = useRef(false);
  const kimRef = useRef<HTMLDivElement>(null);
  const vungRef = useRef<HTMLDivElement>(null);
  const apRef = useRef<HTMLDivElement>(null);
  const tienDoRef = useRef<HTMLDivElement>(null);
  const canhRef = useRef<HTMLDivElement>(null);
  // con lắc tôi đan
  const vtRef = useRef<VungToi | null>(null);
  const phaLacRef = useRef(0);
  const viTriRef = useRef(0);
  const nghiRef = useRef(false);
  const khoaBamRef = useRef(0);
  const conLacRef = useRef<HTMLDivElement>(null);

  const nangCap = kho.nangCap;
  const phuLieu = timPhuLieu(phuLieuId);
  const meXem = pha === 'phoi' || !me ? batDauMe(tuoi, phuLieu, nangCap) : me;
  const duNguyenLieu = duLieu(kho, phuong.lieu, tuoi, phuLieuId);
  const thieu = thieuGi(kho, phuong.lieu, tuoi);
  const chuThieu = thieu.length
    ? `Thiếu ${thieu.map((t) => `${timDuocLieu(t.id).ten} ${TEN_TUOI_NGAN[t.tuoi]}`).join(', ')}`
    : 'Thiếu phụ liệu';
  const daThongThao = (kho.thongThao[phuong.id] ?? 0) >= LUAT.thongThao;

  const daMo = (i: number) => i === 0 || (kho.thongThao[DAN_PHUONG[i - 1].id] ?? 0) >= ME_DE_MO_KHOA;

  const ketThuc = (kq: KetQua) => {
    datKetQua(kq);
    datPha('mo');
    doiKho((k) => nhanKetQua(k, phuong.id, kq));
  };

  /** Đặt bố cục thanh tôi đan cho lần bấm kế tiếp. */
  const datVungToi = (m: Me) => {
    const v = vungToi(phuong, m, Math.random());
    vtRef.current = v;
    datVt(v);
  };

  const vaoToi = (m: Me) => {
    phaLacRef.current = Math.random() * Math.PI * 2;
    nghiRef.current = false;
    datDangNghi(false);
    datBaoToi(null);
    datVungToi(m);
    // nửa giây đầu chưa nhận bấm, kẻo cú chạm cuối của bước khống hỏa bị tính thành một lần tôi đan
    khoaBamRef.current = performance.now() + 500;
    datPha('toi');
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
    let giayNong = 0;
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
      giayNong = v === 'nong' ? giayNong + dt : 0;
      // giây đầu tiên không tính điểm, cho người chơi kịp đặt tay
      if (t >= 1) meRef.current = giuLua(meRef.current!, v, dt, nangCap, giayNong);

      if (kimRef.current) kimRef.current.style.bottom = `${nhiet}%`;
      if (vungRef.current) {
        vungRef.current.style.bottom = `${tamKep - rong / 2}%`;
        vungRef.current.style.height = `${rong}%`;
      }
      if (apRef.current) apRef.current.style.height = `${kep(meRef.current!.apLo / LUAT.apNoLo, 0, 1) * 100}%`;
      if (tienDoRef.current) tienDoRef.current.style.width = `${kep(t / tong, 0, 1) * 100}%`;
      if (canhRef.current) {
        canhRef.current.style.setProperty('--lua', String(nhiet / 100));
        canhRef.current.classList.toggle('bao-dong', meRef.current!.apLo >= LUAT.apNoLo * 0.6);
      }

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
        vaoToi(meRef.current!);
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
      canhRef.current?.classList.remove('bao-dong');
      window.removeEventListener('keydown', phimXuong);
      window.removeEventListener('keyup', phimLen);
    };
    // chỉ chạy lại khi bắt đầu một lượt khống hỏa mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pha, luot]);

  // ---- tôi đan: con lắc chạy qua lại, bấm để dừng ----
  const bamToi = () => {
    const m = meRef.current;
    const v = vtRef.current;
    if (pha !== 'toi' || !m || !v || nghiRef.current || !coTheToi(m) || performance.now() < khoaBamRef.current) return;
    const kq = toiDan(m, v, viTriRef.current, nangCap);
    meRef.current = kq.me;
    datMe(kq.me);
    datBaoToi((b) => ({ loai: kq.loai, luot: (b?.luot ?? 0) + 1 }));
    nghiRef.current = true;
    datDangNghi(true);
    setTimeout(() => {
      if (kq.loai === 'no') ketThuc({ noLo: true, vien: [] });
      else if (kq.me.soVien <= 0) ketThuc({ noLo: false, vien: [] });
      else {
        // khoảng xanh nhảy sang chỗ mới, hẹp hơn nếu vừa lên cấp
        datVungToi(kq.me);
        nghiRef.current = false;
        datDangNghi(false);
      }
    }, NGHI_SAU_BAM);
  };
  const bamToiRef = useRef(bamToi);
  bamToiRef.current = bamToi;

  useEffect(() => {
    if (pha !== 'toi') return;
    let truoc = performance.now();
    let raf = 0;
    const buoc = (now: number) => {
      const dt = Math.min(0.05, (now - truoc) / 1000);
      truoc = now;
      const v = vtRef.current;
      if (v && !nghiRef.current) {
        phaLacRef.current += tocDoGoc(v) * dt;
        viTriRef.current = viTriConLac(phaLacRef.current);
        if (conLacRef.current) conLacRef.current.style.left = `${viTriRef.current * 100}%`;
      }
      raf = requestAnimationFrame(buoc);
    };
    raf = requestAnimationFrame(buoc);
    const phim = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        bamToiRef.current();
      }
    };
    window.addEventListener('keydown', phim);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', phim);
    };
  }, [pha]);

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
    if (nhanh) {
      m = luyenNhanh(phuong, m, nangCap);
      meRef.current = m;
      datMe(m);
      vaoToi(m);
      return;
    }
    meRef.current = m;
    datMe(m);
    datXungDot(0);
    datLuot((l) => l + 1);
    datPha('lua');
  };

  const thuDan = () => {
    if (!meRef.current || nghiRef.current) return;
    ketThuc(moLo(phuong, meRef.current));
  };

  const meMoi = () => {
    meRef.current = null;
    datMe(null);
    datKetQua(null);
    datBaoToi(null);
    datVt(null);
    datPha('phoi');
  };

  const datTuoiO = (i: number, t: Tuoi) =>
    datTuoi((c) => {
      const m = [...c] as [Tuoi, Tuoi, Tuoi];
      m[i] = t;
      return m;
    });

  // Mỗi khi về bước phối liệu hoặc đổi đan phương: tự chọn tuổi thuốc đang có sẵn cho từng ô
  // (ưu tiên giữ lựa chọn cũ nếu còn đủ, không thì lấy tuổi thấp nhất còn hàng).
  useEffect(() => {
    if (pha !== 'phoi') return;
    const con: Record<string, number[]> = {};
    const chon = phuong.lieu.map((id, i) => {
      con[id] ??= [...(kho.duocLieu[id] ?? [0, 0, 0])];
      const uuTien = [tuoi[i], 0, 1, 2] as Tuoi[];
      const t = uuTien.find((x) => con[id][x] > 0) ?? tuoi[i];
      con[id][t] -= 1;
      return t;
    }) as [Tuoi, Tuoi, Tuoi];
    if (chon.some((t, i) => t !== tuoi[i])) datTuoi(chon);
    // phụ liệu đã dùng hết thì bỏ chọn, kẻo nút khai lò báo thiếu mà không rõ vì sao
    if (phuLieuId && (kho.phuLieu[phuLieuId] ?? 0) < 1) datPhuLieuId(null);
    // chỉ chạy khi đổi pha, đổi đan phương hoặc kho thay đổi (mua thêm ở phường thị)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pha, phuongId, kho.duocLieu, kho.phuLieu]);

  const giu = (dangGiu: boolean) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (pha === 'toi') {
      if (dangGiu) bamToi();
      return;
    }
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
  const phanAp = me ? kep(me.apLo / LUAT.apNoLo, 0, 1) : 0;

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
              {vung === 'trong' ? 'Hỏa hầu vừa đẹp' : vung === 'nong' ? 'Quá nóng — áp lò dâng nhanh!' : 'Quá nguội — đan khí đang rò'}
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

      {moChon && (
        <div className="lop-phu" onClick={() => datMoChon(false)}>
          <div className="bang tam chon-phuong" onClick={(e) => e.stopPropagation()}>
            <h2>Chọn đan phương</h2>
            <div className="hang-loc">
              <button className={`the nho ${locBac === null ? 'chon' : ''}`} onClick={() => datLocBac(null)}>
                Tất cả ({DAN_PHUONG.length})
              </button>
              {CAC_BAC.map((b) => (
                <button key={b} className={`the nho ${locBac === b ? 'chon' : ''}`} onClick={() => datLocBac(b)}>
                  {b} ({DAN_PHUONG.filter((p) => p.bac === b).length})
                </button>
              ))}
            </div>
            <div className="luoi-phuong">
              {DAN_PHUONG.map((p, i) => {
                if (locBac && p.bac !== locBac) return null;
                const mo = daMo(i);
                return (
                  <button
                    key={p.id}
                    className={`o-phuong ${p.id === phuongId ? 'chon' : ''} ${mo ? '' : 'khoa'}`}
                    disabled={!mo}
                    onClick={() => {
                      datPhuongId(p.id);
                      datMoChon(false);
                    }}
                  >
                    <img src={anhDan(p.id)} alt="" />
                    <b>{p.ten}</b>
                    <small>{mo ? `Bán từ ${giaBan(p, 0)} linh thạch` : `Cần ${ME_DE_MO_KHOA} mẻ ${DAN_PHUONG[i - 1].ten}`}</small>
                  </button>
                );
              })}
            </div>
            <div className="hang-nut">
              <button className="nut-nho" onClick={() => datMoChon(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bang day">
        {pha === 'phoi' && (
          <>
            <ThanhTiLe doan={doanPham(tiLeVien(phuong, meXem))} />
            <button className="phuong-dang-chon" onClick={() => datMoChon(true)}>
              <img src={anhDan(phuong.id)} alt="" />
              <span className="than">
                <b>{phuong.ten}</b>
                <small>
                  Đan {phuong.bac} · đã luyện {kho.thongThao[phuong.id] ?? 0} mẻ
                </small>
              </span>
              <span className="doi">Đổi đan phương ›</span>
            </button>
            <div className="hang-lieu">
              {phuong.lieu.map((id, i) => {
                const d = timDuocLieu(id);
                const co = kho.duocLieu[id] ?? [0, 0, 0];
                const biThieu = thieu.some((t) => t.id === id && t.tuoi === tuoi[i]);
                return (
                  <div key={i} className={`o-lieu tuoi-${tuoi[i]} ${biThieu ? 'thieu' : ''}`}>
                    <img src={anhDuocLieu(id)} alt="" />
                    <b>{d.ten}</b>
                    <span className="chon-tuoi">
                      {([0, 1, 2] as Tuoi[]).map((t) => (
                        <button key={t} className={`nut-tuoi tuoi-${t} ${tuoi[i] === t ? 'chon' : ''}`} disabled={co[t] < 1} onClick={() => datTuoiO(i, t)}>
                          <em>{TEN_TUOI_SO[t]}</em>
                          <small>×{co[t]}</small>
                        </button>
                      ))}
                    </span>
                  </div>
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
            <p className="chu-nho an-khi-thap">
              {phuLieu ? phuLieu.moTa + '.' : phuong.moTa + ' Chọn tuổi thuốc (năm) cho từng vị: thuốc càng lâu năm, phẩm đan càng cao.'}
            </p>
            <div className="hang-nut">
              {kho.loHu ? (
                <button className="nut chinh" onClick={() => doiKho(suaLo)}>
                  Sửa lò ({Math.min(kho.linhThach, LUAT.giaSuaLo)} linh thạch)
                </button>
              ) : (
                <>
                  <button className="nut chinh" disabled={!duNguyenLieu} onClick={() => khaiLo(false)}>
                    {duNguyenLieu ? 'Khai lò' : chuThieu}
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
            <p className="chu-nho">Nhấn giữ màn hình để tăng lửa, thả tay để hạ lửa. Lửa có đà — hãy đón trước vùng sáng. Quá nóng một chút là áp lò dâng rất nhanh.</p>
          </>
        )}

        {pha === 'toi' && me && vt && (
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

            <div className={`thanh-toi ${dangNghi ? 'nghi' : ''}`}>
              <span className="dai gan" style={{ left: `${(vt.tam - vt.xanh / 2 - vt.gan) * 100}%`, width: `${(vt.xanh + 2 * vt.gan) * 100}%` }} />
              <span className="dai xanh" style={{ left: `${(vt.tam - vt.xanh / 2) * 100}%`, width: `${vt.xanh * 100}%` }} />
              <span className="dai vang" style={{ left: `${(vt.tam - vt.vang / 2) * 100}%`, width: `${vt.vang * 100}%` }} />
              <div ref={conLacRef} className="con-lac" />
            </div>
            <div className="chu-thich-toi">
              <span className="toi-dai-thanh">Vàng: +2</span>
              <span className="toi-thanh">Xanh: +1</span>
              <span className="toi-truot">Sát ngoài: áp lò tăng</span>
              <span className="toi-lech">Xa: tổn một viên</span>
            </div>

            <div className={`thanh-ap ${phanAp >= 0.6 ? 'nguy' : ''}`}>
              <span>Áp lò</span>
              <div>
                <i style={{ width: `${phanAp * 100}%` }} />
              </div>
              <b>{Math.round(phanAp * 100)}%</b>
            </div>

            <p className="chu-nho an-khi-thap">Bấm Tôi đan (hoặc chạm vào lò) đúng lúc con lắc trắng nằm trong khoảng xanh. Mỗi cấp con lắc chạy nhanh hơn và khoảng xanh hẹp lại.</p>
            <div className="neu-thu">
              <span>Nếu thu bây giờ:</span>
              <ThanhTiLe doan={doanPham(tiLeVien(phuong, me))} gon />
            </div>
            <div className="hang-nut">
              <button
                className="nut chinh"
                disabled={dangNghi || !coTheToi(me)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  bamToi();
                }}
              >
                {coTheToi(me) ? 'Tôi đan' : 'Đã tới đỉnh'}
              </button>
              <button className="nut" disabled={dangNghi} onClick={thuDan}>
                Thu đan
              </button>
            </div>
          </>
        )}

        {pha === 'mo' && ketQua && (
          <>
            <div className="ten-doan">
              {ketQua.noLo
                ? 'Áp lò vượt ngưỡng, lò nổ tung, cả mẻ đan tan thành khói. Lò cần sửa.'
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
