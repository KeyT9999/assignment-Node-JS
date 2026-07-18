/**
 * @file server.js
 * @description Điểm khởi chạy (Entry Point) của ứng dụng Node.js Express.
 * Thiết lập các middleware cơ bản, cấu hình định tuyến (routes), quản lý kết nối cơ sở dữ liệu,
 * và điều khiển chu kỳ hoạt động (khởi động/dừng) của server HTTP.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Sử dụng Express middleware để phân tích cú pháp JSON trong request body, giới hạn payload kích thước tối đa 100kb để bảo mật.
app.use(express.json({ limit: '100kb' }));

// Đăng ký các phân hệ Routes chính của hệ thống.
app.use('/auth', require('./routes/authRoutes'));
app.use('/demo', require('./routes/demoRoutes'));

// Endpoint kiểm tra sức khỏe của ứng dụng (Health check endpoint).
app.get('/', (_req, res) => res.json({ message: 'TranKimThang Auth API', status: 'Running' }));

// Các middleware bắt lỗi (Phải được khai báo cuối cùng sau tất cả các route).
app.use(notFound);      // Xử lý khi không tìm thấy route nào khớp (404)
app.use(errorHandler);  // Xử lý các lỗi ngoại lệ phát sinh trong quá trình chạy API (500, lỗi validation...)

let server;

/**
 * Khởi động Server HTTP và kết nối tới cơ sở dữ liệu MongoDB.
 * 
 * @async
 * @function startServer
 * @returns {Promise<http.Server>} Đối tượng Server HTTP đã được lắng nghe kết nối.
 */
async function startServer() {
  // Thực hiện kết nối cơ sở dữ liệu trước khi mở cổng server.
  await connectDB();
  
  // Đọc cấu hình cổng mạng từ biến môi trường, mặc định là 9999.
  const port = Number(process.env.PORT) || 9999;
  
  await new Promise((resolve, reject) => {
    // Lắng nghe các kết nối gửi tới cổng chỉ định.
    server = app.listen(port, () => {
      console.log(`Auth API running at http://localhost:${port}`);
      resolve();
    });
    // Bắt lỗi nếu server gặp vấn đề khi khởi tạo (ví dụ: Trùng cổng port).
    server.once('error', reject);
  });
  return server;
}

/**
 * Đóng kết nối Server HTTP và ngắt kết nối cơ sở dữ liệu MongoDB một cách an toàn (Graceful Shutdown).
 * Phục vụ cho mục đích dọn dẹp bộ nhớ và chạy các chương trình kiểm thử tự động (tests).
 * 
 * @async
 * @function stopServer
 */
async function stopServer() {
  // Đóng server lắng nghe kết nối HTTP
  if (server) await new Promise(resolve => server.close(resolve));
  // Đóng kết nối MongoDB nếu kết nối đang ở trạng thái hoạt động
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
}

/**
 * Tự động chạy server nếu file này được thực thi trực tiếp từ Node.js (ví dụ: node server.js).
 * Sẽ bỏ qua phần này nếu file được require từ một module kiểm thử (tests) khác.
 */
if (require.main === module) {
  startServer().catch(error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${process.env.PORT || 9999} is already in use. Run npm run dev for automatic fallback.`);
    } else {
      console.error(`Startup failed: ${error.message}`);
    }
    process.exit(1);
  });
}

module.exports = { app, startServer, stopServer };

