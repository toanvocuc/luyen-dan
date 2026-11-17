// Trạng thái lâu dài của người chơi (linh thạch, dược liệu, túi đan…) + lưu vào trình duyệt.
import { CANH_GIOI, CHI_SO, DAN_DUOC_DOT_PHA, DAN_PHUONG, DUOC_LIEU, timDanDuoc, HE_SO_DAN_VAN, HE_SO_GIA, LUAT, NANG_CAP_GOC, TONG_MON, bacSo, giaBan, giaHatGiong, heSoChuyen, laDanThat, timDanPhuong, timDuocLieu, timLoDan, timPhuLieu, type ChiSo, type DanPhuong, type LoiThe, type NangCap, type PhamThat, type Tuoi } from './duLieu.ts';
import type { KetQua } from './luyenDan.ts';
import { loiThe, timXuatThan, type NhanVat } from './nhanVat.ts';
import type { QuaMoDau } from './quaMoDau.ts';
import { tacDungThu, type Thu } from './linhThu.ts';
import { buVuc, vatCanDotPha, timVatVuc, vucMoi, type VucTrangThai } from './vucTham.ts';

export interface Kho {
  phienBan: 3;
  /** Chưa tạo nhân vật thì null. */
  nhanVat: NhanVat | null;
  /** Tu vi: cảnh giới (chỉ số trong CANH_GIOI), tầng hiện tại (1–9) và điểm đã tích trong tầng. */
  tuVi: { canhGioi: number; tang: number; diem: number };
  linhThach: number;
  /** id dược liệu -> số lượng theo tuổi thuốc [mười, trăm, ngàn năm]. */
  duocLieu: Record<string, [number, number, number]>;
  /** id phụ liệu -> số lượng. */
  phuLieu: Record<string, number>;
  /** id đan phương -> số viên theo phẩm [hạ, trung, thượng, cực]. Viên đan văn đếm riêng, không nằm trong đây. */
  tuiDan: Record<string, [number, number, number, number]>;
  /** id đan phương -> số viên cực phẩm có đan văn. */
  danVan: Record<string, number>;
  /** id đan phương -> số mẻ đã luyện thành (để mở luyện nhanh). */
  thongThao: Record<string, number>;
  nangCap: NangCap;
  /** Lò vừa nổ, phải sửa mới luyện tiếp được. */
  loHu: boolean;
  thongKe: { soMe: number; noLo: number };
  /** id dược liệu -> số hạt giống đang có. */
  hatGiong: Record<string, number>;
  /** Vườn dược: số ô đã mở và cây trong từng ô (null = ô trống). */
  vuon: { soO: number; o: (OVuon | null)[] };
  /** Phường thị: kỳ hàng gần nhất mà người chơi đã mua, và số đã mua của từng mặt hàng trong kỳ đó. */
  cho: {
    ky: number;
    daMua: Record<string, number>;
    /** Số lần đã trả tiền đổi hàng trong kỳ `ky` (mỗi lần cho ra một lượt hàng khác). */
    lan: number;
    /** Ngày (theo giờ máy) của lần trả tiền đổi hàng gần nhất, và số lượt đã dùng trong ngày đó. */
    ngay: number;
    soLan: number;
  };
  /** Lò đan: chiếc đang dùng và những chiếc đã mua. */
  loDan: { dung: string; co: string[] };
  /** Đơn hàng tông môn: đơn ở từng chỗ (null = chỗ trống), và thời điểm (ms) chỗ trống đó có đơn mới. */
  donHang: { ds: (Don | null)[]; luc: number[] };
  /** id tông môn -> danh vọng đã tích. */
  danhVong: Record<string, number>;
  /** Đan độc: số điểm tại thời điểm `luc` (ms); từ đó tới giờ độc đã tự tan bớt, xem docHienTai. */
  doc: { diem: number; luc: number };
  /** Đang được tăng tốc tu luyện nhờ đan: cộng thêm `nhan` lần tốc độ gốc trong `giay` giây chơi nữa. */
  tangToc: { nhan: number; giay: number };
  /** Phần cộng vào tỉ lệ thành công của lần đột phá kế tiếp (từ Băng Tâm Đan); dùng xong thì về 0. */
  congDotPha: number;
  /** Chỉ số được cộng vĩnh viễn nhờ uống đan (số lẻ; lúc hiển thị mới làm tròn). */
  chiSoCong: Partial<Record<ChiSo, number>>;
  /** id đan phương -> số viên đã uống từ trước tới giờ (để tính nhờn thuốc). */
  daUong: Record<string, number>;
  /** Máu: lượng đang thiếu tại thời điểm `luc` (ms); từ đó tới giờ đã tự hồi bớt, xem mauHienTai. */
  mau: { thieu: number; luc: number };
  /** Đan đã dưỡng lên chuyển: khoá `id đan phương|loại|số chuyển` (xem khoaChuyen) -> số viên. Viên chưa chuyển nào vẫn nằm ở tuiDan/danVan. */
  danChuyen: Record<string, number>;
  /** Các viên đang dưỡng dở (đã được lấy ra khỏi túi); không dưỡng thì null. */
  duong: { vien: VienDuong[] } | null;
  /** Phần tốc độ tu luyện được cộng vĩnh viễn nhờ uống đan đã dưỡng (0,1 = nhanh hơn 10%). */
  tocDoCong: number;
  /** Thể lực du ngoạn: số điểm tại thời điểm `luc` (ms); từ đó tới giờ đã tự hồi thêm, xem theLucHienTai trong kyNgo.ts. */
  theLuc: { diem: number; luc: number };
  /** Bản đồ du ngoạn: điểm đang đứng, các điểm đã từng đặt chân tới, và kỳ (kyCho) mà mỗi điểm đã được giải quyết xong. */
  banDo: {
    viTri: number;
    daDen: number[];
    xong: Record<string, number>;
    /** Kỳ ngộ nhiều bước đang dở: ở điểm nào, kỳ nào, sự kiện nào, bước nào. */
    dangKe?: { diem: number; ky: number; sk: string; buoc: string } | null;
    /** Lúc (ms) bắt đầu lượt du ngoạn hiện tại; quá LUAT.kyNgo.giayLuot thì lượt sau bắt đầu lại từ làng. */
    batDau?: number;
  };
  /** NPC: hảo cảm (0–100) và kỳ gần nhất đã trò chuyện / tỷ thí. */
  npc: Record<string, { haoCam: number; kyNoi: number; kyTyThi: number }>;
  /** Thời điểm (ms) bị mất hồn gần nhất — máu về 0 trong kỳ ngộ; 0 = chưa từng. Xem LUAT.kyNgo.matHon. */
  matHon: number;
  /** Lần mất hồn gần nhất là lần nhẹ (lần đầu tiên): khoá ngắn, không giảm chỉ số. */
  matHonNhe: boolean;
  /** Đã mất hồn bao nhiêu lần từ trước tới giờ. */
  soLanMatHon: number;
  /** Nhiệm vụ dẫn đường (danDuong.ts): đang ở nhiệm vụ thứ mấy, và nhiệm vụ đó đã xong chờ nhận thưởng chưa. */
  danDuong: { buoc: number; xong: boolean };
  /** Các lượt chỉ tay lần đầu (manHinh/ChiTay.tsx) đã xem. */
  daChiTay: string[];
  /** Quà của Đan Lão ở đoạn mở đầu; null = chưa nhận (sẽ xem đoạn mở đầu). */
  quaMoDau: QuaMoDau | null;
  /** Trứng Dực Quang Thần Thú (quà Linh Thú Thần Đan): lúc nhận; null = không có. */
  trung: { luc: number } | null;
  /** Dẫn dược tông môn đang có (id -> số phần). */
  danDuoc: Record<string, number>;
  /** Đã uống Hộ Đạo Đan cho lần đột phá tới. */
  hoDao: boolean;
  /** Lúc (ms) bị tẩu hỏa gần nhất (đột phá đại cảnh giới thất bại); 0 = chưa. */
  tauHoa: number;
  /** Thẻ trạng thái đang chờ người chơi bấm "Đã hiểu" (tự gây ra: tẩu hỏa, trúng độc, mất hồn). */
  thongBao: { loai: 'tau-hoa' | 'trung-doc' | 'mat-hon'; luc: number } | null;
  /** Linh thú đang nuôi (xem game/linhThu.ts), con đang xuất chiến, trứng chưa ấp, trứng đang ấp, thú vừa nở chờ nhận nuôi. */
  linhThu: Thu[];
  thuXuatChien: string | null;
  trungThu: number;
  apTrung: { cap: number; truot: number } | null;
  thuMoiNo: Thu | null;
  /** Vực Thẳm (xem game/vucTham.ts) và vật phẩm Vực Thẳm đã mang ra ngoài. */
  vuc: VucTrangThai;
  vatVuc: Record<string, number>;
}

/** Loại viên đan dưỡng được: thượng phẩm, cực phẩm, hoặc đan văn. */
export type LoaiQuy = 2 | 3 | 'dv';
/** Một viên đang dưỡng: đã lên mấy chuyển, đã trượt mấy lần, đã vỡ chưa, và có đang được giữ lại (không bấm tiếp) không. */
export interface VienDuong {
  phuongId: string;
  loai: LoaiQuy;
  bac: number;
  truot: number;
  vo: boolean;
  giu: boolean;
}

/** Một đơn đặt đan của tông môn. */
export interface Don {
  tongMon: string;
  phuongId: string;
  /** Phẩm thấp nhất tông môn chịu nhận; viên phẩm cao hơn vẫn giao được. */
  pham: PhamThat;
  soLuong: number;
  /** Linh thạch và danh vọng nhận được khi giao đủ. */
  thuong: number;
  danhVong: number;
}

/** Một cây trong vườn: vị thuốc gì, gieo lúc nào (mili giây theo đồng hồ thật). */
export interface OVuon {
  id: string;
  luc: number;
}

const KHOA = 'luyen-dan-kho-v3';

/** Kho khởi đầu. Có nhân vật thì xuất thân quyết định vốn liếng ban đầu. */
export function khoMoi(nv: NhanVat | null = null): Kho {
  const xt = nv ? timXuatThan(nv.xuatThan) : null;
  const hs = xt?.heSoDuocLieu ?? 1;
  const duocLieu: Kho['duocLieu'] = {};
  for (const d of DUOC_LIEU) duocLieu[d.id] = [0, 0, 0];
  // vốn ban đầu: đủ luyện ba mẻ Tụ Khí Đan
  duocLieu['linh-thao'] = [6 * hs, 0, 0];
  duocLieu['chu-qua'] = [3 * hs, 0, 0];
  const tuiDan: Kho['tuiDan'] = {};
  const danVan: Kho['danVan'] = {};
  const thongThao: Kho['thongThao'] = {};
  for (const p of DAN_PHUONG) {
    tuiDan[p.id] = [0, 0, 0, 0];
    danVan[p.id] = 0;
    thongThao[p.id] = 0;
  }
  // thế gia luyện đan: coi như đã thạo đan nhập môn nên đan phương thứ hai mở sẵn
  if (xt?.moSanPhuong) thongThao['tu-khi-dan'] = 3;
  return {
    phienBan: 3,
    nhanVat: nv,
    // bắt đầu là Phàm Nhân: lần đột phá đầu tiên (Dẫn Khí Đan) chính là bài nhập môn
    tuVi: { canhGioi: 0, tang: 1, diem: 0 },
    linhThach: xt?.linhThach ?? 120,
    duocLieu,
    phuLieu: { 'hoa-tinh': 0, 'ngung-than-thao': 0 },
    tuiDan,
    danVan,
    thongThao,
    nangCap: { ...NANG_CAP_GOC, lo: xt?.lo ?? 0 },
    loHu: false,
    thongKe: { soMe: 0, noLo: 0 },
    hatGiong: {},
    vuon: { soO: LUAT.vuon.soODau, o: [] },
    cho: { ky: 0, daMua: {}, lan: 0, ngay: 0, soLan: 0 },
    loDan: { dung: 'thanh-dong-lo', co: ['thanh-dong-lo'] },
    donHang: { ds: [], luc: [] },
    danhVong: {},
    doc: { diem: 0, luc: 0 },
    tangToc: { nhan: 0, giay: 0 },
    congDotPha: 0,
    chiSoCong: {},
    daUong: {},
    mau: { thieu: 0, luc: 0 },
    danChuyen: {},
    duong: null,
    tocDoCong: 0,
    theLuc: { diem: 100, luc: 0 },
    banDo: { viTri: 0, daDen: [0], xong: {} },
    npc: {},
    matHon: 0,
    matHonNhe: false,
    soLanMatHon: 0,
    danDuong: { buoc: 0, xong: false },
    daChiTay: [],
    quaMoDau: null,
    trung: null,
    danDuoc: {},
    hoDao: false,
    tauHoa: 0,
    thongBao: null,
    linhThu: [],
    thuXuatChien: null,
    trungThu: 0,
    apTrung: null,
    thuMoiNo: null,
    vuc: vucMoi(),
    vatVuc: {},
  };
}

/** Bù các mục mới thêm vào dữ liệu sau khi người chơi đã có bản lưu. Không phải bản lưu hợp lệ thì trả về null. */
function buKho(k: Kho | null): Kho | null {
  if (!k || k.phienBan !== 3 || !k.tuVi || !k.tuiDan) return null;
  const moi = khoMoi();
  // mẻ đang dưỡng dở lúc tắt game thì cất luôn vào túi ở mức đang có
  return thuDuong({
      ...moi,
      ...k,
      duocLieu: { ...Object.fromEntries(DUOC_LIEU.map((d) => [d.id, [0, 0, 0] as [number, number, number]])), ...k.duocLieu },
      phuLieu: { ...moi.phuLieu, ...k.phuLieu },
      tuiDan: { ...moi.tuiDan, ...k.tuiDan },
      danVan: { ...moi.danVan, ...k.danVan },
      thongThao: { ...moi.thongThao, ...k.thongThao },
      nangCap: { ...moi.nangCap, ...k.nangCap },
      thongKe: { ...moi.thongKe, ...k.thongKe },
      tuVi: { ...moi.tuVi, ...k.tuVi },
      hatGiong: { ...k.hatGiong },
      vuon: { ...moi.vuon, ...k.vuon },
      cho: { ...moi.cho, ...k.cho },
      loDan: { ...moi.loDan, ...k.loDan },
      donHang: { ...moi.donHang, ...k.donHang },
      danhVong: { ...k.danhVong },
      doc: { ...moi.doc, ...k.doc },
      tangToc: { ...moi.tangToc, ...k.tangToc },
      chiSoCong: { ...k.chiSoCong },
      daUong: { ...k.daUong },
      mau: { ...moi.mau, ...k.mau },
      danChuyen: { ...k.danChuyen },
      duong: k.duong ?? null,
      theLuc: { ...moi.theLuc, ...k.theLuc },
      banDo: { ...moi.banDo, ...k.banDo },
      npc: { ...k.npc },
      matHon: k.matHon ?? 0,
      matHonNhe: k.matHonNhe ?? false,
      soLanMatHon: k.soLanMatHon ?? ((k.matHon ?? 0) > 0 ? 1 : 0),
      danDuong: { ...moi.danDuong, ...k.danDuong },
      daChiTay: [...(k.daChiTay ?? [])],
      quaMoDau: k.quaMoDau ?? null,
      trung: k.trung ?? null,
      danDuoc: { ...k.danDuoc },
      hoDao: k.hoDao ?? false,
      tauHoa: k.tauHoa ?? 0,
      thongBao: k.thongBao ?? null,
      linhThu: [...(k.linhThu ?? [])],
      thuXuatChien: k.thuXuatChien ?? null,
      trungThu: k.trungThu ?? 0,
      apTrung: k.apTrung ?? null,
      thuMoiNo: k.thuMoiNo ?? null,
      vuc: buVuc(k.vuc),
      vatVuc: { ...k.vatVuc },
  });
}

export function napKho(): Kho {
  try {
    const s = localStorage.getItem(KHOA);
    const k = s ? buKho(JSON.parse(s) as Kho) : null;
    if (k) return k;
  } catch {
    // bản lưu hỏng hoặc trình duyệt chặn lưu trữ: chơi bằng kho mới
  }
  return khoMoi();
}

/** Đóng gói cả bản lưu thành một dòng mã để chép sang máy khác hoặc địa chỉ web khác. */
export function xuatMa(k: Kho): string {
  const bytes = new TextEncoder().encode(JSON.stringify(k));
  let nhi = '';
  for (const b of bytes) nhi += String.fromCharCode(b);
  return 'LD3.' + btoa(nhi);
}
/** Đọc lại mã do xuatMa tạo ra. Mã sai hay hỏng thì trả về null. */
export function nhapMa(ma: string): Kho | null {
  try {
    const sach = ma.replace(/\s+/g, '');
    if (!sach.startsWith('LD3.')) return null;
    const nhi = atob(sach.slice(4));
    const bytes = Uint8Array.from(nhi, (c) => c.charCodeAt(0));
    return buKho(JSON.parse(new TextDecoder().decode(bytes)) as Kho);
  } catch {
    return null;
  }
}

export function luuKho(k: Kho) {
  try {
    localStorage.setItem(KHOA, JSON.stringify(k));
  } catch {
    // chế độ ẩn danh có thể chặn ghi — bỏ qua, game vẫn chạy
  }
}

export function duLieu(k: Kho, lieu: readonly string[], tuoi: readonly Tuoi[], phuLieuId: string | null): boolean {
  // gom nhu cầu theo (vị, tuổi) vì một đan phương có thể cần hai phần cùng một vị
  const can = new Map<string, number>();
  lieu.forEach((id, i) => can.set(`${id}|${tuoi[i]}`, (can.get(`${id}|${tuoi[i]}`) ?? 0) + 1));
  for (const [khoa, n] of can) {
    const [id, t] = khoa.split('|');
    if ((k.duocLieu[id]?.[Number(t)] ?? 0) < n) return false;
  }
  if (phuLieuId && (k.phuLieu[phuLieuId] ?? 0) < 1) return false;
  return true;
}

/** Liệt kê dược liệu còn thiếu cho lựa chọn hiện tại (gộp theo vị và tuổi thuốc). */
export function thieuGi(k: Kho, lieu: readonly string[], tuoi: readonly Tuoi[]): { id: string; tuoi: Tuoi; thieu: number }[] {
  const can = new Map<string, number>();
  lieu.forEach((id, i) => can.set(`${id}|${tuoi[i]}`, (can.get(`${id}|${tuoi[i]}`) ?? 0) + 1));
  const ra: { id: string; tuoi: Tuoi; thieu: number }[] = [];
  for (const [khoa, n] of can) {
    const [id, t] = khoa.split('|');
    const co = k.duocLieu[id]?.[Number(t)] ?? 0;
    if (co < n) ra.push({ id, tuoi: Number(t) as Tuoi, thieu: n - co });
  }
  return ra;
}

/** Trừ nguyên liệu khi khai lò. */
export function truNguyenLieu(k: Kho, lieu: readonly string[], tuoi: readonly Tuoi[], phuLieuId: string | null): Kho {
  const duocLieu = { ...k.duocLieu };
  lieu.forEach((id, i) => {
    const c = [...duocLieu[id]] as [number, number, number];
    c[tuoi[i]] -= 1;
    duocLieu[id] = c;
  });
  const phuLieu = { ...k.phuLieu };
  if (phuLieuId) phuLieu[phuLieuId] = (phuLieu[phuLieuId] ?? 0) - 1;
  return { ...k, duocLieu, phuLieu };
}

/** Cất đan vừa luyện vào túi và ghi thống kê. Nổ lò thì lò hư. */
export function nhanKetQua(k: Kho, phuongId: string, kq: KetQua): Kho {
  const thongKe = { soMe: k.thongKe.soMe + 1, noLo: k.thongKe.noLo + (kq.noLo ? 1 : 0) };
  if (kq.noLo) return { ...k, thongKe, loHu: true };
  const tui = [...k.tuiDan[phuongId]] as [number, number, number, number];
  let dv = k.danVan[phuongId] ?? 0;
  for (const v of kq.vien) {
    if (v.danVan) dv += 1;
    else if (laDanThat(v.pham)) tui[v.pham] += 1;
  }
  const coDan = kq.vien.some((v) => v.pham >= 0);
  return {
    ...k,
    thongKe,
    tuiDan: { ...k.tuiDan, [phuongId]: tui },
    danVan: { ...k.danVan, [phuongId]: dv },
    thongThao: { ...k.thongThao, [phuongId]: (k.thongThao[phuongId] ?? 0) + (coDan ? 1 : 0) },
  };
}

// ---------- phường thị ----------

/** Giá mua một phần dược liệu, đã tính lợi thế của nhân vật (giới diện, xuất thân). */
/** Hệ số giá mọi món mua ở phường thị: lợi thế mua của nhân vật × hệ số chung của chợ. */
const heSoCho = (k: Kho) => loiThe(k.nhanVat).heSoMua * LUAT.cho.heSoGia;
export const giaMua = (k: Kho, id: string, tuoi: Tuoi) => Math.max(1, Math.round(timDuocLieu(id).gia[tuoi] * heSoCho(k)));
export const giaMuaPhuLieu = (k: Kho, id: string) => Math.max(1, Math.round((timPhuLieu(id)?.gia ?? 0) * heSoCho(k)));

// Hàng của phường thị đổi theo kỳ (LUAT.cho.gioDoiHang giờ một lần). Hàng mỗi kỳ được quay từ số kỳ và tên nhân vật,
// nên trong một kỳ nó không đổi dù nạp lại trang, và mỗi nhân vật gặp một chợ khác nhau.

const MS_MOI_KY = LUAT.cho.gioDoiHang * 3600_000;
export const kyCho = (luc = Date.now()) => Math.floor(luc / MS_MOI_KY);
/** Còn bao nhiêu giây nữa thì phường thị đổi hàng. */
export const giayToiKySau = (luc = Date.now()) => Math.ceil(((kyCho(luc) + 1) * MS_MOI_KY - luc) / 1000);
/** Khoá của một mặt hàng: thuốc theo tuổi, hoặc hạt giống. */
export const khoaThuoc = (id: string, tuoi: Tuoi) => `${id}|${tuoi}`;
export const khoaHat = (id: string) => `${id}|hat`;
export const khoaDanCho = (id: string, pham: PhamThat) => `${id}|dan${pham}`;
/** Bậc đan mà phường thị bày bán: cùng cảnh giới người chơi; cảnh giới đó chưa có đan thường thì lấy bậc gần nhất bên dưới. */
export function bacDanCho(k: Kho): number {
  for (let b = k.tuVi.canhGioi; b >= 0; b--) if (DAN_PHUONG.some((p) => !p.dotPha && bacSo(p) === b)) return b;
  return -1;
}
/** Các loại đan phường thị có thể bày bán cho người chơi này. */
export const dsDanCho = (k: Kho) => DAN_PHUONG.filter((p) => !p.dotPha && bacSo(p) === bacDanCho(k));
/** Số lần người chơi đã trả tiền đổi hàng trong kỳ `ky`. */
const lanCho = (k: Kho, ky: number) => (k.cho.ky === ky ? k.cho.lan ?? 0 : 0);
/** Số ngày tính theo giờ máy, để đếm lượt đổi hàng mỗi ngày. */
const ngayMay = (luc: number) => Math.floor((luc - new Date(luc).getTimezoneOffset() * 60_000) / 86_400_000);

function bam(chu: string): number {
  let h = 2166136261;
  for (let i = 0; i < chu.length; i++) h = Math.imul(h ^ chu.charCodeAt(i), 16777619);
  return h >>> 0;
}
const boNhoCho = new Map<string, Record<string, number>>();
/** Số lượng từng mặt hàng mà phường thị bày bán trong một kỳ (chưa trừ phần người chơi đã mua). */
export function hangCho(k: Kho, ky: number): Record<string, number> {
  const lan = lanCho(k, ky);
  const bacDan = bacDanCho(k);
  // lượt hàng gốc của kỳ giữ nguyên hạt cũ; mỗi lần trả tiền đổi hàng cho một hạt khác
  const goc = `${k.nhanVat?.ten ?? ''}|${ky}` + (lan ? `|${lan}` : '');
  const khoa = `${goc}|b${bacDan}`;
  const co = boNhoCho.get(khoa);
  if (co) return co;
  let hat = bam(goc);
  const rng = () => {
    hat = (hat + 0x6d2b79f5) >>> 0;
    let t = hat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const trong = ([a, b]: readonly number[]) => a + Math.floor(rng() * (b - a + 1));
  const c = LUAT.cho;
  const hang: Record<string, number> = {};
  for (const d of DUOC_LIEU) {
    const luonCo = (c.luonCo as readonly string[]).includes(d.id);
    for (const t of [0, 1, 2] as Tuoi[]) {
      // luôn quay đủ số lần cho mỗi vị, để thêm bớt luật không làm xô lệch hàng của các vị khác
      const coHang = rng() < c.tiLe[t];
      const n = trong(c.soLuong[t]);
      hang[khoaThuoc(d.id, t)] = t === 0 && luonCo ? c.luonCoSoLuong : coHang ? n : 0;
    }
    const coHat = rng() < c.hatTiLe;
    const n = trong(c.hatSoLuong);
    hang[khoaHat(d.id)] = luonCo ? Math.max(2, n) : coHat ? n : 0;
  }
  // đan quay sau cùng và quay đủ cho mọi đan phương, nên không làm xô lệch hàng thuốc
  for (const p of DAN_PHUONG) {
    if (p.dotPha) continue;
    for (let ph = 0; ph <= c.dan.phamCao; ph++) {
      const coHang = rng() < c.dan.tiLe[ph];
      const n = trong(c.dan.soLuong[ph]);
      hang[khoaDanCho(p.id, ph as PhamThat)] = coHang && bacSo(p) === bacDan ? n : 0;
    }
  }
  boNhoCho.set(khoa, hang);
  return hang;
}
/** Một mặt hàng còn lại bao nhiêu trong kỳ hiện tại. */
export function conHang(k: Kho, khoa: string, luc = Date.now()): number {
  const ky = kyCho(luc);
  return (hangCho(k, ky)[khoa] ?? 0) - (k.cho.ky === ky ? k.cho.daMua[khoa] ?? 0 : 0);
}
function ghiDaMua(k: Kho, khoa: string, luc: number): Kho['cho'] {
  const ky = kyCho(luc);
  const daMua = k.cho.ky === ky ? { ...k.cho.daMua } : {};
  daMua[khoa] = (daMua[khoa] ?? 0) + 1;
  return { ...k.cho, ky, daMua, lan: lanCho(k, ky) };
}

/** Hôm nay còn mấy lượt trả tiền đổi hàng. */
export function luotLamMoiCon(k: Kho, luc = Date.now()): number {
  return LUAT.cho.lamMoi.luotMoiNgay - (k.cho.ngay === ngayMay(luc) ? k.cho.soLan ?? 0 : 0);
}
/** Giá của lượt đổi hàng kế tiếp trong ngày. */
export function giaLamMoi(k: Kho, luc = Date.now()): number {
  const m = LUAT.cho.lamMoi;
  return Math.round(m.gia * m.theoCanhGioi ** k.tuVi.canhGioi * m.nhan ** (m.luotMoiNgay - luotLamMoiCon(k, luc)));
}
/** Trả linh thạch để phường thị đổi hàng ngay (kể cả những món đã mua hết cũng có lại theo lượt hàng mới). */
export function lamMoiCho(k: Kho, luc = Date.now()): Kho {
  const con = luotLamMoiCon(k, luc);
  const gia = giaLamMoi(k, luc);
  if (con < 1 || k.linhThach < gia) return k;
  const ky = kyCho(luc);
  return {
    ...k,
    linhThach: k.linhThach - gia,
    cho: { ky, daMua: {}, lan: lanCho(k, ky) + 1, ngay: ngayMay(luc), soLan: LUAT.cho.lamMoi.luotMoiNgay - con + 1 },
  };
}

/** Giá mua một viên đan ở phường thị: đắt hơn giá trị gốc 50–60%, mỗi kỳ mỗi món một mức. */
export function giaMuaDan(k: Kho, id: string, pham: PhamThat, luc = Date.now()): number {
  const ky = kyCho(luc);
  const [a, b] = LUAT.cho.dan.heSoGia;
  const hs = a + ((bam(`${k.nhanVat?.ten ?? ''}|${ky}|${lanCho(k, ky)}|${id}|${pham}`) % 1000) / 1000) * (b - a);
  return Math.max(1, Math.round(timDanPhuong(id).giaGoc * HE_SO_GIA[pham] * hs * heSoCho(k)));
}
export function muaDan(k: Kho, id: string, pham: PhamThat, luc = Date.now()): Kho {
  const gia = giaMuaDan(k, id, pham, luc);
  const khoa = khoaDanCho(id, pham);
  if (k.linhThach < gia || conHang(k, khoa, luc) < 1) return k;
  const t = [...k.tuiDan[id]] as [number, number, number, number];
  t[pham] += 1;
  return { ...k, linhThach: k.linhThach - gia, tuiDan: { ...k.tuiDan, [id]: t }, cho: ghiDaMua(k, khoa, luc) };
}

export function muaDuocLieu(k: Kho, id: string, tuoi: Tuoi, luc = Date.now()): Kho {
  const gia = giaMua(k, id, tuoi);
  const khoa = khoaThuoc(id, tuoi);
  if (k.linhThach < gia || conHang(k, khoa, luc) < 1) return k;
  const c = [...k.duocLieu[id]] as [number, number, number];
  c[tuoi] += 1;
  return { ...k, linhThach: k.linhThach - gia, duocLieu: { ...k.duocLieu, [id]: c }, cho: ghiDaMua(k, khoa, luc) };
}

export const giaMuaHat = (k: Kho, id: string) => Math.max(1, Math.round(giaHatGiong(timDuocLieu(id), k.tuVi.canhGioi) * heSoCho(k)));
export function muaHatGiong(k: Kho, id: string, luc = Date.now()): Kho {
  const gia = giaMuaHat(k, id);
  const khoa = khoaHat(id);
  if (k.linhThach < gia || conHang(k, khoa, luc) < 1) return k;
  return { ...k, linhThach: k.linhThach - gia, hatGiong: { ...k.hatGiong, [id]: (k.hatGiong[id] ?? 0) + 1 }, cho: ghiDaMua(k, khoa, luc) };
}

export function muaPhuLieu(k: Kho, id: string): Kho {
  const p = timPhuLieu(id);
  const gia = giaMuaPhuLieu(k, id);
  if (!p || k.linhThach < gia) return k;
  return { ...k, linhThach: k.linhThach - gia, phuLieu: { ...k.phuLieu, [id]: (k.phuLieu[id] ?? 0) + 1 } };
}

/** Giá trị toàn bộ đan của một đan phương nếu bán ở phường thị. */
export function giaTriTui(k: Kho, phuongId: string): number {
  const p = timDanPhuong(phuongId);
  const t = k.tuiDan[phuongId];
  const hs = heSoBanCho(k);
  let tong = (k.danVan[phuongId] ?? 0) * giaBan(p, 3, true, hs);
  for (let i = 0; i < 4; i++) tong += t[i] * giaBan(p, i as PhamThat, false, hs);
  return tong;
}

export function banDan(k: Kho, phuongId: string): Kho {
  const tien = giaTriTui(k, phuongId);
  if (tien <= 0) return k;
  return {
    ...k,
    linhThach: k.linhThach + tien,
    tuiDan: { ...k.tuiDan, [phuongId]: [0, 0, 0, 0] },
    danVan: { ...k.danVan, [phuongId]: 0 },
  };
}

/** Bán lẻ: một số viên của một loại đan ở đúng một phẩm ('dv' = đan văn). */
export function banLe(k: Kho, phuongId: string, loai: PhamThat | 'dv', soLuong: number): Kho {
  const p = timDanPhuong(phuongId);
  const hs = heSoBanCho(k);
  if (loai === 'dv') {
    const n = Math.min(soLuong, k.danVan[phuongId] ?? 0);
    if (n < 1) return k;
    return { ...k, linhThach: k.linhThach + n * giaBan(p, 3, true, hs), danVan: { ...k.danVan, [phuongId]: (k.danVan[phuongId] ?? 0) - n } };
  }
  const tui = [...k.tuiDan[phuongId]] as [number, number, number, number];
  const n = Math.min(soLuong, tui[loai]);
  if (n < 1) return k;
  tui[loai] -= n;
  return { ...k, linhThach: k.linhThach + n * giaBan(p, loai, false, hs), tuiDan: { ...k.tuiDan, [phuongId]: tui } };
}

// ---------- dưỡng đan ----------

export const khoaChuyen = (phuongId: string, loai: LoaiQuy, bac: number) => `${phuongId}|${loai}|${bac}`;
/** Tách khoá của danChuyen ra lại ba phần. */
export function docKhoaChuyen(khoa: string): { phuongId: string; loai: LoaiQuy; bac: number } {
  const [phuongId, loai, bac] = khoa.split('|');
  return { phuongId, loai: loai === 'dv' ? 'dv' : (Number(loai) as 2 | 3), bac: Number(bac) };
}

/** Giá bán lẻ một viên đã lên `bac` chuyển. */
export function giaChuyen(k: Kho, phuongId: string, loai: LoaiQuy, bac: number): number {
  const p = timDanPhuong(phuongId);
  const hs = heSoBanCho(k) * heSoChuyen(bac);
  return loai === 'dv' ? giaBan(p, 3, true, hs) : giaBan(p, loai, false, hs);
}

/** Tỉ lệ để một viên lên chuyển kế tiếp. */
export function tiLeDuong(k: Kho, v: VienDuong): number {
  const d = LUAT.duong;
  const goc = v.bac < d.tiLe.length ? d.tiLe[v.bac] : d.tiLe[d.tiLe.length - 1] * d.giamSauBang ** (v.bac - d.tiLe.length + 1);
  const tuChat = Math.min(100, Math.max(0, k.nhanVat?.tuChat ?? 0));
  return Math.min(d.tiLeToiDa, goc * (1 + (d.tuChat * tuChat) / 100) * (v.loai === 'dv' ? d.danVan : 1));
}

/** Một lựa chọn đem đi dưỡng: loại đan nào, phẩm nào, mấy viên. */
export interface ChonDuong {
  phuongId: string;
  loai: LoaiQuy;
  soLuong: number;
}

/** Những viên trong túi đem dưỡng được: từ thượng phẩm trở lên và chưa dưỡng lần nào. Phẩm cao đứng trước. */
export function dsDuongDuoc(k: Kho): { phuongId: string; loai: LoaiQuy; co: number }[] {
  const ra: { phuongId: string; loai: LoaiQuy; co: number }[] = [];
  for (const p of DAN_PHUONG) {
    const dv = k.danVan[p.id] ?? 0;
    if (dv > 0) ra.push({ phuongId: p.id, loai: 'dv', co: dv });
    for (const ph of [3, 2] as const) {
      const co = k.tuiDan[p.id]?.[ph] ?? 0;
      if (ph >= LUAT.duong.phamToiThieu && co > 0) ra.push({ phuongId: p.id, loai: ph, co });
    }
  }
  return ra;
}

/** Bắt đầu dưỡng: lấy các viên đã chọn ra khỏi túi. Chọn quá số đang có hay quá soVienToiDa thì phần thừa bị bỏ qua. */
export function vaoDuong(k: Kho, chon: readonly ChonDuong[]): Kho {
  if (k.duong) return k;
  const tuiDan = { ...k.tuiDan };
  const danVan = { ...k.danVan };
  const vien: VienDuong[] = [];
  for (const c of chon) {
    const co = c.loai === 'dv' ? danVan[c.phuongId] ?? 0 : tuiDan[c.phuongId]?.[c.loai] ?? 0;
    const n = Math.max(0, Math.min(Math.floor(c.soLuong), co, LUAT.duong.soVienToiDa - vien.length));
    if (n < 1 || (c.loai !== 'dv' && c.loai < LUAT.duong.phamToiThieu)) continue;
    if (c.loai === 'dv') danVan[c.phuongId] = co - n;
    else {
      const t = [...tuiDan[c.phuongId]] as [number, number, number, number];
      t[c.loai] -= n;
      tuiDan[c.phuongId] = t;
    }
    for (let i = 0; i < n; i++) vien.push({ phuongId: c.phuongId, loai: c.loai, bac: 0, truot: 0, vo: false, giu: false });
  }
  if (!vien.length) return k;
  return { ...k, tuiDan, danVan, duong: { vien } };
}

export type KetQuaDuong = 'thanh' | 'truot' | 'vo' | null;
/**
 * Một lần bấm: mọi viên chưa vỡ và không bị giữ đều quay riêng, viên thứ i dùng số ngẫu nhiên r[i] trong [0,1).
 * Trả về kho mới và kết quả của từng viên (null = viên đó không quay).
 */
export function bamDuong(k: Kho, r: readonly number[]): { kho: Kho; kq: KetQuaDuong[] } {
  if (!k.duong) return { kho: k, kq: [] };
  const d = LUAT.duong;
  const kq: KetQuaDuong[] = [];
  const vien = k.duong.vien.map((v, i): VienDuong => {
    if (v.vo || v.giu) {
      kq.push(null);
      return v;
    }
    if ((r[i] ?? 1) < tiLeDuong(k, v)) {
      kq.push('thanh');
      return { ...v, bac: v.bac + 1 };
    }
    const truot = v.truot + 1;
    if (truot > d.truotToiDa) {
      kq.push('vo');
      return { ...v, truot, vo: true };
    }
    kq.push('truot');
    return { ...v, truot, bac: Math.max(0, v.bac - d.tut) };
  });
  return { kho: { ...k, duong: { ...k.duong, vien } }, kq };
}

/** Giữ lại một viên (không bấm tiếp cho nó nữa) hoặc thả ra bấm tiếp. */
export function datGiuDuong(k: Kho, viTri: number): Kho {
  if (!k.duong) return k;
  return { ...k, duong: { ...k.duong, vien: k.duong.vien.map((v, i) => (i === viTri && !v.vo ? { ...v, giu: !v.giu } : v)) } };
}

/** Kết thúc dưỡng: cất các viên còn nguyên vào túi theo đúng số chuyển đang có. */
export function thuDuong(k: Kho): Kho {
  if (!k.duong) return k;
  const tuiDan = { ...k.tuiDan };
  const danVan = { ...k.danVan };
  const danChuyen = { ...k.danChuyen };
  // bản lưu của bản đầu tiên ghi id đan phương chung cho cả mẻ thay vì từng viên
  const idChung = (k.duong as { phuongId?: string }).phuongId;
  for (const v of k.duong.vien) {
    const id = v.phuongId ?? idChung;
    if (v.vo || !id || !tuiDan[id]) continue;
    if (v.bac > 0) danChuyen[khoaChuyen(id, v.loai, v.bac)] = (danChuyen[khoaChuyen(id, v.loai, v.bac)] ?? 0) + 1;
    else if (v.loai === 'dv') danVan[id] = (danVan[id] ?? 0) + 1;
    else {
      const t = [...tuiDan[id]] as [number, number, number, number];
      t[v.loai] += 1;
      tuiDan[id] = t;
    }
  }
  return { ...k, tuiDan, danVan, danChuyen, duong: null };
}

/** Các loại đan đã chuyển đang có trong túi, chuyển cao đứng trước. */
export function dsChuyen(k: Kho): { khoa: string; phuongId: string; loai: LoaiQuy; bac: number; co: number }[] {
  return Object.entries(k.danChuyen)
    .filter(([khoa, co]) => co > 0 && DAN_PHUONG.some((p) => khoa.startsWith(p.id + '|')))
    .map(([khoa, co]) => ({ khoa, co, ...docKhoaChuyen(khoa) }))
    .sort((a, b) => b.bac - a.bac || a.phuongId.localeCompare(b.phuongId));
}

/** Bán lẻ một số viên đan đã chuyển. */
export function banChuyen(k: Kho, khoa: string, soLuong: number): Kho {
  const n = Math.min(soLuong, k.danChuyen[khoa] ?? 0);
  if (n < 1) return k;
  const { phuongId, loai, bac } = docKhoaChuyen(khoa);
  return { ...k, linhThach: k.linhThach + n * giaChuyen(k, phuongId, loai, bac), danChuyen: { ...k.danChuyen, [khoa]: (k.danChuyen[khoa] ?? 0) - n } };
}

// ---------- đơn hàng tông môn ----------

/** Quay một đơn mới hợp với cảnh giới hiện tại: chỉ đặt đan của bậc đang đứng và bậc ngay dưới. */
function taoDon(k: Kho, rng: () => number, daCo: readonly string[]): Don {
  const cg = k.tuVi.canhGioi;
  const hop = DAN_PHUONG.filter((p) => bacSo(p) <= cg && bacSo(p) >= cg - 1);
  // tránh ba đơn cùng đòi một loại đan, trừ khi cảnh giới này chỉ có đúng loại đó
  const chuaCo = hop.filter((p) => !daCo.includes(p.id));
  const nguon = chuaCo.length ? chuaCo : hop;
  const p = nguon[Math.floor(rng() * nguon.length)] ?? DAN_PHUONG[0];
  const c = LUAT.don;
  let r = rng();
  let pham = 0;
  while (pham < 3 && r >= c.phamTiLe[pham]) {
    r -= c.phamTiLe[pham];
    pham += 1;
  }
  const [a, b] = c.soLuong[pham];
  // đan đột phá là của hiếm: tông môn chỉ đặt một hai viên
  const soLuong = Math.min(p.dotPha && p.dotPha > 1 ? 2 : 99, a + Math.floor(rng() * (b - a + 1)));
  const heSo = c.heSo[0] + rng() * (c.heSo[1] - c.heSo[0]);
  return {
    tongMon: TONG_MON[Math.floor(rng() * TONG_MON.length)].id,
    phuongId: p.id,
    pham: pham as PhamThat,
    soLuong,
    thuong: Math.max(1, Math.round(p.giaGoc * HE_SO_GIA[pham] * soLuong * heSo * loiThe(k.nhanVat).heSoBan)),
    danhVong: soLuong * (pham + 1) * (bacSo(p) + 1),
  };
}

/** Lấp đơn mới vào những chỗ trống đã hết thời gian chờ. Không có gì đổi thì trả lại đúng kho cũ. */
export function lamMoiDon(k: Kho, rng: () => number = Math.random, luc = Date.now()): Kho {
  if (!k.nhanVat) return k;
  let ds: (Don | null)[] | null = null;
  for (let i = 0; i < LUAT.don.soDon; i++) {
    if (k.donHang.ds[i] || (k.donHang.luc[i] ?? 0) > luc) continue;
    ds ??= Array.from({ length: LUAT.don.soDon }, (_, j) => k.donHang.ds[j] ?? null);
    ds[i] = taoDon(k, rng, ds.flatMap((d) => (d ? [d.phuongId] : [])));
  }
  return ds ? { ...k, donHang: { ...k.donHang, ds } } : k;
}

/** Số viên trong túi đủ phẩm để giao cho một đơn (đan văn tính là cực phẩm). */
export function soVienHopDon(k: Kho, d: Don): number {
  const t = k.tuiDan[d.phuongId];
  let n = k.danVan[d.phuongId] ?? 0;
  for (let ph = d.pham; ph <= 3; ph++) n += t[ph];
  return n;
}

function dongDon(k: Kho, viTri: number, luc: number): Kho['donHang'] {
  const ds = Array.from({ length: LUAT.don.soDon }, (_, j) => k.donHang.ds[j] ?? null);
  const lucMoi = Array.from({ length: LUAT.don.soDon }, (_, j) => k.donHang.luc[j] ?? 0);
  ds[viTri] = null;
  lucMoi[viTri] = luc + LUAT.don.choMoi * 1000;
  return { ds, luc: lucMoi };
}

/**
 * Những viên sẽ được lấy nếu giao đơn này ngay: số viên theo phẩm [hạ, trung, thượng, cực] và số viên đan văn.
 * Lấy viên phẩm thấp nhất còn đủ điều kiện trước, để giữ lại viên quý. Chưa đủ viên thì trả về null.
 */
export function vienSeGiao(k: Kho, d: Don): { pham: [number, number, number, number]; danVan: number } | null {
  if (soVienHopDon(k, d) < d.soLuong) return null;
  const t = k.tuiDan[d.phuongId];
  const pham: [number, number, number, number] = [0, 0, 0, 0];
  let con = d.soLuong;
  for (let ph = d.pham; ph <= 3 && con > 0; ph++) {
    pham[ph] = Math.min(con, t[ph]);
    con -= pham[ph];
  }
  return { pham, danVan: con };
}

/**
 * Tiền thưởng thật khi giao đơn lúc này. Mức ghi trên đơn (d.thuong) là cho toàn viên đúng phẩm tối thiểu;
 * viên nào phẩm cao hơn thì được trả theo đúng phẩm của nó, đan văn nhân thêm như lúc bán — nên giao viên quý không bao giờ thiệt.
 * Chưa đủ viên thì trả về mức ghi trên đơn.
 */
export function thuongDon(k: Kho, d: Don): number {
  const g = vienSeGiao(k, d);
  if (!g) return d.thuong;
  const moiVien = d.thuong / d.soLuong;
  let tong = (g.danVan * moiVien * HE_SO_GIA[3] * HE_SO_DAN_VAN) / HE_SO_GIA[d.pham];
  for (let ph = d.pham; ph <= 3; ph++) tong += (g.pham[ph] * moiVien * HE_SO_GIA[ph]) / HE_SO_GIA[d.pham];
  return Math.round(tong);
}

/** Giao một đơn. */
export function giaoDon(k: Kho, viTri: number, luc = Date.now()): Kho {
  const d = k.donHang.ds[viTri];
  const g = d ? vienSeGiao(k, d) : null;
  if (!d || !g) return k;
  const tui = [...k.tuiDan[d.phuongId]] as [number, number, number, number];
  for (let ph = 0; ph <= 3; ph++) tui[ph] -= g.pham[ph];
  return {
    ...k,
    linhThach: k.linhThach + thuongDon(k, d),
    tuiDan: { ...k.tuiDan, [d.phuongId]: tui },
    danVan: { ...k.danVan, [d.phuongId]: (k.danVan[d.phuongId] ?? 0) - g.danVan },
    danhVong: { ...k.danhVong, [d.tongMon]: (k.danhVong[d.tongMon] ?? 0) + d.danhVong },
    donHang: dongDon(k, viTri, luc),
  };
}

/** Từ chối một đơn: chỗ đó trống một lúc rồi mới có đơn khác. */
export function tuChoiDon(k: Kho, viTri: number, luc = Date.now()): Kho {
  return k.donHang.ds[viTri] ? { ...k, donHang: dongDon(k, viTri, luc) } : k;
}

// ---------- lò đan ----------

/** Giá mua một lò ở phường thị. */
export const giaLo = (id: string) => Math.round(timLoDan(id).gia * LUAT.cho.heSoGia);
export function muaLo(k: Kho, id: string): Kho {
  const lo = timLoDan(id);
  const gia = giaLo(id);
  if (lo.id !== id || k.loDan.co.includes(id) || k.linhThach < gia) return k;
  return { ...k, linhThach: k.linhThach - gia, loDan: { dung: id, co: [...k.loDan.co, id] } };
}
export function dungLo(k: Kho, id: string): Kho {
  return k.loDan.co.includes(id) ? { ...k, loDan: { ...k.loDan, dung: id } } : k;
}

// ---------- vườn dược ----------

/** Giai đoạn của một cây: 0 = mầm (chưa hái được), 1 = thuốc 10 năm, 2 = 100 năm, 3 = 1000 năm. */
export function giaiDoan(o: OVuon, luc = Date.now()): 0 | 1 | 2 | 3 {
  const giay = (luc - o.luc) / 1000;
  const m = LUAT.vuon.giay;
  return giay >= m[2] ? 3 : giay >= m[1] ? 2 : giay >= m[0] ? 1 : 0;
}
/** Còn bao nhiêu giây nữa cây lên giai đoạn kế (đã 1000 năm thì 0). */
export function giayToiGiaiDoanSau(o: OVuon, luc = Date.now()): number {
  const gd = giaiDoan(o, luc);
  const m: readonly number[] = LUAT.vuon.giay;
  return gd >= 3 ? 0 : Math.max(0, Math.ceil(m[gd] - (luc - o.luc) / 1000));
}
export function gieoHat(k: Kho, viTri: number, id: string, luc = Date.now()): Kho {
  if (viTri < 0 || viTri >= k.vuon.soO || k.vuon.o[viTri] || (k.hatGiong[id] ?? 0) < 1) return k;
  const o = Array.from({ length: k.vuon.soO }, (_, i) => k.vuon.o[i] ?? null);
  o[viTri] = { id, luc };
  return { ...k, hatGiong: { ...k.hatGiong, [id]: k.hatGiong[id] - 1 }, vuon: { ...k.vuon, o } };
}
/** Hái một ô: được thuốc đúng tuổi cây đang có. r là số ngẫu nhiên 0–1 quyết định có được thêm một phần không. */
export function thuHoach(k: Kho, viTri: number, r: number, luc = Date.now()): Kho {
  const cay = k.vuon.o[viTri];
  if (!cay) return k;
  const gd = giaiDoan(cay, luc);
  if (gd < 1) return k;
  const v = LUAT.vuon;
  const them = r < v.themTiLe + ((k.nhanVat?.khiVan ?? 50) - 50) * v.themKhiVan ? 1 : 0;
  const c = [...(k.duocLieu[cay.id] ?? [0, 0, 0])] as [number, number, number];
  c[gd - 1] += v.sanLuong + them;
  const o = [...k.vuon.o];
  o[viTri] = null;
  return { ...k, duocLieu: { ...k.duocLieu, [cay.id]: c }, vuon: { ...k.vuon, o } };
}
/** Giá mở thêm một ô; đã đủ số ô tối đa thì null. */
export const giaMoO = (k: Kho) => (k.vuon.soO >= LUAT.vuon.soOToiDa ? null : LUAT.vuon.giaO * LUAT.vuon.giaONhan ** (k.vuon.soO - LUAT.vuon.soODau));
export function moO(k: Kho): Kho {
  const gia = giaMoO(k);
  if (gia === null || k.linhThach < gia) return k;
  return { ...k, linhThach: k.linhThach - gia, vuon: { ...k.vuon, soO: k.vuon.soO + 1 } };
}

/** Sửa lò: thiếu tiền thì trả hết số đang có, để không bao giờ kẹt cứng. */
export function suaLo(k: Kho): Kho {
  return { ...k, loHu: false, linhThach: Math.max(0, k.linhThach - LUAT.giaSuaLo) };
}

/** Cạn túi: không còn đan để bán và không đủ tiền mua mẻ rẻ nhất. */
export function canTui(k: Kho): boolean {
  const conDan = DAN_PHUONG.some((p) => giaTriTui(k, p.id) > 0);
  return !conDan && k.linhThach < 15;
}

export function nhanTroCap(k: Kho): Kho {
  return canTui(k) ? { ...k, linhThach: k.linhThach + LUAT.troCap } : k;
}

// ---------- tu luyện ----------

/** Số tầng của một cảnh giới. */
export const soTang = (canhGioi: number) => (canhGioi === 0 ? LUAT.soTangPhamNhan : LUAT.soTang);
/** Điểm tu vi cần để vượt một tầng ở một cảnh giới. */
export function tuViCan(tang: number, canhGioi: number): number {
  const heSo =
    (canhGioi === 0 ? LUAT.heSoTuViPhamNhan : LUAT.heSoTuViMoiCanhGioi ** Math.max(0, canhGioi - 1)) * (canhGioi >= LUAT.tuViCaoCapTu ? LUAT.heSoTuViCaoCap : 1);
  return Math.round(tang * LUAT.tuViMoiTang * heSo);
}
/** Đã viên mãn tầng cuối chưa (phải dùng đan đột phá mới lên tiếp được). */
export const vienMan = (k: Kho) => k.tuVi.tang >= soTang(k.tuVi.canhGioi) && k.tuVi.diem >= tuViCan(k.tuVi.tang, k.tuVi.canhGioi);

/** Tu vi mỗi giây khi không có đan trợ lực (linh căn quyết định). */
export const tocDoGoc = (k: Kho, luc = Date.now()) =>
  LUAT.tuViMoiGiay * loiThe(k.nhanVat).tocDoTuLuyen * (1 + (k.tocDoCong ?? 0)) * (k.trung ? 1 + LUAT.qua.trung.tocDo : 1) * (dangTauHoa(k, luc) ? LUAT.daiDotPha.tauHoaHeSo : 1) *
  (1 + (k.linhThu?.length ? tacDungThu(k, luc).tuLuyen : 0));
/** Còn bao nhiêu giây tẩu hỏa (0 = không). */
export const giayTauHoa = (k: Kho, luc = Date.now()) => Math.max(0, Math.ceil(((k.tauHoa ?? 0) + LUAT.daiDotPha.tauHoaGiay * 1000 - luc) / 1000));
export const dangTauHoa = (k: Kho, luc = Date.now()) => (k.tauHoa ?? 0) > 0 && giayTauHoa(k, luc) > 0;
/** Tu vi mỗi giây ngay lúc này, đã tính phần tăng tốc nhờ đan. */
export const tocDoTuVi = (k: Kho) => tocDoGoc(k) * (1 + (k.tangToc.giay > 0 ? k.tangToc.nhan : 0));

/** Cộng tu vi theo số giây đã trôi qua, tự lên tầng khi đủ điểm, dừng ở viên mãn tầng cuối. */
export function tuLuyen(k: Kho, giay: number): Kho {
  if (!k.nhanVat || vienMan(k)) return k;
  const cg = k.tuVi.canhGioi;
  let { tang, diem } = k.tuVi;
  // phần tăng tốc nhờ đan chỉ tính cho số giây còn hiệu lực
  const giayNhanh = Math.min(giay, k.tangToc.giay);
  diem += (giay + giayNhanh * k.tangToc.nhan) * tocDoGoc(k);
  // bình cảnh trung kỳ: tới tầng LUAT.binhCanh.tang thì dừng, phải dùng đan cùng bậc mới qua (xem phaBinhCanh)
  const chan = (t: number) => t >= soTang(cg) || (cg >= LUAT.binhCanh.tuCanhGioi && t === LUAT.binhCanh.tang);
  while (!chan(tang) && diem >= tuViCan(tang, cg)) {
    diem -= tuViCan(tang, cg);
    tang += 1;
  }
  if (chan(tang)) diem = Math.min(diem, tuViCan(tang, cg));
  const conGiay = k.tangToc.giay - giayNhanh;
  const tangToc = giayNhanh > 0 ? { nhan: conGiay > 0 ? k.tangToc.nhan : 0, giay: conGiay } : k.tangToc;
  return { ...k, tuVi: { ...k.tuVi, tang, diem }, tangToc };
}

/** Lợi thế luyện đan của người chơi: bẩm sinh (thiên mệnh), cộng phần do cảnh giới mang lại, cộng tính chất của lò đang dùng. */
/** Phần phẩm cộng nhờ cảnh giới (bac = số cảnh giới trên Luyện Khí). */
const phamTheoCanhGioi = (bac: number) => {
  const c = LUAT.canhGioi;
  return c.pham * Math.min(bac, c.bacDayDu) + c.phamSau * Math.max(0, bac - c.bacDayDu);
};
/** Hệ số bán đan ở chợ: bẩm sinh × quà Luyện Thần Đan (đơn tông môn không nhân phần quà). */
export function heSoBanCho(k: Kho): number {
  const q = k.quaMoDau;
  const qua = q?.loai === 'luyen-than' ? (q.nhe ? LUAT.qua.luyenThan.banNhe : LUAT.qua.luyenThan.ban) : 1;
  return loiThe(k.nhanVat).heSoBan * qua;
}
export function loiTheKho(k: Kho): LoiThe {
  const goc = loiThe(k.nhanVat);
  const bac = Math.max(0, k.tuVi.canhGioi - 1);
  const lo = timLoDan(k.loDan.dung);
  const luyen = k.quaMoDau?.loai === 'luyen-than';
  return {
    ...goc,
    phamCong:
      goc.phamCong + phamTheoCanhGioi(bac) + (lo.phamCong ?? 0) + (luyen ? (k.quaMoDau!.nhe ? LUAT.qua.luyenThan.phamNhe : LUAT.qua.luyenThan.pham) : 0) + (k.linhThu?.length ? tacDungThu(k).pham : 0),
    rongVung: goc.rongVung + bac * LUAT.canhGioi.rongVung + (lo.rongVung ?? 0) + (luyen && !k.quaMoDau!.nhe ? LUAT.qua.luyenThan.rongVung : 0),
    heSoBan: heSoBanCho(k),
    heSoAp: goc.heSoAp * (lo.heSoAp ?? 1),
    xanh: goc.xanh + (lo.xanh ?? 0),
    heSoQuet: goc.heSoQuet * (lo.heSoQuet ?? 1),
    vuotKiep: Math.max(
      Math.min(goc.vuotKiep, LUAT.canhGioi.kiepToiThieu),
      Math.min(0.95, goc.vuotKiep + (lo.vuotKiep ?? 0) - LUAT.canhGioi.kiepMoiCanhGioi * Math.max(0, k.tuVi.canhGioi - LUAT.canhGioi.kiepTu)),
    ),
    soVien: goc.soVien + (lo.soVien ?? 0),
  };
}

// ---------- chỉ số nhân vật ----------

/** Hệ số bẩm sinh của từng chỉ số: thể chất cho điểm mạnh riêng, tư chất nâng thần thức, còn lại là căn cốt mỗi người một khác. */
function heSoBamSinh(k: Kho, cs: ChiSo): number {
  const nv = k.nhanVat;
  if (!nv) return 1;
  // căn cốt: lệch ±12% cố định theo tên nhân vật và chỉ số
  let hs = 0.88 + (bam(`${nv.ten}|${cs}`) % 2401) / 10000;
  if (cs === 'khiHuyet' && nv.theChat === 'thanh-moc') hs *= 1.25;
  if (cs === 'luc' && nv.theChat === 'hoa-linh') hs *= 1.25;
  if (cs === 'thanThuc' && nv.theChat === 'bang-tam') hs *= 1.25;
  if (nv.theChat === 'dan-the') hs *= cs === 'thanThuc' ? 1.2 : cs === 'khiHuyet' ? 1.1 : 1;
  if (cs === 'thanThuc') hs *= 0.9 + nv.tuChat / 500;
  return hs;
}
/** Phần gốc của một chỉ số, do cảnh giới, tầng và bẩm sinh quyết định. */
export function chiSoGoc(k: Kho, cs: ChiSo): number {
  const c = LUAT.chiSo;
  const goc = c.goc * c.moiCanhGioi ** k.tuVi.canhGioi * (1 + c.moiTang * (k.tuVi.tang - 1)) * heSoBamSinh(k, cs);
  return goc * (cs === 'khiHuyet' ? c.heSoMau : 1);
}
/** Phần được cộng nhờ uống đan. */
export const chiSoDan = (k: Kho, cs: ChiSo) => (k.chiSoCong[cs] ?? 0) * (cs === 'khiHuyet' ? LUAT.chiSo.heSoMau : 1);
/** Đang trong thời gian mất hồn (mọi chỉ số bị giảm). */
export const dangMatHon = (k: Kho, luc = Date.now()) => (k.matHon ?? 0) > 0 && !k.matHonNhe && luc - k.matHon < LUAT.kyNgo.matHon.yeuGiay * 1000;
/** Giá trị một chỉ số (làm tròn xuống). Đang mất hồn thì chỉ còn LUAT.kyNgo.matHon.heSo phần. */
export const chiSo = (k: Kho, cs: ChiSo, luc = Date.now()) =>
  Math.floor((chiSoGoc(k, cs) + chiSoDan(k, cs)) * (dangMatHon(k, luc) ? LUAT.kyNgo.matHon.heSo : 1) * heSoTrungDoc(docHienTai(k, luc)) * heSoChiSoQua(k) * heSoChiSoThu(k, cs, luc));
/** Linh thú xuất chiến cộng chỉ số: Ngân Nguyệt Lang -> Lực, Thân pháp; Bích Thủy Huyền Quy -> Khí huyết, Phòng ngự. */
function heSoChiSoThu(k: Kho, cs: ChiSo, luc: number): number {
  if (!k.linhThu?.length) return 1;
  const t = tacDungThu(k, luc);
  return 1 + (cs === 'luc' || cs === 'thanPhap' ? t.lucThan : cs === 'khiHuyet' || cs === 'phongNgu' ? t.mauPhong : 0);
}
/** Một thứ đang làm tăng / giảm chỉ số, để bảng thông tin nhân vật kể ra. */
export interface AnhHuong {
  ten: string;
  /** Vì sao (câu ngắn). */
  lyDo: string;
  /** Hệ số nhân vào từng chỉ số (không có = không ảnh hưởng chỉ số đó). */
  heSo: Partial<Record<ChiSo, number>>;
  giam: boolean;
  /** Còn bấy nhiêu giây thì hết (null = không tự hết, hoặc hết theo cách khác). */
  giay: number | null;
  /** Chỉ có tác dụng khi ở trong Vực Thẳm. */
  chiTrongVuc?: boolean;
}
const TAT_CA = (h: number): Partial<Record<ChiSo, number>> => ({ khiHuyet: h, luc: h, phongNgu: h, thanPhap: h, thanThuc: h });
/** Mọi thứ đang làm tăng / giảm chỉ số lúc này (cùng các hệ số mà chiSo() dùng). */
export function anhHuongChiSo(k: Kho, luc = Date.now()): AnhHuong[] {
  const ra: AnhHuong[] = [];
  if (dangMatHon(k, luc)) {
    const h = LUAT.kyNgo.matHon.heSo;
    ra.push({
      ten: 'Mất hồn',
      lyDo: 'Gục ngã khi du ngoạn, hồn phách chưa về nhập xác.',
      heSo: TAT_CA(h),
      giam: true,
      giay: Math.max(0, Math.ceil((k.matHon + LUAT.kyNgo.matHon.yeuGiay * 1000 - luc) / 1000)),
    });
  }
  const doc = docHienTai(k, luc);
  const hd = heSoTrungDoc(doc);
  if (hd < 1) {
    // độc tan dần: còn bao lâu thì xuống dưới ngưỡng
    const giay = Math.ceil((doc - LUAT.doc.day) * LUAT.doc.giayMoiDiem);
    ra.push({ ten: 'Trúng độc', lyDo: `Đan độc ${Math.round(doc)}/${LUAT.doc.day}: uống đan quá nhiều. Độc tự tan dần.`, heSo: TAT_CA(hd), giam: true, giay });
  }
  if ((k.vuc?.tt.yeu ?? 0) > 0) {
    ra.push({
      ten: 'Yếu đuối',
      lyDo: `Bị quái Vực Thẳm đánh trúng. Còn ${k.vuc.tt.yeu} bước.`,
      heSo: { luc: 0.7, thanThuc: 0.7 },
      giam: true,
      giay: null,
      chiTrongVuc: true,
    });
  }
  const qua = heSoChiSoQua(k);
  if (qua > 1) ra.push({ ten: 'Lệ Thần Đan', lyDo: 'Quà của Đan Lão đã dung hợp vào thân.', heSo: TAT_CA(qua), giam: false, giay: null });
  if (k.linhThu?.length) {
    const t = tacDungThu(k, luc);
    const heSo: Partial<Record<ChiSo, number>> = {};
    if (t.lucThan > 0) heSo.luc = heSo.thanPhap = 1 + t.lucThan;
    if (t.mauPhong > 0) heSo.khiHuyet = heSo.phongNgu = 1 + t.mauPhong;
    if (Object.keys(heSo).length) ra.push({ ten: 'Linh thú xuất chiến', lyDo: 'Linh thú đi theo trợ lực.', heSo, giam: false, giay: null });
  }
  return ra;
}
/** Chỉ số khi chưa bị điều gì làm giảm (để bảng thông tin tính phần bị trừ). */
export const chiSoChuaGiam = (k: Kho, cs: ChiSo, luc = Date.now()) => Math.floor((chiSoGoc(k, cs) + chiSoDan(k, cs)) * heSoChiSoQua(k) * heSoChiSoThu(k, cs, luc));
/** Lệ Thần Đan: mọi chỉ số nhân thêm. */
export const heSoChiSoQua = (k: Kho) => (k.quaMoDau?.loai === 'le-than' ? (k.quaMoDau.nhe ? LUAT.qua.leThan.chiSoNhe : LUAT.qua.leThan.chiSo) : 1);
/** Lệ Thần Đan bản đầy đủ: thân thể thần linh. */
export const coLeThanDay = (k: Kho) => k.quaMoDau?.loai === 'le-than' && !k.quaMoDau.nhe;
/** Đan độc quá ngưỡng thì mọi chỉ số chỉ còn bấy nhiêu phần (1 = chưa trúng độc). */
export function heSoTrungDoc(doc: number): number {
  const qua = doc - LUAT.doc.day;
  return qua > 0 ? Math.max(LUAT.doc.heSoToiThieu, 1 - qua * LUAT.doc.giamMoiDiem) : 1;
}

/** Uống `soLuong` viên thì mỗi chỉ số được cộng bao nhiêu (đơn vị thô, chưa nhân heSoMau), đã tính nhờn thuốc. */
function chiSoKhiUong(k: Kho, p: DanPhuong, loai: PhamThat | 'dv', soLuong: number): Partial<Record<ChiSo, number>> {
  if (!p.chiSo) return {};
  const c = LUAT.chiSo;
  const da = k.daUong[p.id] ?? 0;
  let heSo = 0;
  for (let i = 0; i < soLuong; i++) heSo += 1 / (1 + (da + i) / c.khangDuoc);
  heSo *= c.heSoPham[loai === 'dv' ? 4 : loai];
  const ra: Partial<Record<ChiSo, number>> = {};
  for (const cs of CHI_SO) if (p.chiSo[cs.id]) ra[cs.id] = p.chiSo[cs.id]! * heSo;
  return ra;
}

export const mauToiDa = (k: Kho) => chiSo(k, 'khiHuyet');
/** Máu lúc này (đã cộng phần tự hồi theo thời gian). */
export function mauHienTai(k: Kho, luc = Date.now()): number {
  const toiDa = mauToiDa(k);
  // trong Vực Thẳm máu không tự hồi (phải dùng đan hoặc tìm chỗ nghỉ)
  const hoi = k.vuc?.trong ? 0 : LUAT.chiSo.hoiMau * (coLeThanDay(k) ? LUAT.qua.leThan.hoiMau : 1);
  const thieu = Math.max(0, k.mau.thieu - (Math.max(0, luc - k.mau.luc) / 1000) * hoi * toiDa);
  return Math.max(0, Math.round(toiDa - thieu));
}

// ---------- uống đan ----------

/** Lượng đan độc đang có trong người lúc này (đã trừ phần tự tan theo thời gian). */
export function docHienTai(k: Kho, luc = Date.now()): number {
  return Math.max(0, k.doc.diem - Math.max(0, luc - k.doc.luc) / 1000 / LUAT.doc.giayMoiDiem);
}
/** Chỉ số phẩm trong các bảng năm mức [hạ, trung, thượng, cực, đan văn]. */
const mucPham = (loai: PhamThat | 'dv') => (loai === 'dv' ? 4 : loai);
/** Độc tố của một viên đan. */
export const docMoiVien = (p: DanPhuong, loai: PhamThat | 'dv') => LUAT.doc.moiVien[mucPham(loai)] * (p.uong?.doc ?? 1);

export interface XemUong {
  /** Uống được không; không thì `lyDo` nói vì sao. */
  duoc: boolean;
  lyDo?: string;
  /** Độc tố sẽ cộng thêm và mức sau khi uống. */
  docThem: number;
  docSau: number;
  /** Câu tả tác dụng của đúng số viên đang chọn. */
  moTa: string;
}

/** Xem trước việc uống `soLuong` viên: độc tố tăng bao nhiêu, được gì, có uống nổi không. Không đổi gì trong kho. */
export function xemUong(k: Kho, phuongId: string, loai: PhamThat | 'dv', soLuong: number, luc = Date.now()): XemUong {
  const p = timDanPhuong(phuongId);
  const td = p.uong;
  const docThem = docMoiVien(p, loai) * soLuong;
  const docSau = docHienTai(k, luc) + docThem;
  if (!td) return { duoc: false, lyDo: p.dotPha ? 'Đan đột phá, dùng ở nút Đột phá' : 'Đan này không uống được', docThem: 0, docSau: docHienTai(k, luc), moTa: '' };
  const v = td.giaTri[mucPham(loai)];
  const co = loai === 'dv' ? k.danVan[phuongId] ?? 0 : k.tuiDan[phuongId][loai];
  let moTa = '';
  let lyDo: string | undefined;
  if (td.loai === 'tang-toc') {
    const giay = (td.giay ?? 60) * soLuong;
    moTa = `Tu vi mỗi giây +${Math.round(v * 100)}% trong ${Math.floor(giay / 60)} phút${giay % 60 ? ` ${giay % 60} giây` : ''}`;
    if (vienMan(k)) lyDo = 'Đã viên mãn, uống cũng không thêm tu vi';
  } else if (td.loai === 'tu-vi') {
    const cg = k.tuVi.canhGioi;
    moTa = `Lập tức +${Math.round(tuViCan(k.tuVi.tang, cg) * v * soLuong)} tu vi`;
    if (vienMan(k)) lyDo = 'Đã viên mãn, uống cũng không thêm tu vi';
  } else if (td.loai === 'tu-chat') {
    const tc = k.nhanVat?.tuChat ?? 0;
    moTa = `Tư chất +${Math.min(100 - tc, v * soLuong)} vĩnh viễn (đang ${tc}/100)`;
    if (tc >= 100) lyDo = 'Tư chất đã tới đỉnh';
  } else if (td.loai === 'hoi-mau') {
    const toiDa = mauToiDa(k);
    const thieu = toiDa - mauHienTai(k, luc);
    moTa = thieu > 0 ? `Hồi ${Math.min(thieu, Math.round(toiDa * Math.min(1, v * soLuong)))} máu` : 'Máu đang đầy';
  } else if (td.loai === 'ho-dao') {
    moTa = 'Hộ đạo cho lần đột phá tới: thất bại vẫn giữ một nửa số đan, không hao tu vi';
    if (k.hoDao) lyDo = 'Đã được hộ đạo, đợi lần đột phá tới';
    else if (soLuong > 1) lyDo = 'Mỗi lần chỉ cần một viên';
  } else {
    const con = LUAT.dotPha.congToiDa - k.congDotPha;
    moTa = `Lần đột phá tới +${Math.round(Math.min(con, v * soLuong) * 100)}% thành công (đang +${Math.round(k.congDotPha * 100)}%, tối đa +${Math.round(LUAT.dotPha.congToiDa * 100)}%)`;
    if (con <= 0.0001) lyDo = 'Tâm đã tĩnh hết mức, uống thêm vô ích';
  }
  // phần chỉ số được cộng thêm, ghi nối vào sau tác dụng chính
  const them = chiSoKhiUong(k, p, loai, soLuong);
  const chuChiSo = CHI_SO.filter((cs) => them[cs.id])
    .map((cs) => `${cs.ten} +${(them[cs.id]! * (cs.id === 'khiHuyet' ? LUAT.chiSo.heSoMau : 1)).toFixed(1)}`)
    .join(', ');
  if (chuChiSo) moTa += ` · ${chuChiSo}`;
  if (co < soLuong) lyDo = 'Không đủ viên';
  // quá ngưỡng vẫn uống được, nhưng báo trước sẽ trúng độc
  if (docSau > LUAT.doc.day + 0.0001) moTa += ` · Trúng độc: chỉ số còn ${Math.round(heSoTrungDoc(docSau) * 100)}%`;
  return { duoc: !lyDo, lyDo, docThem, docSau, moTa };
}

/** Uống `soLuong` viên. Không uống được (xem xemUong) thì trả lại đúng kho cũ. */
export function uongDan(k: Kho, phuongId: string, loai: PhamThat | 'dv', soLuong: number, luc = Date.now()): Kho {
  const xem = xemUong(k, phuongId, loai, soLuong, luc);
  const p = timDanPhuong(phuongId);
  const td = p.uong;
  if (!xem.duoc || !td || !k.nhanVat) return k;
  const v = td.giaTri[mucPham(loai)];
  const them = chiSoKhiUong(k, p, loai, soLuong);
  const chiSoCong = { ...k.chiSoCong };
  for (const cs of CHI_SO) if (them[cs.id]) chiSoCong[cs.id] = (chiSoCong[cs.id] ?? 0) + them[cs.id]!;
  // máu tối đa có thể vừa tăng: chốt lượng máu đang thiếu theo mốc hiện tại trước khi đổi
  const thieuNay = mauToiDa(k) - mauHienTai(k, luc);
  let moi: Kho = {
    ...k,
    doc: { diem: xem.docSau, luc },
    // vừa vượt ngưỡng độc: hiện thẻ trúng độc
    thongBao: docHienTai(k, luc) <= LUAT.doc.day && xem.docSau > LUAT.doc.day ? { loai: 'trung-doc', luc } : k.thongBao,
    chiSoCong,
    daUong: { ...k.daUong, [phuongId]: (k.daUong[phuongId] ?? 0) + soLuong },
    mau: { thieu: thieuNay, luc },
  };
  if (loai === 'dv') moi.danVan = { ...k.danVan, [phuongId]: (k.danVan[phuongId] ?? 0) - soLuong };
  else {
    const tui = [...k.tuiDan[phuongId]] as [number, number, number, number];
    tui[loai] -= soLuong;
    moi.tuiDan = { ...k.tuiDan, [phuongId]: tui };
  }
  if (td.loai === 'tang-toc') {
    // thời gian nối dài; mức tăng lấy theo viên mạnh nhất còn hiệu lực
    const dangCo = k.tangToc.giay > 0 ? k.tangToc.nhan : 0;
    moi.tangToc = { nhan: Math.max(dangCo, v), giay: Math.max(0, k.tangToc.giay) + (td.giay ?? 60) * soLuong };
  } else if (td.loai === 'tu-vi') {
    // cộng thẳng tu vi rồi để tuLuyen lo việc lên tầng (0 giây = không cộng gì thêm)
    const them = tuViCan(k.tuVi.tang, k.tuVi.canhGioi) * v * soLuong;
    moi = tuLuyen({ ...moi, tuVi: { ...moi.tuVi, diem: moi.tuVi.diem + them } }, 0);
  } else if (td.loai === 'tu-chat') {
    moi.nhanVat = { ...k.nhanVat, tuChat: Math.min(100, k.nhanVat.tuChat + v * soLuong) };
  } else if (td.loai === 'hoi-mau') {
    moi.mau = { thieu: Math.max(0, thieuNay - mauToiDa(k) * Math.min(1, v * soLuong)), luc };
  } else if (td.loai === 'ho-dao') {
    moi.hoDao = true;
  } else {
    moi.congDotPha = Math.min(LUAT.dotPha.congToiDa, k.congDotPha + v * soLuong);
  }
  return moi;
}

// ---------- uống đan đã dưỡng ----------

/** Dược lực của một viên đã chuyển so với viên thường cùng phẩm. */
export const duocLucChuyen = (loai: LoaiQuy, bac: number) => heSoChuyen(bac) * (loai === 'dv' ? LUAT.duong.duocLucDanVan : 1);
/** Uống một viên đã chuyển thì tốc độ tu luyện được cộng vĩnh viễn bao nhiêu (đã tính trần). */
function tocDoKhiUong(k: Kho, loai: LoaiQuy, bac: number): number {
  const d = LUAT.duong;
  return Math.max(0, Math.min(d.tocDoToiDa - (k.tocDoCong ?? 0), d.tocDo * bac * (loai === 'dv' ? d.duocLucDanVan : 1)));
}
/** Kho giả có thêm đúng một viên thường cùng loại, để mượn lại phần tính tác dụng chính của xemUong / uongDan. */
function themMotVien(k: Kho, phuongId: string, loai: LoaiQuy): Kho {
  if (loai === 'dv') return { ...k, danVan: { ...k.danVan, [phuongId]: (k.danVan[phuongId] ?? 0) + 1 } };
  const t = [...k.tuiDan[phuongId]] as [number, number, number, number];
  t[loai] += 1;
  return { ...k, tuiDan: { ...k.tuiDan, [phuongId]: t } };
}

export interface XemUongChuyen extends XemUong {
  /** Tác dụng chính của viên đan (tăng tốc, hồi máu…) có dùng được lúc này không; không thì vẫn uống được để lấy chỉ số. */
  coTacDungChinh: boolean;
}

/** Xem trước việc uống một viên đã chuyển (khoá của danChuyen). */
export function xemUongChuyen(k: Kho, khoa: string, luc = Date.now()): XemUongChuyen {
  const { phuongId, loai, bac } = docKhoaChuyen(khoa);
  const p = timDanPhuong(phuongId);
  const docNay = docHienTai(k, luc);
  if (!p?.uong) return { duoc: false, coTacDungChinh: false, lyDo: p?.dotPha ? 'Đan đột phá, dùng ở nút Đột phá' : 'Đan này không uống được', docThem: 0, docSau: docNay, moTa: '' };
  const goc = xemUong(themMotVien(k, phuongId, loai), phuongId, loai, 1, luc);
  const hs = duocLucChuyen(loai, bac);
  const them = chiSoKhiUong(k, p, loai, 1);
  const phan: string[] = [];
  const chuChiSo = CHI_SO.filter((cs) => them[cs.id])
    .map((cs) => `${cs.ten} +${(them[cs.id]! * hs * (cs.id === 'khiHuyet' ? LUAT.chiSo.heSoMau : 1)).toFixed(1)}`)
    .join(', ');
  if (chuChiSo) phan.push(chuChiSo);
  const tocDo = tocDoKhiUong(k, loai, bac);
  if (tocDo > 0) phan.push(`Tốc độ tu luyện +${(tocDo * 100).toFixed(1)}% vĩnh viễn`);
  if (goc.duoc) phan.push(goc.moTa.split(' · ')[0]);
  let lyDo: string | undefined;
  if ((k.danChuyen[khoa] ?? 0) < 1) lyDo = 'Không đủ viên';
  if (goc.docSau > LUAT.doc.day + 0.0001) phan.push(`Trúng độc: chỉ số còn ${Math.round(heSoTrungDoc(goc.docSau) * 100)}%`);
  return { duoc: !lyDo, coTacDungChinh: goc.duoc, lyDo, docThem: goc.docThem, docSau: goc.docSau, moTa: phan.join(' · ') };
}

/** Uống một viên đã chuyển: được tác dụng của viên thường cùng phẩm, chỉ số nhân theo dược lực, và tốc độ tu luyện tăng vĩnh viễn. */
export function uongChuyen(k: Kho, khoa: string, luc = Date.now()): Kho {
  const xem = xemUongChuyen(k, khoa, luc);
  if (!xem.duoc || !k.nhanVat) return k;
  const { phuongId, loai, bac } = docKhoaChuyen(khoa);
  const p = timDanPhuong(phuongId);
  const hs = duocLucChuyen(loai, bac);
  const them = chiSoKhiUong(k, p, loai, 1);
  const tocDo = tocDoKhiUong(k, loai, bac);
  let moi: Kho;
  // phần chỉ số mà bước dưới đã cộng sẵn (uongDan cộng đúng một lần phần gốc)
  let daCong = 0;
  if (xem.coTacDungChinh) {
    moi = uongDan(themMotVien(k, phuongId, loai), phuongId, loai, 1, luc);
    daCong = 1;
  } else {
    // tác dụng chính đang vô ích (đã viên mãn, tư chất đã đỉnh…): vẫn nhận độc và chỉ số
    const thieuNay = mauToiDa(k) - mauHienTai(k, luc);
    moi = { ...k, doc: { diem: xem.docSau, luc }, daUong: { ...k.daUong, [phuongId]: (k.daUong[phuongId] ?? 0) + 1 }, mau: { thieu: thieuNay, luc } };
  }
  const chiSoCong = { ...moi.chiSoCong };
  for (const cs of CHI_SO) if (them[cs.id]) chiSoCong[cs.id] = (chiSoCong[cs.id] ?? 0) + them[cs.id]! * (hs - daCong);
  const danChuyen = { ...moi.danChuyen };
  if ((danChuyen[khoa] ?? 0) <= 1) delete danChuyen[khoa];
  else danChuyen[khoa] -= 1;
  return { ...moi, chiSoCong, danChuyen, tocDoCong: (k.tocDoCong ?? 0) + tocDo };
}

// ---------- đột phá ----------

/** Đan đột phá mà cảnh giới hiện tại cần; đã ở đỉnh (Tiên Đế) thì không có. */
export const danDotPha = (k: Kho): DanPhuong | null =>
  k.tuVi.canhGioi + 1 < CANH_GIOI.length ? DAN_PHUONG.find((p) => p.dotPha === k.tuVi.canhGioi + 1) ?? null : null;

/** Tỉ lệ đột phá thành công nếu dùng một viên phẩm này. */
export function tiLeDotPha(k: Kho, pham: PhamThat, danVan: boolean, congChuyen = 0): number {
  if (danVan) return 1;
  const kv = ((k.nhanVat?.khiVan ?? 50) - 50) * LUAT.dotPha.khiVan;
  const dich = k.tuVi.canhGioi + 1;
  const giam = dich >= LUAT.daiDotPha.tu ? LUAT.daiDotPha.giamMoiCanhGioi * (dich - 2) : 0;
  return Math.min(0.99, Math.max(0.05, LUAT.dotPha.tiLe[pham] + kv + k.congDotPha - giam + congChuyen + (k.linhThu?.length ? tacDungThu(k).dotPha : 0)));
}

// ---------- đột phá đại cảnh giới ----------

const oBang = <T,>(bang: readonly T[], i: number) => bang[Math.max(0, Math.min(bang.length - 1, i))];
/** Điều kiện của lần đột phá kế tiếp. `dai` = theo luật đại cảnh giới (Kim Đan trở lên). */
export function yeuCauDotPha(k: Kho) {
  const p = danDotPha(k);
  const dich = k.tuVi.canhGioi + 1;
  const c = LUAT.daiDotPha;
  const dai = dich >= c.tu;
  const i = dich - c.tu;
  return {
    p,
    dich,
    dai,
    soVien: dai ? oBang(c.soVien, i) : 1,
    phamToiThieu: (dai ? oBang(c.phamToiThieu, i) : 0) as PhamThat,
    danDuoc: dai ? [...(DAN_DUOC_DOT_PHA[dich] ?? [])] : [],
    /** Vật phẩm Vực Thẳm phải nộp (từ Hóa Thần trở lên). */
    vatVuc: vatCanDotPha(dich),
    phi: dai ? Math.round(c.phiGoc * c.phiNhan ** i) : 0,
  };
}
/** Các viên (theo phẩm) dùng được cho lần đột phá tới: viên đã dưỡng đứng trước (chuyển cao trước), rồi viên thường. */
function vienDotPha(k: Kho, id: string, loai: PhamThat | 'dv'): { khoa: string | null; bac: number; co: number }[] {
  const ra: { khoa: string | null; bac: number; co: number }[] = [];
  for (const c of dsChuyen(k)) if (c.phuongId === id && c.loai === loai) ra.push({ khoa: c.khoa, bac: c.bac, co: c.co });
  ra.sort((a, b) => b.bac - a.bac);
  const thuong = loai === 'dv' ? (k.danVan[id] ?? 0) : (k.tuiDan[id]?.[loai] ?? 0);
  if (thuong > 0) ra.push({ khoa: null, bac: 0, co: thuong });
  return ra;
}
/** Chọn đúng `n` viên một phẩm: trả về tổng số chuyển cộng thêm (viên đã dưỡng được ưu tiên), hoặc null nếu không đủ. */
function chonVien(k: Kho, id: string, loai: PhamThat | 'dv', n: number): { chuyen: number; lay: { khoa: string | null; so: number }[] } | null {
  let con = n;
  let chuyen = 0;
  const lay: { khoa: string | null; so: number }[] = [];
  for (const v of vienDotPha(k, id, loai)) {
    if (con <= 0) break;
    const so = Math.min(con, v.co);
    lay.push({ khoa: v.khoa, so });
    chuyen += so * v.bac;
    con -= so;
  }
  return con > 0 ? null : { chuyen, lay };
}
/** Các lựa chọn phẩm cho bảng đột phá: phẩm nào đủ số viên, tỉ lệ thành bao nhiêu. */
export function luaChonDotPha(k: Kho) {
  const yc = yeuCauDotPha(k);
  if (!yc.p) return [];
  const ra: { loai: PhamThat | 'dv'; co: number; du: boolean; tiLe: number; chuyen: number }[] = [];
  for (const loai of ['dv', 3, 2, 1, 0] as (PhamThat | 'dv')[]) {
    if (loai !== 'dv' && loai < yc.phamToiThieu) continue;
    const co = vienDotPha(k, yc.p.id, loai).reduce((s, v) => s + v.co, 0);
    if (co < 1) continue;
    const chon = chonVien(k, yc.p.id, loai, yc.soVien);
    const chuyen = chon?.chuyen ?? 0;
    ra.push({ loai, co, du: !!chon, chuyen, tiLe: tiLeDotPha(k, loai === 'dv' ? 3 : loai, loai === 'dv', chuyen * LUAT.daiDotPha.moiChuyen) });
  }
  return ra;
}
/** Thiếu gì để đột phá (ngoài đan): dẫn dược, linh thạch. Rỗng = đủ. */
export function thieuDotPha(k: Kho): string[] {
  const yc = yeuCauDotPha(k);
  const ra: string[] = [];
  for (const id of yc.danDuoc) if ((k.danDuoc[id] ?? 0) < 1) ra.push(timDanDuoc(id).ten);
  for (const [id, n] of yc.vatVuc) if ((k.vatVuc?.[id] ?? 0) < n) ra.push(`${n - (k.vatVuc?.[id] ?? 0)} ${timVatVuc(id).ten}`);
  if (k.linhThach < yc.phi) ra.push(`${yc.phi - k.linhThach} linh thạch`);
  return ra;
}
/** Giá một phần dẫn dược (danh vọng của tông môn đó) theo cảnh giới đột phá kế tiếp. */
export const giaDanDuoc = (k: Kho) => LUAT.daiDotPha.giaDanhVong * Math.max(LUAT.daiDotPha.tu, k.tuVi.canhGioi + 1);
/** Đổi danh vọng lấy một phần dẫn dược ở Tàng Bảo Các. */
export function doiDanDuoc(k: Kho, id: string): Kho {
  const d = timDanDuoc(id);
  const gia = giaDanDuoc(k);
  if (d.id !== id || (k.danhVong[d.tongMon] ?? 0) < gia) return k;
  return { ...k, danhVong: { ...k.danhVong, [d.tongMon]: k.danhVong[d.tongMon] - gia }, danDuoc: { ...k.danDuoc, [id]: (k.danDuoc[id] ?? 0) + 1 } };
}

/**
 * Dùng một viên đan đột phá. r là số ngẫu nhiên 0–1 do nơi gọi quay sẵn (để giao diện biết trước kết quả mà dựng hiệu ứng).
 * Thành công: lên cảnh giới mới, tầng 1. Thất bại: mất viên đan, hao một phần tu vi của tầng hiện tại.
 * Không đủ điều kiện (chưa viên mãn, không có viên đó) thì trả về null.
 */
export function dotPha(k: Kho, pham: PhamThat, danVan: boolean, r: number, luc = Date.now()): { kho: Kho; thanh: boolean; giuLai: number; hoDao: boolean } | null {
  const yc = yeuCauDotPha(k);
  const p = yc.p;
  if (!p || !vienMan(k)) return null;
  const loai: PhamThat | 'dv' = danVan ? 'dv' : pham;
  if (loai !== 'dv' && loai < yc.phamToiThieu) return null;
  if (thieuDotPha(k).length) return null;
  const chon = chonVien(k, p.id, loai, yc.soVien);
  if (!chon) return null;
  // tiêu hao: đan (viên đã dưỡng trước), dẫn dược, phí lập trận
  const tui = [...k.tuiDan[p.id]] as [number, number, number, number];
  let dv = k.danVan[p.id] ?? 0;
  const danChuyen = { ...k.danChuyen };
  for (const l of chon.lay) {
    if (l.khoa) {
      danChuyen[l.khoa] = (danChuyen[l.khoa] ?? 0) - l.so;
      if (danChuyen[l.khoa] <= 0) delete danChuyen[l.khoa];
    } else if (loai === 'dv') dv -= l.so;
    else tui[loai] -= l.so;
  }
  const danDuoc = { ...k.danDuoc };
  for (const id of yc.danDuoc) danDuoc[id] = (danDuoc[id] ?? 0) - 1;
  const vatVuc = { ...k.vatVuc };
  for (const [id, n] of yc.vatVuc) vatVuc[id] = (vatVuc[id] ?? 0) - n;
  const thanh = r < tiLeDotPha(k, loai === 'dv' ? 3 : loai, loai === 'dv', chon.chuyen * LUAT.daiDotPha.moiChuyen);
  let tuVi = k.tuVi;
  let giuLai = 0;
  let tauHoa = k.tauHoa ?? 0;
  let thongBao = k.thongBao;
  if (thanh) tuVi = { canhGioi: k.tuVi.canhGioi + 1, tang: 1, diem: 0 };
  else {
    const c = LUAT.daiDotPha;
    if (k.hoDao) {
      // hộ đạo: trả lại một nửa số đan (viên thường cùng phẩm), không hao tu vi
      giuLai = Math.ceil(yc.soVien / 2);
      if (loai === 'dv') dv += giuLai;
      else tui[loai] += giuLai;
    } else {
      const mat = yc.dai ? Math.min(c.matTuViToiDa, LUAT.dotPha.matTuVi + c.matTuViThem * (yc.dich - c.tu)) : LUAT.dotPha.matTuVi;
      tuVi = { ...k.tuVi, diem: Math.floor(k.tuVi.diem * (1 - mat)) };
    }
    if (yc.dai) {
      tauHoa = luc;
      thongBao = { loai: 'tau-hoa', luc };
    }
  }
  return {
    thanh,
    giuLai,
    hoDao: !thanh && k.hoDao,
    kho: {
      ...k,
      tuVi,
      linhThach: k.linhThach - yc.phi,
      congDotPha: 0,
      hoDao: false,
      tauHoa,
      thongBao,
      tuiDan: { ...k.tuiDan, [p.id]: tui },
      danVan: { ...k.danVan, [p.id]: dv },
      danChuyen,
      danDuoc,
      vatVuc,
    },
  };
}

/** Số mẻ đan phương đứng trước (cùng bậc) phải luyện thành thì mới mở đan phương kế tiếp. */
export const ME_DE_MO_KHOA = 3;
/**
 * Vì sao đan phương thứ `i` (trong DAN_PHUONG) còn khoá; null = đã mở. Phải đạt cảnh giới của bậc đó,
 * và trong cùng một bậc thì phải luyện thành vài mẻ đan đứng trước.
 */
export function lyDoKhoaPhuong(k: Kho, i: number): string | null {
  const p = DAN_PHUONG[i];
  if (k.tuVi.canhGioi < bacSo(p)) return `Cần đạt ${p.bac}`;
  const truoc = DAN_PHUONG[i - 1];
  if (truoc && truoc.bac === p.bac && (k.thongThao[truoc.id] ?? 0) < ME_DE_MO_KHOA) return `Cần ${ME_DE_MO_KHOA} mẻ ${truoc.ten}`;
  return null;
}

// ---------- bình cảnh trung kỳ ----------

/** Đang kẹt bình cảnh trung kỳ (tu vi đầy tầng LUAT.binhCanh.tang, chưa phá). */
export const dangBinhCanh = (k: Kho) =>
  k.tuVi.canhGioi >= LUAT.binhCanh.tuCanhGioi && k.tuVi.tang === LUAT.binhCanh.tang && k.tuVi.diem >= tuViCan(k.tuVi.tang, k.tuVi.canhGioi);
/** Tỉ lệ phá bình cảnh bằng một viên phẩm `loai`. */
export function tiLeBinhCanh(k: Kho, loai: PhamThat | 'dv'): number {
  if (loai === 'dv') return 1;
  const c = LUAT.binhCanh;
  const kv = ((k.nhanVat?.khiVan ?? 50) - 50) * LUAT.dotPha.khiVan;
  return Math.min(0.99, Math.max(c.toiThieu, c.tiLe[loai] - c.giamMoiCanhGioi * Math.max(0, k.tuVi.canhGioi - 1) + kv + (k.linhThu?.length ? tacDungThu(k).dotPha : 0)));
}
/** Các viên dùng được để phá bình cảnh: mọi đan phương cùng bậc với cảnh giới đang tu, theo phẩm (cao trước). */
export function danBinhCanh(k: Kho): { id: string; loai: PhamThat | 'dv'; co: number }[] {
  const ra: { id: string; loai: PhamThat | 'dv'; co: number }[] = [];
  for (const p of DAN_PHUONG) {
    if (bacSo(p) !== k.tuVi.canhGioi) continue;
    if ((k.danVan[p.id] ?? 0) > 0) ra.push({ id: p.id, loai: 'dv', co: k.danVan[p.id] });
    for (const ph of [3, 2, 1, 0] as PhamThat[]) if ((k.tuiDan[p.id]?.[ph] ?? 0) > 0) ra.push({ id: p.id, loai: ph, co: k.tuiDan[p.id][ph] });
  }
  return ra;
}
/** Dùng một viên để phá bình cảnh. Thành: lên tầng kế (tu vi về 0). Bại: mất viên đan, hao một phần tu vi của tầng. */
export function phaBinhCanh(k: Kho, id: string, loai: PhamThat | 'dv', r: number): { kho: Kho; thanh: boolean } | null {
  if (!dangBinhCanh(k)) return null;
  const p = timDanPhuong(id);
  if (bacSo(p) !== k.tuVi.canhGioi) return null;
  let kho: Kho;
  if (loai === 'dv') {
    if ((k.danVan[id] ?? 0) < 1) return null;
    kho = { ...k, danVan: { ...k.danVan, [id]: k.danVan[id] - 1 } };
  } else {
    if ((k.tuiDan[id]?.[loai] ?? 0) < 1) return null;
    const t = [...k.tuiDan[id]] as [number, number, number, number];
    t[loai] -= 1;
    kho = { ...k, tuiDan: { ...k.tuiDan, [id]: t } };
  }
  const thanh = r < tiLeBinhCanh(k, loai);
  const tuVi = thanh ? { ...k.tuVi, tang: k.tuVi.tang + 1, diem: 0 } : { ...k.tuVi, diem: Math.floor(k.tuVi.diem * (1 - LUAT.binhCanh.matTuVi)) };
  return { kho: { ...kho, tuVi }, thanh };
}
