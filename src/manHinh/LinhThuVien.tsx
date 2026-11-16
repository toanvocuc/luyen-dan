// Linh Thú Viên: nơi nuôi linh thú. Thẻ "Linh thú": danh sách, thông tin, cho ăn, xuất chiến, bỏ rơi.
// Thẻ "Ấp trứng": truyền linh khí vào trứng (kiểu dưỡng đan), mở trứng, rồi nhận nuôi hoặc bỏ rơi.
import { useState } from 'react';
import { phat } from '../amThanh.ts';
import { TEN_PHAM, anhDan, timDanPhuong } from '../game/duLieu.ts';
import type { Kho } from '../game/kho.ts';
import {
  ANH_TRUNG_CHUA_RO,
  CAP_AP_TOI_DA,
  LUAT_THU,
  MAU_BAC_THU,
  TEN_BAC_THU,
  TEN_DANG,
  anhThu,
  anhTrungThu,
  batDauAp,
  boRoi,
  boRoiThuMoi,
  canLon,
  chiSoThu,
  chiuAn,
  choAn,
  chuTacDung,
  dinhDuong,
  dsMonAn,
  moTrung,
  moTrungDucQuang,
  nhanNuoi,
  noHienTai,
  phanBoBac,
  tiLeAp,
  timLoaiThu,
  truyenLinhKhi,
  xuatChien,
  type Thu,
} from '../game/linhThu.ts';
import { useBayGio } from './PhuongThi.tsx';

/** Ảnh thú; chưa có ảnh thì hiện chữ đầu tên trong vòng tròn. */
export function AnhThu({ src, ten, className = '' }: { src: string; ten: string; className?: string }) {
  const [loi, datLoi] = useState(false);
  if (loi) return <span className={`anh-thu-tam ${className}`}>{ten.split(' ').pop()?.[0] ?? '?'}</span>;
  return <img className={className} src={src} alt={ten} draggable={false} onError={() => datLoi(true)} />;
}

function ThanhNho({ gt, max, mau, chu }: { gt: number; max: number; mau: string; chu: string }) {
  return (
    <span className="thanh-thu">
      <i style={{ width: `${Math.max(0, Math.min(100, (gt / Math.max(1, max)) * 100))}%`, background: mau }} />
      <em>{chu}</em>
    </span>
  );
}

function TheThongTin({ kho, t, doiKho, onChoAn }: { kho: Kho; t: Thu; doiKho: (h: (k: Kho) => Kho) => void; onChoAn: () => void }) {
  const luc = useBayGio();
  const l = timLoaiThu(t.loai);
  const cs = chiSoThu(t);
  const no = noHienTai(t, luc);
  const dangXuat = kho.thuXuatChien === t.uid;
  return (
    <div className="the-thu">
      <div className="dau-the-thu">
        <b style={{ color: MAU_BAC_THU[l.bac] }}>{l.ten}</b>
        <small>
          Bậc {TEN_BAC_THU[l.bac]} · {TEN_DANG[t.dang]} · Tiềm năng {t.tiemNang}
        </small>
      </div>
      <p className="mo-ta-thu">{l.moTa}</p>
      <div className="luoi-chi-so-thu">
        <span>
          Máu <b>{cs.mau}</b>
        </span>
        <span>
          Sức mạnh <b>{cs.sucManh}</b>
        </span>
      </div>
      <ThanhNho gt={no} max={100} mau="linear-gradient(90deg,#8a5a2a,#e9b45a)" chu={`Độ no ${Math.round(no)}/100`} />
      <ThanhNho gt={t.haoCam} max={100} mau="linear-gradient(90deg,#8a2a4a,#ff8cb0)" chu={`Hảo cảm ${t.haoCam}/100`} />
      {t.dang < 2 ? (
        <ThanhNho gt={t.lon} max={canLon(t)} mau="linear-gradient(90deg,#2a6a4a,#6cc596)" chu={`Trưởng thành ${Math.floor(t.lon)}/${canLon(t)} → ${TEN_DANG[t.dang + 1]}`} />
      ) : (
        <ThanhNho gt={1} max={1} mau="linear-gradient(90deg,#6a5a2a,#ffd66e)" chu="Đã trưởng thành" />
      )}
      <p className="tac-dung-thu">
        {dangXuat ? 'Đang xuất chiến: ' : 'Nếu xuất chiến: '}
        {chuTacDung(t, luc)}
      </p>
      <div className="hang-nut-thu">
        <button className="nut-nho" disabled={dangXuat} onClick={() => doiKho((k) => xuatChien(k, t.uid))}>
          {dangXuat ? 'Đang xuất chiến' : 'Xuất chiến'}
        </button>
        <button className="nut-nho" onClick={onChoAn}>
          Cho ăn
        </button>
        <button
          className="nut-nho nguy-hiem"
          onClick={() => {
            if (confirm(`Bỏ rơi ${l.ten}? Thả về núi rừng rồi thì không tìm lại được.`)) doiKho((k) => boRoi(k, t.uid));
          }}
        >
          Bỏ rơi
        </button>
      </div>
    </div>
  );
}

function BangChoAn({ kho, t, doiKho, onDong }: { kho: Kho; t: Thu; doiKho: (h: (k: Kho) => Kho) => void; onDong: () => void }) {
  const luc = useBayGio();
  const [bao, datBao] = useState('');
  const ds = dsMonAn(kho);
  return (
    <div className="lop-phu" onClick={onDong}>
      <div className="bang tam" onClick={(e) => e.stopPropagation()}>
        <h2>Cho {timLoaiThu(t.loai).ten} ăn</h2>
        <p className="chu-nho">Độ no {Math.round(noHienTai(t, luc))}/100. Đan bậc càng cao, phẩm càng cao thì càng mau lớn. Lớn rồi thì kén ăn hơn.</p>
        {bao && <p className="chu-nho bao-thu">{bao}</p>}
        {ds.length === 0 && <p className="chu-nho">Trong túi chưa có viên đan nào.</p>}
        {ds.map((m) => {
          const ly = chiuAn(t, m, luc);
          return (
            <div key={m.khoa} className={`dong-tui ${ly ? 'mo' : ''}`}>
              <img src={anhDan(m.phuongId)} alt="" />
              <div className="than-dong">
                <b>{timDanPhuong(m.phuongId).ten}</b>
                <div className="hang-pham">
                  <span className={m.loai === 'dv' ? 'pham-dv' : `pham-${m.loai}`}>
                    {m.loai === 'dv' ? 'Đan văn' : TEN_PHAM[m.loai]}
                    {m.chuyen ? ` · ${m.chuyen} chuyển` : ''} ×{m.co}
                  </span>
                  <span>{ly ?? `+${dinhDuong(m).toFixed(1)} trưởng thành`}</span>
                </div>
              </div>
              <button
                className="nut-nho"
                disabled={!!ly}
                onClick={() => {
                  const r = choAn(kho, t.uid, m.khoa);
                  if (!r) return;
                  doiKho(() => r.kho);
                  phat(r.lenDang ? 'dot-pha' : 'hao-cam');
                  datBao(r.lenDang ? `${timLoaiThu(t.loai).ten} đã lớn lên!` : 'Nó ăn ngon lành.');
                }}
              >
                Cho ăn
              </button>
            </div>
          );
        })}
        <div className="hang-nut">
          <button className="nut-nho" onClick={onDong}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}

export function LinhThuVien({ kho, doiKho, onDong }: { kho: Kho; doiKho: (h: (k: Kho) => Kho) => void; onDong: () => void }) {
  const [the, datThe] = useState<'thu' | 'ap'>(kho.linhThu.length || !(kho.trungThu || kho.trung || kho.apTrung) ? 'thu' : 'ap');
  const [chon, datChon] = useState<string | null>(kho.thuXuatChien);
  const [choAnUid, datChoAnUid] = useState<string | null>(null);
  const [baoAp, datBaoAp] = useState('');
  const t = kho.linhThu.find((x) => x.uid === chon) ?? kho.linhThu[0] ?? null;
  const day = kho.linhThu.length >= LUAT_THU.soToiDa;
  const a = kho.apTrung;

  return (
    <div className="man-linh-thu">
      <header className="dau-linh-thu">
        <b>Linh Thú Viên</b>
        <button className="nut-nho" onClick={onDong}>
          Đóng
        </button>
      </header>
      <div className="hang-chon the-linh-thu">
        <button className={`the nho ${the === 'thu' ? 'chon' : ''}`} onClick={() => datThe('thu')}>
          Linh thú ({kho.linhThu.length}/{LUAT_THU.soToiDa})
        </button>
        <button className={`the nho ${the === 'ap' ? 'chon' : ''}`} onClick={() => datThe('ap')}>
          Ấp trứng ({(kho.trungThu ?? 0) + (kho.trung ? 1 : 0) + (a ? 1 : 0)})
        </button>
      </div>

      {the === 'thu' && (
        <div className="than-linh-thu">
          {t ? (
            <>
              <div className="san-thu">
                <AnhThu className="anh-thu-lon" src={anhThu(t.loai, t.dang)} ten={timLoaiThu(t.loai).ten} />
              </div>
              <div className="hang-thu">
                {kho.linhThu.map((x) => (
                  <button key={x.uid} className={`o-thu ${x.uid === t.uid ? 'chon' : ''}`} style={{ borderColor: MAU_BAC_THU[timLoaiThu(x.loai).bac] }} onClick={() => datChon(x.uid)}>
                    <AnhThu src={anhThu(x.loai, x.dang)} ten={timLoaiThu(x.loai).ten} />
                    {kho.thuXuatChien === x.uid && <i className="dau-xuat-chien">★</i>}
                  </button>
                ))}
              </div>
              <TheThongTin kho={kho} t={t} doiKho={doiKho} onChoAn={() => datChoAnUid(t.uid)} />
            </>
          ) : (
            <p className="chu-nho trong-linh-thu">Chưa nuôi linh thú nào. Sang thẻ Ấp trứng để ấp một quả; trứng mua ở Tàng Bảo Các (Vạn Bảo Lâu).</p>
          )}
        </div>
      )}

      {the === 'ap' && (
        <div className="than-linh-thu">
          {a ? (
            <>
              <div className="san-thu">
                <img className={`trung-ap ${baoAp.startsWith('Trúng') ? 'nay' : baoAp.startsWith('Trượt') ? 'rung' : ''}`} key={baoAp + a.cap + a.truot} src={ANH_TRUNG_CHUA_RO} alt="" draggable={false} />
              </div>
              <div className="the-thu">
                <div className="dau-the-thu">
                  <b>Cấp ấp {a.cap}/{CAP_AP_TOI_DA}</b>
                  <small>
                    Đã trượt {a.truot}/{LUAT_THU.truotToiDa} · trượt quá {LUAT_THU.truotToiDa} lần trứng vỡ
                  </small>
                </div>
                {baoAp && <p className="chu-nho bao-thu">{baoAp}</p>}
                <p className="chu-nho">Cơ hội nở ra (theo cấp ấp hiện tại):</p>
                <div className="phan-bo-bac">
                  {phanBoBac(a.cap).map((p, i) => (
                    <span key={i} style={{ color: MAU_BAC_THU[i] }}>
                      {TEN_BAC_THU[i]} <b>{p < 1 && p > 0 ? p.toFixed(1) : Math.round(p)}%</b>
                    </span>
                  ))}
                </div>
                <div className="hang-nut-thu">
                  <button
                    className="nut chinh"
                    disabled={a.cap >= CAP_AP_TOI_DA}
                    onClick={() => {
                      const r = truyenLinhKhi(kho, Math.random());
                      if (!r) return;
                      doiKho(() => r.kho);
                      phat(r.ket === 'trung' ? 'toi-trung' : r.ket === 'vo' ? 'no-lo' : 'toi-truot');
                      datBaoAp(r.ket === 'trung' ? 'Trúng! Linh khí thấm vào trứng.' : r.ket === 'vo' ? 'Trứng nứt vỡ, linh khí tan biến…' : 'Trượt! Trứng lùi cấp.');
                    }}
                  >
                    Truyền linh khí · {Math.round(tiLeAp(kho, a.cap) * 100)}%
                  </button>
                  <button
                    className="nut"
                    onClick={() => {
                      doiKho((k) => moTrung(k, Math.random(), Math.random()));
                      phat('mo-lo-quy');
                      datBaoAp('');
                    }}
                  >
                    Mở trứng
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="ds-trung">
              {baoAp && <p className="chu-nho bao-thu">{baoAp}</p>}
              {kho.trung && (
                <div className="dong-tui">
                  <AnhThu src={anhTrungThu('duc-quang')} ten="Dực Quang" />
                  <div className="than-dong">
                    <b style={{ color: MAU_BAC_THU[4] }}>Trứng Dực Quang Thần Thú</b>
                    <div className="hang-pham">
                      <span>Quà của Đan Lão: nở thẳng ra thú bậc Thần, không cần ấp.</span>
                    </div>
                  </div>
                  <button
                    className="nut-nho"
                    onClick={() => {
                      doiKho((k) => moTrungDucQuang(k, Math.random()));
                      phat('mo-lo-quy');
                    }}
                  >
                    Ấp nở
                  </button>
                </div>
              )}
              <div className="dong-tui">
                <AnhThu src={ANH_TRUNG_CHUA_RO} ten="Trứng" />
                <div className="than-dong">
                  <b>Trứng linh thú ×{kho.trungThu ?? 0}</b>
                  <div className="hang-pham">
                    <span>Truyền linh khí càng nhiều cấp, càng dễ nở ra thú bậc cao. Tư chất và khí vận càng cao, truyền càng dễ trúng.</span>
                  </div>
                </div>
                <button className="nut-nho" disabled={(kho.trungThu ?? 0) < 1} onClick={() => doiKho(batDauAp)}>
                  Bắt đầu ấp
                </button>
              </div>
              {(kho.trungThu ?? 0) < 1 && !kho.trung && <p className="chu-nho">Hết trứng. Trứng bán ở Tàng Bảo Các (Vạn Bảo Lâu), giá rất cao.</p>}
            </div>
          )}
        </div>
      )}

      {kho.thuMoiNo && (
        <div className="lop-phu lop-thu-moi">
          <div className="the-thu-moi">
            <small>Trứng đã nở!</small>
            <AnhThu className="anh-thu-moi" src={anhThu(kho.thuMoiNo.loai, 0)} ten={timLoaiThu(kho.thuMoiNo.loai).ten} />
            <b style={{ color: MAU_BAC_THU[timLoaiThu(kho.thuMoiNo.loai).bac] }}>{timLoaiThu(kho.thuMoiNo.loai).ten}</b>
            <p>
              Bậc <b style={{ color: MAU_BAC_THU[timLoaiThu(kho.thuMoiNo.loai).bac] }}>{TEN_BAC_THU[timLoaiThu(kho.thuMoiNo.loai).bac]}</b> · Tiềm năng{' '}
              <b>{kho.thuMoiNo.tiemNang}</b>/100
            </p>
            <p className="chu-nho">{timLoaiThu(kho.thuMoiNo.loai).moTa}</p>
            {day && <p className="chu-nho bao-thu">Chuồng đã đủ {LUAT_THU.soToiDa} con: phải bỏ rơi bớt một con mới nhận nuôi được.</p>}
            <div className="hang-nut-thu">
              <button
                className="nut chinh"
                disabled={day}
                onClick={() => {
                  const uid = kho.thuMoiNo!.uid;
                  doiKho(nhanNuoi);
                  phat('hao-cam');
                  datChon(uid);
                  datThe('thu');
                }}
              >
                Nhận nuôi
              </button>
              <button
                className="nut"
                onClick={() => {
                  if (confirm('Bỏ rơi con thú vừa nở? Không tìm lại được.')) doiKho(boRoiThuMoi);
                }}
              >
                Bỏ rơi
              </button>
            </div>
          </div>
        </div>
      )}

      {choAnUid && kho.linhThu.find((x) => x.uid === choAnUid) && (
        <BangChoAn kho={kho} t={kho.linhThu.find((x) => x.uid === choAnUid)!} doiKho={doiKho} onDong={() => datChoAnUid(null)} />
      )}
    </div>
  );
}
