import { createRoot } from 'react-dom/client';
import { khoiDongAmThanh } from './amThanh.ts';
import { UngDung } from './UngDung.tsx';
import './giaoDien.css';

khoiDongAmThanh();
createRoot(document.getElementById('goc')!).render(<UngDung />);
