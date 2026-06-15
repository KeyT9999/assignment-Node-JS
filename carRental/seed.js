// File: seed.js
// Chức năng: Tạo dữ liệu mẫu cho việc test API cancel booking
// Cách chạy: node seed.js

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Car = require("./models/carModel");
const Booking = require("./models/bookingModel");

const seed = async () => {
  try {
    await connectDB();

    // Xóa dữ liệu cũ để tránh trùng lặp
    await Car.deleteMany({});
    await Booking.deleteMany({});
    console.log("Đã xóa dữ liệu cũ.");

    // --- Tạo dữ liệu Xe (Cars) ---
    const cars = await Car.create([
      {
        carNumber: "29A-888.88",
        capacity: 7,
        pricePerDay: 1200000,
        status: "available",
        features: ["GPS", "Camera hành trình", "Cửa sổ trời"],
      },
      {
        carNumber: "30A-111.11",
        capacity: 5,
        pricePerDay: 500000,
        status: "maintenance",
        features: ["GPS"],
      },
    ]);
    console.log(`Đã tạo ${cars.length} xe.`);

    // --- Tạo dữ liệu Booking ---

    // Booking 1: Đã tạo cách đây 48h (>24h) => KHÔNG thể cancel
    const oldDate = new Date();
    oldDate.setHours(oldDate.getHours() - 48);

    const booking1 = await Booking.create({
      customerName: "Nguyễn Văn A",
      carNumber: "29A-888.88",
      startDate: new Date("2026-06-20"),
      endDate: new Date("2026-06-25"),
      totalAmount: 5 * 1200000, // 6.000.000
      status: "active",
      createdAt: oldDate,
      updatedAt: oldDate,
    });
    console.log(`Booking 1 (cũ, >24h): ${booking1._id}`);

    // Booking 2: Vừa tạo cách đây 2h (<24h) => CÓ thể cancel
    const recentDate = new Date();
    recentDate.setHours(recentDate.getHours() - 2);

    const booking2 = await Booking.create({
      customerName: "Trần Kim Thắng",
      carNumber: "29A-888.88",
      startDate: new Date("2026-06-26"),
      endDate: new Date("2026-06-28"),
      totalAmount: 2 * 1200000, // 2.400.000
      status: "active",
      createdAt: recentDate,
      updatedAt: recentDate,
    });
    console.log(`Booking 2 (mới, <24h): ${booking2._id}`);

    // Booking 3: Booking active khác cho xe khác
    const booking3 = await Booking.create({
      customerName: "Lê Thị B",
      carNumber: "30A-111.11",
      startDate: new Date("2026-06-22"),
      endDate: new Date("2026-06-24"),
      totalAmount: 2 * 500000, // 1.000.000
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Booking 3 (active): ${booking3._id}`);

    // Cập nhật trạng thái xe cho phù hợp
    await Car.findOneAndUpdate(
      { carNumber: "29A-888.88" },
      { status: "rented" }
    );

    console.log("\n=== Seed dữ liệu thành công! ===");
    console.log("\n--- Tóm tắt dữ liệu ---");
    console.log(`Xe 29A-888.88: rented (1.200.000 VND/ngày)`);
    console.log(`Xe 30A-111.11: maintenance (500.000 VND/ngày)`);
    console.log(`\nBooking 1 (${booking1._id}): Nguyễn Văn A - 29A-888.88 - Đã tạo 48h trước`);
    console.log(`  => Test cancel: Sẽ báo lỗi quá 24h`);
    console.log(`\nBooking 2 (${booking2._id}): Trần Kim Thắng - 29A-888.88 - Đã tạo 2h trước`);
    console.log(`  => Test cancel: Sẽ thành công, refund 90% = ${(2400000 * 0.9).toLocaleString()} VND`);
    console.log(`\nBooking 3 (${booking3._id}): Lê Thị B - 30A-111.11 - Vừa tạo`);
    console.log(`  => Test cancel: Sẽ thành công, refund 90% = ${(1000000 * 0.9).toLocaleString()} VND`);

    // Đóng kết nối
    await mongoose.connection.close();
    console.log("\nĐã đóng kết nối MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi seed dữ liệu:", error.message);
    process.exit(1);
  }
};

seed();
