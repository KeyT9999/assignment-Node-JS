// File: src/models/Question.js
// Chức năng: Định nghĩa cấu trúc dữ liệu (Schema) của Câu hỏi trong MongoDB.

// Import thư viện mongoose để xây dựng schema và model
const mongoose = require("mongoose");

// Khởi tạo Schema cho Model Question (Câu hỏi)
const questionSchema = new mongoose.Schema(
  {
    // Nội dung câu hỏi (Ví dụ: "Thủ đô của Việt Nam là gì?")
    text: {
      type: String,
      required: [true, "Question text is required"], // Bắt buộc phải nhập, nếu thiếu sẽ báo lỗi "Question text is required"
      trim: true, // Tự động cắt bỏ các khoảng trắng thừa ở đầu và cuối chuỗi
    },
    // Danh sách các đáp án lựa chọn (Ví dụ: ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Huế"])
    options: {
      type: [String], // Kiểu dữ liệu là một mảng các chuỗi (Array of Strings)
      required: [true, "Options are required"], // Bắt buộc phải có danh sách đáp án
      validate: {
        // Hàm tự định nghĩa (custom validator) để kiểm tra tính hợp lệ của dữ liệu
        validator: function (arr) {
          // Trả về true nếu mảng có từ 2 phần tử trở lên, ngược lại trả về false
          return arr.length >= 2;
        },
        // Tin nhắn lỗi hiển thị khi validator trả về false
        message: "A question must have at least 2 options",
      },
    },
    // Mảng chứa các từ khóa liên quan đến câu hỏi (dùng để tìm kiếm, lọc)
    keywords: {
      type: [String], // Kiểu dữ liệu là mảng các chuỗi
      default: [], // Giá trị mặc định là mảng rỗng nếu người dùng không truyền vào
    },
    // Chỉ mục (index) của câu trả lời chính xác trong mảng `options` (Bắt đầu từ 0)
    correctAnswerIndex: {
      type: Number, // Kiểu dữ liệu là số nguyên
      required: [true, "Correct answer index is required"], // Bắt buộc nhập
      min: 0, // Giá trị nhỏ nhất là 0 (tương ứng phần tử đầu tiên của mảng options)
    },
  },
  {
    // Tự động tạo và quản lý hai trường: createdAt (thời gian tạo) và updatedAt (thời gian cập nhật mới nhất)
    timestamps: true,
  }
);

// Tạo Model từ Schema và export để các controller có thể thực hiện thao tác CRUD trên database
module.exports = mongoose.model("Question", questionSchema);
