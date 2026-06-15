// File: models/bookingModel.js
// Chức năng: Định nghĩa cấu trúc bản ghi thuê xe (Booking) gồm ngày thuê và tổng tiền.

// Import thư viện mongoose
const mongoose = require("mongoose");

// Khởi tạo Schema cho Đơn thuê xe (Booking)
const BookingSchema = new mongoose.Schema(
  {
    // Tên của khách hàng thuê xe
    customerName: {
      type: String,
      required: [true, "Tên khách hàng là bắt buộc"],
      trim: true,
    },
    // Biển số xe được thuê (liên kết với trường carNumber của model Car)
    carNumber: {
      type: String,
      required: [true, "Biển số xe là bắt buộc"],
      trim: true,
    },
    // Ngày bắt đầu thuê xe
    startDate: {
      type: Date,
      required: [true, "Ngày bắt đầu là bắt buộc"],
    },
    // Ngày kết thúc thuê xe
    endDate: {
      type: Date,
      required: [true, "Ngày kết thúc là bắt buộc"],
    },
    // Tổng số tiền thuê xe (Tính bằng: Số ngày thuê * Đơn giá thuê của xe)
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, "Tổng tiền không được âm"],
    },
    // Trạng thái đơn đặt xe: "active" (đang hiệu lực) hoặc "cancelled" (đã hủy)
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    // Số tiền hoàn trả khi hủy booking (nếu có)
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, "Số tiền hoàn trả không được âm"],
    },
  },
  {
    // Tự động tạoCreatedAt và updatedAt quản lý thời gian tạo/sửa đổi đơn thuê xe
    timestamps: true,
  }
);

/**
 * Middleware tiền kiểm tra (Pre-validate):
 * Chạy trước khi Mongoose tiến hành validate dữ liệu đầu vào.
 * Chức năng: Đảm bảo ngày kết thúc thuê xe (endDate) phải diễn ra sau ngày bắt đầu thuê xe (startDate).
 */
BookingSchema.pre("validate", function () {
  // Nếu cả hai ngày đều tồn tại mà ngày kết thúc nhỏ hơn hoặc bằng ngày bắt đầu
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    // Kích hoạt lỗi validate cho trường endDate
    this.invalidate("endDate", "Ngày kết thúc phải sau ngày bắt đầu");
  }
});

// Tạo và export Model Booking
module.exports = mongoose.model("Booking", BookingSchema);
