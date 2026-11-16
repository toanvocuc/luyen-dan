// Ảnh lỗi: bộ bắt lỗi chung ở main.tsx tự tải lại vài lần; onError trong các màn chỉ đổi sang hình thay thế khi đã hết lượt thử.
export const SO_LAN_THU = 2;
/** Ảnh này đã được tải lại đủ số lần mà vẫn hỏng. */
export const daHetLuotThu = (im: HTMLImageElement) => im.dataset.het === '1';
