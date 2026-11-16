// Du ngoạn: bản đồ điểm nối đường của một vùng. Chạm điểm kề bên để đi (tốn thể lực); tới nơi thì gặp kỳ ngộ, NPC hoặc linh địa.
// Mọi sự kiện kể trong khung giấy (KhungKe). Luật nằm ở game/kyNgo.ts.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { phat, type Tieng } from '../amThanh.ts';
import { LUAT, TEN_PHAM, anhDan, timDanPhuong, type PhamThat } from '../game/duLieu.ts';
import { mauHienTai, mauToiDa, type Kho } from '../game/kho.ts';
import {
  BAN_DO,
  HAO_CAM_TOI_DA,
  KIEM_TY_THI,
  NPC,
  TEN_MUC,
  canhTai,
  chonLuaChon,
  coTheTyThi,
  daThay,
  daXongKy,
  diToi,
  dsDanTang,
  duMau,
  lyDoKhongDi,
  giayDuBuoc,
  haiLinhDia,
  haoCamTang,
  keNhau,
  npcCua,
  tangDan,
  tenChiSo,
  theLucHienTai,
  tiLeKiem,
  timDiem,
  timNhanVat,
  troChuyen,
  tyThi,
  xetCan,
  type KetQuaKyNgo,
  type TiengGap,
} from '../game/kyNgo.ts';
import { dongHo, useBayGio } from './PhuongThi.tsx';

const anhBanDo = (ten: string) => `./hinh/ban-do/${ten}.webp`;
const anhKe = (ten: string) => `./hinh/ky-ngo/${ten}.webp`;
const anhNv = (ten: string) => `./hinh/ky-ngo/${ten}.webp`;
const phanTram = (x: number) => `${Math.round(x * 100)}%`;
const mauTiLe = (x: number) => (x >= 0.6 ? 'cao' : x >= 0.3 ? 'vua' : 'thap');

/** Tiếng sau khi chọn một lựa chọn: mất hồn > còn bước sau (thành/bại) > kết thúc (đẹp/xấu/thành/bại). */
function tiengKetQua(kq: KetQuaKyNgo): Tieng | null {
  if (kq.trongThuong) return 'tu-tran';
  if (kq.tiep) return kq.coKiem ? (kq.thanh ? 'thanh-cong' : 'that-bai') : null;
  if (kq.nhan.some((n) => n.includes('vĩnh viễn'))) return 'ket-dep';
  const chiCoMat = kq.mat.length > 0 && !kq.nhan.some((n) => !n.startsWith('Hảo cảm'));
  // chưa có file ket-xau riêng: kết cục chỉ có mất mát dùng tiếng thất bại
  if (chiCoMat) return 'that-bai';
  if (kq.coKiem) return kq.thanh ? 'thanh-cong' : 'that-bai';
  return kq.nhan.length ? 'thanh-cong' : null;
}
const TIENG_GAP: Record<TiengGap, Tieng> = { cuop: 'gap-cuop', 'tien-nu': 'gap-tien-nu', 'yeu-thu': 'gap-yeu-thu', ma: 'gap-ma', 'ky-ngo': 'gap-ky-ngo' };
/** Phát tiếng chính, rồi nếu có hảo cảm tăng thì thêm tiếng hảo cảm sau một nhịp. */
function phatKetQua(chinh: Tieng | null, coHaoCam: boolean) {
  if (chinh) phat(chinh);
  if (coHaoCam) setTimeout(() => phat('hao-cam'), chinh ? 650 : 0);
}

/** Bảng đang mở trên bản đồ. */
type Mo =
  | null
  | { loai: 'su-kien'; id: number }
  | { loai: 'ket-qua'; diem: number; tieuDe: string; anh: string | null; kq: KetQuaKyNgo }
  | { loai: 'npc'; id: string; loi: string; ketQua?: { chu: string; nhan: string[]; mat: string[] } }
  | { loai: 'tang'; id: string }
  | { loai: 'linh-dia'; id: number; nhan?: string[] };

/** Khung giấy kể chuyện. */
function KhungKe({ tieuDe, anh, children }: { tieuDe: string; anh?: string | null; children: ReactNode }) {
  return (
    <div className="lop-phu lop-ky-ngo">
      <div className="khung-ky-ngo" onClick={(e) => e.stopPropagation()}>
        <div className="ruot-ky-ngo">
          <h2>{tieuDe}</h2>
          {anh && <img className="tranh-ke" src={anh} alt="" draggable={false} />}
          {children}
        </div>
      </div>
    </div>
  );
}

function Tim({ haoCam }: { haoCam: number }) {
  const day = Math.floor((haoCam / HAO_CAM_TOI_DA) * 5);
  return (
    <span className="tim-hao-cam" title={`Hảo cảm ${haoCam}/${HAO_CAM_TOI_DA}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < day ? 'day' : ''}>
          ♥
        </i>
      ))}
    </span>
  );
}

function DanhSachNhanMat({ nhan, mat }: { nhan: string[]; mat: string[] }) {
  if (!nhan.length && !mat.length) return null;
  return (
    <div className="nhan-mat">
      {nhan.length > 0 && <p className="nhan">Nhận: {nhan.join(', ')}</p>}
      {mat.length > 0 && <p className="mat">Mất: {mat.join(', ')}</p>}
    </div>
  );
}

export function BanDo({ kho, doiKho, onVe }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; onVe: () => void }) {
  const luc = useBayGio();
  const [mo, datMo] = useState<Mo>(null);
  const cuonRef = useRef<HTMLDivElement>(null);
  const viTri = kho.banDo.viTri;
  const tl = theLucHienTai(kho, luc);
  const mau = mauHienTai(kho, luc);
  const mauMax = mauToiDa(kho);
  const duBuoc = tl >= LUAT.kyNgo.theLucMoiBuoc;
  const khoeManh = duMau(kho, luc) && !lyDoKhongDi(kho, luc);

  // mở bản đồ thì cuộn tới chỗ người chơi đang đứng
  useEffect(() => {
    const c = cuonRef.current;
    if (!c) return;
    c.scrollTop = (timDiem(viTri).y / 100) * c.scrollHeight - c.clientHeight / 2;
    // chỉ cần lúc mở
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Tới một điểm (hoặc chạm lại điểm đang đứng) thì mở thứ đang chờ ở đó. */
  const moTai = (k: Kho, id: number) => {
    const d = timDiem(id);
    const c = canhTai(k, id);
    if (c) {
      if (c.buoc === null) phat(TIENG_GAP[c.sk.tieng ?? 'ky-ngo']);
      datMo({ loai: 'su-kien', id });
    }
    else if (d.loai === 'npc' && d.npc) datMo({ loai: 'npc', id: d.npc, loi: `${NPC[d.npc].ten} gật đầu chào ngươi.` });
    else if (d.loai === 'linh-dia' && !daXongKy(k, id)) datMo({ loai: 'linh-dia', id });
    else datMo(null);
  };

  const bamDiem = (id: number) => {
    if (id === viTri) return moTai(kho, id);
    if (!keNhau(viTri, id) || !duBuoc || !khoeManh) return;
    const sau = diToi(kho, id);
    if (sau === kho) return;
    doiKho(() => sau);
    phat('buoc-di');
    moTai(sau, id);
  };

  const canh = mo?.loai === 'su-kien' ? canhTai(kho, mo.id, luc) : null;
  const nvKe = canh?.sk.nv ? timNhanVat(canh.sk.nv) : null;

  return (
    <div className="man-ban-do">
      <header className="dau-ban-do">
        <b>{BAN_DO.ten}</b>
        <div className="chi-so-ban-do">
          <span className="thanh-nho the-luc" title="Thể lực">
            <i style={{ width: `${(tl / LUAT.kyNgo.theLucToiDa) * 100}%` }} />
            <em>
              Thể lực {Math.floor(tl)}/{LUAT.kyNgo.theLucToiDa}
            </em>
          </span>
          <span className="thanh-nho mau" title="Máu">
            <i style={{ width: `${(mau / Math.max(1, mauMax)) * 100}%` }} />
            <em>
              Máu {mau}/{mauMax}
            </em>
          </span>
        </div>
      </header>
      {(!duBuoc || !khoeManh) && (
        <p className="bao-ban-do">
          {!khoeManh
            ? `Thương thế chưa lành: cần ít nhất ${Math.round(LUAT.kyNgo.mauVao * 100)}% máu mới đi tiếp được.`
            : `Hết thể lực. Đủ cho một bước sau ${dongHo(giayDuBuoc(kho, luc))}.`}
        </p>
      )}

      <div className="cuon-ban-do" ref={cuonRef}>
        <div className="mat-ban-do" style={{ backgroundImage: `url(./hinh/ban-do/${BAN_DO.nen}.webp)` }}>
          <svg className="duong-ban-do" viewBox="0 0 100 100" preserveAspectRatio="none">
            {BAN_DO.duong.map(([a, b]) => {
              if (!daThay(kho, a) || !daThay(kho, b)) return null;
              const A = timDiem(a);
              const B = timDiem(b);
              const dangDi = (a === viTri || b === viTri) && duBuoc && khoeManh;
              return <line key={`${a}-${b}`} className={dangDi ? 'di-duoc' : ''} x1={A.x} y1={A.y} x2={B.x} y2={B.y} vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
          {BAN_DO.diem.map((d) => {
            const thay = daThay(kho, d.id);
            const coSk = thay && !!canhTai(kho, d.id, luc);
            const ke = keNhau(viTri, d.id);
            return (
              <button
                key={d.id}
                data-im
                className={`diem-ban-do loai-${d.loai} ${thay ? '' : 'suong'} ${ke && duBuoc && khoeManh ? 'ke' : ''} ${d.id === viTri ? 'dang-dung' : ''}`}
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
                disabled={!thay}
                onClick={() => bamDiem(d.id)}
                aria-label={thay ? d.ten : 'Chưa khám phá'}
              >
                <img src={anhBanDo(d.anh)} alt="" draggable={false} />
                {thay && <span className="ten-diem">{d.ten}</span>}
                {coSk && <img className={`dau-su-kien ${d.loai === 'hiem-dia' ? 'hiem' : ''}`} src={anhBanDo('dau-ky-ngo')} alt="Kỳ ngộ" draggable={false} />}
              </button>
            );
          })}
          <img className="dau-nguoi" src={anhBanDo('dau-nguoi-choi')} alt="" draggable={false} style={{ left: `${timDiem(viTri).x}%`, top: `${timDiem(viTri).y}%` }} />
        </div>
      </div>

      {/* ---- sự kiện ---- */}
      {mo?.loai === 'su-kien' && canh && (
        <KhungKe tieuDe={canh.sk.ten} anh={anhKe(`${canh.sk.anh}-${canh.anh}`)}>
          <p className="loi-ke">
            {nvKe && <img className="nv-ke" src={anhNv(nvKe.anh)} alt={nvKe.ten} draggable={false} />}
            {canh.mo}
          </p>
          <div className="day-lua-chon">
            {canh.luaChon.map((lc, i) => {
              const can = xetCan(kho, lc.can);
              const tile = lc.kiem ? tiLeKiem(kho, lc.kiem) : null;
              return (
                <button
                  key={i}
                  data-im
                  className="lua-chon"
                  disabled={!can.duoc}
                  onClick={() => {
                    const r = chonLuaChon(kho, mo.id, i);
                    if (!r) return;
                    doiKho(() => r.kho);
                    phatKetQua(tiengKetQua(r.kq), !r.kq.trongThuong && r.kq.nhan.some((n) => n.startsWith('Hảo cảm')));
                    datMo({ loai: 'ket-qua', diem: mo.id, tieuDe: canh.sk.ten, anh: anhKe(`${canh.sk.anh}-${r.kq.ketCuc.anh}`), kq: r.kq });
                  }}
                >
                  <b>{lc.chu}</b>
                  <small>
                    {lc.kiem && tile !== null ? (
                      <>
                        {tenChiSo(lc.kiem.chiSo)} · {TEN_MUC[lc.kiem.muc]} · <span className={`ti-le-kn ${mauTiLe(tile)}`}>{phanTram(tile)}</span>
                      </>
                    ) : can.chu ? (
                      can.chu
                    ) : (
                      'Chắc chắn'
                    )}
                  </small>
                </button>
              );
            })}
          </div>
        </KhungKe>
      )}

      {mo?.loai === 'ket-qua' && (
        <KhungKe tieuDe={mo.kq.coKiem ? `${mo.tieuDe} · ${mo.kq.thanh ? 'Thành' : 'Bại'}` : mo.tieuDe} anh={mo.anh}>
          <p className="loi-ke">{mo.kq.ketCuc.chu}</p>
          <DanhSachNhanMat nhan={mo.kq.nhan} mat={mo.kq.mat} />
          {mo.kq.trongThuong ? (
            <>
              {mo.kq.matHonNhe ? (
                <p className="loi-ke nguy">
                  Ngươi ngã gục, hồn phách rời khỏi thân xác. Đây là lần đầu nên hồn về nhập xác nhanh: chỉ cần tĩnh dưỡng {Math.round(LUAT.kyNgo.matHon.khoaGiayLanDau / 60)} phút ở
                  động phủ, chỉ số không bị ảnh hưởng. Từ lần sau, mất hồn sẽ khoá du ngoạn {Math.round(LUAT.kyNgo.matHon.khoaGiay / 3600)} giờ và mọi chỉ số chỉ còn một nửa trong{' '}
                  {Math.round(LUAT.kyNgo.matHon.yeuGiay / 3600)} giờ. Tỉ lệ thấp thì nên chọn phương án chắc chắn hoặc rút lui.
                </p>
              ) : (
                <p className="loi-ke nguy">
                  Ngươi ngã gục, hồn phách rời khỏi thân xác. Khi tỉnh lại đã nằm trong động phủ: {Math.round(LUAT.kyNgo.matHon.khoaGiay / 3600)} giờ tới không thể du ngoạn, và
                  trong {Math.round(LUAT.kyNgo.matHon.yeuGiay / 3600)} giờ mọi chỉ số chỉ còn một nửa.
                </p>
              )}
              <button className="nut-ke chinh" onClick={onVe}>
                Về động phủ
              </button>
            </>
          ) : mo.kq.tiep ? (
            <button className="nut-ke chinh" onClick={() => datMo({ loai: 'su-kien', id: mo.diem })}>
              Tiếp tục ›
            </button>
          ) : (
            <button className="nut-ke chinh" onClick={() => datMo(null)}>
              Xác định
            </button>
          )}
        </KhungKe>
      )}

      {/* ---- linh địa ---- */}
      {mo?.loai === 'linh-dia' && (
        <KhungKe tieuDe={timDiem(mo.id).ten} anh={null}>
          <img className="tranh-dia-diem" src={anhBanDo(timDiem(mo.id).anh)} alt="" draggable={false} />
          {mo.nhan ? (
            <>
              <p className="loi-ke">Ngươi cẩn thận hái những gốc linh thảo đã đủ tuổi, chừa lại rễ cho mùa sau.</p>
              <DanhSachNhanMat nhan={mo.nhan} mat={[]} />
            </>
          ) : (
            <p className="loi-ke">Ruộng linh thảo bỏ hoang trên sườn núi, vài gốc thuốc đã đủ tuổi để hái. Mỗi kỳ chỉ hái được một lần.</p>
          )}
          <div className="day-lua-chon">
            {!mo.nhan && (
              <button
                className="nut-ke chinh"
                onClick={() => {
                  const r = haiLinhDia(kho, mo.id);
                  if (!r) return;
                  doiKho(() => r.kho);
                  phat('nut-bam');
                  datMo({ ...mo, nhan: r.nhan });
                }}
              >
                Hái thuốc
              </button>
            )}
            <button className="nut-ke" onClick={() => datMo(null)}>
              {mo.nhan ? 'Xác định' : 'Rời đi'}
            </button>
          </div>
        </KhungKe>
      )}

      {/* ---- NPC ---- */}
      {mo?.loai === 'npc' && (
        <KhungKe tieuDe={NPC[mo.id].ten} anh={null}>
          <div className="dau-npc">
            <img src={anhNv(NPC[mo.id].anh)} alt="" draggable={false} />
            <div>
              <small>{NPC[mo.id].danhHieu}</small>
              <Tim haoCam={npcCua(kho, mo.id).haoCam} />
            </div>
          </div>
          <p className="loi-ke">“{mo.loi}”</p>
          {mo.ketQua && (
            <>
              <p className="loi-ke">{mo.ketQua.chu}</p>
              <DanhSachNhanMat nhan={mo.ketQua.nhan} mat={mo.ketQua.mat} />
            </>
          )}
          <div className="day-lua-chon">
            <button
              className="lua-chon"
              onClick={() => {
                const r = troChuyen(kho, mo.id);
                doiKho(() => r.kho);
                if (r.them) phatKetQua(null, true);
                datMo({ ...mo, loi: r.loi, ketQua: r.them ? { chu: '', nhan: [`Hảo cảm +${r.them}`], mat: [] } : undefined });
              }}
            >
              <b>Trò chuyện</b>
              <small>Mỗi kỳ lần đầu được thêm hảo cảm</small>
            </button>
            <button className="lua-chon" onClick={() => datMo({ loai: 'tang', id: mo.id })}>
              <b>Tặng đan</b>
              <small>Thích nhất: {timDanPhuong(NPC[mo.id].thich).ten}</small>
            </button>
            {(() => {
              const coThe = coTheTyThi(kho, mo.id, luc);
              const tile = tiLeKiem(kho, { chiSo: KIEM_TY_THI, muc: NPC[mo.id].tyThi });
              return (
                <button
                  className="lua-chon"
                  disabled={!coThe}
                  onClick={() => {
                    const r = tyThi(kho, mo.id);
                    if (!r) return;
                    doiKho(() => r.kho);
                    phatKetQua(r.thang ? 'thanh-cong' : 'that-bai', true);
                    datMo({
                      ...mo,
                      loi: r.thang ? 'Hảo kiếm pháp! Lần sau ta sẽ không nương tay đâu.' : 'Còn non lắm. Về luyện thêm rồi hẵng tới.',
                      ketQua: { chu: r.thang ? 'Ngươi thắng trận tỷ thí, ngộ ra đôi điều.' : 'Ngươi thua trận tỷ thí.', nhan: r.nhan, mat: r.mat },
                    });
                  }}
                >
                  <b>Tỷ thí</b>
                  <small>
                    {coThe ? (
                      <>
                        {tenChiSo(KIEM_TY_THI)} · {TEN_MUC[NPC[mo.id].tyThi]} · <span className={`ti-le-kn ${mauTiLe(tile)}`}>{phanTram(tile)}</span>
                      </>
                    ) : (
                      'Kỳ này đã tỷ thí rồi'
                    )}
                  </small>
                </button>
              );
            })()}
            <button className="nut-ke" onClick={() => datMo(null)}>
              Rời đi
            </button>
          </div>
        </KhungKe>
      )}

      {mo?.loai === 'tang' && (
        <KhungKe tieuDe={`Tặng đan cho ${NPC[mo.id].ten}`} anh={null}>
          <div className="dau-npc">
            <img src={anhNv(NPC[mo.id].anh)} alt="" draggable={false} />
            <div>
              <small>Hảo cảm {npcCua(kho, mo.id).haoCam}/{HAO_CAM_TOI_DA}</small>
              <Tim haoCam={npcCua(kho, mo.id).haoCam} />
            </div>
          </div>
          <div className="ds-tang">
            {dsDanTang(kho).length === 0 && <p className="loi-ke">Trong túi chưa có viên đan nào.</p>}
            {dsDanTang(kho).map((d) => (
              <div key={`${d.phuongId}|${d.loai}`} className="dong-tang">
                <img src={anhDan(d.phuongId)} alt="" />
                <span>
                  <b>{timDanPhuong(d.phuongId).ten}</b>
                  <small>
                    {d.loai === 'dv' ? 'Đan văn' : TEN_PHAM[d.loai as PhamThat]} ×{d.co}
                  </small>
                </span>
                <button className="nut-ke" disabled={npcCua(kho, mo.id).haoCam >= HAO_CAM_TOI_DA} onClick={() => {
                    doiKho((k) => tangDan(k, mo.id, d.phuongId, d.loai));
                    phatKetQua(null, true);
                  }}>
                  Tặng +{haoCamTang(mo.id, d.phuongId, d.loai)}
                </button>
              </div>
            ))}
          </div>
          <button className="nut-ke" onClick={() => datMo({ loai: 'npc', id: mo.id, loi: 'Đa tạ tấm lòng của ngươi.' })}>
            Xong
          </button>
        </KhungKe>
      )}
    </div>
  );
}
