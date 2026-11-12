// Đẩy thư mục dist/ lên nhánh gh-pages của origin. Chạy: npm run day-web
// Mỗi lần đẩy là một commit mới tinh ghi đè nhánh gh-pages (nhánh này chỉ chứa bản dựng, không cần lịch sử).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const git = (thuMuc, ...thamSo) => execFileSync('git', thamSo, { cwd: thuMuc, encoding: 'utf8' }).trim();

if (!existsSync('dist/index.html')) {
  console.error('Chưa có dist/index.html — chạy npm run build trước.');
  process.exit(1);
}
const origin = git('.', 'remote', 'get-url', 'origin');
const banNguon = git('.', 'rev-parse', '--short', 'HEAD');

const tam = mkdtempSync(join(tmpdir(), 'luyen-dan-web-'));
try {
  cpSync('dist', tam, { recursive: true });
  // .nojekyll: bảo GitHub Pages phục vụ nguyên trạng, không chạy Jekyll
  writeFileSync(join(tam, '.nojekyll'), '');
  // Khi đã trỏ tên miền riêng thì đặt biến TEN_MIEN để ghi file CNAME, nếu không GitHub sẽ quên tên miền sau mỗi lần đẩy
  if (process.env.TEN_MIEN) writeFileSync(join(tam, 'CNAME'), process.env.TEN_MIEN + '\n');

  git(tam, 'init', '-q', '-b', 'gh-pages');
  git(tam, 'add', '-A');
  git(tam, '-c', 'user.name=day-web', '-c', 'user.email=day-web@users.noreply.github.com', 'commit', '-q', '-m', `Bản web dựng từ ${banNguon}`);
  git(tam, 'push', '-f', '-q', origin, 'gh-pages');
  console.log(`Đã đẩy bản dựng từ ${banNguon} lên nhánh gh-pages của ${origin}`);
} finally {
  rmSync(tam, { recursive: true, force: true });
}
