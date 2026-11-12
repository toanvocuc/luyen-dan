// Thanh tỉ lệ nhiều đoạn — độ dài mỗi đoạn đúng bằng phần trăm của nó.
export interface Doan {
  ten: string;
  /** Lớp CSS quyết định màu. */
  lop: string;
  v: number;
}

/** Năm đoạn phẩm cấp của viên đan. */
export const doanPham = (tl: number[]): Doan[] => [
  { ten: 'Phế đan', lop: 'phe', v: tl[0] },
  { ten: 'Hạ', lop: 'pham-0', v: tl[1] },
  { ten: 'Trung', lop: 'pham-1', v: tl[2] },
  { ten: 'Thượng', lop: 'pham-2', v: tl[3] },
  { ten: 'Cực', lop: 'pham-3', v: tl[4] },
];

/** Năm kết cục của một lần tôi đan. */
export const doanToi = (tl: number[]): Doan[] => [
  { ten: 'Nổ lò', lop: 'toi-no', v: tl[0] },
  { ten: 'Tổn', lop: 'toi-ton', v: tl[1] },
  { ten: 'Giữ', lop: 'toi-giu', v: tl[2] },
  { ten: 'Thành', lop: 'toi-thanh', v: tl[3] },
  { ten: 'Đại thành', lop: 'toi-dai', v: tl[4] },
];

export function ThanhTiLe({
  doan,
  gon = false,
  kim = null,
}: {
  doan: Doan[];
  /** Bản gọn: thanh mảnh, chữ nhỏ. */
  gon?: boolean;
  /** Kim quay: chạy tới vị trí `den` (0–1). Đổi `luot` để chạy lại hoạt ảnh. */
  kim?: { den: number; luot: number } | null;
}) {
  return (
    <div className={`ti-le ${gon ? 'gon' : ''}`}>
      <div className="ti-le-thanh">
        {doan.map((d) => (
          <span key={d.ten} className={`doan ${d.lop}`} style={{ width: `${d.v * 100}%` }} />
        ))}
        {kim && <i key={kim.luot} className="kim-quay" style={{ '--den': `${kim.den * 100}%` } as React.CSSProperties} />}
      </div>
      <div className="ti-le-chu" style={{ gridTemplateColumns: `repeat(${doan.length}, 1fr)` }}>
        {doan.map((d) => (
          <span key={d.ten} className={`o ${d.lop}`}>
            <em>{d.ten}</em>
            <b>{(d.v * 100).toFixed(d.v < 0.1 ? 1 : 0)}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}
