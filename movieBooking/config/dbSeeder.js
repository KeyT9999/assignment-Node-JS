// File: config/dbSeeder.js
// Chức năng: Khởi tạo (seed) dữ liệu mẫu ban đầu cho rạp chiếu phim (Theaters) và lịch chiếu phim (Schedules)
// nếu cơ sở dữ liệu MongoDB hiện chưa có bản ghi nào. Giúp ứng dụng hoạt động ngay mà không cần nhập thủ công.

// Nhập các model Mongoose để tương tác với MongoDB
const Theater = require("../models/theaterModel");
const Schedule = require("../models/scheduleModel");

const seedDatabase = async () => {
  try {
    // 1. Khởi tạo dữ liệu mẫu cho Rạp chiếu phim (Theater)
    // Đếm số lượng bản ghi rạp phim hiện có trong DB
    const theaterCount = await Theater.countDocuments();
    if (theaterCount === 0) {
      // Nếu chưa có rạp nào, tạo mới 3 rạp mẫu chất lượng cao
      await Theater.create([
        {
          theaterName: "Cineplex Downtown",
          location: "123 Main St, Cityville",
          seatCapacity: 150,
          screenType: "IMAX",
          amenities: ["Recliner seats", "Dolby Atmos", "Snack Bar"],
        },
        {
          theaterName: "Megaplex Midtown",
          location: "456 Broadway, Metrocity",
          seatCapacity: 120,
          screenType: "3D",
          amenities: ["Dolby Atmos", "Snack Bar"],
        },
        {
          theaterName: "Starlight Premium",
          location: "789 Luxury Blvd, Uptown",
          seatCapacity: 80,
          screenType: "Standard",
          amenities: ["Recliner seats", "Snack Bar"],
        },
      ]);
      console.log("Mock theaters seeded successfully.");
    }

    // 2. Khởi tạo dữ liệu mẫu cho Lịch chiếu phim (Schedule)
    // Đếm số lượng bản ghi lịch chiếu hiện có trong DB
    const scheduleCount = await Schedule.countDocuments();
    if (scheduleCount === 0) {
      // Thiết lập ngày chiếu: 1 lịch vào ngày mai và 1 lịch vào ngày kia để dễ chạy thử
      // Ngày mai lúc 20:00 (8 giờ tối)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(20, 0, 0, 0);

      // Ngày kia lúc 18:30 (6 rưỡi tối)
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 2);
      nextDay.setHours(18, 30, 0, 0);

      // Tạo các lịch chiếu mẫu cho 3 phim: Inception, Avatar, Interstellar
      await Schedule.create([
        {
          movieName: "Inception",
          theaterName: "Cineplex Downtown",
          showTime: tomorrow,
          ticketPrice: 12.5,
          availableSeats: 100, // Số ghế trống ban đầu là 100
        },
        {
          movieName: "Avatar: The Way of Water",
          theaterName: "Megaplex Midtown",
          showTime: tomorrow,
          ticketPrice: 15.0,
          availableSeats: 80,  // Số ghế trống ban đầu là 80
        },
        {
          movieName: "Interstellar",
          theaterName: "Starlight Premium",
          showTime: nextDay,
          ticketPrice: 10.0,
          availableSeats: 50,  // Số ghế trống ban đầu là 50
        },
        {
          movieName: "Inception",
          theaterName: "Megaplex Midtown",
          showTime: nextDay,
          ticketPrice: 11.0,
          availableSeats: 90,  // Số ghế trống ban đầu là 90
        },
      ]);
      console.log("Mock schedules seeded successfully.");
    }
  } catch (error) {
    // Log lỗi nếu quá trình nạp dữ liệu thất bại
    console.error("Error seeding database:", error.message);
  }
};

module.exports = seedDatabase;

