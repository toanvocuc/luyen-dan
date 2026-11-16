// Đan thư: sổ tay mọi đan phương — luyện bằng gì, uống được gì theo từng phẩm, cộng chỉ số nào, độc bao nhiêu, dùng đột phá ra sao.
// Đan chưa mở vẫn xem được (để người chơi biết đường mà nhắm tới).
import { useState } from 'react';
import { CANH_GIOI, CHI_SO, DAN_PHUONG, LUAT, TEN_TUOI_NGAN, anhDan, giaBan, timDuocLieu, type DanPhuong, type TacDung } from '../game/duLieu.ts';
import { lyDoKhoaPhuong, type Kho } from '../game/kho.ts';

const TEN_MUC = ['Hạ', 'Trung', 'Thượng', 'Cực', 'Đan văn'] as const;

/** Tác dụng của một viên ở một mức phẩm (chữ ngắn để xếp thành bảng). */
function chuTacDung(td: TacDung, v: number): string {
  const pt = (x: number) => `${Math.round(x * 100)}%`;
  switch (td.loai) {
    case 'tang-toc':
      return `+${pt(v)} tốc độ tu luyện`;
    case 'tu-vi':
      return `+${pt(v)} tu vi một tầng`;
    case 'tu-chat':
      return `+${v} tư chất`;
    case 'hoi-mau':
      return `hồi ${pt(v)} máu`;
    default:
      return `+${pt(v)} đột phá lần tới`;
  }
}
const TEN_LOAI: Record<TacDung['loai'], string> = {
  'tang-toc': 'Tăng tốc tu luyện',
  'tu-vi': 'Cộng tu vi ngay',
  'tu-chat': 'Tăng tư chất vĩnh viễn',
  'hoi-mau': 'Hồi máu',
  'dot-pha': 'Tĩnh tâm trước khi đột phá',
};

/** Dược liệu: gộp vị trùng (Linh Thảo ×2). */
function chuLieu(p: DanPhuong): string {
  const dem = new Map<string, number>();
  for (const id of p.lieu) dem.set(id, (dem.get(id) ?? 0) + 1);
  const ds = [...dem].map(([id, n]) => `${timDuocLieu(id).ten}${n > 1 ? ` ×${n}` : ''}`).join(', ');
  return p.tuoiToiThieu ? `${ds} (thuốc từ ${TEN_TUOI_NGAN[p.tuoiToiThieu]} trở lên)` : ds;
}

function TheDan({ kho, p, onLuyen }: { kho: Kho; p: DanPhuong; onLuyen?: (id: string) => void }) {
  const i = DAN_PHUONG.indexOf(p);
  const khoa = lyDoKhoaPhuong(kho, i);
  const da = kho.thongThao[p.id] ?? 0;
  const daUong = kho.daUong[p.id] ?? 0;
  // chỉ số được cộng của viên hạ phẩm KẾ TIẾP (đã tính nhờn thuốc theo số viên đã uống)
  const nhon = 1 / (1 + daUong / LUAT.chiSo.khangDuoc);
  const chiSo = p.chiSo
    ? CHI_SO.filter((c) => p.chiSo![c.id])
        .map((c) => `${c.ten} +${(p.chiSo![c.id]! * nhon * (c.id === 'khiHuyet' ? LUAT.chiSo.heSoMau : 1)).toFixed(1)}`)
        .join(', ')
    : '';
  const doc = (p.uong?.doc ?? 1) * LUAT.doc.moiVien[0];
  return (
    <div className={`the-dan-thu ${khoa ? 'khoa' : ''}`}>
      <div className="dau-the-dan">
        <img src={anhDan(p.id)} alt="" />
        <div>
          <b>{p.ten}</b>
          <small>
            Đan {p.bac} · {khoa ? `Chưa mở: ${khoa.replace(/^Cần/, 'cần')}` : da ? `Đã luyện ${da} mẻ` : 'Chưa luyện mẻ nào'}
          </small>
        </div>
      </div>
      <p className="mo-ta-dan">{p.moTa}</p>
      <p className="dong-dan">
        <em>Dược liệu</em> {chuLieu(p)}
      </p>
      {p.dotPha && (
        <p className="dong-dan">
          <em>Đột phá</em> Dùng ở nút Đột phá để lên <b>{CANH_GIOI[p.dotPha]}</b>. Tỉ lệ thành: {LUAT.dotPha.tiLe.map((t, j) => `${TEN_MUC[j]} ${Math.round(t * 100)}%`).join(' · ')} · Đan văn 100%.
        </p>
      )}
      {p.uong && (
        <>
          <p className="dong-dan">
            <em>Khi uống</em> {TEN_LOAI[p.uong.loai]}
            {p.uong.giay ? `, mỗi viên kéo dài ${Math.round(p.uong.giay / 60)} phút` : ''}.
          </p>
          <div className="bang-pham-dan">
            {p.uong.giaTri.map((v, j) => (
              <span key={j} className={j === 4 ? 'pham-dv' : `pham-${j}`}>
                <i>{TEN_MUC[j]}</i>
                {chuTacDung(p.uong!, v)}
              </span>
            ))}
          </div>
          {chiSo && (
            <p className="dong-dan">
              <em>Chỉ số</em> Mỗi viên hạ phẩm cộng vĩnh viễn {chiSo}
              {daUong ? ` (đã uống ${daUong} viên nên nhờn thuốc, còn ${Math.round(nhon * 100)}%)` : ''}. Phẩm cao hơn cộng gấp{' '}
              {LUAT.chiSo.heSoPham.slice(1).map((h, j) => `${h} lần (${TEN_MUC[j + 1].toLowerCase()})`).join(', ')}.
            </p>
          )}
          <p className="dong-dan">
            <em>Đan độc</em> Hạ phẩm +{Math.round(doc)} mỗi viên, phẩm càng cao càng ít độc (cực phẩm +{Math.round((p.uong.doc ?? 1) * LUAT.doc.moiVien[3])}).
          </p>
        </>
      )}
      <p className="dong-dan">
        <em>Giá bán</em> hạ phẩm {giaBan(p, 0)} · thượng phẩm {giaBan(p, 2)} linh thạch
      </p>
      {onLuyen && (
        <button className="nut-nho nut-luyen-dan-thu" disabled={!!khoa} onClick={() => onLuyen(p.id)}>
          {khoa ? khoa : 'Luyện đan này ›'}
        </button>
      )}
    </div>
  );
}

export function DanThu({ kho, onDong, onLuyen }: { kho: Kho; onDong: () => void; onLuyen?: (id: string) => void }) {
  const [loc, datLoc] = useState<'uong' | 'dot-pha'>('uong');
  const ds = DAN_PHUONG.filter((p) => (loc === 'uong' ? !!p.uong : !!p.dotPha));
  return (
    <div className="lop-phu" onClick={onDong}>
      <div className="bang tam dan-thu" onClick={(e) => e.stopPropagation()}>
        <h2>Đan thư</h2>
        <p className="chu-nho">Mọi đan phương trong thiên hạ: luyện bằng gì, uống vào được gì. Đan chưa mở vẫn xem trước được.</p>
        <div className="hang-chon">
          <button className={`the nho ${loc === 'uong' ? 'chon' : ''}`} onClick={() => datLoc('uong')}>
            Đan uống
          </button>
          <button className={`the nho ${loc === 'dot-pha' ? 'chon' : ''}`} onClick={() => datLoc('dot-pha')}>
            Đan đột phá
          </button>
        </div>
        {ds.map((p) => (
          <TheDan key={p.id} kho={kho} p={p} onLuyen={onLuyen} />
        ))}
        <div className="hang-nut">
          <button className="nut-nho" onClick={onDong}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
