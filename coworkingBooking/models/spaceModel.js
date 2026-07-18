// Thư viện Mongoose dùng để quản lý schema và kết nối MongoDB
const mongoose = require('mongoose');

// Định nghĩa cấu trúc lược đồ (Schema) cho Không gian làm việc (Spaces/Resources)
const resourceSchema = new mongoose.Schema({
  // Mã định danh của không gian làm việc (ví dụ: MR-201, EV-FAST-01)
  spaceCode: {
    type: String,
    required: [true, 'Space code is required'], // Bắt buộc phải có mã không gian
    unique: true, // Mã này phải là duy nhất, không trùng lặp
    trim: true // Loại bỏ khoảng trắng ở đầu và cuối
  },
  // Loại phòng hoặc loại không gian (ví dụ: meetingRoom, workspace, EVChargingStation)
  type: {
    type: String,
    required: [true, 'Type is required'] // Bắt buộc phải nhập loại phòng/không gian
  },
  // Sức chứa của không gian (số lượng người tối đa hoặc số cổng sạc)
  capacity: {
    type: Number,
    default: 1 // Mặc định sức chứa là 1
  },
  // Trạng thái hiện tại của không gian làm việc
  status: {
    type: String,
    enum: ['available', 'maintenance', 'offline'], // Chỉ cho phép 3 trạng thái: khả dụng, đang bảo trì, hoặc ngoại tuyến
    default: 'available' // Mặc định là sẵn sàng sử dụng (available)
  },
  // Giá thuê hoặc phí sử dụng theo mỗi giờ
  pricePerHour: {
    type: Number,
    required: [true, 'Price per unit is required'] // Bắt buộc phải nhập giá thuê
  },
  // Danh sách các tiện ích đi kèm (ví dụ: wifi, máy chiếu, bảng viết...)
  amenities: {
    type: [String],
    default: [] // Mặc định là một mảng rỗng nếu không có tiện ích nào
  }
});

// Xuất model 'Space' dựa trên resourceSchema để sử dụng
module.exports = mongoose.model('Space', resourceSchema);
