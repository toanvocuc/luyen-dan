// Búp bê nhân vật: các lớp ảnh cùng khung hình chồng lên nhau theo thứ tự thân -> áo -> mặt -> tóc.
import type { NhanVat } from '../game/nhanVat.ts';

const anh = (ten: string) => `./hinh/nhan-vat/${ten}.png`;

export function BupBe({ dang, an = false }: { dang: NhanVat['dang'] | null; /** Chưa định hình: chỉ hiện bóng thân. */ an?: boolean }) {
  return (
    <div className={`bup-be ${an || !dang ? 'chua-dinh-hinh' : ''}`}>
      <img src={anh('than')} alt="" draggable={false} />
      {dang && !an && (
        <>
          <img src={anh(`ao-${dang.ao}`)} alt="" draggable={false} />
          <img src={anh(`mat-${dang.mat}`)} alt="" draggable={false} />
          <img src={anh(`toc-${dang.toc}`)} alt="" draggable={false} />
        </>
      )}
    </div>
  );
}
