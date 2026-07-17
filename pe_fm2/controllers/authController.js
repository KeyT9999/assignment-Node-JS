const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Xử lý đăng ký người dùng mới
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Mã hóa mật khẩu với salt vòng 10
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).send("User registered");
    } catch (err) {
        res.status(400).send("Registration failed: " + err.message);
    }
};

// Xử lý đăng nhập
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Tìm người dùng theo tên
        const user = await User.findOne({ username });
        // So sánh mật khẩu đã nhập với mật khẩu trong DB
        if (user && await bcrypt.compare(password, user.password)) {
            // Tạo mã JWT chứa ID và Role
            const token = jwt.sign(
                { id: user._id, role: user.role }, 
                process.env.JWT_SECRET || 'YOUR_SECRET_KEY'
            );
            return res.json({ token });
        }
        res.status(400).send("Invalid credentials");
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Xử lý đăng xuất (Client xóa token, server phản hồi thành công)
exports.logout = (req, res) => {
    // Với JWT stateless, logout chủ yếu thực hiện ở phía Client bằng cách xóa token.
    // Server có thể gửi thông báo xác nhận.
    res.json({ message: "Logged out successfully" });
};