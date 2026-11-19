// Trang Nhân vật & võ công: ảnh nhân vật đứng, các ô chiêu, danh sách bí tịch để lắp, chỉ số chiến đấu, thiên phú võ học, linh căn.
// Ngộ Đạo Đan (luyện thục) và Tẩy Cốt Đan (thiên phú) dùng ngay tại đây.
import { useState } from 'react';
import { phat } from '../amThanh.ts';
import { CANH_GIOI, CHI_SO, TEN_PHAM, timDanPhuong, type PhamThat } from '../game/duLieu.ts';
import { chiSo, mauToiDa, tamPhapDangLap, type Kho } from '../game/kho.ts';
import { dsPhamDan, ngoDao, tayCot, LUAT_BT } from '../game/nguonVoCong.ts';
import {
  CAC_HE,
  CAP_LUYEN_THUC_TOI_DA,
  HE,
  NGUYEN,
  NGUYEN_TO,
  PHAM_BI_TICH,
  TEN_LOAI_BT,
  THIEN_PHU,
  anhBiTich,
  boBiTich,
  canhGioiMoO,
  knCan,
  lapBiTich,
  linhCanCua,
  nguyenCua,
  oDangLap,
  thaoBiTich,
  thienPhuCua,
  timBiTich,
  uidTaiO,
  type BiTich,
  type LoaiBiTich,
  type O,
} from '../game/voCong.ts';
import { anhNhanVatDung } from './BupBe.tsx';

const O_HIEN: { o: O; ten: string; loai: LoaiBiTich }[] = [
  { o: 'voKy', ten: 'Võ kỹ', loai: 'vo-ky' },
  { o: 'tuyetChieu', ten: 'Tuyệt chiêu', loai: 'tuyet-chieu' },
  { o: 'thanPhap', ten: 'Thân pháp', loai: 'than-phap' },
  { o: 'tamPhap0', ten: 'Tâm pháp', loai: 'tam-phap' },
  { o: 'tamPhap1', ten: 'Tâm pháp 2', loai: 'tam-phap' },
];
const TEN_LOAI_DAN = (l: PhamThat | 'dv') => (l === 'dv' ? 'Đan văn' : TEN_PHAM[l]);

/** Một dòng thông tin ngắn của một cuốn: phẩm · cấp · hệ linh căn. */
export function chuBiTich(bt: BiTich) {
  return `${PHAM_BI_TICH[bt.pham].ten} · cấp ${bt.cap}/${CAP_LUYEN_THUC_TOI_DA}${bt.nguyenTo ? ` · ${NGUYEN_TO[bt.nguyenTo].ten}` : ''}`;
}

export function NhanVatTrang({
  kho,
  doiKho,
  onDong,
  onChiSo,
  onThienMenh,
  chonDau,
}: {
  kho: Kho;
  doiKho: (ham: (k: Kho) => Kho) => void;
  onDong: () => void;
  onChiSo: () => void;
  onThienMenh: () => void;
  /** Mở trang với cuốn này đang chọn (bấm từ túi đồ). */
  chonDau?: number | null;
}) {
  const nv = kho.nhanVat!;
  const v = kho.voCong;
  const cg = kho.tuVi.canhGioi;
  const tp = thienPhuCua(nv);
  const lc = linhCanCua(nv);
  const [loc, datLoc] = useState<LoaiBiTich | null>(null);
  const [chon, datChon] = useState<number | null>(chonDau ?? null);
  const [bao, datBao] = useState<string | null>(null);
  const bt = chon != null ? v.tui.find((b) => b.uid === chon) ?? null : null;
  const ds = v.tui
    .filter((b) => !loc || timBiTich(b.id).loai === loc)
    .sort((a, b) => Number(!!oDangLap(v, b.uid)) - Number(!!oDangLap(v, a.uid)) || b.pham - a.pham || b.cap - a.cap);
  const hopThienPhu = (b: BiTich) => {
    const he = timBiTich(b.id).he;
    return !!he && tp[he] >= 2;
  };
  const nguyenMax = NGUYEN.toiDa + (tamPhapDangLap(kho).includes('thanh-tam') ? NGUYEN.thanhTam : 0);
  const danNgo = dsPhamDan(kho, 'ngo-dao-dan');
  const danTay = dsPhamDan(kho, 'tay-cot-dan');

  return (
    <div className="lop-phu" onClick={onDong}>
      <div className="bang tam trang-nhan-vat" onClick={(e) => e.stopPropagation()}>
        <h2>{nv.ten}</h2>
        <div className="hang-chon the-trang-nv">
          <button className="the nho chon">Võ công</button>
          <button className="the nho" onClick={onChiSo}>
            Chỉ số
          </button>
          <button className="the nho" onClick={onThienMenh}>
            Thiên mệnh
          </button>
        </div>

        <div className="san-nv">
          <img className="nv-dung" src={anhNhanVatDung(nv.gioiTinh, cg)} alt="" draggable={false} />
          <div className="o-chieu-nv">
            {O_HIEN.map(({ o, ten, loai }) => {
              const mo = cg >= canhGioiMoO(o);
              const b = mo ? v.tui.find((x) => x.uid === uidTaiO(v, o)) : null;
              return (
                <button
                  key={o}
                  className={`o-chieu ${mo ? '' : 'khoa'} ${b ? 'co' : ''} ${loc === loai ? 'chon' : ''}`}
                  style={b ? { borderColor: PHAM_BI_TICH[b.pham].mau } : undefined}
                  onClick={() => {
                    datLoc(loai);
                    if (b) datChon(b.uid);
                  }}
                >
                  {b ? <img src={anhBiTich(b.id)} alt="" draggable={false} /> : <i>{mo ? '+' : '🔒'}</i>}
                  <span>{mo ? (b ? timBiTich(b.id).ten : ten) : `${ten} · ${CANH_GIOI[canhGioiMoO(o)]}`}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hang-chon loc-bi-tich">
          <button className={`the nho ${!loc ? 'chon' : ''}`} onClick={() => datLoc(null)}>
            Tất cả
          </button>
          {(['vo-ky', 'tuyet-chieu', 'than-phap', 'tam-phap'] as LoaiBiTich[]).map((l) => (
            <button key={l} className={`the nho ${loc === l ? 'chon' : ''}`} onClick={() => datLoc(l)}>
              {TEN_LOAI_BT[l]}
            </button>
          ))}
        </div>
        <div className="ds-bi-tich">
          {ds.length === 0 && <p className="chu-nho">Chưa có cuốn nào. Mua ở phường thị, tông môn (Tàng Bảo Các) hoặc đấu giá.</p>}
          {ds.map((b) => (
            <button key={b.uid} className={`the-bi-tich ${chon === b.uid ? 'chon' : ''}`} style={{ borderColor: PHAM_BI_TICH[b.pham].mau }} onClick={() => datChon(b.uid)}>
              <img src={anhBiTich(b.id)} alt="" draggable={false} />
              <span>
                <b>
                  {timBiTich(b.id).ten}
                  {hopThienPhu(b) ? ' ★' : ''}
                </b>
                <small>{chuBiTich(b)}</small>
                {oDangLap(v, b.uid) && <em>Đang lắp</em>}
              </span>
            </button>
          ))}
        </div>

        {bt && (
          <div className="chi-tiet-bi-tich" style={{ borderColor: PHAM_BI_TICH[bt.pham].mau }}>
            <b style={{ color: PHAM_BI_TICH[bt.pham].mau }}>
              {timBiTich(bt.id).ten} · {PHAM_BI_TICH[bt.pham].ten}
            </b>
            <small>
              {TEN_LOAI_BT[timBiTich(bt.id).loai]}
              {timBiTich(bt.id).he ? ` · ${HE[timBiTich(bt.id).he!].ten} (thiên phú ${THIEN_PHU[tp[timBiTich(bt.id).he!]].ten})` : ''}
              {nguyenCua(bt.id) ? ` · ${nguyenCua(bt.id)} chân nguyên` : ''}
              {timBiTich(bt.id).hoi ? ` · hồi ${timBiTich(bt.id).hoi} lượt` : ''}
            </small>
            <p>{timBiTich(bt.id).moTa}</p>
            {bt.nguyenTo && (
              <small className={lc.he.includes(bt.nguyenTo) ? 'hop' : 'khong-hop'}>
                Hệ {NGUYEN_TO[bt.nguyenTo].ten}: {lc.he.includes(bt.nguyenTo) ? NGUYEN_TO[bt.nguyenTo].tac : 'không hợp linh căn, không có hiệu ứng nguyên tố'}
              </small>
            )}
            <div className="dong-luyen-thuc">
              <span>
                Luyện thục cấp {bt.cap}/{CAP_LUYEN_THUC_TOI_DA}
              </span>
              <div className="tien-do">
                <div style={{ width: `${bt.cap >= CAP_LUYEN_THUC_TOI_DA ? 100 : Math.min(100, (bt.kn / knCan(bt.cap)) * 100)}%` }} />
              </div>
            </div>
            <div className="hang-nut">
              {oDangLap(v, bt.uid) ? (
                <button className="nut-nho" onClick={() => doiKho((k) => ({ ...k, voCong: thaoBiTich(k.voCong, bt.uid) }))}>
                  Tháo
                </button>
              ) : (
                <button
                  className="nut-nho chinh"
                  disabled={!(['voKy', 'tuyetChieu', 'thanPhap', 'tamPhap0', 'tamPhap1'] as O[]).some((o) => O_HIEN.find((x) => x.o === o)!.loai === timBiTich(bt.id).loai && cg >= canhGioiMoO(o))}
                  onClick={() => {
                    phat('nut-bam');
                    doiKho((k) => ({ ...k, voCong: lapBiTich(k.voCong, bt.uid, k.tuVi.canhGioi) }));
                  }}
                >
                  Lắp
                </button>
              )}
              {bt.cap < CAP_LUYEN_THUC_TOI_DA &&
                danNgo.slice(0, 1).map(([l, n]) => (
                  <button
                    key={String(l)}
                    className="nut-nho"
                    onClick={() => {
                      const r = ngoDao(kho, bt.uid, l);
                      if (!r) return;
                      doiKho(() => r.kho);
                      phat('hao-cam');
                      datBao(r.chu);
                    }}
                  >
                    {timDanPhuong('ngo-dao-dan').ten} ({TEN_LOAI_DAN(l)} ×{n}) +{LUAT_BT.ngoDao[l === 'dv' ? 4 : l]}
                  </button>
                ))}
              {!oDangLap(v, bt.uid) && (
                <button
                  className="nut-nho nguy-hiem"
                  onClick={() => {
                    if (!confirm(`Bỏ hẳn ${timBiTich(bt.id).ten}?`)) return;
                    doiKho((k) => ({ ...k, voCong: boBiTich(k.voCong, bt.uid) }));
                    datChon(null);
                  }}
                >
                  Bỏ
                </button>
              )}
            </div>
          </div>
        )}
        {bao && <p className="chu-nho bao-thu">{bao}</p>}

        <h3>Chiến đấu</h3>
        <div className="luoi-chi-so-nv">
          <span>
            Khí huyết <b>{mauToiDa(kho)}</b>
          </span>
          <span>
            Chân nguyên <b>{nguyenMax}</b>
          </span>
          {CHI_SO.filter((c) => c.id !== 'khiHuyet').map((c) => (
            <span key={c.id}>
              {c.ten} <b>{chiSo(kho, c.id)}</b>
            </span>
          ))}
        </div>

        <h3>Thiên phú võ học</h3>
        <div className="ds-thien-phu">
          {CAC_HE.map((he) => (
            <div key={he} className="dong-thien-phu">
              <span>{HE[he].ten}</span>
              <div className={`thanh-thien-phu bac-${tp[he]}`}>
                <i style={{ width: `${(tp[he] + 1) * 20}%` }} />
              </div>
              <small>{THIEN_PHU[tp[he]].ten}</small>
              {danTay.length > 0 && tp[he] < LUAT_BT.tayCotToiDa && (
                <button
                  className="nut-nho nut-tay-cot"
                  onClick={() => {
                    const l = danTay[0][0];
                    if (!confirm(`Dùng ${timDanPhuong('tay-cot-dan').ten} (${TEN_LOAI_DAN(l)}) cho ${HE[he].dao}? Tỉ lệ thành ${Math.round(LUAT_BT.tayCot[l === 'dv' ? 4 : l] * 100)}%.`)) return;
                    const r = tayCot(kho, he, l);
                    if (!r) return;
                    doiKho(() => r.kho);
                    phat(r.thanh ? 'dot-pha' : 'hao-cam');
                    datBao(r.chu);
                  }}
                >
                  Tẩy cốt
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="chu-nho">
          Linh căn hệ {lc.he.map((h) => NGUYEN_TO[h].ten).join(', ')} · hiệu lực nguyên tố {Math.round(lc.hieuLuc * 100)}%. Chiêu cùng hệ linh căn mới có hiệu ứng nguyên tố. ★ = hợp thiên phú.
        </p>
        <div className="hang-nut">
          <button className="nut-nho" onClick={onDong}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
