// File: seedData.js
// Chức năng: Tạo dữ liệu mẫu (seed) để test API Update Booking Dates
// Chạy lệnh: npm run seed

require("dotenv").config();
const mongoose = require("mongoose");
const Car = require("./models/carModel");
const Booking = require("./models/bookingModel");

const seedData = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    // Xóa dữ liệu cũ
    await Car.deleteMany({});
    await Booking.deleteMany({});
    console.log("🗑️  Đã xóa toàn bộ dữ liệu cũ (cars & bookings)");

    // ========================================
    // 1. TẠO XE MẪU
    // ========================================
    const cars = await Car.insertMany([
      {
        carNumber: "29A-TEST01",
        capacity: 4,
        pricePerDay: 500000,
        status: "available",
        features: ["Điều hòa", "GPS", "Camera hành trình"],
      },
      {
        carNumber: "30B-TEST02",
        capacity: 7,
        pricePerDay: 800000,
        status: "available",
        features: ["Điều hòa", "GPS", "Màn hình giải trí"],
      },
    ]);
    console.log(`🚗 Đã tạo ${cars.length} xe mẫu:`);
    cars.forEach((car) => {
      console.log(`   - ${car.carNumber} | ${car.capacity} chỗ | ${car.pricePerDay.toLocaleString()} VNĐ/ngày`);
    });

    // ========================================
    // 2. TẠO BOOKING MẪU
    // ========================================

    // --- Booking 1: Booking MỚI (vừa tạo → trong vòng 24h → CÓ THỂ update) ---
    // Thuê xe 29A-TEST01, 5 ngày, từ 01/07 → 06/07
    const booking1 = await Booking.create({
      customerName: "Nguyen Van A",
      carNumber: "29A-TEST01",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-06"),
      totalAmount: 5 * 500000, // 2,500,000 VNĐ
    });

    // Cập nhật trạng thái xe thành "rented"
    await Car.findOneAndUpdate({ carNumber: "29A-TEST01" }, { status: "rented" });

    console.log("\n📋 Booking 1 (MỚI - có thể update trong 24h):");
    console.log(`   ID: ${booking1._id}`);
    console.log(`   Khách: ${booking1.customerName}`);
    console.log(`   Xe: ${booking1.carNumber}`);
    console.log(`   Ngày: 01/07/2026 → 06/07/2026 (5 ngày)`);
    console.log(`   Tổng tiền: ${booking1.totalAmount.toLocaleString()} VNĐ`);
    console.log(`   Tạo lúc: ${booking1.createdAt}`);

    // --- Booking 2: Booking CŨ (>24h → KHÔNG THỂ update) ---
    // Thuê xe 30B-TEST02, 3 ngày, từ 05/07 → 08/07
    const booking2 = await Booking.create({
      customerName: "Tran Van B",
      carNumber: "30B-TEST02",
      startDate: new Date("2026-07-05"),
      endDate: new Date("2026-07-08"),
      totalAmount: 3 * 800000, // 2,400,000 VNĐ
    });

    // Chỉnh createdAt về 2 ngày trước để mô phỏng booking đã tạo quá 24h
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    await Booking.findByIdAndUpdate(booking2._id, {
      createdAt: twoDaysAgo,
    });

    await Car.findOneAndUpdate({ carNumber: "30B-TEST02" }, { status: "rented" });

    console.log("\n📋 Booking 2 (CŨ - đã quá 24h, KHÔNG thể update):");
    console.log(`   ID: ${booking2._id}`);
    console.log(`   Khách: ${booking2.customerName}`);
    console.log(`   Xe: ${booking2.carNumber}`);
    console.log(`   Ngày: 05/07/2026 → 08/07/2026 (3 ngày)`);
    console.log(`   Tổng tiền: ${booking2.totalAmount.toLocaleString()} VNĐ`);
    console.log(`   createdAt đã chỉnh về: ${twoDaysAgo.toISOString()} (quá 24h)`);

    // --- Booking 3: Booking KHÁC trên CÙNG xe 29A-TEST01 (để test trùng lịch) ---
    // Thuê xe 29A-TEST01, từ 15/07 → 20/07
    const booking3 = await Booking.create({
      customerName: "Le Thi C",
      carNumber: "29A-TEST01",
      startDate: new Date("2026-07-15"),
      endDate: new Date("2026-07-20"),
      totalAmount: 5 * 500000, // 2,500,000 VNĐ
    });

    console.log("\n📋 Booking 3 (dùng để test TRÙNG LỊCH với Booking 1):");
    console.log(`   ID: ${booking3._id}`);
    console.log(`   Khách: ${booking3.customerName}`);
    console.log(`   Xe: ${booking3.carNumber}`);
    console.log(`   Ngày: 15/07/2026 → 20/07/2026 (5 ngày)`);
    console.log(`   Tổng tiền: ${booking3.totalAmount.toLocaleString()} VNĐ`);

    // ========================================
    // 3. HƯỚNG DẪN TEST
    // ========================================
    console.log("\n" + "=".repeat(60));
    console.log("🧪 HƯỚNG DẪN TEST VỚI POSTMAN");
    console.log("=".repeat(60));

    console.log(`
✅ Test Case 1 - GIẢM NGÀY (dư tiền):
   PUT http://localhost:3000/bookings/${booking1._id}/update-dates
   Body: { "startDate": "2026-07-01", "endDate": "2026-07-04" }
   → 5 ngày xuống 3 ngày → DƯ 1,000,000 VNĐ

✅ Test Case 2 - TĂNG NGÀY (thiếu tiền):
   PUT http://localhost:3000/bookings/${booking1._id}/update-dates
   Body: { "startDate": "2026-07-01", "endDate": "2026-07-08" }
   → 5 ngày lên 7 ngày → THIẾU 1,000,000 VNĐ

❌ Test Case 3 - QUÁ 24H (bị từ chối):
   PUT http://localhost:3000/bookings/${booking2._id}/update-dates
   Body: { "startDate": "2026-07-05", "endDate": "2026-07-10" }
   → Booking đã tạo quá 24h → BỊ TỪ CHỐI

❌ Test Case 4 - TRÙNG LỊCH (bị từ chối):
   PUT http://localhost:3000/bookings/${booking1._id}/update-dates
   Body: { "startDate": "2026-07-14", "endDate": "2026-07-18" }
   → Trùng với Booking 3 (15/07-20/07) → BỊ TỪ CHỐI
    `);

    console.log("✅ Seed dữ liệu thành công! Server sẵn sàng để test.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error.message);
    process.exit(1);
  }
};

seedData();
