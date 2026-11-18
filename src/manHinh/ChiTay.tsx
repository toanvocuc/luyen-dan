// Chỉ tay lần đầu (lớp 2 của hướng dẫn): lần đầu một màn / bảng hiện ra, phủ tối cả màn, chừa sáng đúng chỗ cần biết
// kèm một câu ngắn; chạm để sang ý kế. Mỗi lượt chỉ hiện một lần (nhớ trong kho.daChiTay).
// Lượt nào hiện là do bộ điều khiển dò DOM: lượt đầu tiên trong danh sách mà `cho` đang có trên màn và chưa xem.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

export interface BuocChiTay {
  /** Bộ chọn CSS của chỗ cần chỉ; không thấy trên màn thì bỏ qua bước này. */
  chon: string;
  chu: string;
}
export interface LuotChiTay {
  id: string;
  /** Lượt này chỉ hiện khi bộ chọn này có trên màn. */
  cho: string;
  /** Lượt của màn chính: đợi tới khi không còn bảng nổi nào đang mở. */
  nen?: true;
  buoc: readonly BuocChiTay[];
}

/** Bảng nổi đứng trước màn chính, để lượt của bảng hiện trước khi lượt của màn bên dưới chen vào. */
export const LUOT_CHI_TAY: readonly LuotChiTay[] = [
  {
    id: 'ky-ngo',
    cho: '.khung-ky-ngo .lua-chon',
    buoc: [
      {
        chon: '.khung-ky-ngo .day-lua-chon',
        chu: 'Mỗi lựa chọn ghi tỉ lệ thành. Thua thì mất máu, hết máu là mất hồn.',
      },
    ],
  },
  {
    id: 'duong-dan',
    cho: '.man-duong .chon-duong',
    buoc: [
      { chon: '.man-duong .chon-duong', chu: 'Chọn tối đa 6 viên thượng phẩm, cực phẩm hoặc đan văn để dưỡng.' },
      {
        chon: '.man-duong .hang-nut',
        chu: 'Chạm từng viên: trúng lên 1 chuyển, trượt tụt 3, trượt quá 3 lần thì vỡ. Càng nhiều chuyển uống càng mạnh.',
      },
    ],
  },
  {
    id: 'tui-do',
    cho: '.lop-phu .dong-uong',
    buoc: [
      {
        chon: '.lop-phu .dong-uong',
        chu: 'Uống đan để tu nhanh hơn hoặc tăng chỉ số. Đan độc vượt 100 thì trúng độc, chỉ số giảm tới khi độc tan.',
      },
    ],
  },
  {
    id: 'phuong-thi',
    cho: '.lop-phu .hang-doi-hang',
    buoc: [
      { chon: '.lop-phu .hang-doi-hang', chu: 'Hàng đổi mỗi 3 giờ. Trả linh thạch để đổi ngay, 5 lượt mỗi ngày.' },
      { chon: '.lop-phu .o-mua.giong', chu: 'Ô viền xanh là hạt giống: mua về gieo ở vườn dược, lâu dài rẻ hơn mua thuốc.' },
    ],
  },
  {
    id: 'dot-pha',
    nen: true,
    cho: '.nut-dot-pha',
    buoc: [
      {
        chon: '.nut-dot-pha',
        chu: 'Tu vi đã viên mãn! Bấm để xem cần gì để đột phá.',
      },
    ],
  },
  {
    id: 'binh-canh',
    cho: '.nut-binh-canh',
    nen: true,
    buoc: [
      {
        chon: '.nut-binh-canh',
        chu: 'Chạm bình cảnh ở tầng 5: dùng một viên đan cùng bậc để lên tầng 6.',
      },
    ],
  },
  {
    id: 'dong-phu',
    nen: true,
    cho: '.tu-tien .dau-tu-tien',
    buoc: [
      { chon: '.tu-tien .nut-nhiem-vu', chu: 'Nhiệm vụ dẫn đường. Chạm nhiệm vụ để đi thẳng tới chỗ làm. Chấm đỏ: về nhận thưởng.' },
      {
        chon: '.bang.day.tu-vi',
        chu: 'Tu vi tự tăng, kể cả khi tắt game. Tới tầng cuối thì cần đan đột phá.',
      },
      { chon: '.tu-tien .cot-nut', chu: 'Túi đồ: uống đan, xem dược liệu. Đơn hàng: giao đan cho tông môn.' },
      { chon: '.thanh-dieu-huong', chu: 'Luyện đan, trồng thuốc, mua bán, du ngoạn. Chấm đỏ là có việc chờ.' },
      { chon: '.bien-ten', chu: 'Chạm vào tên để xem chỉ số và thiên mệnh của nhân vật.' },
    ],
  },
  {
    id: 'dan-phong',
    nen: true,
    cho: '.lo-dan .phuong-dang-chon',
    buoc: [
      { chon: '.lo-dan .ti-le', chu: 'Tỉ lệ ra từng phẩm của mẻ này.' },
      { chon: '.lo-dan .phuong-dang-chon', chu: 'Đan phương đang luyện. Chạm để đổi; luyện thành đủ mẻ thì mở đan phương kế tiếp.' },
      { chon: '.lo-dan .hang-lieu', chu: 'Chọn tuổi thuốc cho từng vị. Thuốc 100 năm, 1000 năm đẩy phẩm đan lên cao hẳn.' },
      {
        chon: '.lo-dan .bang.day .nut.chinh',
        chu: 'NHẤN GIỮ màn hình để thêm lửa, thả ra cho lửa hạ, giữ kim trong vùng sáng. Rồi bấm Tôi đan khi con lắc ở khoảng xanh.',
      },
      { chon: '.ung-dung > .cot-nut:not(.trai)', chu: 'Túi đan: bán đan. Đơn hàng: giao đan. Dưỡng đan (bên trái): nâng chuyển cho đan thượng phẩm.' },
    ],
  },
  {
    id: 'vuon',
    nen: true,
    cho: '.vuon .o-vuon',
    buoc: [
      { chon: '.vuon .luoi-vuon', chu: 'Chạm ô trống để gieo hạt. Cây lớn theo giờ thật; để càng lâu thuốc càng nhiều năm tuổi.' },
      { chon: '.vuon .o-vuon.khoa', chu: 'Có thêm linh thạch thì mở thêm ô để trồng được nhiều hơn.' },
    ],
  },
  {
    id: 'ban-do',
    nen: true,
    cho: '.man-ban-do .dau-nguoi',
    buoc: [
      { chon: '.man-ban-do .chi-so-ban-do', chu: 'Mỗi bước tốn 5 thể lực, tự hồi dần. Một lượt du ngoạn kéo dài 1 giờ. Máu dưới 30% thì phải về dưỡng thương.' },
      { chon: '.man-ban-do .diem-ban-do.ke', chu: 'Chạm điểm có đường đỏ để đi. Sương tan khi ngươi tới gần.' },
      { chon: '.man-ban-do .dau-su-kien', chu: 'Dấu ? là kỳ ngộ đang chờ. Kỳ ngộ đổi mới mỗi 3 giờ.' },
    ],
  },
];

const timO = (chon: string) => {
  const e = document.querySelector(chon);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? r : null;
};

/** Lớp phủ của một lượt chỉ tay. */
function LopChiTay({ luot, onXong, onTatHet }: { luot: LuotChiTay; onXong: () => void; onTatHet: () => void }) {
  const [i, datI] = useState(0);
  const [o, datO] = useState<DOMRect | null>(null);
  const xongRef = useRef(onXong);
  xongRef.current = onXong;
  // đo lại chỗ cần chỉ liên tục (ảnh tải xong, màn cuộn, xoay máy); bước nào không thấy thì nhảy qua
  useLayoutEffect(() => {
    let huy = false;
    let lanKhongThay = 0;
    const do_ = () => {
      if (huy) return;
      if (i >= luot.buoc.length) return xongRef.current();
      const r = timO(luot.buoc[i].chon);
      if (!r) {
        if (++lanKhongThay > 2) datI((x) => x + 1);
      } else {
        lanKhongThay = 0;
        datO((c) => (c && c.x === r.x && c.y === r.y && c.width === r.width && c.height === r.height ? c : r));
      }
    };
    do_();
    const id = setInterval(do_, 250);
    return () => {
      huy = true;
      clearInterval(id);
    };
  }, [i, luot]);

  if (i >= luot.buoc.length || !o) return null;
  const le = 6;
  const H = window.innerHeight;
  const CAN = 160; // chiều cao cần cho bong bóng chữ
  const duoi = H - o.bottom - le;
  const tren = o.top - le;
  // đặt bên nào còn đủ chỗ; vùng cần chỉ quá cao (cả hai bên đều chật) thì đặt bong bóng đè lên nửa dưới của nó
  const viTri: CSSProperties =
    duoi >= CAN && duoi >= tren
      ? { top: o.bottom + le + 10 }
      : tren >= CAN
        ? { bottom: H - o.top + le + 10 }
        : duoi >= CAN
          ? { top: o.bottom + le + 10 }
          : { top: Math.min(H - CAN, Math.max(8, o.top + o.height * 0.55)) };
  const tiep = () => datI((x) => x + 1);
  return (
    <div className="chi-tay" onClick={tiep}>
      <div className="lo-sang" style={{ left: o.left - le, top: o.top - le, width: o.width + le * 2, height: o.height + le * 2 }} />
      <div
        className="bong-chi-tay"
        style={viTri}
      >
        <p>{luot.buoc[i].chu}</p>
        <div className="hang-chi-tay">
          <span className="nut-chi-tay">
            <button
              className="bo-qua"
              onClick={(e) => {
                e.stopPropagation();
                onXong();
              }}
            >
              Bỏ qua
            </button>
            <button
              className="bo-qua tat-het"
              onClick={(e) => {
                e.stopPropagation();
                onTatHet();
              }}
            >
              Tắt hướng dẫn
            </button>
          </span>
          <span>
            {i + 1}/{luot.buoc.length} · chạm để tiếp
          </span>
        </div>
      </div>
    </div>
  );
}

/** Bộ điều khiển: dò màn, chọn lượt cần hiện, báo lại khi xem xong. `bat = false` thì không hiện gì (vd màn mở đầu). */
export function ChiTay({ daXem, bat, onXem }: { daXem: readonly string[]; bat: boolean; onXem: (ids: readonly string[]) => void }) {
  const [luot, datLuot] = useState<LuotChiTay | null>(null);
  useEffect(() => {
    if (!bat || luot) return;
    const id = setInterval(() => {
      const coBang = !!document.querySelector('.lop-phu, .man-duong');
      const l = LUOT_CHI_TAY.find((x) => !daXem.includes(x.id) && !(x.nen && coBang) && document.querySelector(x.cho));
      if (l) datLuot(l);
    }, 600);
    return () => clearInterval(id);
  }, [bat, luot, daXem]);
  if (!luot || !bat) return null;
  return (
    <LopChiTay
      key={luot.id}
      luot={luot}
      onXong={() => {
        onXem([luot.id]);
        datLuot(null);
      }}
      onTatHet={() => {
        // tắt mọi lượt chỉ tay; bật lại được ở Cài đặt -> Xem lại hướng dẫn
        onXem(LUOT_CHI_TAY.map((x) => x.id));
        datLuot(null);
      }}
    />
  );
}
