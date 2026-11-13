// Sao lưu bằng mã: chép cả bản lưu thành một dòng chữ để mang sang máy khác hoặc địa chỉ web khác, rồi dán vào để nạp lại.
import { useState } from 'react';
import { CANH_GIOI } from '../game/duLieu.ts';
import { nhapMa, xuatMa, type Kho } from '../game/kho.ts';

export function SaoLuu({ kho, onNap, onDong }: { kho: Kho; onNap: (k: Kho) => void; onDong: () => void }) {
  const [maDan, datMaDan] = useState('');
  const [bao, datBao] = useState('');
  const ma = kho.nhanVat ? xuatMa(kho) : '';
  const tomTat = (k: Kho) => `${k.nhanVat?.ten ?? 'chưa có nhân vật'}, ${CANH_GIOI[k.tuVi.canhGioi]} tầng ${k.tuVi.tang}, ${k.linhThach} linh thạch`;

  const chep = async () => {
    try {
      await navigator.clipboard.writeText(ma);
      datBao('Đã chép mã. Hãy dán vào một nơi an toàn (ghi chú, tin nhắn cho chính mình).');
    } catch {
      datBao('Trình duyệt không cho chép tự động. Hãy chạm giữ vào ô mã, chọn tất cả rồi chép.');
    }
  };
  const nap = () => {
    const k = nhapMa(maDan);
    if (!k || !k.nhanVat) {
      datBao('Mã không đúng hoặc bị thiếu. Hãy chép lại toàn bộ mã rồi dán lần nữa.');
      return;
    }
    if (kho.nhanVat && !confirm(`Thay nhân vật đang có (${tomTat(kho)}) bằng bản lưu trong mã (${tomTat(k)})?`)) return;
    onNap(k);
    datMaDan('');
    datBao(`Đã nạp: ${tomTat(k)}.`);
  };

  return (
    <div className="lop-phu" onClick={onDong}>
      <div className="bang tam sao-luu" onClick={(e) => e.stopPropagation()}>
        <h2>Sao lưu</h2>
        <p className="chu-nho">Bản lưu nằm trong trình duyệt này. Muốn chơi tiếp trên máy khác hoặc địa chỉ web khác thì chép mã ở đây rồi dán vào bên đó.</p>

        <h3>Mã của nhân vật đang chơi</h3>
        {kho.nhanVat ? (
          <>
            <p className="chu-nho trai">{tomTat(kho)}</p>
            <textarea className="o-ma" readOnly value={ma} onFocus={(e) => e.currentTarget.select()} />
            <button className="nut-nho" onClick={chep}>
              Chép mã
            </button>
          </>
        ) : (
          <p className="chu-nho trai">Chưa có nhân vật nào để sao lưu.</p>
        )}

        <h3>Nạp từ mã</h3>
        <textarea className="o-ma" placeholder="Dán mã vào đây" value={maDan} onChange={(e) => datMaDan(e.target.value)} />
        <button className="nut-nho" disabled={!maDan.trim()} onClick={nap}>
          Nạp bản lưu
        </button>

        {bao && <p className="chu-nho bao-sao-luu">{bao}</p>}
        <div className="hang-nut">
          <button className="nut-nho" onClick={onDong}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
