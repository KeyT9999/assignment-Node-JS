// Thư viện JsonWebToken dùng để mã hóa, giải mã và xác thực token JWT
const jwt = require('jsonwebtoken');

/**
 * Middleware protect dùng để bảo vệ các routes yêu cầu đăng nhập.
 * Nó sẽ kiểm tra sự hiện diện và tính hợp lệ của token JWT gửi lên từ phía Client qua Header Authorization.
 */
const protect = async (req, res, next) => {
  let token;

  // Kiểm tra xem Header Authorization có tồn tại và bắt đầu bằng từ khóa 'Bearer' hay không
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Tách chuỗi để lấy token thực tế (bỏ chữ 'Bearer' và dấu khoảng trắng)
      token = req.headers.authorization.split(' ')[1];

      // Giải mã token bằng JWT_SECRET để lấy thông tin payload đã mã hóa trước đó
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sdn302_secret_key');

      // Lưu thông tin người dùng đã giải mã (id, username, role) vào đối tượng request (req.user)
      // Điều này giúp các hàm xử lý phía sau (Controller) có thể truy cập thông tin người dùng đang đăng nhập
      req.user = decoded;

      // Cho phép request tiếp tục đi tới middleware hoặc controller tiếp theo
      next();
    } catch (error) {
      // Ghi nhận lỗi nếu token hết hạn hoặc không hợp lệ (ví dụ: bị chỉnh sửa)
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // Trường hợp không tìm thấy token trong Header
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
