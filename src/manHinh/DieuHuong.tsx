// Điều hướng chung: thanh nút đáy (đổi màn) và cột nút tròn nhỏ ở mép phải (việc riêng của từng màn).
import { useState } from 'react';
import { giaiDoan, type Kho } from '../game/kho.ts';
import { lyDoKhongDi } from '../game/kyNgo.ts';
import { lyDoKhongVaoVuc } from '../game/vucTham.ts';
import { daHetLuotThu } from '../anhLoi.ts';

/** Màn chính đi được từ thanh đáy. */
export type ManChinh = 'tu-tien' | 'lo-dan' | 'vuon' | 'ban-do';

/**
 * Nút tròn có ảnh public/hinh/ui/nut-<anh>.webp (chưa có ảnh thì hiện một chữ trong vòng tròn).
 * `so`: số đỏ góc trên (0 = ẩn); `cham`: chấm đỏ không số; `nhan`: nhãn nhỏ góc trên (vd lý do bị khoá).
 */
export function NutAnh({
  anh,
  ten,
  chu,
  dang = false,
  so = 0,
  cham = false,
  nhan,
  khoa = false,
  onClick,
}: {
  anh: string;
  ten: string;
  chu: string;
  dang?: boolean;
  so?: number;
  cham?: boolean;
  nhan?: string;
  khoa?: boolean;
  onClick: () => void;
}) {
  const [coAnh, datCoAnh] = useState(true);
  // ảnh chưa tải xong (hoặc đang thử tải lại) thì hiện chữ thay thế, không bao giờ để lộ hình vỡ
  const [daTai, datDaTai] = useState(false);
  return (
    <button className={`nut-tron ${dang ? 'dang' : ''}`} disabled={khoa} onClick={onClick} aria-current={dang ? 'page' : undefined}>
      <span className={`mat-nut ${coAnh && daTai ? '' : 'chua-anh'}`}>
        {(!coAnh || !daTai) && <b>{chu}</b>}
        {coAnh && (
          <img
            className={daTai ? '' : 'an-anh'}
            src={`./hinh/ui/nut-${anh}.webp`}
            alt=""
            draggable={false}
            onLoad={() => datDaTai(true)}
            onError={(e) => daHetLuotThu(e.currentTarget) && datCoAnh(false)}
          />
        )}
        {so > 0 ? <i className="cham-so">{so > 9 ? '9+' : so}</i> : cham ? <i className="cham-so trong" /> : null}
      </span>
      <span className="ten-nut">{ten}</span>
      {nhan && <em>{nhan}</em>}
    </button>
  );
}

/** Có cây nào đã lên 1000 năm (hết lớn, nên hái) chưa — chỉ lúc đó mới chấm đỏ, kẻo chấm đỏ suốt ngày. */
export const coCayChin = (k: Kho, luc = Date.now()) => k.vuon.o.some((o) => o && giaiDoan(o, luc) >= 3);

export function ThanhDieuHuong({ man, kho, onChon, onPhuongThi }: { man: ManChinh; kho: Kho; onChon: (m: ManChinh) => void; onPhuongThi: () => void }) {
  // đang ở dưới Vực Thẳm thì nút Du ngoạn luôn mở (quay lại vực)
  // nút chỉ khoá khi cả Thanh Vân sơn lẫn Vực Thẳm đều không vào được
  const khongDi = kho.vuc?.trong || !lyDoKhongVaoVuc(kho) ? null : lyDoKhongDi(kho);
  const nhanDi = khongDi === 'cần Luyện Khí' ? 'Luyện Khí' : khongDi === 'mất hồn' ? 'Mất hồn' : khongDi ? 'Dưỡng thương' : undefined;
  return (
    <nav className="thanh-dieu-huong">
      <NutAnh anh="dong-phu" ten="Động phủ" chu="府" dang={man === 'tu-tien'} cham={kho.danDuong.xong} onClick={() => onChon('tu-tien')} />
      <NutAnh anh="luyen-dan" ten="Đan phòng" chu="丹" dang={man === 'lo-dan'} onClick={() => onChon('lo-dan')} />
      <NutAnh anh="vuon-duoc" ten="Vườn dược" chu="草" dang={man === 'vuon'} cham={coCayChin(kho)} onClick={() => onChon('vuon')} />
      <NutAnh anh="phuong-thi" ten="Phường thị" chu="市" onClick={onPhuongThi} />
      <NutAnh anh="du-ngoan" ten="Du ngoạn" chu="遊" dang={man === 'ban-do'} khoa={!!khongDi && man !== 'ban-do'} nhan={nhanDi} onClick={() => onChon('ban-do')} />
    </nav>
  );
}
