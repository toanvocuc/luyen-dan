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
        chu: 'Mỗi lựa chọn ghi chỉ số được thử và tỉ lệ thành theo sức của ngươi. “Chắc chắn” là không rủi ro. Thua thì mất máu; máu về 0 là mất hồn.',
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
        chu: 'Vào dưỡng rồi chạm từng viên: trúng thì lên 1 chuyển, trượt thì tụt 3 chuyển, trượt quá 3 lần thì vỡ. Đan càng nhiều chuyển, uống vào càng mạnh.',
      },
    ],
  },
  {
    id: 'tui-do',
    cho: '.lop-phu .dong-uong',
    buoc: [
      {
        chon: '.lop-phu .dong-uong',
        chu: 'Uống đan để tu luyện nhanh hơn hoặc tăng chỉ số. Mỗi viên thêm chút đan độc; độc vượt 100 thì trúng độc, mọi chỉ số giảm cho tới khi độc tan. Đan phẩm cao ít độc hơn.',
      },
    ],
  },
  {
    id: 'phuong-thi',
    cho: '.lop-phu .hang-doi-hang',
    buoc: [
      { chon: '.lop-phu .hang-doi-hang', chu: 'Hàng ở phường thị tự đổi mỗi 3 giờ. Muốn đổi ngay thì trả linh thạch, mỗi ngày được 5 lượt.' },
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
        chu: 'Tu vi đã viên mãn! Đột phá cần một viên đan đột phá. Phẩm càng cao càng dễ thành; thất bại thì mất viên đan và hao một phần tu vi.',
      },
    ],
  },
  {
    id: 'dong-phu',
    nen: true,
    cho: '.tu-tien .dau-tu-tien',
    buoc: [
      { chon: '.tu-tien .nut-nhiem-vu', chu: 'Cuộn thư nhiệm vụ dẫn đường. Chạm để xem việc cần làm; chạm vào nhiệm vụ là đi thẳng tới chỗ làm. Chấm đỏ là đã xong, về đây nhận thưởng.' },
      {
        chon: '.bang.day.tu-vi',
        chu: 'Tu vi tự tăng mỗi giây, kể cả khi tắt game. Đầy thanh thì lên tầng; tới tầng cuối thì cần đan đột phá để bước lên cảnh giới mới.',
      },
      { chon: '.tu-tien .cot-nut', chu: 'Túi đồ để uống đan và xem dược liệu. Đơn hàng là nơi tông môn đặt mua đan; số đỏ là đơn đã đủ đan để giao.' },
      { chon: '.thanh-dieu-huong', chu: 'Thanh này đưa ngươi đi khắp nơi: luyện đan, trồng thuốc, mua bán và du ngoạn. Chấm đỏ là có việc đang chờ.' },
      { chon: '.bien-ten', chu: 'Chạm vào tên để xem chỉ số và thiên mệnh của nhân vật.' },
    ],
  },
  {
    id: 'dan-phong',
    nen: true,
    cho: '.lo-dan .phuong-dang-chon',
    buoc: [
      { chon: '.lo-dan .ti-le', chu: 'Tỉ lệ ra từng phẩm của mẻ đan này. Phẩm càng cao bán càng đắt, uống càng mạnh; phế đan là mất trắng.' },
      { chon: '.lo-dan .phuong-dang-chon', chu: 'Đan phương đang luyện. Chạm để đổi; luyện thành đủ mẻ thì mở đan phương kế tiếp.' },
      { chon: '.lo-dan .hang-lieu', chu: 'Chọn tuổi thuốc cho từng vị. Thuốc 100 năm, 1000 năm đẩy phẩm đan lên cao hẳn.' },
      {
        chon: '.lo-dan .bang.day .nut.chinh',
        chu: 'Khai lò xong thì NHẤN GIỮ màn hình để thêm lửa, thả tay cho lửa hạ, giữ kim nằm trong vùng sáng. Lửa có đà, phải đón trước. Sau đó bấm Tôi đan đúng lúc con lắc nằm trong khoảng xanh.',
      },
      { chon: '.ung-dung > .cot-nut:not(.trai)', chu: 'Túi đan để bán đan, Đơn hàng để giao đan cho tông môn. Nút Dưỡng đan bên trái dùng để nâng viên thượng phẩm lên nhiều chuyển.' },
    ],
  },
  {
    id: 'vuon',
    nen: true,
    cho: '.vuon .o-vuon',
    buoc: [
      { chon: '.vuon .luoi-vuon', chu: 'Chạm một ô trống để gieo hạt. Cây lớn theo giờ thật, kể cả khi tắt game; để càng lâu thuốc càng nhiều năm tuổi, nhưng hái muộn thì ô bị chiếm lâu.' },
      { chon: '.vuon .o-vuon.khoa', chu: 'Có thêm linh thạch thì mở thêm ô để trồng được nhiều hơn.' },
    ],
  },
  {
    id: 'ban-do',
    nen: true,
    cho: '.man-ban-do .dau-nguoi',
    buoc: [
      { chon: '.man-ban-do .chi-so-ban-do', chu: 'Mỗi bước đi tốn 5 thể lực, thể lực tự hồi theo thời gian. Mỗi lượt du ngoạn kéo dài 1 giờ: thoát ra vào lại vẫn đứng chỗ cũ, hết giờ thì về làng. Máu dưới 30% thì phải về dưỡng thương.' },
      { chon: '.man-ban-do .diem-ban-do.ke', chu: 'Chạm điểm có đường nối đỏ để đi tới. Ba con đường tách riêng, chỉ gặp nhau ở làng: muốn sang đường khác phải vòng về. Vùng còn phủ sương sẽ hiện ra khi ngươi đến gần.' },
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
