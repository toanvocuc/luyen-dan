// Chọn vùng du ngoạn: Thanh Vân sơn (kỳ ngộ, đi lên) hoặc Vực Thẳm (từ Kim Đan, đi xuống, không reset).
import type { Kho } from '../game/kho.ts';
import { BAN_DO, lyDoKhongDi } from '../game/kyNgo.ts';
import { LUAT_VUC, diemVuc, lyDoKhongVaoVuc } from '../game/vucTham.ts';

export function ChonVung({ kho, onThanhVan, onVuc, onDong }: { kho: Kho; onThanhVan: () => void; onVuc: () => void; onDong: () => void }) {
  const khongTv = lyDoKhongDi(kho);
  const khongVuc = lyDoKhongVaoVuc(kho);
  return (
    <div className="lop-phu lop-chon-vung" onClick={onDong}>
      <div className="chon-vung" onClick={(e) => e.stopPropagation()}>
        <h2>Du ngoạn</h2>
        <button className="the-vung tv" disabled={!!khongTv} onClick={onThanhVan}>
          <img src="./hinh/ky-ngo/huou-1.webp" alt="" draggable={false} />
          <span>
            <b>{BAN_DO.ten}</b>
            <small>{khongTv ? `Không đi được: ${khongTv}` : 'Kỳ ngộ, linh địa, cố nhân.'}</small>
          </span>
        </button>
        <button className="the-vung vuc" disabled={!!khongVuc} onClick={onVuc}>
          <img src="./hinh/vuc-tham/nen/cua-vuc.webp" alt="" draggable={false} />
          <span>
            <b>Vực Thẳm</b>
            <small>
              {khongVuc
                ? `Không vào được: ${khongVuc}`
                : kho.vuc.trong
                  ? `Đang ở tầng ${diemVuc(kho, kho.vuc.viTri).tang}: quay lại chỗ cũ.`
                  : `${kho.tuVi.canhGioi < 3 ? 'Tu vi còn non: vào là cửu tử nhất sinh. ' : ''}${LUAT_VUC.soTang} tầng, đổi hình mỗi ngày. Máu không tự hồi. Sâu nhất: tầng ${kho.vuc.sauNhat}.`}
            </small>
          </span>
        </button>
        <button className="nut-nho" onClick={onDong}>
          Đóng
        </button>
      </div>
    </div>
  );
}
