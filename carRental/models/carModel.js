// File: models/carModel.js
// Chức năng: Định nghĩa cấu trúc của xe ô tô (Car) gồm giá thuê, trạng thái trống hay đã thuê.

// Import thư viện mongoose
const mongoose = require("mongoose");

// Khởi tạo Schema cho Xe (Car)
const CarSchema = new mongoose.Schema(
  {
    // Biển số xe (Ví dụ: "29A-12345")
    carNumber: {
      type: String,
      required: [true, "Biển số xe là bắt buộc"], // Bắt buộc phải nhập
      unique: true, // Giá trị là duy nhất trong toàn hệ thống (không trùng biển số)
      trim: true, // Cắt bỏ khoảng trắng thừa đầu/cuối
    },
    // Sức chứa/Số chỗ ngồi của xe (Ví dụ: 4, 7 chỗ)
    capacity: {
      type: Number,
      required: [true, "Sức chứa xe là bắt buộc"],
      min: [1, "Sức chứa tối thiểu là 1"], // Sức chứa phải từ 1 chỗ trở lên
    },
    // Trạng thái hiện tại của xe
    status: {
      type: String,
      enum: {
        // Chỉ chấp nhận 3 giá trị trạng thái này
        values: ["available", "rented", "maintenance"],
        message: "Trạng thái phải là: available, rented, hoặc maintenance",
      },
      default: "available", // Mặc định khi thêm xe mới là sẵn sàng cho thuê (available)
    },
    // Đơn giá thuê trên mỗi ngày (Ví dụ: 500000 VNĐ/ngày)
    pricePerDay: {
      type: Number,
      required: [true, "Giá thuê/ngày là bắt buộc"],
      min: [0, "Giá thuê không được âm"], // Không cho phép giá trị âm
    },
    // Các tiện ích đi kèm của xe (Ví dụ: ["Điều hòa", "GPS", "Bản đồ"])
    features: {
      type: [String], // Kiểu dữ liệu là một mảng các chuỗi
      default: [], // Mặc định là mảng rỗng
    },
  },
  {
    // Tự động thêm và quản lý thời gian bản ghi được tạo (createdAt) và cập nhật (updatedAt)
    timestamps: true,
  }
);

// Tạo Model Car từ Schema và export để sử dụng ở các Controller
module.exports = mongoose.model("Car", CarSchema);
