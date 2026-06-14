// File: controllers/theaterController.js
// Chức năng: Xử lý các API liên quan đến Rạp chiếu phim (Theater) bao gồm lấy thông tin rạp và tạo rạp chiếu mới.

const Theater = require("../models/theaterModel");

// 1. API GET /theaters: Lấy danh sách toàn bộ các rạp chiếu phim hiện có
exports.getAllTheaters = async (req, res) => {
  try {
    // Tìm kiếm toàn bộ danh sách rạp chiếu phim từ MongoDB
    const theaters = await Theater.find();
    // Trả về dữ liệu JSON kèm mã HTTP 200 (Thành công)
    res.status(200).json(theaters);
  } catch (error) {
    // Trả về lỗi HTTP 500 nếu gặp lỗi truy vấn dữ liệu
    res.status(500).json({ message: error.message });
  }
};

// 2. API POST /theaters: Tạo một rạp chiếu phim mới vào hệ thống
exports.createTheater = async (req, res) => {
  try {
    // Lưu thông tin rạp chiếu mới từ HTTP request body vào cơ sở dữ liệu
    const theater = await Theater.create(req.body);
    // Trả về thông tin rạp vừa tạo và mã HTTP 201 (Thành công tạo mới)
    res.status(201).json(theater);
  } catch (error) {
    // Trả về mã HTTP 400 nếu dữ liệu gửi lên không đúng định dạng của Schema
    res.status(400).json({ message: error.message });
  }
};

