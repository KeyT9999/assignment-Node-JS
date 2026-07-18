/**
 * @file startDev.js
 * @description Công cụ tự động tìm cổng mạng (port fallback) khi khởi chạy ứng dụng ở môi trường phát triển (development).
 * Đảm bảo server khởi chạy thành công ngay cả khi cổng mạng mặc định (9999) đã bị ứng dụng khác chiếm dụng.
 */

require('dotenv').config();
const net = require('net');

/**
 * Kiểm tra xem một cổng (port) cụ thể có đang sẵn sàng sử dụng hay không.
 * 
 * @function portAvailable
 * @param {number} port - Cổng cần kiểm tra.
 * @returns {Promise<boolean>} Trả về true nếu cổng rỗi, ngược lại trả về false.
 */
function portAvailable(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.unref();
    probe.once('error', () => resolve(false));
    probe.listen(port, () => probe.close(() => resolve(true)));
  });
}

/**
 * Hàm tự khởi chạy tìm kiếm cổng rỗi trong dải preferred đến preferred + 50.
 */
(async () => {
  const preferred = Number(process.env.PORT) || 9999;
  let selected = preferred;
  
  // Quét tối đa 50 cổng kế tiếp bắt đầu từ cổng cấu hình ưa thích.
  while (selected < preferred + 50 && !(await portAvailable(selected))) {
    selected += 1;
  }
  
  if (selected >= preferred + 50) {
    throw new Error(`No free development port in ${preferred}-${preferred + 49}`);
  }
  
  // Gán cổng trống tìm được vào biến môi trường PORT
  process.env.PORT = String(selected);
  
  if (selected !== preferred) {
    console.warn(`[dev] Port ${preferred} is busy; using ${selected}. Update Postman base_url.`);
  }
  
  console.log(`[dev] Starting on http://localhost:${selected}`);
  // Nạp và khởi động server
  require('../server');
})().catch((error) => {
  console.error(`[dev] Startup failed: ${error.message}`);
  process.exit(1);
});

