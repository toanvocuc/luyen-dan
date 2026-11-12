import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' để chạy được cả ở tên miền riêng lẫn đường dẫn con của GitHub Pages
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5183 },
});
