// Vực Thẳm: bản đồ mê cung đi XUỐNG 50 tầng. Chạm điểm kề để đi; gặp quái thì Đánh / Bỏ chạy / Từ bỏ;
// boss đánh theo lượt (linh thú xuất chiến cùng đánh và hộ thể). Luật nằm ở game/vucTham.ts.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { datNhac, phat, type Tieng } from '../amThanh.ts';
import { LUAT } from '../game/duLieu.ts';
import { mauHienTai, mauToiDa, type Kho } from '../game/kho.ts';
import { giayDuBuoc, theLucHienTai } from '../game/kyNgo.ts';
import { timLoaiThu } from '../game/linhThu.ts';
import {
  BOSS,
  LUAT_VUC,
  NEN_TRAN,
  TEN_LOP,
  TRANG_THAI,
  anhBoss,
  anhQuai,
  banDoVuc,
  batDauTran,
  bossConSong,
  chayTron,
  chuTui,
  danhQuai,
  diVuc,
  diemVuc,
  dsDanVuc,
  dungDanVuc,
  giayChoNghi,
  giayDoiVuc,
  keVuc,
  kiemChet,
  lamMoiVuc,
  ngayVuc,
  laThoat,
  lopTang,
  luiTran,
  bossDanh,
  nguoiDanh,
  nghiNgoi,
  roiVuc,
  thayVuc,
  thuRaTran,
  tiLeChay,
  timQuai,
  tuBo,
  uocTiLeDanh,
  type HanhDong,
  type TrangThaiId,
} from '../game/vucTham.ts';
import { dongHo, useBayGio } from './PhuongThi.tsx';
import { LopHieuUng, useHieuUng } from './HieuUngTran.tsx';
import { ManTran, type SuKienTran } from './ManTran.tsx';
import { MO_O, timBiTich, timTrongTui } from '../game/voCong.ts';
import type { KetTuDong } from '../game/chienDau.ts';

const KC = 92; // khoảng cách giữa hai tầng trên bản đồ (px)
const DINH = 56; // lề trên của tầng 0
const anhDau = (ten: string) => `./hinh/vuc-tham/dau/${ten}.webp`;
const anhNen = (ten: string) => `./hinh/vuc-tham/nen/${ten}.webp`;
const phanTram = (x: number) => `${Math.round(x * 100)}%`;
const mauTiLe = (x: number) => (x >= 0.6 ? 'cao' : x >= 0.3 ? 'vua' : 'thap');
const TIENG_TT: Record<TrangThaiId, Tieng> = { doc: 'trung-doc', mau: 'chay-mau', yeu: 'bi-danh', hac: 'hac-hoa' };
/** Mỗi bước: tiếng chân, rồi một tiếng thì thầm ngẫu nhiên. */
function tiengBuoc() {
  phat('buoc-di');
  setTimeout(() => phat((['thi-tham-1', 'thi-tham-2', 'thi-tham-3'] as const)[Math.floor(Math.random() * 3)]), 350);
}

/** Khung xương sắt kể chuyện của Vực Thẳm. */
function KhungVuc({ tieuDe, children }: { tieuDe: string; children: ReactNode }) {
  return (
    <div className="lop-phu lop-vuc">
      <div className="khung-vuc" onClick={(e) => e.stopPropagation()}>
        <img className="mat-khung-vuc" src="./hinh/vuc-tham/khung-vuc-mat.webp" alt="" draggable={false} />
        <div className="ruot-vuc">
          <h2>{tieuDe}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
/** Sân đấu: nền theo tầng lớp, sinh vật đứng giữa. */
function SanDau({ lop, anh, rung, lon, children }: { lop: number; anh: string; rung?: number; lon?: boolean; children?: ReactNode }) {
  return (
    <div className={`san-dau-vuc ${lon ? 'lon' : ''}`} style={{ backgroundImage: `url(${anhNen(NEN_TRAN[lop])}), url(${anhNen(NEN_TRAN[0])})` }}>
      <img key={`${anh}|${rung ?? 0}`} className={`sinh-vat ${rung ? 'rung' : ''}`} src={anh} alt="" draggable={false} />
      {children}
    </div>
  );
}
function ThanhMau({ nay, max, chu, loai }: { nay: number; max: number; chu: string; loai: string }) {
  return (
    <span className={`thanh-vuc ${loai}`}>
      <i style={{ width: `${Math.max(0, Math.min(100, (nay / Math.max(1, max)) * 100))}%` }} />
      <em>{chu}</em>
    </span>
  );
}
function DongTrangThai({ kho }: { kho: Kho }) {
  const tt = kho.vuc.tt;
  const ds = (['doc', 'mau', 'yeu', 'hac'] as TrangThaiId[]).filter((id) => tt[id] > 0);
  if (!ds.length) return null;
  return (
    <div className="dong-tt-vuc">
      {ds.map((id) => (
        <span key={id} className={`tt-vuc tt-${id}`} title={TRANG_THAI[id].moTa}>
          <img src={`./hinh/vuc-tham/${TRANG_THAI[id].anh}.webp`} alt="" />
          {TRANG_THAI[id].ten} {id === 'hac' ? `${tt.hac}%` : `· ${tt[id]} bước`}
        </span>
      ))}
    </div>
  );
}
function NhanMat({ nhan, mat }: { nhan: string[]; mat: string[] }) {
  if (!nhan.length && !mat.length) return null;
  return (
    <div className="nhan-mat vuc">
      {nhan.length > 0 && <p className="nhan">Nhặt được: {nhan.join(', ')}</p>}
      {mat.length > 0 && <p className="mat">Mất: {mat.join(', ')}</p>}
    </div>
  );
}

type Bao =
  | null
  | { loai: 'ket-gap'; tieuDe: string; anh: string; lop: number; chu: string; nhan: string[]; mat: string[] }
  | { loai: 'chet'; mat: string[] }
  | { loai: 'nghi' }
  | { loai: 'doi-hinh' }
  | { loai: 'thoat'; cat: string[] }
  | { loai: 'thang-boss'; ten: string; anh: string; lop: number; nhan: string[] };

export function VucTham({ kho, doiKho, onVe }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; onVe: () => void }) {
  const luc = useBayGio();
  const v = kho.vuc;
  const bd = banDoVuc(kho);
  const d = diemVuc(kho, v.viTri);
  const [bao, datBao] = useState<Bao>(null);
  const [moDan, datMoDan] = useState(false);
  const [boQuaCong, datBoQuaCong] = useState<number | null>(null);
  const [rung, datRung] = useState(0);
  const cuonRef = useRef<HTMLDivElement>(null);
  const tl = theLucHienTai(kho, luc);
  const mau = mauHienTai(kho, luc);
  const mauMax = mauToiDa(kho);
  const duBuoc = tl >= LUAT.kyNgo.theLucMoiBuoc;
  const tran = v.tran;
  const gap = v.gap;
  const hu = useHieuUng(() => datRung((x) => x + 1));
  /** Sự kiện cho màn trận boss chạy hiệu ứng; màn kết chiếu xong mới hiện bảng kể. */
  const [suKien, datSuKien] = useState<SuKienTran | null>(null);
  const demSk = useRef(0);
  const [ketTranAnim, datKetTranAnim] = useState<{ thang: boolean; hien: boolean; tran: NonNullable<typeof v.tran> } | null>(null);
  /** Lượt vừa rồi người chơi tung tuyệt chiêu: boss đợi cảnh cắt chiếu xong mới đánh trả. */
  const vuaTuyet = useRef(false);
  /** Trận tự đánh với quái đang phát lại từng lượt (kết quả đã ghi vào kho từ trước). */
  const [phatLai, datPhatLai] = useState<{ td: KetTuDong; i: number; quai: string; lop: number; ket: () => void } | null>(null);
  const voKy = timTrongTui(kho.voCong, kho.voCong.lap.voKy);
  const tuyet = kho.tuVi.canhGioi >= MO_O.tuyetChieu ? timTrongTui(kho.voCong, kho.voCong.lap.tuyetChieu) : null;

  // nhạc theo chỗ đứng: boss > chỗ nghỉ > tầng lớp
  useEffect(() => {
    datNhac(tran ? (tran.boss === 'ma-long' ? 'boss-cuoi' : 'boss-vuc') : d.loai === 'nghi' ? 'cho-nghi' : (['vuc-nong', 'vuc-sau', 'vuc-tham'] as const)[lopTang(d.tang)]);
  }, [tran?.boss, d.loai, d.tang, !!tran]); // eslint-disable-line react-hooks/exhaustive-deps
  // tim đập khi máu thấp hoặc hắc hoá nặng
  const nguy = v.trong && (mau < mauMax * 0.3 || v.tt.hac >= 70);
  useEffect(() => {
    if (!nguy) return;
    phat('tim-dap');
    const id = setInterval(() => phat('tim-dap'), 1100);
    return () => clearInterval(id);
  }, [nguy]);
  // máu cạn mà chưa xử (vd máu tối đa vừa giảm): gục ngã
  useEffect(() => {
    if (bao) return;
    const sau = kiemChet(kho);
    if (!sau) return;
    doiKho(() => sau);
    phat('chet-vuc');
    datBao({ loai: 'chet', mat: chuTui(kho.vuc.tui) });
  }, [mau <= 0, v.tt.hac >= LUAT_VUC.hacToiDa]); // eslint-disable-line react-hooks/exhaustive-deps
  // qua ngày mới: vực đổi hình
  const homNay = ngayVuc(luc);
  useEffect(() => {
    if (v.ngay !== homNay) doiKho((k) => lamMoiVuc(k));
  }, [homNay]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (v.doiHinh && !bao) datBao({ loai: 'doi-hinh' });
  }, [v.doiHinh]); // eslint-disable-line react-hooks/exhaustive-deps
  // cuộn bản đồ theo người chơi
  useEffect(() => {
    const c = cuonRef.current;
    if (c) c.scrollTo({ top: DINH + d.tang * KC - c.clientHeight / 2, behavior: 'smooth' });
  }, [d.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const bamDiem = (id: number) => {
    if (id === v.viTri || !keVuc(kho, v.viTri, id)) return;
    const r = diVuc(kho, id);
    if (!r) return;
    doiKho(() => r.kho);
    datBoQuaCong(null);
    tiengBuoc();
    if (r.chet) {
      phat('chet-vuc');
      return datBao({ loai: 'chet', mat: [...chuTui(kho.vuc.tui), ...(r.matMau ? [`${r.matMau} máu vì độc và vết thương`] : [])] });
    }
    if (r.kho.vuc.gap) setTimeout(() => phat('gap-quai-vuc'), 250);
    else if (laThoat(r.kho, id) && diemVuc(r.kho, id).loai !== 'boss') {
      phat('loi-thoat');
      datBao({ loai: 'thoat', cat: r.catDo });
    }
  };

  // ---- chạm trán ----
  const quai = gap ? timQuai(gap.quai) : null;
  const xuLyGap = (r: ReturnType<typeof danhQuai>, tieuDe: string, chuThanh: string, chuBai: string) => {
    if (!r || !quai) return;
    doiKho(() => r.kho);
    // trận tự đánh: phát lại từng lượt rồi mới báo kết quả
    if (r.tuDong) {
      const td = r.tuDong;
      const q = quai;
      const ket = () => {
        datPhatLai(null);
        if (r.chet) {
          phat('chet-vuc');
          return datBao({ loai: 'chet', mat: [...chuTui(kho.vuc.tui), ...r.mat] });
        }
        if (r.thanh) phat('thang-vuc');
        else if (r.dinh) phat(TIENG_TT[r.dinh]);
        const chu = r.thanh ? chuThanh : r.hoa ? `${q.ten} gầm gừ rồi lùi vào bóng tối.` : chuBai;
        datBao({ loai: 'ket-gap', tieuDe: `${q.ten} · ${r.thanh ? 'Thắng' : r.hoa ? 'Bất phân' : 'Bị đánh lui'}`, anh: anhQuai(q.id), lop: q.lop, chu, nhan: r.nhan, mat: r.mat });
      };
      datPhatLai({ td, i: 0, quai: q.id, lop: q.lop, ket });
      return;
    }
    if (r.chet) {
      phat('chet-vuc');
      return datBao({ loai: 'chet', mat: [...chuTui(kho.vuc.tui), ...r.mat] });
    }
    if (r.thanh) phat(tieuDe === 'Thắng' ? 'thang-vuc' : 'buoc-di');
    else {
      phat('bi-danh');
      if (r.dinh) setTimeout(() => phat(TIENG_TT[r.dinh!]), 500);
      datRung((x) => x + 1);
    }
    datBao({ loai: 'ket-gap', tieuDe: `${quai.ten} · ${tieuDe}`, anh: anhQuai(quai.id), lop: quai.lop, chu: r.thanh ? chuThanh : chuBai, nhan: r.nhan, mat: r.mat });
  };

  // ---- boss ----
  const coCong = d.loai === 'boss' && !tran && bossConSong(kho, d.id, luc) && boQuaCong !== d.id && !gap && !bao;
  const daPhaCong = !!v.bossDiet[d.id];
  /** Kết thúc trận (thắng / gục) sau nửa lượt nào cũng xử như nhau. */
  const ketTran = (r: NonNullable<ReturnType<typeof nguoiDanh>>, bossId: keyof typeof BOSS, tuiTruoc: Record<string, number>, tranCuoi: NonNullable<typeof v.tran>, tre = 0) => {
    if (r.ket === 'tiep') return;
    const thang = r.ket === 'thang';
    // giữ ảnh trận cuối NGAY (kho đã xoá trận) để màn trận không biến mất giữa cảnh cắt; màn kết hiện sau
    datKetTranAnim({ thang, hien: false, tran: { ...tranCuoi, choBoss: false } });
    // thanh máu boss về 0 đúng lúc đòn chót nổ
    if (thang) setTimeout(() => datKetTranAnim((c) => (c ? { ...c, tran: { ...c.tran, mau: 0 } } : c)), Math.max(0, tre - 50));
    setTimeout(() => {
      datKetTranAnim((c) => (c ? { ...c, hien: true } : c));
      phat(thang ? 'thang-vuc' : 'chet-vuc');
    }, tre + 500);
    setTimeout(() => {
      datKetTranAnim(null);
      if (thang) datBao({ loai: 'thang-boss', ten: BOSS[bossId].ten, anh: anhBoss(bossId, 'dung'), lop: lopTang(BOSS[bossId].tang), nhan: r.nhan });
      else datBao({ loai: 'chet', mat: chuTui(tuiTruoc) });
    }, tre + 2600);
  };
  /** Nửa lượt của người chơi; boss đánh trả sau một nhịp (xem hiệu ứng choBoss bên dưới). */
  const hanhDong = (hd: HanhDong) => {
    if (!tran) return;
    const r = nguoiDanh(kho, hd);
    if (!r) return;
    doiKho(() => r.kho);
    const tuyetCh = hd.loai === 'tuyet-chieu';
    vuaTuyet.current = tuyetCh;
    if (hd.loai === 'vo-ky' || hd.loai === 'thuong') setTimeout(() => phat('danh-trung-vuc'), 170);
    else if (tuyetCh) {
      phat('gam-boss');
      setTimeout(() => phat('danh-trung-vuc'), 1150);
    } else if (hd.loai === 'do') phat('do-don');
    else phat('hao-cam');
    const tb = timTrongTui(kho.voCong, kho.voCong.lap.tuyetChieu);
    datSuKien({
      id: ++demSk.current,
      loai: tuyetCh ? 'tuyet' : hd.loai === 'vo-ky' || hd.loai === 'thuong' ? 'danh' : hd.loai === 'do' ? 'thu' : 'dan',
      vfx: r.vfx,
      tenChieu: tuyetCh && tb ? timBiTich(tb.id).ten : undefined,
    });
    ketTran(r, tran.boss, kho.vuc.tui, tran, tuyetCh ? 1200 : 300);
  };
  // boss đánh trả chậm một giây sau đòn của người chơi (cả khi tải lại trang giữa chừng)
  const khoRef = useRef(kho);
  khoRef.current = kho;
  useEffect(() => {
    if (!tran?.choBoss) return;
    const id = setTimeout(() => {
      const k0 = khoRef.current;
      const t0 = k0.vuc.tran;
      if (!t0?.choBoss) return;
      const r = bossDanh(k0);
      if (!r) return;
      doiKho(() => r.kho);
      const lon = r.chieu?.loai === 'lon';
      datSuKien({ id: ++demSk.current, loai: 'boss', vfx: r.vfx, lon });
      if (r.chieu && r.chieu.loai !== 'thuong') phat('gam-boss');
      if (r.chieu?.dmg && !r.thuDo) setTimeout(() => phat('bi-danh'), lon ? 420 : 220);
      if (r.dinh[0]) setTimeout(() => phat(TIENG_TT[r.dinh[0]]), 800);
      ketTran(r, t0.boss, k0.vuc.tui, t0, 600);
    }, vuaTuyet.current ? 2100 : 1100);
    return () => clearTimeout(id);
  }, [tran?.choBoss, tran?.luot]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!phatLai) return;
    const l = phatLai.td.luot[phatLai.i];
    if (l) {
      hu.phat(l.vfx);
      if (l.vfx.some((x) => x.loai === 'so' && x.ben === 'dich')) phat('danh-trung-vuc');
      if (l.vfx.some((x) => x.loai === 'so' && x.ben === 'minh' && x.kieu === 'thuong')) setTimeout(() => phat('bi-danh'), 350);
    }
    const id = setTimeout(() => {
      if (phatLai.i + 1 >= phatLai.td.luot.length) phatLai.ket();
      else datPhatLai((c) => (c ? { ...c, i: c.i + 1 } : c));
    }, 900);
    return () => clearTimeout(id);
  }, [phatLai?.i, !!phatLai]); // eslint-disable-line react-hooks/exhaustive-deps
  const tlDanh = useMemo(() => (gap ? uocTiLeDanh(kho, 80) : 0), [gap?.quai, gap?.diem, gap?.langThang, Math.round(mau / Math.max(1, mauMax) * 20), kho.tuVi.canhGioi, kho.voCong, v.tt.yeu > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- bản đồ ----
  const H = DINH * 2 + LUAT_VUC.soTang * KC;
  const thay = bd.diem.filter((x) => thayVuc(kho, x.id));
  const tangThay = [...new Set(thay.map((x) => x.tang))];
  const iconDiem = (x: (typeof bd.diem)[number], daToi: boolean) => {
    if (x.loai === 'cua' || x.loai === 'thoat') return anhDau('loi-thoat');
    if (x.loai === 'nghi') return anhDau('cho-nghi');
    if (x.loai === 'boss') return anhDau('boss');
    return daToi ? anhDau('quai') : null;
  };
  const thu = thuRaTran(kho, luc);

  return (
    <div className="man-vuc">
      <header className="dau-vuc">
        <div className="hang-dau-vuc">
          <b>
            Vực Thẳm · Tầng {d.tang}
            <small>
              {TEN_LOP[lopTang(Math.max(1, d.tang))]} · sâu nhất {v.sauNhat}/{LUAT_VUC.soTang}
            </small>
            <small>Vực đổi hình sau {dongHo(giayDoiVuc(luc))}</small>
          </b>
          <button className="nut-nho nut-vuc" onClick={() => datMoDan(true)}>
            Dùng đan
          </button>
        </div>
        <div className="chi-so-ban-do">
          <ThanhMau loai="the-luc" nay={tl} max={LUAT.kyNgo.theLucToiDa} chu={`Thể lực ${Math.floor(tl)}/${LUAT.kyNgo.theLucToiDa}`} />
          <ThanhMau loai="mau" nay={mau} max={mauMax} chu={`Máu ${mau}/${mauMax}`} />
        </div>
        <DongTrangThai kho={kho} />
        {Object.keys(v.tui).length > 0 && <p className="tui-vuc">Đang mang (chưa cất, chết là mất): {chuTui(v.tui).join(', ')}</p>}
        {!duBuoc && <p className="bao-vuc">Kiệt sức. Đủ sức cho một bước sau {dongHo(giayDuBuoc(kho, luc))}.</p>}
        {mau <= mauMax * 0.15 && <p className="bao-vuc nguy">Máu sắp cạn và ở đây máu không tự hồi. Dùng đan, tìm chỗ nghỉ, hoặc quay về lối thoát.</p>}
      </header>

      <div className="cuon-vuc" ref={cuonRef}>
        <div className="mat-vuc" style={{ height: H }}>
          <svg className="duong-vuc" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
            {bd.duong.map(([a, b]) => {
              if (!thayVuc(kho, a) || !thayVuc(kho, b) || !(v.daDen.includes(a) || v.daDen.includes(b))) return null;
              const A = bd.diem[a];
              const B = bd.diem[b];
              const di = (a === v.viTri || b === v.viTri) && duBuoc && !gap && !tran;
              return <line key={`${a}-${b}`} className={di ? 'di-duoc' : ''} x1={A.x} y1={DINH + A.tang * KC} x2={B.x} y2={DINH + B.tang * KC} vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
          {tangThay.map((t) => (
            <span key={t} className="ten-tang" style={{ top: DINH + t * KC }}>
              {t === 0 ? 'Miệng vực' : `Tầng ${t}`}
            </span>
          ))}
          {thay.map((x) => {
            const daToi = v.daDen.includes(x.id);
            const ke = keVuc(kho, v.viTri, x.id);
            const icon = iconDiem(x, daToi);
            const sach = x.loai === 'quai' && v.diet.includes(x.id);
            return (
              <button
                key={x.id}
                data-im
                className={`diem-vuc loai-${x.loai} ${daToi ? 'da-toi' : 'chua-toi'} ${ke && duBuoc && !gap && !tran ? 'ke' : ''} ${sach ? 'sach' : ''} ${x.id === v.viTri ? 'dang-dung' : ''}`}
                style={{ left: `${x.x}%`, top: DINH + x.tang * KC }}
                onClick={() => bamDiem(x.id)}
                aria-label={daToi ? x.loai : 'Chưa rõ'}
              >
                {icon ? <img src={icon} alt="" draggable={false} /> : <i className="diem-chua-ro">?</i>}
              </button>
            );
          })}
          <img className="dau-nguoi vuc" src="./hinh/ban-do/dau-nguoi-choi.webp" alt="" draggable={false} style={{ left: `${d.x}%`, top: DINH + d.tang * KC }} />
        </div>
      </div>

      <footer className="chan-vuc">
        {d.loai === 'nghi' && !gap && (
          <button
            className="nut chinh"
            disabled={giayChoNghi(kho, d.id, luc) > 0}
            onClick={() => {
              doiKho((k) => nghiNgoi(k));
              datBao({ loai: 'nghi' });
            }}
          >
            {giayChoNghi(kho, d.id, luc) > 0 ? `Lửa đã tàn · nhóm lại sau ${dongHo(giayChoNghi(kho, d.id, luc))}` : 'Nghỉ ngơi bên lửa'}
          </button>
        )}
        {laThoat(kho, d.id) && !gap && !tran && (
          <button
            className="nut chinh"
            onClick={() => {
              doiKho((k) => roiVuc(k));
              onVe();
            }}
          >
            Leo lên · rời Vực Thẳm
          </button>
        )}
        {d.loai === 'boss' && daPhaCong && bossConSong(kho, d.id, luc) && !tran && boQuaCong === d.id && (
          <button className="nut" onClick={() => datBoQuaCong(null)}>
            Khiêu chiến lại {BOSS[d.boss!].ten}
          </button>
        )}
        {!laThoat(kho, d.id) && d.loai !== 'nghi' && <p className="goi-y-vuc">Chạm điểm sáng kề bên để đi.</p>}
      </footer>

      {/* ---- quái chặn đường ---- */}
      {gap && quai && !bao && !moDan && !phatLai && (
        <KhungVuc tieuDe={`${quai.ten}${gap.langThang ? ' · lang thang' : diemVuc(kho, gap.diem).cut ? ' · giữ ngõ cụt' : ''}`}>
          <SanDau lop={quai.lop} anh={anhQuai(quai.id)} rung={rung} />
          <p className="loi-ke">{quai.mo}</p>
          <DongTrangThai kho={kho} />
          <div className="day-lua-chon">
            <button data-im className="lua-chon" onClick={() => xuLyGap(danhQuai(kho), 'Thắng', `${quai.ten} đổ gục. Ngươi lục lọi những gì nó để lại.`, `Ngươi không địch nổi. ${quai.ten} vẫn chắn lối.`)}>
              <b>Đánh</b>
              <small>
                Tự đánh bằng {voKy ? timBiTich(voKy.id).ten : 'quyền cước'}
                {tuyet ? ` + ${timBiTich(tuyet.id).ten}` : ''} · thắng ~<span className={`ti-le-kn ${mauTiLe(tlDanh)}`}>{phanTram(tlDanh)}</span> · yếu trước {quai.kiem === 'luc' ? 'ngoại công' : 'nội công'} · trúng đòn dễ dính {TRANG_THAI[quai.tt].ten.toLowerCase()}
              </small>
            </button>
            <button data-im className="lua-chon" onClick={() => xuLyGap(chayTron(kho), 'Thoát thân', 'Ngươi lùi vào bóng tối, nó không đuổi theo.', 'Nó vồ trúng ngươi trước khi ngươi kịp lùi lại.')}>
              <b>Bỏ chạy</b>
              <small>
                Thân pháp · <span className={`ti-le-kn ${mauTiLe(tiLeChay(kho, luc))}`}>{phanTram(tiLeChay(kho, luc))}</span> · lùi về chỗ vừa đi
              </small>
            </button>
            <button
              className="lua-chon"
              onClick={() => {
                doiKho((k) => tuBo(k));
                phat('buoc-di');
              }}
            >
              <b>Từ bỏ</b>
              <small>Chắc chắn · bị đẩy ngược về lối thoát gần nhất</small>
            </button>
          </div>
        </KhungVuc>
      )}

      {/* ---- trận tự đánh đang phát lại ---- */}
      {phatLai && (() => {
        const l = phatLai.td.luot[phatLai.i];
        const q = timQuai(phatLai.quai);
        return (
          <KhungVuc tieuDe={`${q.ten} · lượt ${phatLai.i + 1}`}>
            <SanDau lop={phatLai.lop} anh={anhQuai(q.id)} rung={rung}>
              <LopHieuUng ds={hu.ds} ben="dich" />
              <LopHieuUng ds={hu.ds} ben="minh" />
            </SanDau>
            <ThanhMau loai="mau-boss" nay={l?.mauDich ?? 0} max={phatLai.td.mauMaxDich} chu={q.ten} />
            <ThanhMau loai="mau" nay={l?.mauMinh ?? 0} max={mauMax} chu={`Máu ${Math.round(l?.mauMinh ?? 0)}/${mauMax}`} />
            <div className="nhat-ky tu-dong">
              {phatLai.td.luot.slice(0, phatLai.i + 1).reverse().map((x, j) => (
                <p key={phatLai.i - j} className={j === 0 ? 'moi' : ''}>
                  Lượt {phatLai.i + 1 - j}: {x.dong.join(' ')}
                </p>
              ))}
            </div>
            <div className="hang-nut">
              <button className="nut-nho" onClick={() => phatLai.ket()}>
                Bỏ qua
              </button>
            </div>
          </KhungVuc>
        );
      })()}

      {/* ---- cổng boss ---- */}
      {coCong && d.boss && (
        <KhungVuc tieuDe={BOSS[d.boss].ten}>
          <SanDau lop={lopTang(d.tang)} anh={anhBoss(d.boss, 'dung')} />
          <p className="loi-ke">{BOSS[d.boss].mo}</p>
          {thu && <p className="loi-ke thu-theo">{timLoaiThu(thu.loai).ten} theo ngươi vào trận: {LUAT_VUC.thuDanhMoi} lượt đánh một đòn, {LUAT_VUC.thuDoMoi} lượt đỡ thay một đòn.</p>}
          <div className="day-lua-chon">
            <button data-im className="lua-chon" onClick={() => { doiKho((k) => batDauTran(k)); phat('gam-boss'); }}>
              <b>{daPhaCong ? 'Khiêu chiến lại' : 'Khiêu chiến'}</b>
              <small>Đánh theo lượt tới khi một bên gục ngã</small>
            </button>
            <button
              className="lua-chon"
              onClick={() => {
                datBoQuaCong(d.id);
                if (!daPhaCong) doiKho((k) => ({ ...k, vuc: { ...k.vuc, viTri: k.vuc.truoc, truoc: k.vuc.viTri } }));
              }}
            >
              <b>{daPhaCong ? 'Đi qua' : 'Lui lại'}</b>
              <small>{daPhaCong ? 'Cổng đã phá, cứ thế đi tiếp' : 'Quay về chỗ vừa đi'}</small>
            </button>
          </div>
        </KhungVuc>
      )}

      {/* ---- trận boss (toàn màn hình, xem ManTran.tsx) ---- */}
      {((tran && !bao) || ketTranAnim) && (
        <ManTran
          kho={kho}
          tran={ketTranAnim?.tran ?? tran!}
          luc={luc}
          suKien={suKien}
          ket={ketTranAnim?.hien ? { thang: ketTranAnim.thang } : null}
          khoa={!!ketTranAnim}
          onHanhDong={hanhDong}
          onDan={() => datMoDan(true)}
          onRutLui={() => {
            if (confirm('Rút lui? Boss sẽ hồi đầy máu.')) doiKho((k) => luiTran(k));
          }}
        />
      )}

      {/* ---- dùng đan ---- */}
      {moDan && (
        <div className="lop-phu lop-vuc" onClick={() => datMoDan(false)}>
          <div className="bang tam bang-vuc" onClick={(e) => e.stopPropagation()}>
            <h2>Dùng đan</h2>
            <p className="chu-nho">{tran ? 'Trong trận, dùng đan mất một lượt.' : 'Trong vực máu không tự hồi.'}</p>
            {dsDanVuc(kho).length === 0 && <p className="chu-nho">Không mang viên nào dùng được.</p>}
            {dsDanVuc(kho).map((m) => (
              <div key={m.khoa} className="dong-tui">
                <img src={m.anh} alt="" />
                <div className="than-dong">
                  <b>
                    {m.ten} ×{m.co}
                  </b>
                  <div className="hang-pham">
                    <span>{m.moTa}</span>
                  </div>
                </div>
                <button
                  className="nut-nho"
                  onClick={() => {
                    if (tran) {
                      datMoDan(false);
                      return hanhDong({ loai: 'dan', khoa: m.khoa });
                    }
                    const r = dungDanVuc(kho, m.khoa);
                    if (!r) return;
                    doiKho(() => r.kho);
                    phat('hao-cam');
                  }}
                >
                  Dùng
                </button>
              </div>
            ))}
            <div className="hang-nut">
              <button className="nut-nho" onClick={() => datMoDan(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- các bảng kể ---- */}
      {bao?.loai === 'ket-gap' && (
        <KhungVuc tieuDe={bao.tieuDe}>
          <SanDau lop={bao.lop} anh={bao.anh} rung={rung} />
          <p className="loi-ke">{bao.chu}</p>
          <NhanMat nhan={bao.nhan} mat={bao.mat} />
          <DongTrangThai kho={kho} />
          <div className="hang-nut">
            <button className="nut chinh" onClick={() => datBao(null)}>
              {gap ? 'Đối mặt tiếp' : 'Đi tiếp'}
            </button>
          </div>
        </KhungVuc>
      )}
      {bao?.loai === 'thang-boss' && (
        <KhungVuc tieuDe={`${bao.ten} đã gục ngã`}>
          <SanDau lop={bao.lop} anh={bao.anh} />
          <p className="loi-ke">Thân xác khổng lồ đổ sập, bóng tối quanh đây như nhạt đi một chút.</p>
          <NhanMat nhan={bao.nhan} mat={[]} />
          {laThoat(kho, kho.vuc.viTri) ? (
            <p className="loi-ke thu-theo">Đồ đã cất an toàn. Có thể rời vực ngay tại đây.</p>
          ) : (
            <p className="loi-ke thu-theo">Đồ chưa cất: tới lối thoát ở tầng dưới để cất.</p>
          )}
          <div className="hang-nut">
            <button className="nut chinh" onClick={() => datBao(null)}>
              Đi tiếp
            </button>
          </div>
        </KhungVuc>
      )}
      {bao?.loai === 'doi-hinh' && (
        <KhungVuc tieuDe="Vực thẳm đổi hình">
          <p className="loi-ke">
            Vách đá sụp rồi mọc lại thành lối khác. Quái đã hạ lại bò ra. Ngươi bị đẩy về miệng vực.
          </p>
          <div className="hang-nut">
            <button
              className="nut chinh"
              onClick={() => {
                datBao(null);
                doiKho((k) => ({ ...k, vuc: { ...k.vuc, doiHinh: false } }));
              }}
            >
              Đứng dậy
            </button>
          </div>
        </KhungVuc>
      )}
      {bao?.loai === 'nghi' && (
        <KhungVuc tieuDe="Lửa trại">
          <img className="tranh-ke vuc" src={anhNen('cho-nghi')} alt="" draggable={false} />
          <p className="loi-ke">Hơi ấm hiếm hoi giữa vực thẳm. Vết thương khép lại, độc tan, đầu óc tỉnh lại.</p>
          <div className="hang-nut">
            <button className="nut chinh" onClick={() => datBao(null)}>
              Đứng dậy
            </button>
          </div>
        </KhungVuc>
      )}
      {bao?.loai === 'thoat' && (
        <KhungVuc tieuDe="Lối thoát">
          <img className="tranh-ke vuc" src={anhNen('loi-thoat')} alt="" draggable={false} />
          <p className="loi-ke">Bậc đá dẫn lên ánh ngày. Có thể rời vực ở đây; lần sau vào lại sẽ bắt đầu từ đây.</p>
          {bao.cat.length > 0 && <p className="nhan-mat vuc nhan">Đã cất an toàn: {bao.cat.join(', ')}</p>}
          <div className="hang-nut">
            <button className="nut-nho" onClick={() => datBao(null)}>
              Ở lại, đi tiếp
            </button>
            <button
              className="nut chinh"
              onClick={() => {
                doiKho((k) => roiVuc(k));
                onVe();
              }}
            >
              Leo lên
            </button>
          </div>
        </KhungVuc>
      )}
      {bao?.loai === 'chet' && (
        <KhungVuc tieuDe="Gục ngã">
          <img className="tranh-ke vuc" src={anhNen('vuc-chet')} alt="" draggable={false} onError={(e) => (e.currentTarget.style.display = 'none')} />
          <p className="loi-ke nguy">Bóng tối khép lại. Ngươi bị ném lên miệng vực, hồn lìa khỏi xác, đồ mang theo mất sạch.</p>
          <NhanMat nhan={[]} mat={bao.mat} />
          <div className="hang-nut">
            <button className="nut chinh" onClick={onVe}>
              Về động phủ
            </button>
          </div>
        </KhungVuc>
      )}
    </div>
  );
}
