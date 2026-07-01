const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Định nghĩa cấu trúc lược đồ (Schema) cho thực thể Người dùng (User)
const userSchema = new mongoose.Schema({
    // Tên đăng nhập của người dùng
    username: {
        type: String,
        required: [true, "Username is required"], // Bắt buộc phải có tên đăng nhập
        unique: true,                             // Đảm bảo không trùng lặp tên đăng nhập trong hệ thống
        trim: true                                // Tự động cắt bỏ các khoảng trắng thừa ở hai đầu
    },

    // Mật khẩu tài khoản (lưu trữ dưới dạng đã được mã hóa băm)
    password: {
        type: String,
        required: [true, "Password is required"]  // Bắt buộc phải nhập mật khẩu
    },

    // Vai trò của người dùng trong hệ thống
    role: {
        type: String,
        enum: ["admin", "customer"],              // Chỉ cho phép nhận một trong hai vai trò: admin hoặc customer
        default: "customer"                       // Mặc định ban đầu là tài khoản khách hàng
    },

    // Thời điểm tài khoản được khởi tạo
    createdAt: {
        type: Date,
        default: Date.now                         // Mặc định lấy thời gian hiện tại lúc tạo tài khoản
    },

    // Số dư ví tài khoản của khách hàng để thanh toán các phiên sạc
    balance: {
        type: Number,
        default: 0                                // Số dư ban đầu mặc định là 0
    }
});

/**
 * Middleware pre-save: Chạy tự động trước khi lưu tài liệu User vào MongoDB.
 * Nhiệm vụ: Tự động băm (hash) mật khẩu bằng thư viện bcrypt nếu mật khẩu có sự thay đổi hoặc tạo mới.
 */
userSchema.pre("save", async function () {
    // Nếu trường mật khẩu không bị chỉnh sửa, bỏ qua bước băm mật khẩu
    if (!this.isModified("password")) {
        return;
    }

    // Tiến hành băm mật khẩu với salt round là 10
    this.password = await bcrypt.hash(this.password, 10);
});

/**
 * Phương thức tùy biến (Instance method) của User model.
 * Dùng để so sánh mật khẩu dạng thô do người dùng nhập vào với mật khẩu đã mã hóa lưu trong DB.
 * 
 * @param {string} inputPassword - Mật khẩu thô cần kiểm tra
 * @returns {Promise<boolean>} - Trả về true nếu trùng khớp, ngược lại là false
 */
userSchema.methods.comparePassword = async function (inputPassword) {
    return bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);