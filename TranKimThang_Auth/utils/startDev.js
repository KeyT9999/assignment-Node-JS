/**
 * @file startDev.js
 * @description Tiện ích mở rộng môi trường phát triển (Development Utility).
 * Tự động tìm kiếm và khởi chạy server trên một cổng mạng trống (port fallback).
 * Giúp tránh lỗi "EADDRINUSE" (Cổng đã bị chiếm dụng) nếu có dịch vụ khác đang chạy trên cổng mặc định (9999).
 */

require('dotenv').config();
const net = require('net');

/**
 * Kiểm tra xem một cổng mạng (port) cụ thể có đang ở trạng thái rỗi (sẵn sàng sử dụng) hay không.
 * Tạo một server TCP ảo và lắng nghe thử trên cổng đó. Nếu lắng nghe thành công, cổng đó còn rỗi.
 * 
 * @function portAvailable
 * @param {number} port - Cổng mạng cần kiểm tra.
 * @returns {Promise<boolean>} Trả về true nếu cổng rỗi, ngược lại trả về false.
 */
const portAvailable = port => new Promise(resolve => {
  const probe = net.createServer();
  probe.unref(); // Không giữ cho Node.js event loop tiếp tục chạy nếu chỉ còn mỗi probe này
  probe.once('error', () => resolve(false)); // Lỗi xảy ra có nghĩa cổng đang bị chiếm dụng
  probe.listen(port, () => probe.close(() => resolve(true))); // Lắng nghe được thì đóng lại và xác nhận cổng trống
});

/**
 * Hàm tự khởi chạy (IIFE) thực hiện tìm kiếm cổng rỗi trong phạm vi cấu hình.
 * Bắt đầu thử từ cổng cấu hình sẵn (mặc định 9999) và cộng dồn tối đa thêm 50 cổng kế tiếp.
 */
(async () => {
  // Cổng ưa thích mong muốn khởi chạy (mặc định lấy từ .env hoặc 9999)
  const preferred = Number(process.env.PORT) || 9999;
  let selected = preferred;
  
  // Vòng lặp tìm kiếm cổng rỗi: thử cổng hiện tại, nếu bận thì tăng thêm 1 đơn vị, tối đa thử tiếp 50 cổng.
  while (selected < preferred + 50 && !(await portAvailable(selected))) {
    selected += 1;
  }
  
  // Ném lỗi nếu toàn bộ 50 cổng trong dải quét đều đang bận.
  if (selected >= preferred + 50) {
    throw new Error(`No free port in range ${preferred}-${preferred + 49}`);
  }
  
  // Gán lại cổng trống vừa tìm thấy vào biến môi trường PORT.
  process.env.PORT = String(selected);
  
  // Cảnh báo người dùng nếu phải đổi sang cổng phụ do cổng chính bị bận.
  if (selected !== preferred) {
    console.warn(`[dev] Port ${preferred} is busy; using ${selected}.`);
  }
  
  // Nạp module server chính và bắt đầu khởi chạy lắng nghe.
  await require('../server').startServer();
})().catch(error => {
  console.error(`[dev] Startup failed: ${error.message}`);
  process.exit(1); // Thoát chương trình kèm mã lỗi
});

