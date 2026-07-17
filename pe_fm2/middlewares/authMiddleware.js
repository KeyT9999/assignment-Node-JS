const jwt = require('jsonwebtoken');

// Middleware xác thực Token
const verifyToken = (req, res, next) => {
    // Lấy token từ header Authorization (Bearer <token>)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    // Nếu không có token, chặn truy cập
    if (!token) return res.status(401).send("Access Denied");

    try {
        // Giải mã token bằng Secret Key
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY');
        // Lưu thông tin người dùng vào req để các controller phía sau sử dụng
        req.user = decoded;
        next(); // Tiếp tục xử lý
    } catch (err) {
        res.status(400).send("Invalid Token");
    }
};

// Middleware kiểm tra quyền Admin
const isAdmin = (req, res, next) => {
    // Nếu role không phải admin, báo lỗi Forbidden
    if (req.user.role !== 'admin') {
        return res.status(403).send("Requires Admin Role");
    }
    next(); // Tiếp tục xử lý
};

module.exports = { verifyToken, isAdmin };