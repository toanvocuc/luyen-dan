// Vực Thẳm: bản đồ mê cung đi XUỐNG 50 tầng. Chạm điểm kề để đi; gặp quái thì Đánh / Bỏ chạy / Từ bỏ;
// boss đánh theo lượt (linh thú xuất chiến cùng đánh và hộ thể). Luật nằm ở game/vucTham.ts.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { datNhac, phat, type Tieng } from '../amThanh.ts';
import { LUAT } from '../game/duLieu.ts';
import { mauHienTai, mauToiDa, type Kho } from '../game/kho.ts';
import { giayDuBuoc, theLucHienTai } from '../game/kyNgo.ts';
import { anhThu, timLoaiThu } from '../game/linhThu.ts';
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
  chieuBoss,
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
  luotTran,
  nghiNgoi,
  roiVuc,
  satThuong,
  thayVuc,
  thuRaTran,
  tiLeChay,
  tiLeDanh,
  timQuai,
  tuBo,
  type HanhDong,
  type TrangThaiId,
} from '../game/vucTham.ts';
import { dongHo, useBayGio } from './PhuongThi.tsx';
import { AnhThu } from './LinhThuVien.tsx';

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
function SanDau({ lop, anh, rung, lon }: { lop: number; anh: string; rung?: number; lon?: boolean }) {
  return (
    <div className={`san-dau-vuc ${lon ? 'lon' : ''}`} style={{ backgroundImage: `url(${anhNen(NEN_TRAN[lop])}), url(${anhNen(NEN_TRAN[0])})` }}>
      <img key={`${anh}|${rung ?? 0}`} className={`sinh-vat ${rung ? 'rung' : ''}`} src={anh} alt="" draggable={false} />
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
  const hanhDong = (hd: HanhDong) => {
    const r = luotTran(kho, hd);
    if (!r) return;
    doiKho(() => r.kho);
    if (hd.loai === 'luc' || hd.loai === 'thanThuc') phat('danh-trung-vuc');
    else if (hd.loai === 'do') phat('do-don');
    datRung((x) => x + 1);
    if (r.chieu && r.chieu.loai !== 'thuong') setTimeout(() => phat('gam-boss'), 380);
    else if (r.chieu?.dmg) setTimeout(() => phat('bi-danh'), 420);
    if (r.dinh[0]) setTimeout(() => phat(TIENG_TT[r.dinh[0]]), 900);
    if (r.ket === 'thang' && tran) {
      setTimeout(() => phat('thang-vuc'), 500);
      datBao({ loai: 'thang-boss', ten: BOSS[tran.boss].ten, anh: anhBoss(tran.boss, 'dung'), lop: lopTang(BOSS[tran.boss].tang), nhan: r.nhan });
    } else if (r.ket === 'chet') {
      phat('chet-vuc');
      datBao({ loai: 'chet', mat: chuTui(kho.vuc.tui) });
    }
  };

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
  const danhSau = (n: number, moi: number) => {
    let k = 1;
    while ((n + k) % moi) k++;
    return k;
  };

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
        {!laThoat(kho, d.id) && d.loai !== 'nghi' && <p className="goi-y-vuc">Chạm điểm sáng kề bên để đi. Chỉ ra được khỏi vực ở lối thoát.</p>}
      </footer>

      {/* ---- quái chặn đường ---- */}
      {gap && quai && !bao && !moDan && (
        <KhungVuc tieuDe={`${quai.ten}${gap.langThang ? ' · lang thang' : diemVuc(kho, gap.diem).cut ? ' · giữ ngõ cụt' : ''}`}>
          <SanDau lop={quai.lop} anh={anhQuai(quai.id)} rung={rung} />
          <p className="loi-ke">{quai.mo}</p>
          <DongTrangThai kho={kho} />
          <div className="day-lua-chon">
            <button data-im className="lua-chon" onClick={() => xuLyGap(danhQuai(kho), 'Thắng', `${quai.ten} đổ gục. Ngươi lục lọi những gì nó để lại.`, `Ngươi không địch nổi. ${quai.ten} vẫn chắn lối.`)}>
              <b>Đánh</b>
              <small>
                {quai.kiem === 'luc' ? 'Lực' : 'Thần thức'} · <span className={`ti-le-kn ${mauTiLe(tiLeDanh(kho, luc))}`}>{phanTram(tiLeDanh(kho, luc))}</span> · thua thì dính {TRANG_THAI[quai.tt].ten.toLowerCase()}
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

      {/* ---- cổng boss ---- */}
      {coCong && d.boss && (
        <KhungVuc tieuDe={BOSS[d.boss].ten}>
          <SanDau lop={lopTang(d.tang)} anh={anhBoss(d.boss, 'dung')} />
          <p className="loi-ke">{BOSS[d.boss].mo}</p>
          {thu && <p className="loi-ke thu-theo">{timLoaiThu(thu.loai).ten} gầm gừ bên cạnh ngươi: cứ {LUAT_VUC.thuDanhMoi} lượt nó đánh một đòn, {LUAT_VUC.thuDoMoi} lượt đỡ thay ngươi một đòn.</p>}
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

      {/* ---- trận boss ---- */}
      {tran && !bao && (
        <div className="tran-vuc">
          <div className="dau-tran">
            <b>{BOSS[tran.boss].ten}</b>
            <ThanhMau loai="mau-boss" nay={tran.mau} max={tran.mauMax} chu={`${tran.mau}/${tran.mauMax}${tran.giap > 0 ? ' · giáp hoá' : ''}${tran.cuong ? ' · hoá ma' : ''}`} />
          </div>
          <SanDau lop={lopTang(BOSS[tran.boss].tang)} anh={anhBoss(tran.boss, tran.anh)} rung={rung} lon />
          <p className={`y-do ${chieuBoss(tran, tran.yDo).loai === 'lon' ? 'nguy' : ''}`}>
            Lượt {tran.luot + 1}: {chieuBoss(tran, tran.yDo).bao}
          </p>
          <div className="nhat-ky">
            {tran.nhatKy.slice(0, 3).map((x, i) => (
              <p key={i} style={{ opacity: 1 - i * 0.3 }}>
                {x}
              </p>
            ))}
          </div>
          <div className="nguoi-tran">
            <ThanhMau loai="mau" nay={mau} max={mauMax} chu={`Máu ${mau}/${mauMax}`} />
            <DongTrangThai kho={kho} />
            {thu && (
              <div className="thu-tran">
                <AnhThu src={anhThu(thu.loai, thu.dang)} ten={timLoaiThu(thu.loai).ten} />
                <span>
                  {timLoaiThu(thu.loai).ten}: đánh sau {danhSau(tran.luot, LUAT_VUC.thuDanhMoi)} lượt · hộ thể sau {danhSau(tran.luot, LUAT_VUC.thuDoMoi)} lượt
                </span>
              </div>
            )}
          </div>
          <div className="nut-tran">
            <button data-im className="nut" onClick={() => hanhDong({ loai: 'luc' })}>
              Đánh bằng sức mạnh
              <small>~{Math.round(satThuong(kho, tran, 'luc', luc))}</small>
            </button>
            <button data-im className="nut" onClick={() => hanhDong({ loai: 'thanThuc' })}>
              Đánh bằng thần thức
              <small>~{Math.round(satThuong(kho, tran, 'thanThuc', luc))}</small>
            </button>
            <button data-im className="nut" onClick={() => hanhDong({ loai: 'do' })}>
              Đỡ đòn
              <small>chỉ nhận {phanTram(LUAT_VUC.doDon)}</small>
            </button>
            <button className="nut" onClick={() => datMoDan(true)}>
              Dùng đan
              <small>mất lượt</small>
            </button>
          </div>
          <button
            className="nut-nho lui-tran"
            onClick={() => {
              if (confirm('Rút lui? Boss sẽ hồi đầy máu.')) doiKho((k) => luiTran(k));
            }}
          >
            Rút lui
          </button>
        </div>
      )}

      {/* ---- dùng đan ---- */}
      {moDan && (
        <div className="lop-phu lop-vuc" onClick={() => datMoDan(false)}>
          <div className="bang tam bang-vuc" onClick={(e) => e.stopPropagation()}>
            <h2>Dùng đan</h2>
            <p className="chu-nho">{tran ? 'Trong trận, dùng đan mất một lượt.' : 'Trong vực máu không tự hồi. Giải Độc, Chỉ Huyết, Thanh Tâm Đan luyện ở đan phòng (bậc Trúc Cơ).'}</p>
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
            <p className="loi-ke thu-theo">Đáy vực có trận truyền tống cổ: đồ đã được cất an toàn, ngươi có thể rời vực ngay tại đây.</p>
          ) : (
            <p className="loi-ke thu-theo">Đồ còn nằm trong túi mang theo: phải tới lối thoát mới cất được. Lối thoát kế tiếp ở ngay tầng dưới.</p>
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
            Mặt đất rung chuyển, vách đá sụp đổ rồi mọc lại thành những lối đi khác hẳn. Những thứ đã bị hạ lại bò ra từ bóng tối. Ngươi bị đẩy ngược về miệng vực.
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
          <p className="loi-ke">Ngọn lửa nhỏ nổ lách tách, hơi ấm hiếm hoi giữa vực thẳm. Vết thương khép lại, độc tan, đầu óc tỉnh táo hơn.</p>
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
          <p className="loi-ke">Một khe đá với những bậc thang thô ráp dẫn lên, xa tít trên kia le lói chút ánh ngày. Từ đây có thể rời vực; lần sau quay lại cũng sẽ bắt đầu ở đây.</p>
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
          <p className="loi-ke nguy">Bóng tối khép lại. Khi tỉnh dậy, ngươi đã bị ném lên miệng vực, hồn phách rời rạc, mọi thứ mang theo đều bị vực thẳm nuốt mất.</p>
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
