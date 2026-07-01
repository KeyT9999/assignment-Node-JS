const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

/**
 * Hàm hỗ trợ (Helper) tạo JSON Web Token (JWT) cho người dùng đăng nhập.
 * Token này được dùng để xác thực các yêu cầu tiếp theo từ phía Client.
 * 
 * @param {Object} user - Thông tin tài khoản người dùng
 * @returns {string} - Mã JWT token đã ký
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,      // Lưu ID người dùng vào payload của token
            role: user.role    // Lưu vai trò của người dùng để phân quyền nhanh
        },
        process.env.JWT_SECRET, // Sử dụng khóa bí mật cấu hình từ file .env
        {
            expiresIn: process.env.JWT_EXPIRES || "1d" // Thời hạn của token, mặc định là 1 ngày
        }
    );
};

// @desc    Register a new user (Đăng ký tài khoản người dùng mới)
// @route   POST /auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // 1. Kiểm tra đầu vào bắt buộc phải có đầy đủ tên đăng nhập và mật khẩu
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        // 2. Gán vai trò mặc định là 'customer' nếu người dùng không chỉ định cụ thể
        const selectedRole = role || "customer";

        // 3. Giới hạn chỉ cho phép tạo tài khoản có vai trò hợp lệ trong hệ thống
        if (!["admin", "customer"].includes(selectedRole)) {
            return res.status(400).json({
                message: "Role must be admin or customer"
            });
        }

        // 4. Kiểm tra sự trùng lặp của tên đăng nhập (Username) trong cơ sở dữ liệu
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists" // Lỗi 409 Conflict khi tên đăng nhập đã được sử dụng
            });
        }

        // 5. Quy tắc nghiệp vụ đặc thù:
        // - Khách hàng (customer) khi mới đăng ký được tặng sẵn 50 USD/VNĐ làm vốn sạc ban đầu.
        // - Quản trị viên (admin) thì không cần số dư trong ví (đặt mặc định là 0).
        const balance = selectedRole === "customer" ? 50 : 0;

        // 6. Thực hiện lưu trữ tài khoản vào MongoDB (Mật khẩu sẽ tự băm bởi pre-save hook trong userModel)
        const user = await User.create({
            username,
            password,
            role: selectedRole,
            balance
        });

        // 7. Trả về thông báo đăng ký thành công kèm thông tin cơ bản của tài khoản (loại trừ mật khẩu)
        res.status(201).json({
            message: "Register successfully",
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                balance: user.balance
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Register failed",
            error: error.message
        });
    }
};

// @desc    Login user (Đăng nhập tài khoản)
// @route   POST /auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Kiểm tra đầu vào bắt buộc
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        // 2. Tìm người dùng trong database theo tên đăng nhập
        const user = await User.findOne({ username });

        // Nếu không tìm thấy người dùng
        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password" // Không nên báo cụ thể là sai username hay password để bảo mật thông tin
            });
        }

        // 3. Sử dụng method tùy biến comparePassword để kiểm tra tính hợp lệ của mật khẩu
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        // 4. Sinh mã token truy cập cho người dùng đăng nhập thành công
        const token = generateToken(user);

        // 5. Phản hồi về phía Client token và thông tin người dùng
        res.status(200).json({
            message: "Login successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                balance: user.balance
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

module.exports = {
    register,
    login
};

