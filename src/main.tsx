import { createRoot } from 'react-dom/client';
import { khoiDongAmThanh } from './amThanh.ts';
import { SO_LAN_THU } from './anhLoi.ts';
import { UngDung } from './UngDung.tsx';
import './giaoDien.css';

khoiDongAmThanh();

// ảnh tải hỏng (mạng chập chờn, hay CDN còn giữ bản cũ ngay sau lúc đẩy bản mới) thì tự tải lại tối đa SO_LAN_THU lần.
// Bắt ở pha capture trên window nên chạy TRƯỚC onError của React; các onError chỉ nên chuyển sang hình thay thế khi daHetLuotThu().
window.addEventListener(
  'error',
  (e) => {
    const im = e.target;
    if (!(im instanceof HTMLImageElement)) return;
    const lan = Number(im.dataset.thu ?? 0);
    if (lan >= SO_LAN_THU) {
      // đã thử đủ: đánh dấu để onError của màn chuyển sang hình thay thế
      im.dataset.het = '1';
      return;
    }
    im.dataset.thu = String(lan + 1);
    const goc = im.src.split('?')[0];
    setTimeout(() => {
      im.src = `${goc}?thu=${Date.now()}`;
    }, 700 * (lan + 1));
  },
  true,
);
createRoot(document.getElementById('goc')!).render(<UngDung />);
