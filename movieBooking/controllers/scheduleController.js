// File: controllers/scheduleController.js
// Chức năng: Xử lý các API liên quan đến Lịch chiếu phim (Schedule) như lấy danh sách lịch chiếu và tạo lịch chiếu mới.

const Schedule = require("../models/scheduleModel");

// 1. API GET /schedules: Lấy danh sách toàn bộ các lịch chiếu phim hiện có
exports.getAllSchedules = async (req, res) => {
  try {
    // Tìm kiếm toàn bộ lịch chiếu phim từ cơ sở dữ liệu MongoDB
    const schedules = await Schedule.find();
    // Trả về kết quả cho client dạng JSON với mã HTTP 200 (Thành công)
    res.status(200).json(schedules);
  } catch (error) {
    // Trả về mã lỗi HTTP 500 nếu gặp sự cố truy vấn DB
    res.status(500).json({ message: error.message });
  }
};

// 2. API POST /schedules: Tạo một lịch chiếu phim mới (Dành cho việc mở rộng rạp/phim mới)
exports.createSchedule = async (req, res) => {
  try {
    // Tạo bản ghi lịch chiếu mới từ dữ liệu JSON trong HTTP request body
    const schedule = await Schedule.create(req.body);
    // Trả về bản ghi vừa tạo kèm mã HTTP 201 (Tạo mới thành công)
    res.status(201).json(schedule);
  } catch (error) {
    // Trả về mã HTTP 400 (Yêu cầu không hợp lệ) nếu dữ liệu truyền lên không khớp cấu trúc Schema
    res.status(400).json({ message: error.message });
  }
};

// Thêm vào cuối file scheduleController.js
//GET /schedules/search?theaterName=Megaplex Midtown&showTime=2026-06-11T20:00:00.000Z


// 3. API GET /schedules/search: Tìm các phim có cùng rạp và giờ chiếu
exports.getMoviesByTheaterAndShowtime = async (req, res) => {
  try {
    const { theaterName, showTime } = req.query;

    // Kiểm tra xem client đã truyền đủ tham số chưa
    if (!theaterName || !showTime) {
      return res.status(400).json({
        message: "Vui lòng cung cấp đầy đủ theaterName và showTime dưới dạng query parameters."
      });
    }

    // Định dạng showTime về kiểu Date để truy vấn chính xác trong MongoDB
    const cleanShowTime = typeof showTime === "string" ? showTime.trim() : showTime;
    const queryDate = new Date(cleanShowTime);

    // Kiểm tra tính hợp lệ của ngày tháng để tránh lỗi CastError
    if (isNaN(queryDate.getTime())) {
      return res.status(400).json({
        message: "Định dạng showTime không hợp lệ. Vui lòng truyền chuỗi thời gian hợp lệ."
      });
    }

    // Tìm kiếm các lịch chiếu khớp cả rạp và giờ chiếu
    const schedules = await Schedule.find({
      theaterName: theaterName,
      showTime: queryDate
    });

    // Trích xuất danh sách các phim (hoặc trả về toàn bộ thông tin lịch chiếu nếu muốn)
    // Dùng Map để lấy ra mảng chứa thông tin phim (tên phim, giá vé, số ghế trống)
    const movies = schedules.map(item => ({
      movieName: item.movieName,
      ticketPrice: item.ticketPrice,
      availableSeats: item.availableSeats
    }));

    res.status(200).json({
      success: true,
      count: movies.length,
      theaterName,
      showTime,
      movies
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
