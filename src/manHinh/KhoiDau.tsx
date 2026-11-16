// Đoạn mở đầu: tỉnh dậy ở bến Vong Xuyên, gặp Đan Lão, hỏi ba câu, rồi chọn một viên thần đan mang sang thế giới mới.
// Mọi người chơi mới (kể cả luân hồi) đều qua đoạn này; người chơi cũ chưa nhận quà cũng được xem một lần (`cu` = nhận bản nhẹ).
import { useEffect, useRef, useState } from 'react';
import { phat } from '../amThanh.ts';
import { QUA, THU_TU_QUA, tacDungQua, type LoaiQua } from '../game/quaMoDau.ts';

type Pha = 'den' | 'mo-mat' | 'thoai' | 'dan-bay' | 'chon' | 'tien' | 'loe';
/** Một lời trong hộp thoại: Đan Lão nói, người chơi nói, hoặc lời kể. */
interface Loi {
  ai: 'lao' | 'minh' | 'ke';
  chu: string;
  /** Chữ to, rung (tiếng cười). */
  to?: boolean;
}

const MO_DAU: Loi[] = [{ ai: 'lao', chu: 'Tỉnh rồi à? Hồn phách ngươi trôi dạt ba ngày ba đêm, lão phu còn tưởng đã tan vào hư không rồi.' }];
type Hoi = 'dau' | 'ai' | 'chet';
const CAU_HOI: Record<Hoi, { hoi: string; dap: Loi[] }> = {
  dau: {
    hoi: 'Đây là đâu?',
    dap: [{ ai: 'lao', chu: 'Bến Vong Xuyên, ranh giới giữa kiếp này và kiếp sau. Kẻ qua đây uống một chén canh là quên sạch tiền trần. Còn ngươi… là lão phu giữ lại.' }],
  },
  ai: {
    hoi: 'Ông là ai?',
    dap: [
      { ai: 'lao', chu: 'Danh hiệu của lão phu, thiên hạ đã quên từ vạn năm trước. Ngươi cứ gọi một tiếng Đan Lão.' },
      { ai: 'lao', chu: 'Cả đời lão chỉ làm một việc: luyện đan. Ba lò này đã đỏ lửa từ thuở trời đất chưa phân.' },
    ],
  },
  chet: {
    hoi: 'Tôi… chết rồi sao?',
    dap: [
      { ai: 'ke', chu: 'Đan Lão ngẩn ra một thoáng, rồi ngửa mặt cười vang.' },
      { ai: 'lao', chu: 'Ha ha ha ha!', to: true },
      { ai: 'lao', chu: 'Haiz… Phải, ở thế giới cũ ngươi đã chết. Nhưng chết chưa phải là hết. Lão phu đợi người có duyên đã quá lâu rồi.' },
      { ai: 'ke', chu: 'Ba lò đan bỗng rung lên. Nắp lò bật mở.' },
    ],
  },
};
/** Miệng ba lò trong ảnh canh-dan-lao (phần trăm theo khung ảnh 572×1024), theo đúng thứ tự quà. */
const MIENG_LO: Record<LoaiQua, { x: number; y: number }> = {
  'le-than': { x: 25, y: 45 },
  'luyen-than': { x: 70, y: 42 },
  'linh-thu': { x: 81.5, y: 46 },
};
const anh = (ten: string) => `./hinh/mo-dau/${ten}.webp`;

export function KhoiDau({ cu, onXong }: { cu: boolean; onXong: (loai: LoaiQua) => void }) {
  const [pha, datPha] = useState<Pha>('den');
  /** Hàng lời đang kể (bấm để sang lời kế); hết hàng thì hiện câu hỏi còn lại. */
  const [hang, datHang] = useState<Loi[]>(MO_DAU);
  const [daHoi, datDaHoi] = useState<Hoi[]>([]);
  const [chon, datChon] = useState<LoaiQua | null>(null);
  // màn cha vẽ lại mỗi giây (tu vi vẫn chạy) nên onXong đổi liên tục: giữ qua ref, kẻo hẹn giờ chuyển cảnh bị huỷ mãi
  const xongRef = useRef(onXong);
  xongRef.current = onXong;

  // màn đen -> mở mắt -> hội thoại
  useEffect(() => {
    if (pha === 'den') {
      const id = setTimeout(() => datPha('mo-mat'), 2600);
      return () => clearTimeout(id);
    }
    if (pha === 'mo-mat') {
      const id = setTimeout(() => datPha('thoai'), 3400);
      return () => clearTimeout(id);
    }
    if (pha === 'dan-bay') {
      phat('mo-lo-quy');
      const id = setTimeout(() => datPha('chon'), 2600);
      return () => clearTimeout(id);
    }
    if (pha === 'loe') {
      phat('dot-pha');
      const id = setTimeout(() => chon && xongRef.current(chon), 1500);
      return () => clearTimeout(id);
    }
  }, [pha, chon]);

  const loi = hang[0];
  const sangLoiKe = () => {
    if (hang.length > 1) return datHang(hang.slice(1));
    // hết lời: vừa nghe xong câu "chết rồi sao" thì ba viên đan bay ra
    if (daHoi.includes('chet') && pha === 'thoai') return datPha('dan-bay');
    if (pha === 'tien') return datPha('loe');
    datHang([]);
  };
  const hoi = (h: Hoi) => {
    datDaHoi((d) => [...d, h]);
    datHang([{ ai: 'minh', chu: CAU_HOI[h].hoi }, ...CAU_HOI[h].dap]);
  };
  const conHoi = (Object.keys(CAU_HOI) as Hoi[]).filter((h) => !daHoi.includes(h));
  const xacNhan = () => {
    if (!chon) return;
    datPha('tien');
    datHang([{ ai: 'lao', chu: `${QUA[chon].ten}… Lựa chọn tốt. Đi đi, đừng ngoái đầu lại.` }]);
  };

  return (
    <div className={`khoi-dau pha-${pha}`}>
      {pha === 'den' && <p className="chu-den">…Lạnh quá.</p>}
      {pha !== 'den' && (
        <div className="khung-canh">
          <img className="anh-canh" src={anh('canh-dan-lao')} alt="" draggable={false} />
          {pha === 'dan-bay' &&
            THU_TU_QUA.map((q, i) => (
              <img
                key={q}
                className="dan-bay"
                src={anh(QUA[q].anh)}
                alt=""
                draggable={false}
                style={{ left: `${MIENG_LO[q].x}%`, top: `${MIENG_LO[q].y}%`, animationDelay: `${i * 0.25}s` }}
              />
            ))}
        </div>
      )}
      {pha === 'mo-mat' && (
        <>
          <i className="mi mi-tren" />
          <i className="mi mi-duoi" />
        </>
      )}

      {(pha === 'thoai' || pha === 'tien') && (
        <div className="hop-thoai" onClick={loi ? sangLoiKe : undefined}>
          {loi ? (
            <>
              <b className={`ai-noi ${loi.ai}`}>{loi.ai === 'lao' ? 'Đan Lão' : loi.ai === 'minh' ? 'Ngươi' : ''}</b>
              <p key={loi.chu} className={`loi-thoai ${loi.ai} ${loi.to ? 'to' : ''}`}>
                {loi.ai === 'ke' ? loi.chu : `“${loi.chu}”`}
              </p>
              <small className="cham-tiep">chạm để tiếp ›</small>
            </>
          ) : (
            <div className="cau-hoi">
              {conHoi.map((h) => (
                <button key={h} className="nut-hoi" onClick={() => hoi(h)}>
                  {CAU_HOI[h].hoi}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {pha === 'chon' && (
        <div className="man-chon-qua">
          <h2>Hãy chọn một viên mang theo.</h2>
          <p className="phu-de">Chỉ một mà thôi.</p>
          <div className="hang-qua">
            {THU_TU_QUA.map((q, i) => (
              <button key={q} className={`the-qua ${chon === q ? 'chon' : chon ? 'mo' : ''}`} style={{ animationDelay: `${i * 0.15}s` }} onClick={() => datChon(q)}>
                <img src={anh(QUA[q].anh)} alt="" draggable={false} />
                <b style={{ color: QUA[q].mau }}>{QUA[q].ten}</b>
                <small>{QUA[q].tomTat}</small>
              </button>
            ))}
          </div>
          <div className="chi-tiet-qua">
            {chon ? (
              <>
                <b style={{ color: QUA[chon].mau }}>{QUA[chon].ten}</b>
                <ul>
                  {tacDungQua(chon, cu).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                {cu && chon !== 'linh-thu' && <small>Ngươi đã bước vào thế giới này từ trước, nên dược lực chỉ còn phần nhỏ.</small>}
              </>
            ) : (
              <small>Chạm vào một viên đan để xem công dụng.</small>
            )}
          </div>
          <button className="nut chinh nut-mang-theo" disabled={!chon} onClick={xacNhan}>
            Mang theo viên này
          </button>
        </div>
      )}

      {pha === 'loe' && <div className="loe-trang" />}
      {(pha === 'den' || pha === 'mo-mat' || pha === 'thoai') && (
        <button className="nut-nho nut-bo-qua-mo-dau" onClick={() => datPha('chon')}>
          Bỏ qua ›
        </button>
      )}
    </div>
  );
}
