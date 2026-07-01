const mongoose = require("mongoose");

// Định nghĩa cấu trúc lược đồ (Schema) cho thực thể Trạm sạc điện (Station)
const stationSchema = new mongoose.Schema({
    // Mã nhận diện duy nhất của trạm sạc (ví dụ: ST01, ST02)
    stationCode: {
        type: String,
        required: [true, "Station code is required"], // Bắt buộc nhập mã trạm sạc
        unique: true,                                 // Đảm bảo mã trạm sạc là độc nhất trong hệ thống
        trim: true                                    // Tự động loại bỏ khoảng trắng thừa
    },

    // Phân loại công nghệ sạc của trạm
    type: {
        type: String,
        enum: ["FastCharge", "NormalCharge"],         // Chỉ chấp nhận sạc nhanh (FastCharge) hoặc sạc thường (NormalCharge)
        required: [true, "Station type is required"]  // Bắt buộc nhập loại trạm sạc
    },

    // Trạng thái vận hành chung của trạm sạc
    status: {
        type: String,
        enum: ["available", "maintenance", "offline"], // Sẵn sàng sử dụng, Đang bảo trì, hoặc Ngoại tuyến (mất kết nối)
        default: "available"                           // Mặc định ban đầu trạm ở trạng thái sẵn sàng (available)
    },

    // Giá tiền cho mỗi kilowatt giờ (kWh) điện tiêu thụ tại trạm này
    pricePerKwh: {
        type: Number,
        required: [true, "Price per kWh is required"], // Bắt buộc nhập đơn giá
        min: [0, "Price must be positive"]             // Đơn giá tối thiểu phải là số dương (>= 0)
    },

    // Danh sách các loại đầu nối sạc được hỗ trợ tại trạm này
    connectors: {
        type: [String],                                // Mảng các chuỗi ký tự chứa danh sách cổng kết nối sạc
        required: true,
        enum: ["Type2", "CCS2", "CHAdeMO"]             // Chỉ chấp nhận các chuẩn cổng: Type2, CCS2, hoặc CHAdeMO
    },

    // Trạng thái vật lý hiển thị xem hiện tại có xe nào đang đỗ/cắm sạc tại trạm này hay không
    isOccupied: {
        type: Boolean,
        default: false                                 // Mặc định ban đầu trạm sạc còn trống (false)
    }
});

module.exports = mongoose.model("Station", stationSchema);