/**
 * @file authMiddleware.js
 * @description Các middleware xử lý xác thực (Authentication) và phân quyền (Authorization)
 * dựa trên cơ chế JSON Web Token (JWT) và kiểm tra Role người dùng trước khi truy cập tài nguyên bảo mật.
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực token JWT gửi kèm trong request header.
 * Kiểm tra xem token có hợp lệ và còn hạn sử dụng hay không.
 *
 * @function verifyToken
 * @param {express.Request} req - Đối tượng Request từ Express.
 * @param {express.Response} res - Đối tượng Response gửi về Client.
 * @param {express.NextFunction} next - Hàm callback chuyển tiếp middleware tiếp theo.
 */
function verifyToken(req, res, next) {
  // Lấy giá trị trường Authorization từ HTTP request headers.
  const authorization = req.headers.authorization || '';
  
  // JWT token hợp lệ bắt buộc phải có tiền tố "Bearer ".
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Cắt chuỗi để lấy token thực tế phía sau "Bearer ".
  const token = authorization.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Giải mã và xác thực token bằng thuật toán mã hóa khóa bí mật JWT_SECRET.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Gán thông tin người dùng đã giải mã (payload) vào thuộc tính req.user để sử dụng ở các middleware/route tiếp theo.
    req.user = decoded;
    
    return next();
  } catch (_error) {
    // Trả về mã lỗi 401 nếu token không hợp lệ, bị giả mạo hoặc đã hết hạn.
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Middleware kiểm tra phân quyền người dùng theo danh sách vai trò (roles) được cho phép.
 * Phải được xếp sau verifyToken trong chuỗi xử lý của route.
 *
 * @function requireRole
 * @param {...string} roles - Danh sách các vai trò được phép truy cập.
 * @returns {Function} Hàm middleware của Express.
 */
const requireRole = (...roles) => (req, res, next) => {
  // Nếu thông tin người dùng không tồn tại (chưa qua verifyToken) hoặc vai trò không khớp với danh sách cho phép.
  if (!req.user || !roles.includes(req.user.role)) {
    // Phản hồi mã lỗi 403 Forbidden (Không đủ quyền truy cập).
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  // Hợp lệ, tiếp tục xử lý nghiệp vụ chính của API.
  return next();
};

module.exports = { verifyToken, requireRole };

