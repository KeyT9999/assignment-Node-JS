/**
 * Middleware phân quyền (Role Authorization).
 * Hàm này nhận vào một danh sách các vai trò được phép truy cập (roles).
 * Trả về một middleware Express chuẩn để kiểm tra vai trò của người dùng hiện tại.
 * 
 * @param  {...string} roles - Các vai trò được phép truy cập (ví dụ: 'admin', 'customer')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra xem thông tin người dùng (req.user) có tồn tại và vai trò của họ có nằm trong danh sách được phép không
    if (!req.user || !roles.includes(req.user.role)) {
      // Trả về lỗi 403 (Forbidden) nếu vai trò không được phép truy cập
      return res.status(403).json({
        message: `Forbidden: Role '${req.user ? req.user.role : 'none'}' is not allowed to access this resource`
      });
    }
    // Cho phép tiếp tục thực hiện nếu vai trò hợp lệ
    next();
  };
};

module.exports = { authorizeRoles };
