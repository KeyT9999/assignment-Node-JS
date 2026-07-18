/**
 * @file authMiddleware.js
 * @description Middleware bảo vệ các tuyến đường (routes) bằng cách xác thực mã token JWT.
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware bảo vệ các API yêu cầu đăng nhập.
 * Trích xuất token từ header Authorization, kiểm tra tính hợp lệ và giải mã thông tin gán vào req.user.
 * 
 * @async
 * @function protect
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
const protect = async (req, res, next) => {
  let token;
  
  // Kiểm tra header Authorization có bắt đầu với tiền tố "Bearer" hay không.
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Trích xuất mã token thực tế từ chuỗi "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
      
      // Xác thực chữ ký token với khóa bí mật JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sdn302_secret_key');
      
      // Đính kèm thông tin giải mã (id, username, role) vào đối tượng req.user
      req.user = decoded;
      return next();
    }  catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({
        message: 'Not authorized, token failed'
      });
    }
  }
  
  // Trả về lỗi nếu không có token được đính kèm trong request
  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token provided'
    });
  }
};

module.exports = {
  protect
};

