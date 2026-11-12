// Thanh tỉ lệ sáu đoạn — độ dài mỗi đoạn đúng bằng phần trăm của nó.
const TEN = ['Nổ lò', 'Phế đan', 'Hạ', 'Trung', 'Thượng', 'Cực'];
const LOP = ['no-lo', 'phe', 'pham-0', 'pham-1', 'pham-2', 'pham-3'];

export function ThanhTiLe({ tiLe }: { tiLe: number[] }) {
  return (
    <div className="ti-le">
      <div className="ti-le-thanh">
        {tiLe.map((v, i) => (
          <span key={i} className={`doan ${LOP[i]}`} style={{ width: `${v * 100}%` }} />
        ))}
      </div>
      <div className="ti-le-chu">
        {tiLe.map((v, i) => (
          <span key={i} className={`o ${LOP[i]}`}>
            <em>{TEN[i]}</em>
            <b>{(v * 100).toFixed(v < 0.1 ? 1 : 0)}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}
