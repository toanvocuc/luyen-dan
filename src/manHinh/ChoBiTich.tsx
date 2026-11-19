// Các quầy bí tịch: hàng phường thị / tông môn (mua đứt) và phiên đấu giá 3 ngày (bỏ giá kín).
import { useState } from 'react';
import { phat } from '../amThanh.ts';
import { TONG_MON, timTongMon } from '../game/duLieu.ts';
import type { Kho } from '../game/kho.ts';
import {
  LUAT_BT,
  daMuaBt,
  giaDaRa,
  giaNhapTongMon,
  giayDoiTongMon,
  giayToiPhienSau,
  hangBtCho,
  hangBtTongMon,
  hangDauGia,
  muaBt,
  raGia,
  type MonBt,
} from '../game/nguonVoCong.ts';
import { HE, NGUYEN_TO, PHAM_BI_TICH, TEN_LOAI_BT, anhBiTich, thienPhuCua, timBiTich } from '../game/voCong.ts';
import { dongHo } from './PhuongThi.tsx';

function DauMon({ kho, m }: { kho: Kho; m: MonBt }) {
  const g = timBiTich(m.id);
  const hop = g.he && thienPhuCua(kho.nhanVat)[g.he] >= 2;
  return (
    <>
      <img src={anhBiTich(m.id)} alt="" />
      <div className="than-dong">
        <b style={{ color: PHAM_BI_TICH[m.pham].mau }}>
          {g.ten}
          {hop ? ' ★' : ''}
        </b>
        <div className="hang-pham">
          <span>
            {PHAM_BI_TICH[m.pham].ten} · {TEN_LOAI_BT[g.loai]}
            {g.he ? ` · ${HE[g.he].ten}` : ''}
            {m.nguyenTo ? ` · ${NGUYEN_TO[m.nguyenTo].ten}` : ''}
          </span>
        </div>
        <small className="mo-ta-bt">{g.moTa}</small>
      </div>
    </>
  );
}

/** Danh sách bí tịch mua đứt (phường thị hoặc tông môn). */
export function HangBiTich({ kho, doiKho, ds }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; ds: MonBt[] }) {
  const tm = kho.voCong.tongMon;
  return (
    <>
      {ds.map((m) => {
        const da = daMuaBt(kho, m.khoa);
        const thieuDv = !!m.danhVong && (!tm || (kho.danhVong[tm] ?? 0) < m.danhVong);
        return (
          <div key={m.khoa} className="dong-tui dong-ban dong-bi-tich" style={{ borderLeftColor: PHAM_BI_TICH[m.pham].mau }}>
            <DauMon kho={kho} m={m} />
            <button
              className="nut-nho nut-ban"
              disabled={da || kho.linhThach < m.gia || thieuDv}
              onClick={() => {
                phat('linh-thach');
                doiKho((k) => muaBt(k, m));
              }}
            >
              {da ? 'Đã mua' : `${m.gia.toLocaleString('vi-VN')}${m.danhVong ? ` + ${m.danhVong} DV` : ''}`}
            </button>
          </div>
        );
      })}
    </>
  );
}

export function QuayBiTichCho({ kho, doiKho }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void }) {
  return (
    <>
      <p className="chu-nho">Bí tịch phẩm thường, đổi cùng kỳ hàng. Muốn phẩm cao: tông môn hoặc đấu giá. ★ = hợp thiên phú.</p>
      <HangBiTich kho={kho} doiKho={doiKho} ds={hangBtCho(kho)} />
    </>
  );
}

/** Tông môn: gia nhập, rồi đổi danh vọng + linh thạch lấy bí tịch. */
export function QuayTongMon({ kho, doiKho }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void }) {
  const tm = kho.voCong.tongMon;
  const cho = giayDoiTongMon(kho);
  return (
    <>
      <h3>Tông môn</h3>
      <p className="chu-nho">
        {tm ? `Đang là đệ tử ${timTongMon(tm).ten} (danh vọng ${kho.danhVong[tm] ?? 0}).` : 'Chưa gia nhập tông môn nào. Gia nhập để mua bí tịch bằng danh vọng.'}
        {tm && cho > 0 ? ` Đổi tông môn sau ${dongHo(cho)}.` : ''}
      </p>
      <div className="hang-chon loc-tui">
        {TONG_MON.map((t) => (
          <button
            key={t.id}
            className={`the nho ${tm === t.id ? 'chon' : ''}`}
            disabled={tm === t.id || cho > 0}
            onClick={() => {
              if (tm && !confirm(`Rời ${timTongMon(tm).ten} để vào ${t.ten}? Sau đó ${LUAT_BT.ngayDoiTongMon} ngày mới đổi lại được.`)) return;
              doiKho((k) => giaNhapTongMon(k, t.id));
            }}
          >
            {t.ten}
          </button>
        ))}
      </div>
      {tm && <HangBiTich kho={kho} doiKho={doiKho} ds={hangBtTongMon(kho)} />}
    </>
  );
}

/** Phiên đấu giá: mỗi món bỏ giá kín một lần; cao hơn giá ẩn của đối thủ thì được, trả đúng giá đã ra. */
export function DauGia({ kho, doiKho, luc }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void; luc: number }) {
  const ds = hangDauGia(kho, luc);
  const [nhap, datNhap] = useState<Record<string, string>>({});
  const [bao, datBao] = useState<string | null>(null);
  return (
    <div className="dau-gia" style={{ backgroundImage: 'url(./hinh/dau-gia/nen-dau-gia.webp)' }}>
      <p className="chu-nho">
        Phiên đấu giá đổi sau {dongHo(giayToiPhienSau(luc))}. Mỗi món ra giá một lần: cao hơn giá ẩn của đối thủ thì thắng và trả đúng giá đã ra; thấp hơn thì
        không mất gì.
      </p>
      {bao && <p className="chu-nho bao-thu">{bao}</p>}
      {ds.map((m) => {
        const da = giaDaRa(kho, m.khoa, luc);
        const gia = Number(nhap[m.khoa] ?? Math.round(m.gia * 1.2));
        return (
          <div key={m.khoa} className="dong-tui dong-ban dong-bi-tich dong-dau-gia" style={{ borderLeftColor: PHAM_BI_TICH[m.pham].mau }}>
            <DauMon kho={kho} m={m} />
            {da ? (
              <span className={`ket-dau-gia ${da.thang ? 'thang' : 'thua'}`}>{da.thang ? `Đã thắng · ${da.gia.toLocaleString('vi-VN')}` : 'Bị trả giá cao hơn'}</span>
            ) : (
              <span className="o-ra-gia">
                <small>Khởi điểm {m.gia.toLocaleString('vi-VN')}</small>
                <input
                  type="number"
                  inputMode="numeric"
                  min={m.gia}
                  step={Math.max(1, Math.round(m.gia / 20))}
                  value={nhap[m.khoa] ?? String(Math.round(m.gia * 1.2))}
                  onChange={(e) => datNhap((c) => ({ ...c, [m.khoa]: e.target.value }))}
                />
                <button
                  className="nut-nho nut-ban"
                  disabled={!(gia >= m.gia) || gia > kho.linhThach}
                  onClick={() => {
                    if (!confirm(`Ra giá ${gia.toLocaleString('vi-VN')} linh thạch cho ${timBiTich(m.id).ten}?`)) return;
                    const r = raGia(kho, m, gia, luc);
                    if (!r) return;
                    doiKho(() => r.kho);
                    phat(r.thang ? 'thanh-cong' : 'that-bai');
                    datBao(r.thang ? `Thắng! ${timBiTich(m.id).ten} đã vào túi.` : `Có người trả cao hơn. ${timBiTich(m.id).ten} về tay kẻ khác.`);
                  }}
                >
                  Ra giá
                </button>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
