// Phường thị: mua dược liệu, hạt giống, phụ liệu và lò đan. Hàng đổi theo kỳ, mỗi món có số lượng giới hạn.
import { useEffect, useState } from 'react';
import { CANH_GIOI, DUOC_LIEU, LO_DAN, LUAT, PHU_LIEU, TEN_PHAM_NGAN, TEN_TUOI_NGAN, anhDan, anhDuocLieu, anhLoDan, type PhamThat, type Tuoi } from '../game/duLieu.ts';
import {
  bacDanCho,
  canTui,
  conHang,
  dsDanCho,
  dungLo,
  giaLamMoi,
  giaMua,
  giaMuaDan,
  giaMuaHat,
  giaMuaPhuLieu,
  giayToiKySau,
  khoaDanCho,
  khoaHat,
  khoaThuoc,
  lamMoiCho,
  luotLamMoiCon,
  muaDan,
  muaDuocLieu,
  muaHatGiong,
  muaLo,
  muaPhuLieu,
  nhanTroCap,
  type Kho,
} from '../game/kho.ts';

type Quay = 'duoc-lieu' | 'dan' | 'phu-lieu' | 'lo-dan';

/** Đồng hồ đếm ngược: "2g 05p" khi còn trên một giờ, "4:32" khi dưới một giờ. */
export function dongHo(giay: number): string {
  const g = Math.floor(giay / 3600);
  const p = Math.floor((giay % 3600) / 60);
  const s = giay % 60;
  return g > 0 ? `${g}g ${String(p).padStart(2, '0')}p` : `${p}:${String(s).padStart(2, '0')}`;
}

/** Giờ hiện tại, tự cập nhật mỗi giây — cho các màn có đồng hồ đếm ngược. */
export function useBayGio(): number {
  const [luc, datLuc] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => datLuc(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return luc;
}

export function PhuongThi({ kho, doiKho, onDong }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; onDong: () => void }) {
  const [quay, datQuay] = useState<Quay>('duoc-lieu');
  const luc = useBayGio();
  const luotCon = luotLamMoiCon(kho, luc);
  const giaDoi = giaLamMoi(kho, luc);
  const danCho = dsDanCho(kho);

  return (
    <div className="lop-phu" onClick={onDong}>
      <div className="bang tam phuong-thi" onClick={(e) => e.stopPropagation()}>
        <h2>Phường thị</h2>
        <p className="chu-nho">
          Đang có {kho.linhThach} linh thạch. Đổi hàng sau {dongHo(giayToiKySau(luc))}.
        </p>
        <div className="hang-doi-hang">
          <button className="nut-nho" disabled={luotCon < 1 || kho.linhThach < giaDoi} onClick={() => doiKho((k) => lamMoiCho(k))}>
            {luotCon < 1 ? 'Hôm nay hết lượt đổi hàng' : `Đổi hàng ngay · ${giaDoi}`}
          </button>
          <small>
            Còn {Math.max(0, luotCon)}/{LUAT.cho.lamMoi.luotMoiNgay} lượt hôm nay
          </small>
        </div>
        <div className="hang-chon">
          <button className={`the nho ${quay === 'duoc-lieu' ? 'chon' : ''}`} onClick={() => datQuay('duoc-lieu')}>
            Dược liệu
          </button>
          <button className={`the nho ${quay === 'dan' ? 'chon' : ''}`} onClick={() => datQuay('dan')}>
            Đan dược
          </button>
          <button className={`the nho ${quay === 'phu-lieu' ? 'chon' : ''}`} onClick={() => datQuay('phu-lieu')}>
            Phụ liệu
          </button>
          <button className={`the nho ${quay === 'lo-dan' ? 'chon' : ''}`} onClick={() => datQuay('lo-dan')}>
            Lò đan
          </button>
        </div>

        {quay === 'duoc-lieu' &&
          DUOC_LIEU.map((d) => {
            const conHat = conHang(kho, khoaHat(d.id), luc);
            const giaHat = giaMuaHat(kho, d.id);
            return (
              <div key={d.id} className="dong-cho">
                <div className="dau-dong-cho">
                  <img src={anhDuocLieu(d.id)} alt="" />
                  <b>{d.ten}</b>
                  <small>
                    Có {kho.duocLieu[d.id].join(' / ')} · hạt {kho.hatGiong[d.id] ?? 0}
                  </small>
                </div>
                <div className="hang-mua">
                  {([0, 1, 2] as Tuoi[]).map((t) => {
                    const con = conHang(kho, khoaThuoc(d.id, t), luc);
                    const g = giaMua(kho, d.id, t);
                    return (
                      <button
                        key={t}
                        className={`o-mua tuoi-${t}`}
                        disabled={con < 1 || kho.linhThach < g}
                        onClick={() => doiKho((k) => muaDuocLieu(k, d.id, t))}
                      >
                        <em>{TEN_TUOI_NGAN[t]}</em>
                        <b>{con < 1 ? 'Hết' : g}</b>
                        <small>{con < 1 ? '—' : `còn ${con}`}</small>
                      </button>
                    );
                  })}
                  <button className="o-mua giong" disabled={conHat < 1 || kho.linhThach < giaHat} onClick={() => doiKho((k) => muaHatGiong(k, d.id))}>
                    <em>Hạt giống</em>
                    <b>{conHat < 1 ? 'Hết' : giaHat}</b>
                    <small>{conHat < 1 ? '—' : `còn ${conHat}`}</small>
                  </button>
                </div>
              </div>
            );
          })}

        {quay === 'dan' && (
          <>
            <p className="chu-nho">
              {danCho.length
                ? `Đan bậc ${CANH_GIOI[bacDanCho(kho)]}, cao nhất tới thượng phẩm, đắt hơn giá gốc 50–60%. Đan đột phá không bán, phải tự luyện.`
                : 'Cảnh giới này chưa có loại đan nào được bày bán.'}
            </p>
            {danCho.map((p) => (
              <div key={p.id} className="dong-cho">
                <div className="dau-dong-cho">
                  <img src={anhDan(p.id)} alt="" />
                  <b>{p.ten}</b>
                  <small>Có {kho.tuiDan[p.id].slice(0, LUAT.cho.dan.phamCao + 1).join(' / ')}</small>
                </div>
                <div className="hang-mua">
                  {([0, 1, 2] as PhamThat[]).map((ph) => {
                    const con = conHang(kho, khoaDanCho(p.id, ph), luc);
                    const g = giaMuaDan(kho, p.id, ph, luc);
                    return (
                      <button key={ph} className={`o-mua tuoi-${ph}`} disabled={con < 1 || kho.linhThach < g} onClick={() => doiKho((k) => muaDan(k, p.id, ph))}>
                        <em>{TEN_PHAM_NGAN[ph]}</em>
                        <b>{con < 1 ? 'Hết' : g}</b>
                        <small>{con < 1 ? '—' : `còn ${con}`}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {quay === 'phu-lieu' &&
          PHU_LIEU.map((p) => {
            const g = giaMuaPhuLieu(kho, p.id);
            return (
              <div key={p.id} className="dong-tui">
                <div className="than-dong">
                  <b>
                    {p.ten} <small>(có {kho.phuLieu[p.id] ?? 0})</small>
                  </b>
                  <div className="hang-pham">
                    <span>{p.moTa}</span>
                  </div>
                </div>
                <button className="nut-nho" disabled={kho.linhThach < g} onClick={() => doiKho((k) => muaPhuLieu(k, p.id))}>
                  {g}
                </button>
              </div>
            );
          })}

        {quay === 'lo-dan' &&
          LO_DAN.map((lo) => {
            const daCo = kho.loDan.co.includes(lo.id);
            const dangDung = kho.loDan.dung === lo.id;
            return (
              <div key={lo.id} className={`dong-tui dong-lo ${dangDung ? 'dang-dung' : ''}`}>
                <img
                  src={anhLoDan(lo.id)}
                  alt=""
                  onError={(e) => {
                    // lò chưa có ảnh riêng thì dùng ảnh lò mặc định
                    if (!e.currentTarget.src.endsWith('/lo-dan.png')) e.currentTarget.src = './hinh/lo-dan.png';
                  }}
                />
                <div className="than-dong">
                  <b>{lo.ten}</b>
                  <div className="hang-pham">
                    <span>{lo.moTa}</span>
                  </div>
                </div>
                {dangDung ? (
                  <span className="nhan-dang-dung">Đang dùng</span>
                ) : daCo ? (
                  <button className="nut-nho" onClick={() => doiKho((k) => dungLo(k, lo.id))}>
                    Dùng
                  </button>
                ) : (
                  <button className="nut-nho" disabled={kho.linhThach < lo.gia} onClick={() => doiKho((k) => muaLo(k, lo.id))}>
                    {lo.gia}
                  </button>
                )}
              </div>
            );
          })}

        <div className="hang-nut">
          {canTui(kho) && (
            <button className="nut-nho" onClick={() => doiKho(nhanTroCap)}>
              Xin tông môn trợ cấp (+{LUAT.troCap})
            </button>
          )}
          <button className="nut-nho" onClick={onDong}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
