const mongoose = require("mongoose");
const User = require("../models/userModel");

/**
 * Hàm khởi tạo các tài khoản người dùng mặc định (Seeding Data).
 * Giúp tạo sẵn tài khoản Admin và Customer để thuận tiện kiểm thử khi ứng dụng chạy lần đầu.
 */
const seedDefaultUsers = async () => {
  try {
    // 1. Kiểm tra tài khoản Quản trị viên (Admin) đã tồn tại hay chưa
    const adminExists = await User.findOne({ username: "admin1" });
    if (!adminExists) {
      // Nếu chưa có, tiến hành tạo mới tài khoản admin1 với số dư mặc định là 0
      await User.create({
        username: "admin1",
        password: "123", // Mật khẩu thô (sẽ tự động được mã hóa bởi pre-save hook trong userModel)
        role: "admin",
        balance: 0
      });
      console.log("Seeded default admin account: admin1 / 123");
    }

    // 2. Kiểm tra tài khoản Khách hàng (Customer) đã tồn tại hay chưa
    const customerExists = await User.findOne({ username: "user1" });
    if (!customerExists) {
      // Nếu chưa có, tiến hành tạo mới tài khoản user1 với số dư mặc định là 50 USD/VNĐ
      await User.create({
        username: "user1",
        password: "123", // Mật khẩu thô (sẽ tự động được mã hóa bởi pre-save hook trong userModel)
        role: "customer",
        balance: 50
      });
      console.log("Seeded default customer account: user1 / 123");
    }
  } catch (error) {
    console.error("Error seeding default users:", error.message);
  }
};

/**
 * Hàm kết nối ứng dụng với MongoDB.
 * Lấy URI kết nối từ biến môi trường MONGO_URI.
 */
const connectDB = async () => {
  try {
    // Thực hiện kết nối thông qua thư viện Mongoose
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
    
    // Sau khi kết nối thành công, tự động chạy hàm tạo tài khoản mặc định
    await seedDefaultUsers();
  } catch (error) {
    // Nếu kết nối thất bại, in ra thông báo lỗi và dừng toàn bộ chương trình (exit code 1)
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;