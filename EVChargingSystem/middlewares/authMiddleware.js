const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

/**
 * Middleware Protect: Xác thực JWT token gửi lên từ phía Client.
 * Đảm bảo người dùng đã đăng nhập để truy cập vào các tuyến đường được bảo vệ.
 */
const protect = async (req, res, next) => {
    try {
        // Lấy token từ header Authorization của yêu cầu HTTP gửi lên
        const authHeader = req.headers.authorization;

        // Định dạng hợp lệ của token gửi lên phải là: "Bearer <token>"
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        // Tách chuỗi để lấy phần mã JWT token thực tế
        const token = authHeader.split(" ")[1];

        // Xác minh chữ ký JWT bằng cách giải mã token sử dụng khóa bí mật JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tìm thông tin người dùng từ cơ sở dữ liệu dựa trên ID giải mã từ token (và loại trừ trường mật khẩu)
        const user = await User.findById(decoded.id).select("-password");

        // Nếu người dùng không tồn tại (đã bị xóa khỏi DB nhưng token vẫn còn hạn)
        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // Lưu thông tin người dùng tìm thấy vào đối tượng request (req.user) để các hàm xử lý phía sau có thể dùng tiếp
        req.user = user;
        next(); // Chuyển tiếp yêu cầu sang middleware hoặc controller tiếp theo
    } catch (error) {
        // Trả về mã lỗi 401 khi token không hợp lệ hoặc đã hết thời gian hiệu lực
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

/**
 * Middleware Authorize: Phân quyền truy cập dựa trên danh sách các vai trò (roles) được cho phép.
 * 
 * @param {...string} roles - Danh sách các vai trò có quyền truy cập (ví dụ: "admin", "customer")
 * @returns {Function} - Trả về một Express middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        // Kiểm tra xem vai trò của người dùng hiện tại (req.user.role) có nằm trong danh sách được cho phép hay không
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission" // Trả về mã lỗi 403 Forbidden nếu không đủ thẩm quyền
            });
        }

        next(); // Đủ quyền thì chuyển tiếp sang bước tiếp theo
    };
};

module.exports = {
    protect,
    authorize
};