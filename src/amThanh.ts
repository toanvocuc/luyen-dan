// Âm thanh của game: nhạc nền theo màn, tiếng nút bấm, tiếng luyện đan.
// File gốc nằm ở Am_thanh/ (chép sang public/am/ khi chạy `npm run xu-ly-anh`).
// Mọi thứ đi qua Web Audio để chỉnh được âm lượng trên cả iPhone (ở đó thuộc tính volume của thẻ audio không có tác dụng).
//
// Trình duyệt chỉ cho phát tiếng sau khi người chơi chạm màn hình lần đầu, nên nhạc bắt đầu từ cú chạm đó.

/**
 * Số đo của từng file (đo bằng trình duyệt, xem ghi chú cuối file):
 * dau = khoảng lặng đầu file cần bỏ qua (giây), dai = chỉ phát bấy nhiêu giây (bỏ đuôi lặng), am = hệ số âm lượng để các tiếng to đều nhau.
 */
const TIENG = {
  'nut-bam': { dau: 0.02, dai: 0.2, am: 0.32 },
  'mo-bang': { dau: 0.03, dai: 0.5, am: 0.7 },
  'dong-bang': { dau: 0.29, dai: 0.5, am: 0.3 },
  'toi-trung': { dau: 0.18, dai: 1.6, am: 1.6 },
  'toi-truot': { dau: 0.07, dai: 0.7, am: 0.85 },
  'no-lo': { dau: 0.06, dai: 2.5, am: 0.95 },
  'mo-lo-thuong': { dau: 0.57, dai: 0.7, am: 2 },
  'mo-lo-quy': { dau: 0.06, dai: 3, am: 0.8 },
  'set-danh': { dau: 0.49, dai: 4.2, am: 0.9 },
  'dot-pha': { dau: 0.24, dai: 2.2, am: 5 },
  'linh-thach': { dau: 0.03, dai: 1, am: 0.8 },
  // du ngoạn (đo 2026-11-16): nhiều file dài, chỉ phát đoạn đầu có tiếng
  'buoc-di': { dau: 0.8, dai: 0.9, am: 0.6 },
  'gap-cuop': { dau: 0.05, dai: 2.1, am: 1 },
  'gap-tien-nu': { dau: 0.34, dai: 3.1, am: 1.25 },
  'gap-yeu-thu': { dau: 0.47, dai: 3.6, am: 0.4 },
  'gap-ma': { dau: 0.12, dai: 3.2, am: 2 },
  'gap-ky-ngo': { dau: 0.81, dai: 2.8, am: 0.4 },
  'thanh-cong': { dau: 0.02, dai: 0.9, am: 1.5 },
  'that-bai': { dau: 0.08, dai: 0.5, am: 0.6 },
  'ket-dep': { dau: 0.19, dai: 3.5, am: 0.4 },
  'tu-tran': { dau: 0.03, dai: 3.7, am: 0.55 },
  'hao-cam': { dau: 0.02, dai: 1.1, am: 0.4 },
  // Vực Thẳm (đo 2026-11-17, cùng cách đo): thì thầm cố ý nhỏ hơn để lẩn vào nền
  'gap-quai-vuc': { dau: 0.14, dai: 3.6, am: 0.4 },
  'danh-trung-vuc': { dau: 0.08, dai: 0.5, am: 0.75 },
  'do-don': { dau: 0.06, dai: 0.6, am: 0.8 },
  'bi-danh': { dau: 0.02, dai: 1.5, am: 0.16 },
  'gam-boss': { dau: 0.02, dai: 2.4, am: 0.22 },
  'trung-doc': { dau: 0.1, dai: 0.6, am: 1 },
  'chay-mau': { dau: 0.08, dai: 0.4, am: 3 },
  'hac-hoa': { dau: 0.12, dai: 3.2, am: 0.5 },
  'tim-dap': { dau: 0.05, dai: 0.75, am: 0.25 },
  'thang-vuc': { dau: 0.17, dai: 2.5, am: 2.6 },
  'loi-thoat': { dau: 0.34, dai: 4, am: 0.8 },
  'chet-vuc': { dau: 0.03, dai: 6, am: 0.24 },
  'thi-tham-1': { dau: 0.88, dai: 3, am: 0.28 },
  'thi-tham-2': { dau: 0.11, dai: 3, am: 2.5 },
  'thi-tham-3': { dau: 0.66, dai: 2.9, am: 0.9 },
} as const;
export type Tieng = keyof typeof TIENG;

/** Nhạc nền: dau/cuoi = điểm bắt đầu và kết thúc của đoạn lặp (giây), am = âm lượng. */
const NHAC = {
  'dong-phu': { file: 'nhac-dong-phu', dau: 0.3, cuoi: 66.5, am: 0.32 },
  vuon: { file: 'nhac-dong-phu2', dau: 0.5, cuoi: 99.5, am: 0.4 },
  'dan-phong': { file: 'nhac-dan-phong', dau: 0, cuoi: 28, am: 0.5 },
  'du-ngoan': { file: 'nhac-du-ngoan', dau: 0.5, cuoi: 99.5, am: 0.4 },
  'vuc-nong': { file: 'nhac-vuc-nong', dau: 0.9, cuoi: 27.7, am: 0.4 },
  // nhạc riêng của tầng Sâu nghe không hợp: dùng chung bản của tầng Nông
  'vuc-sau': { file: 'nhac-vuc-nong', dau: 0.9, cuoi: 27.7, am: 0.4 },
  'vuc-tham': { file: 'nhac-vuc-tham', dau: 2.08, cuoi: 46.5, am: 0.22 },
  'cho-nghi': { file: 'nhac-cho-nghi', dau: 0.52, cuoi: 6.6, am: 0.7 },
  'boss-vuc': { file: 'nhac-boss-vuc', dau: 0.1, cuoi: 70.9, am: 0.27 },
  'boss-cuoi': { file: 'nhac-boss-cuoi', dau: 0.09, cuoi: 31.8, am: 0.2 },
} as const;
export type Nhac = keyof typeof NHAC;

/** Tiếng lửa lặp trong lúc khống hỏa. */
const LUA = { file: 'lua-chay', dau: 0.05, cuoi: 17.2, am: 0.75 };

const duong = (file: string) => `./am/${file}.mp3`;

// ---------- cài đặt bật/tắt, nhớ trong trình duyệt ----------

export interface CaiDatAm {
  nhac: boolean;
  hieuUng: boolean;
}
const KHOA = 'luyen-dan-am-thanh';
let caiDat: CaiDatAm = { nhac: true, hieuUng: true };
try {
  caiDat = { ...caiDat, ...(JSON.parse(localStorage.getItem(KHOA) ?? '{}') as Partial<CaiDatAm>) };
} catch {
  // không đọc được thì dùng mặc định
}
const nguoiNghe = new Set<() => void>();
export const layCaiDatAm = () => caiDat;
export function dangKyCaiDatAm(ham: () => void) {
  nguoiNghe.add(ham);
  return () => {
    nguoiNghe.delete(ham);
  };
}
export function datCaiDatAm(moi: Partial<CaiDatAm>) {
  caiDat = { ...caiDat, ...moi };
  try {
    localStorage.setItem(KHOA, JSON.stringify(caiDat));
  } catch {
    // chế độ ẩn danh có thể chặn ghi — bỏ qua
  }
  capNhatNhac();
  if (!caiDat.hieuUng) tatLua();
  else if (luaDangCan) batLua();
  nguoiNghe.forEach((h) => h());
}

// ---------- lõi Web Audio ----------

let ctx: AudioContext | null = null;
let daCham = false;
const boNho = new Map<string, Promise<AudioBuffer | null>>();

function taiBuffer(file: string): Promise<AudioBuffer | null> {
  let p = boNho.get(file);
  if (!p) {
    p = fetch(duong(file))
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((ab) => ctx!.decodeAudioData(ab))
      .catch(() => null); // thiếu file hay hỏng thì game vẫn chạy, chỉ không có tiếng đó
    boNho.set(file, p);
  }
  return p;
}

/** Phát một tiếng ngắn. `toc` = tốc độ phát (lớn hơn 1 thì cao và nhanh hơn), `am` nhân thêm vào âm lượng. */
export function phat(ten: Tieng, { toc = 1, am = 1 }: { toc?: number; am?: number } = {}) {
  if (!ctx || !daCham || !caiDat.hieuUng) return;
  const t = TIENG[ten];
  const c = ctx;
  void taiBuffer(ten).then((buf) => {
    if (!buf || !caiDat.hieuUng) return;
    const nguon = c.createBufferSource();
    nguon.buffer = buf;
    nguon.playbackRate.value = toc;
    const g = c.createGain();
    const luc = c.currentTime;
    g.gain.setValueAtTime(t.am * am, luc);
    // tắt dần ở cuối để chỗ cắt đuôi không bị "bụp"
    g.gain.setValueAtTime(t.am * am, luc + (t.dai / toc) * 0.8);
    g.gain.linearRampToValueAtTime(0, luc + t.dai / toc);
    nguon.connect(g).connect(c.destination);
    nguon.start(luc, t.dau, t.dai);
  });
}

// ---------- tiếng lửa lặp ----------

let luaDangCan = false;
let lua: { nguon: AudioBufferSourceNode; g: GainNode } | null = null;
export function batLua() {
  luaDangCan = true;
  if (!ctx || !daCham || !caiDat.hieuUng || lua) return;
  const c = ctx;
  void taiBuffer(LUA.file).then((buf) => {
    if (!buf || !luaDangCan || lua || !caiDat.hieuUng) return;
    const nguon = c.createBufferSource();
    nguon.buffer = buf;
    nguon.loop = true;
    nguon.loopStart = LUA.dau;
    nguon.loopEnd = Math.min(LUA.cuoi, buf.duration);
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(LUA.am * 0.4, c.currentTime + 0.4);
    nguon.connect(g).connect(c.destination);
    nguon.start(c.currentTime, LUA.dau);
    lua = { nguon, g };
  });
}
/** Lửa to nhỏ theo nhiệt trong lò (0–1). */
export function datLua(nhiet: number) {
  if (!lua || !ctx) return;
  lua.g.gain.setTargetAtTime(LUA.am * (0.35 + 0.65 * Math.min(1, Math.max(0, nhiet))), ctx.currentTime, 0.15);
}
export function tatLua(nho = false) {
  if (!nho) luaDangCan = false;
  if (!lua || !ctx) return;
  const { nguon, g } = lua;
  lua = null;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
  nguon.stop(ctx.currentTime + 0.6);
}

// ---------- nhạc nền ----------

interface BanNhac {
  ten: Nhac;
  the: HTMLAudioElement;
  g: GainNode;
}
const cacBan = new Map<Nhac, BanNhac>();
let nhacMuon: Nhac | null = null;
let nhacDangPhat: Nhac | null = null;

function layBan(ten: Nhac): BanNhac | null {
  if (!ctx) return null;
  let b = cacBan.get(ten);
  if (!b) {
    const n = NHAC[ten];
    const the = new Audio(duong(n.file));
    the.preload = 'auto';
    // tự lặp ở điểm đã đo, bỏ đoạn lặng cuối bài
    the.addEventListener('timeupdate', () => {
      if (the.currentTime >= n.cuoi) the.currentTime = n.dau;
    });
    the.addEventListener('ended', () => {
      the.currentTime = n.dau;
      void the.play().catch(() => {});
    });
    const g = ctx.createGain();
    g.gain.value = 0;
    ctx.createMediaElementSource(the).connect(g).connect(ctx.destination);
    b = { ten, the, g };
    cacBan.set(ten, b);
  }
  return b;
}

function capNhatNhac() {
  if (!ctx || !daCham) return;
  const muon = caiDat.nhac && !document.hidden ? nhacMuon : null;
  if (muon === nhacDangPhat) return;
  const luc = ctx.currentTime;
  // bản cũ tắt hẳn rồi bản mới mới vào, không cho hai bản vang chồng lên nhau
  // (trên iPhone âm lượng của thẻ audio đôi khi không chỉnh được, nên phải dừng hẳn chứ không chỉ vặn nhỏ)
  const coBanCu = !!nhacDangPhat && !!cacBan.get(nhacDangPhat);
  if (nhacDangPhat) {
    const cu = cacBan.get(nhacDangPhat);
    if (cu) {
      cu.g.gain.cancelScheduledValues(luc);
      cu.g.gain.setTargetAtTime(0, luc, 0.1);
      const the = cu.the;
      const ten = cu.ten;
      setTimeout(() => {
        if (nhacDangPhat !== ten) the.pause();
      }, CHO_TAT_NHAC);
    }
  }
  nhacDangPhat = muon;
  if (muon) {
    const vao = () => {
      if (nhacDangPhat !== muon || !ctx) return;
      const moi = layBan(muon);
      if (!moi) return;
      if (moi.the.currentTime < NHAC[muon].dau) moi.the.currentTime = NHAC[muon].dau;
      void moi.the.play().catch(() => {});
      moi.g.gain.cancelScheduledValues(ctx.currentTime);
      moi.g.gain.setValueAtTime(0, ctx.currentTime);
      moi.g.gain.setTargetAtTime(NHAC[muon].am, ctx.currentTime, 0.5);
    };
    if (coBanCu) setTimeout(vao, CHO_TAT_NHAC + 30);
    else vao();
  }
}
/** Mili giây chờ bản nhạc cũ tắt hẳn trước khi bản mới vào. */
const CHO_TAT_NHAC = 450;

/** Chọn bản nhạc nền cho màn hiện tại (null = im lặng). Đổi bản thì bản cũ nhỏ dần, bản mới to dần. */
export function datNhac(ten: Nhac | null) {
  nhacMuon = ten;
  capNhatNhac();
}

// ---------- khởi động: gắn một lần khi game mở ----------

let daKhoiDong = false;
export function khoiDongAmThanh() {
  if (daKhoiDong || typeof window === 'undefined') return;
  daKhoiDong = true;

  const moKhoa = () => {
    if (!ctx) {
      const Lop = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Lop) return;
      ctx = new Lop();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    if (!daCham) {
      daCham = true;
      // nạp sẵn các tiếng ngắn để lần bấm đầu không bị trễ
      for (const ten of Object.keys(TIENG)) void taiBuffer(ten);
      capNhatNhac();
      if (luaDangCan) batLua();
    }
  };
  window.addEventListener('pointerdown', moKhoa, { capture: true });
  window.addEventListener('keydown', moKhoa, { capture: true });

  // mọi nút bấm được đều kêu một tiếng, khỏi phải gắn tay từng nút; nút nào có tiếng riêng thì đặt data-im
  window.addEventListener(
    'click',
    (e) => {
      const nut = (e.target as Element | null)?.closest?.('button');
      if (nut && !(nut as HTMLButtonElement).disabled && !nut.hasAttribute('data-im')) phat('nut-bam');
    },
    { capture: true },
  );

  // bảng nổi hiện ra / đóng lại: nghe theo số lớp phủ đang có trên màn
  let soBang = 0;
  new MutationObserver(() => {
    const n = document.querySelectorAll('.lop-phu').length;
    if (n > soBang) phat('mo-bang');
    else if (n < soBang) phat('dong-bang');
    soBang = n;
  }).observe(document.body, { childList: true, subtree: true });

  // chuyển sang tab khác hay tắt màn hình thì ngừng nhạc và lửa, quay lại thì phát tiếp
  document.addEventListener('visibilitychange', () => {
    capNhatNhac();
    if (document.hidden) tatLua(true);
    else if (luaDangCan) batLua();
  });
}

// Ghi chú: các số dau/dai/am ở trên lấy từ lần đo ngày 2026-11-14 (giải mã từng file bằng decodeAudioData,
// tìm khoảng lặng đầu cuối và độ to trung bình của nửa giây to nhất). Thay file âm thanh thì nên đo lại.
