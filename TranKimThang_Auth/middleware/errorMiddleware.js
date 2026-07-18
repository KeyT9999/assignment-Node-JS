/**
 * @file errorMiddleware.js
 * @description Xử lý lỗi tập trung cho toàn bộ ứng dụng Express.
 * Chứa middleware định tuyến cho các Route không tồn tại (404) và middleware xử lý ngoại lệ (500, lỗi xác thực DB,...).
 */

/**
 * Middleware bắt lỗi 404 - Không tìm thấy route.
 * Được gọi khi client gửi request tới một API endpoint không được khai báo trong ứng dụng.
 *
 * @function notFound
 * @param {express.Request} req - Đối tượng Request từ Express.
 * @param {express.Response} res - Đối tượng Response gửi về Client.
 */
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Middleware tập trung xử lý lỗi toàn cục (Global Error Handler).
 * Express sẽ tự động chuyển hướng lỗi tới middleware này khi gọi hàm next(error).
 *
 * @function errorHandler
 * @param {Error} error - Đối tượng lỗi phát sinh trong hệ thống.
 * @param {express.Request} _req - Đối tượng Request (không dùng).
 * @param {express.Response} res - Đối tượng Response gửi về Client.
 * @param {express.NextFunction} _next - Hàm chuyển tiếp middleware tiếp theo (không dùng).
 */
function errorHandler(error, _req, res, _next) {
  // Lỗi xác thực Mongoose (ValidationError) hoặc lỗi định dạng ID không hợp lệ (CastError).
  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  
  // Lỗi trùng lặp dữ liệu độc nhất (Duplicate Key Error) từ MongoDB, mã lỗi code là 11000 (Ví dụ: Trùng username).
  if (error?.code === 11000) {
    return res.status(409).json({ message: 'Unique value already exists' });
  }
  
  // Ghi nhận chi tiết lỗi vào log hệ thống để phục vụ việc debug.
  console.error(error);
  
  // Trả về mã lỗi 500 nếu là lỗi hệ thống không lường trước được.
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };

