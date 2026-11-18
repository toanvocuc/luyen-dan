// Tạo ảnh hàng loạt bằng Gemini. Key đọc từ .env (GEMINI_API_KEY), không bao giờ in ra.
// Dùng: node scripts/tao-anh-gemini.mjs <tệp danh sách .json> [--lam-lai]
// Tệp danh sách: { "thuMuc": "Hinh_anh/_gemini/nhan-vat", "model": "gemini-3-pro-image", "tiLe": "2:3",
//                  "chung": "phần lời nhắc dùng chung", "anh": [ { "ten": "nam-goc-a", "loi": "...", "theo": ["nam-goc-a"] } ] }
// "theo": tên các ảnh đã tạo trong cùng thư mục, gửi kèm làm ảnh mẫu (giữ mặt, giữ nét vẽ). Ảnh đã có thì bỏ qua, trừ khi --lam-lai.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const goc = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(join(goc, '.env'), 'utf8');
const KEY = /^GEMINI_API_KEY=(.+)$/m.exec(env)?.[1].trim();
if (!KEY) throw new Error('Thiếu GEMINI_API_KEY trong .env');

const [tepDs, ...co] = process.argv.slice(2);
const lamLai = co.includes('--lam-lai');
const ds = JSON.parse(readFileSync(tepDs, 'utf8'));
const thuMuc = join(goc, ds.thuMuc);
mkdirSync(thuMuc, { recursive: true });
const model = ds.model ?? 'gemini-3-pro-image';

async function tao(muc) {
  const ra = join(thuMuc, `${muc.ten}.png`);
  if (!lamLai && existsSync(ra)) return console.log(`bỏ qua ${muc.ten} (đã có)`);
  const thieu = (muc.theo ?? []).filter((t) => !existsSync(join(thuMuc, `${t}.png`)));
  if (thieu.length) return console.log(`bỏ qua ${muc.ten}: thiếu ảnh mẫu ${thieu.join(', ')}`);
  const parts = [];
  for (const t of muc.theo ?? []) {
    parts.push({ inlineData: { mimeType: 'image/png', data: readFileSync(join(thuMuc, `${t}.png`)).toString('base64') } });
  }
  parts.push({ text: [ds.chung, muc.loi].filter(Boolean).join('\n\n') });
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: muc.tiLe ?? ds.tiLe ?? '2:3' } },
  };
  for (let lan = 1; lan <= 3; lan++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    const anh = d.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (anh) {
      writeFileSync(ra, Buffer.from(anh.data, 'base64'));
      return console.log(`xong ${muc.ten}`);
    }
    const loi = d.error ? `${d.error.code} ${d.error.message}` : `không có ảnh (${d.candidates?.[0]?.finishReason ?? d.promptFeedback?.blockReason ?? '?'})`;
    console.log(`lỗi ${muc.ten} lần ${lan}: ${loi.slice(0, 300)}`);
    if (d.error?.code === 400 || d.error?.code === 403) return;
    await new Promise((ok) => setTimeout(ok, 5000 * lan));
  }
}

// ảnh có "theo" phải chờ ảnh mẫu xong: chạy theo lượt, mỗi lượt song song tối đa 3
const conLai = [...ds.anh];
const daXong = new Set();
while (conLai.length) {
  const san = conLai.filter((m) => (m.theo ?? []).every((t) => daXong.has(t) || existsSync(join(thuMuc, `${t}.png`)))).slice(0, 3);
  if (!san.length) throw new Error('Ảnh mẫu bị thiếu: ' + conLai.map((m) => m.ten).join(', '));
  await Promise.all(san.map(tao));
  for (const m of san) {
    daXong.add(m.ten);
    conLai.splice(conLai.indexOf(m), 1);
  }
}
