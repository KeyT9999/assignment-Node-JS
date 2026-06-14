// File: src/models/Quiz.js
// Chức năng: Định nghĩa cấu trúc dữ liệu (Schema) của bộ đề Quiz trong MongoDB.

// Import thư viện mongoose
const mongoose = require("mongoose");

// Khởi tạo Schema cho Model Quiz (Bộ đề trắc nghiệm)
const quizSchema = new mongoose.Schema(
  {
    // Tiêu đề của bộ Quiz (Ví dụ: "Địa lý thế giới", "Kiến thức Node.js")
    title: {
      type: String,
      required: [true, "Quiz title is required"], // Bắt buộc phải nhập tiêu đề
      trim: true, // Cắt bỏ khoảng trắng thừa đầu/cuối
    },
    // Mô tả ngắn gọn về bộ Quiz (Ví dụ: "Bộ câu hỏi kiểm tra kiến thức cơ bản về Express")
    description: {
      type: String,
      required: [true, "Quiz description is required"], // Bắt buộc phải nhập mô tả
      trim: true,
    },
    // Mảng chứa danh sách các ID của các câu hỏi thuộc bộ Quiz này
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId, // Kiểu dữ liệu là ObjectId của MongoDB (khoá ngoại)
        ref: "Question", // Tham chiếu tới Model "Question". Cho phép sử dụng phương thức .populate() để nạp dữ liệu chi tiết của Question
      },
    ],
  },
  {
    // Tự động thêm hai trường createdAt và updatedAt quản lý thời gian bản ghi được tạo/cập nhật
    timestamps: true,
  }
);

// Tạo và export Model Quiz
module.exports = mongoose.model("Quiz", quizSchema);
