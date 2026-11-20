// Màn trận boss toàn màn hình: boss ở trên, nhân vật quay lưng ở góc dưới trái, cụm nút chiêu tròn ở góc dưới phải.
// Mọi chuyển động làm bằng CSS trên ảnh tĩnh: thở, lao tới, giật lùi khi trúng, đứng hình, rung màn,
// tuyệt chiêu có cảnh cắt (dải mực + nửa người + tên chiêu), màn kết thắng / thua.
import { useEffect, useRef, useState } from 'react';
import { LUAT_CUONG, chienMoi, duNguyen, duNguyenO, nguyenNay, nguyenToiDa, type BangTt, type Vfx } from '../game/chienDau.ts';
import { bacNen } from '../game/duLieu.ts';
import { mauHienTai, mauToiDa, type Kho } from '../game/kho.ts';
import { anhThu, timLoaiThu } from '../game/linhThu.ts';
import { phat } from '../amThanh.ts';
import { KHAC, MO_O, NGUYEN_TO, TEN_VAI, anhBiTich, khacHe, vaiCua, type He, type BiTich, nguyenCua, timBiTich, timTrongTui } from '../game/voCong.ts';
import { BOSS, LUAT_VUC, NEN_TRAN, anhBoss, chieuBoss, hoSoBoss, lopTang, thuRaTran, tuyetChieuBossSan, type HanhDong, type TranBoss } from '../game/vucTham.ts';
import { anhNhanVatDung } from './BupBe.tsx';
import { HangTrangThai, LopHieuUng, useHieuUng } from './HieuUngTran.tsx';
import { AnhThu } from './LinhThuVien.tsx';

export interface SuKienTran {
  id: number;
  loai: 'danh' | 'tuyet' | 'thu' | 'dan' | 'boss';
  vfx: Vfx[];
  tenChieu?: string;
  /** Hệ võ của tuyệt chiêu: chọn ảnh cảnh cắt. */
  he?: He;
  /** Đòn của boss là đòn lớn (gồng người, rung mạnh). */
  lon?: boolean;
}

const BO_THEO_BAC = ['pham-y', 'thanh-van', 'dan-su', 'kiem-tu', 'tien-bao'] as const;
const anhLung = (gioi: string | undefined, cg: number) => `./hinh/nhan-vat-lung/${gioi === 'Nữ' ? 'nu' : 'nam'}-${BO_THEO_BAC[bacNen(cg) - 1]}.webp`;
/** Ảnh cảnh cắt tuyệt chiêu: bóng mực theo hệ võ (một ảnh hợp mọi bộ trang phục). */
const anhTuyetKy = (gioi: string | undefined, he: He) => `./hinh/tuyet-ky/${gioi === 'Nữ' ? 'nu' : 'nam'}-${he}.webp`;
const anhNenTran = (lop: number) => `./hinh/vuc-tham/nen/${NEN_TRAN[lop]}.webp`;

/** Thanh có khung đồng; phần đã mất có vệt trắng chạy chậm theo sau. */
function Thanh({ loai, nay, max, chu }: { loai: 'boss' | 'mau' | 'nguyen'; nay: number; max: number; chu: string }) {
  const pt = Math.max(0, Math.min(100, (nay / Math.max(1, max)) * 100));
  return (
    <div className={`thanh-tran ${loai}`}>
      <div className="ruot">
        <i className="vet" style={{ width: `${pt}%` }} />
        <i className="day" style={{ width: `${pt}%` }} />
      </div>
      <em>{chu}</em>
    </div>
  );
}

export function ManTran({
  kho,
  tran,
  luc,
  suKien,
  ket,
  onHanhDong,
  onDan,
  onRutLui,
  khoa = false,
}: {
  kho: Kho;
  tran: TranBoss;
  luc: number;
  suKien: SuKienTran | null;
  /** Trận vừa xong: chiếu màn kết rồi mới gọi onXong của nó. */
  ket: { thang: boolean } | null;
  onHanhDong: (hd: HanhDong) => void;
  onDan: () => void;
  onRutLui: () => void;
  /** Trận đã ngã ngũ (đang chiếu kết): khoá mọi nút. */
  khoa?: boolean;
}) {
  const b = BOSS[tran.boss];
  const lop = lopTang(b.tang);
  const [rung, datRung] = useState(0);
  const hu = useHieuUng(() => datRung((x) => x + 1));
  const [dongBoss, datDongBoss] = useState('');
  const [dongNguoi, datDongNguoi] = useState('');
  const [catCanh, datCatCanh] = useState<{ ten: string; id: number; he?: He } | null>(null);
  const [moNhatKy, datMoNhatKy] = useState(false);
  const henGio = useRef<number[]>([]);
  const sau = (ms: number, f: () => void) => henGio.current.push(window.setTimeout(f, ms));
  useEffect(() => () => henGio.current.forEach((id) => clearTimeout(id)), []);

  const nv = kho.nhanVat!;
  const hs = hoSoBoss(kho, tran, luc);
  const st = tran.chien ?? chienMoi(nguyenToiDa(hs));
  const nguyen = nguyenNay(st, hs);
  const nguyenMax = nguyenToiDa(hs);
  const voKy = timTrongTui(kho.voCong, kho.voCong.lap.voKy);
  const tuyet = kho.tuVi.canhGioi >= MO_O.tuyetChieu ? timTrongTui(kho.voCong, kho.voCong.lap.tuyetChieu) : null;
  const tuyetSan = tuyetChieuBossSan(kho, tran, luc);
  const voKySan = !voKy || duNguyen(hs, st, 'vo-ky');
  /** Tuyệt chiêu đã hồi xong nhưng thiếu chân nguyên: vẫn bấm được để nghe tiếng báo thiếu. */
  const tuyetThieuNguyen = !!tuyet && !tuyetSan && st.hoi <= 0 && !duNguyen(hs, st, 'tuyet-chieu');
  const ban = !!tran.choBoss || !!catCanh || !!ket || khoa;
  const thu = thuRaTran(kho, luc);
  const chieu = chieuBoss(tran, tran.yDo);
  const phu = hs.phu ?? [null, null];
  /** Hệ khắc boss (để gợi ý): hệ X mà KHAC[X] === hệ boss. */
  const heKhacBoss = (Object.keys(KHAC) as (keyof typeof KHAC)[]).find((x) => KHAC[x] === b.he);
  const khac = (bt: BiTich | null) => !!bt && khacHe(bt.nguyenTo, b.he).kieu === 'khac';
  const gong = !tran.choBoss && chieu.loai === 'lon' && !tran.ngat;
  const ttBoss: BangTt = { ...(tran.chien?.dich ?? {}), ...(gong ? { gong: { tang: 1, luot: 0 } } : {}) };
  const cuongMax = tran.chien?.cuongMax ?? 0;
  const cuongNay = tran.chien?.cuong ?? 0;

  // chạy hiệu ứng theo từng sự kiện
  const daChay = useRef(0);
  useEffect(() => {
    if (!suKien || suKien.id === daChay.current) return;
    daChay.current = suKien.id;
    const trungDich = suKien.vfx.some((v) => v.loai === 'so' && v.ben === 'dich');
    const trungMinh = suKien.vfx.some((v) => v.loai === 'so' && v.ben === 'minh' && v.kieu === 'thuong');
    if (suKien.loai === 'danh') {
      datDongNguoi('lao');
      sau(170, () => {
        hu.phat(suKien.vfx);
        if (trungDich) datDongBoss('trung');
      });
      sau(520, () => {
        datDongNguoi('');
        datDongBoss('');
      });
    } else if (suKien.loai === 'tuyet') {
      datCatCanh({ ten: suKien.tenChieu ?? 'Tuyệt chiêu', id: suKien.id, he: suKien.he });
      sau(1150, () => {
        datCatCanh(null);
        datDongNguoi('lao');
        hu.phat(suKien.vfx);
        datDongBoss('trung');
        datRung((x) => x + 1);
      });
      sau(1700, () => {
        datDongNguoi('');
        datDongBoss('');
      });
    } else if (suKien.loai === 'boss') {
      datDongBoss(suKien.lon ? 'gong' : 'lao');
      sau(suKien.lon ? 420 : 220, () => {
        datDongBoss('lao');
        hu.phat(suKien.vfx);
        if (trungMinh) datDongNguoi('trung');
      });
      sau(suKien.lon ? 900 : 650, () => {
        datDongBoss('');
        datDongNguoi('');
      });
    } else hu.phat(suKien.vfx);
  }, [suKien?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dongMoi = tran.choBoss ? (tran.dongNguoi ?? []).join(' ') : tran.nhatKy[0] ?? '';

  return (
    <div className={`man-tran ${rung % 2 ? 'rung-a' : rung ? 'rung-b' : ''}`}>
      <div className="nen-man-tran" style={{ backgroundImage: `url(${anhNenTran(lop)}), url(${anhNenTran(0)})` }} />
      <div className="suong-tran" />

      {/* ---- boss ---- */}
      <header className="dau-man-tran">
        <button className="nut-goc" onClick={() => datMoNhatKy(true)} aria-label="Diễn biến">
          ≡
        </button>
        <div className="ten-boss-tran">
          <b>{b.ten}</b>
          <Thanh loai="boss" nay={tran.mau} max={tran.mauMax} chu={`${tran.mau.toLocaleString('vi-VN')} / ${tran.mauMax.toLocaleString('vi-VN')}${tran.giap > 0 ? ' · giáp hoá' : ''}${tran.cuong ? ' · hoá ma' : ''}`} />
          {cuongMax > 0 && (
            <div className={`thanh-cuong ${cuongNay > 0 ? '' : 'vo'}`}>
              <i style={{ width: `${Math.min(100, (cuongNay / cuongMax) * 100)}%` }} />
              <em>{cuongNay > 0 ? `Cương khí ${Math.round(cuongNay).toLocaleString('vi-VN')}` : `Cương khí vỡ · tụ lại sau ${tran.chien?.cuongCho ?? LUAT_CUONG.tuLai} lượt`}</em>
            </div>
          )}
          <span className="he-boss">
            Hệ {NGUYEN_TO[b.he].ten}
            {heKhacBoss && <> · sợ {NGUYEN_TO[heKhacBoss].ten}</>}
          </span>
          <HangTrangThai bang={ttBoss} />
        </div>
        <button className="nut-goc" disabled={ban} onClick={onRutLui} aria-label="Rút lui" title="Rút lui">
          ⚑
        </button>
      </header>
      <div className={`san-boss ${dongBoss}`}>
        <img key={tran.anh} className="anh-boss" src={anhBoss(tran.boss, tran.anh)} alt="" draggable={false} />
        <LopHieuUng ds={hu.ds} ben="dich" />
      </div>
      <p className={`y-do-tran ${!tran.choBoss && chieu.loai === 'lon' ? 'nguy' : ''}`} key={tran.luot + (tran.choBoss ? 'c' : '')}>
        {tran.choBoss ? `${b.ten} đang ra đòn…` : tran.ngat && chieu.loai === 'lon' ? `${chieu.ten} đã bị ngắt!` : chieu.bao}
        {gong && tran.khangNgat && <b className="khong-ngat"> Lần này không thể ngắt.</b>}
      </p>
      {dongMoi && (
        <p className="dong-moi-tran" key={dongMoi}>
          {dongMoi}
        </p>
      )}

      {/* ---- người chơi ---- */}
      <div className={`san-nguoi ${dongNguoi}`}>
        <img className="anh-nguoi" src={anhLung(nv.gioiTinh, kho.tuVi.canhGioi)} alt="" draggable={false} />
        <LopHieuUng ds={hu.ds} ben="minh" />
      </div>
      {thu && (
        <div className="thu-tran-moi">
          <AnhThu src={anhThu(thu.loai, thu.dang)} ten={timLoaiThu(thu.loai).ten} />
        </div>
      )}
      <div className="the-nguoi-tran">
        <b>{nv.ten}</b>
        <Thanh loai="mau" nay={mauHienTai(kho, luc)} max={mauToiDa(kho)} chu={`${mauHienTai(kho, luc).toLocaleString('vi-VN')} / ${mauToiDa(kho).toLocaleString('vi-VN')}`} />
        <Thanh loai="nguyen" nay={nguyen} max={nguyenMax} chu={`Chân nguyên ${Math.round(nguyen)}`} />
        <HangTrangThai bang={tran.chien?.minh} khien={tran.chien?.khien} />
      </div>

      {/* ---- cụm nút ---- */}
      <div className="cum-nut-tran">
        <button data-im
          className={`nut-tron-tran tuyet ${tuyetSan ? 'san' : ''} ${tuyetThieuNguyen ? 'thieu' : ''}`}
          disabled={ban || (!tuyetSan && !tuyetThieuNguyen)}
          onClick={() => (tuyetThieuNguyen ? phat('het-nguyen') : (phat('nut-bam'), onHanhDong({ loai: 'tuyet-chieu' })))}
        >
          <span
            className="vong-hoi"
            style={{ ['--pt' as string]: `${tuyet && st.hoi > 0 ? (st.hoi / (timBiTich(tuyet.id).hoi ?? 3)) * 100 : 0}%` }}
          />
          {tuyet ? <img src={anhBiTich(tuyet.id)} alt="" draggable={false} /> : <i>🔒</i>}
          {tuyet && st.hoi > 0 && <b className="so-hoi">{st.hoi}</b>}
          <small>{tuyet ? timBiTich(tuyet.id).ten : 'Tuyệt chiêu'}</small>
          {tuyet && <em className="gia-nguyen">{nguyenCua(tuyet.id)}</em>}
          {khac(tuyet) && <b className="nhan-khac">克</b>}
        </button>
        <button
          data-im
          className={`nut-tron-tran vo-ky ${voKySan ? '' : 'thieu'}`}
          disabled={ban}
          onClick={() => (voKySan ? (phat('nut-bam'), onHanhDong({ loai: voKy ? 'vo-ky' : 'thuong' })) : phat('het-nguyen'))}
        >
          {voKy ? <img src={anhBiTich(voKy.id)} alt="" draggable={false} /> : <img src="./hinh/combat/loai/quyen.webp" alt="" draggable={false} />}
          <small>{voKy ? timBiTich(voKy.id).ten : 'Quyền cước'}</small>
          {voKy && <em className="gia-nguyen">{nguyenCua(voKy.id)}</em>}
          {khac(voKy) && <b className="nhan-khac">克</b>}
        </button>
        {(['phu0', 'phu1'] as const).map((o, i) => {
          if (kho.tuVi.canhGioi < MO_O.phu[i]) return null;
          const bt = phu[i];
          const san = !!bt && duNguyenO(hs, st, o);
          const vai = bt ? vaiCua(bt.id) : null;
          return (
            <button
              key={o}
              data-im
              className={`nut-tron-tran phu ${o} ${bt && !san ? 'thieu' : ''} ${vai === 'ngat' && gong && !tran.khangNgat ? 'goi-y' : ''}`}
              disabled={ban || !bt}
              title={bt ? `${timBiTich(bt.id).ten} (${TEN_VAI[vai!]}): ${timBiTich(bt.id).moTa}` : 'Ô chiêu phụ trống: lắp ở trang Nhân vật'}
              onClick={() => (san ? (phat('nut-bam'), onHanhDong({ loai: o })) : phat('het-nguyen'))}
            >
              {bt ? <img src={anhBiTich(bt.id)} alt="" draggable={false} /> : <i>+</i>}
              <small>{bt ? TEN_VAI[vai!] : 'Trống'}</small>
              {bt && <em className="gia-nguyen">{nguyenCua(bt.id)}</em>}
              {khac(bt) && <b className="nhan-khac">克</b>}
            </button>
          );
        })}
        <button className="nut-tron-tran nho quyen" disabled={ban} onClick={() => onHanhDong({ loai: 'thuong' })} title="Quyền cước: không tốn chân nguyên">
          <img src="./hinh/combat/loai/quyen.webp" alt="" draggable={false} />
          <small>Thường</small>
        </button>
        <button className="nut-tron-tran nho thu" disabled={ban} onClick={() => onHanhDong({ loai: 'do' })} title={`Thủ: nhận ${Math.round(LUAT_VUC.doDon * 100)}% sát thương, +Khí thế, hồi chân nguyên`}>
          <i>盾</i>
          <small>Thủ</small>
        </button>
        <button className="nut-tron-tran nho dan" disabled={ban} onClick={onDan} title="Dùng đan (mất lượt)">
          <i>丹</i>
          <small>Đan</small>
        </button>
      </div>

      {/* ---- cảnh cắt tuyệt chiêu ---- */}
      {catCanh && (
        <div className="cat-canh" key={catCanh.id}>
          <div className="dai-muc" />
          <img className="dai-vang" src="./hinh/tran/dai-tuyet-chieu.webp" alt="" draggable={false} />
          {catCanh.he ? (
            <img className="ban-than tuyet-ky" src={anhTuyetKy(nv.gioiTinh, catCanh.he)} alt="" draggable={false} />
          ) : (
            <img className="ban-than" src={anhNhanVatDung(nv.gioiTinh, kho.tuVi.canhGioi)} alt="" draggable={false} />
          )}
          <b className="ten-chieu-lon">{catCanh.ten}</b>
        </div>
      )}

      {/* ---- màn kết ---- */}
      {ket && (
        <div className={`ket-man-tran ${ket.thang ? 'thang' : 'thua'}`}>
          <img src={`./hinh/tran/ket-${ket.thang ? 'thang' : 'thua'}.webp`} alt="" draggable={false} />
          <b>{ket.thang ? 'Đại thắng' : 'Bại trận'}</b>
        </div>
      )}

      {moNhatKy && (
        <div className="lop-phu" onClick={() => datMoNhatKy(false)}>
          <div className="bang tam bang-vuc" onClick={(e) => e.stopPropagation()}>
            <h2>Diễn biến trận</h2>
            <div className="nhat-ky">
              {tran.nhatKy.map((x, i) => (
                <p key={tran.nhatKy.length - i}>{x}</p>
              ))}
              {!tran.nhatKy.length && <p className="trong">Chưa ra đòn nào.</p>}
            </div>
            <div className="hang-nut">
              <button className="nut-nho" onClick={() => datMoNhatKy(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
