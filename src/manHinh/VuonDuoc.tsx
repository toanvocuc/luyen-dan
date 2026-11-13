// Vườn dược: gieo hạt giống vào ô linh điền, cây lớn theo đồng hồ thật (kể cả lúc tắt game), hái lúc nào được thuốc tuổi lúc đó.
import { useState } from 'react';
import { DUOC_LIEU, LUAT, TEN_TUOI_NGAN, anhDuocLieu, timDuocLieu } from '../game/duLieu.ts';
import { giaMoO, giaiDoan, giayToiGiaiDoanSau, gieoHat, moO, thuHoach, type Kho } from '../game/kho.ts';
import { dongHo, useBayGio } from './PhuongThi.tsx';

const ANH_CAY = ['mam', 'mam', 'cay-non', 'cay-lon'] as const;
const TEN_GIAI_DOAN = ['Mầm non', 'Thuốc 10 năm', 'Thuốc 100 năm', 'Thuốc 1000 năm'] as const;

export function VuonDuoc({ kho, doiKho }: { kho: Kho; doiKho: (ham: (k: Kho) => Kho) => void }) {
  const luc = useBayGio();
  const [chon, datChon] = useState<number | null>(null);
  const giaO = giaMoO(kho);
  const cayChon = chon !== null ? kho.vuon.o[chon] ?? null : null;
  const hatDangCo = DUOC_LIEU.filter((d) => (kho.hatGiong[d.id] ?? 0) > 0);

  return (
    <main className="vuon">
      <div className="luoi-vuon">
        {Array.from({ length: kho.vuon.soO }, (_, i) => {
          const cay = kho.vuon.o[i] ?? null;
          const gd = cay ? giaiDoan(cay, luc) : 0;
          const con = cay ? giayToiGiaiDoanSau(cay, luc) : 0;
          return (
            <button key={i} className={`o-vuon ${chon === i ? 'chon' : ''} ${cay && gd >= 1 ? 'hai-duoc' : ''}`} onClick={() => datChon(i)}>
              <span className="dat">
                <img className="nen-o" src="./hinh/vuon/o-dat.png" alt="" draggable={false} />
                {cay && <img className={`cay gd-${gd}`} src={`./hinh/vuon/${ANH_CAY[gd]}.png`} alt="" draggable={false} />}
                {cay && <img className="loai" src={anhDuocLieu(cay.id)} alt="" draggable={false} />}
              </span>
              <span className="nhan-o">{cay ? (gd === 0 ? `Mầm · ${dongHo(con)}` : gd === 3 ? '1000 năm' : `${TEN_TUOI_NGAN[gd - 1]} · ${dongHo(con)}`) : 'Ô trống'}</span>
            </button>
          );
        })}
        {giaO !== null && (
          <button className="o-vuon khoa" disabled={kho.linhThach < giaO} onClick={() => doiKho(moO)}>
            <span className="dat">
              <img className="nen-o" src="./hinh/vuon/o-dat.png" alt="" draggable={false} />
            </span>
            <span className="nhan-o">Mở ô · {giaO}</span>
          </button>
        )}
      </div>

      <section className="bang day gon">
        {chon === null && (
          <p className="chu-nho">
            Chạm một ô để gieo hạt hoặc thu hoạch. Hạt nảy thành thuốc 10 năm sau {dongHo(LUAT.vuon.giay[0])}, 100 năm sau {dongHo(LUAT.vuon.giay[1])}, 1000 năm sau{' '}
            {dongHo(LUAT.vuon.giay[2])}. Cây vẫn lớn khi tắt game.
          </p>
        )}

        {chon !== null && !cayChon && (
          <>
            <div className="ten-doan">Ô {chon + 1}: chọn hạt giống để gieo</div>
            {hatDangCo.length === 0 && <p className="chu-nho">Chưa có hạt giống nào. Hạt giống bán ở phường thị, mỗi kỳ một ít.</p>}
            <div className="hang-hat">
              {hatDangCo.map((d) => (
                <button key={d.id} className="the-phuong" onClick={() => doiKho((k) => gieoHat(k, chon, d.id))}>
                  <img src={anhDuocLieu(d.id)} alt="" />
                  {d.ten} ×{kho.hatGiong[d.id]}
                </button>
              ))}
            </div>
          </>
        )}

        {chon !== null &&
          cayChon &&
          (() => {
            const gd = giaiDoan(cayChon, luc);
            const con = giayToiGiaiDoanSau(cayChon, luc);
            const ten = timDuocLieu(cayChon.id).ten;
            return (
              <>
                <div className="ten-doan">
                  Ô {chon + 1}: {ten} — {TEN_GIAI_DOAN[gd]}
                </div>
                <p className="chu-nho">
                  {gd === 3
                    ? 'Cây đã đủ ngàn năm, không lớn thêm nữa.'
                    : gd === 0
                      ? `Còn ${dongHo(con)} nữa mới hái được.`
                      : `Để thêm ${dongHo(con)} nữa sẽ thành thuốc ${TEN_TUOI_NGAN[gd]}. Hái bây giờ thì ô trống ngay.`}
                </p>
                <div className="hang-nut">
                  <button className="nut chinh" disabled={gd < 1} onClick={() => doiKho((k) => thuHoach(k, chon, Math.random()))}>
                    {gd < 1 ? 'Chưa hái được' : `Hái ${LUAT.vuon.sanLuong}–${LUAT.vuon.sanLuong + 1} phần ${ten} ${TEN_TUOI_NGAN[gd - 1]}`}
                  </button>
                </div>
              </>
            );
          })()}
      </section>
    </main>
  );
}
