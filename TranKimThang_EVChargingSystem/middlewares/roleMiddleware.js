/**
 * @file roleMiddleware.js
 * @description Middleware phân quyền người dùng (Authorization) dựa trên vai trò (Roles).
 */

/**
 * Middleware cho phép truy cập API dựa trên danh sách các vai trò được chấp nhận.
 * So khớp vai trò của người dùng trong `req.user.role` với các vai trò được khai báo ở đầu vào.
 * 
 * @param {...string} roles - Danh sách các vai trò được phép truy cập (ví dụ: 'admin', 'customer').
 * @returns {Function} Hàm middleware Express.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra xem thông tin đăng nhập có tồn tại và vai trò người dùng có hợp lệ hay không.
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Role '${req.user ? req.user.role : 'none'}' is not allowed to access this station`
      });
    }
    return next();
  };
};

module.exports = {
  authorizeRoles
};

