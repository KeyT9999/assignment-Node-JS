require('dotenv').config();
const mongoose = require('mongoose');
const Theater = require('./models/theaterModel');
const Schedule = require('./models/scheduleModel');
const Booking = require('./models/bookingModel');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Đã kết nối MongoDB. Đang xoá dữ liệu cũ...");
        await Theater.deleteMany();
        await Schedule.deleteMany();
        await Booking.deleteMany();

        console.log("Đang thêm danh sách Rạp Phim (5 Rạp)...");
        await Theater.insertMany([
            { theaterName: "CGV Vincom Center", location: "Quận 1, TP.HCM", seatCapacity: 300, screenType: "IMAX", amenities: ["Ghế đôi", "Âm thanh Atmos", "Bắp nước"] },
            { theaterName: "Lotte Cinema Nam Sài Gòn", location: "Quận 7, TP.HCM", seatCapacity: 250, screenType: "3D", amenities: ["Ghế ngả lưng", "Phòng VIP"] },
            { theaterName: "BHD Star Thảo Điền", location: "Quận 2, TP.HCM", seatCapacity: 200, screenType: "Standard", amenities: ["Ghế đôi"] },
            { theaterName: "Galaxy Nguyễn Du", location: "Quận 1, TP.HCM", seatCapacity: 400, screenType: "Standard", amenities: ["Bắp nước", "Máy lạnh"] },
            { theaterName: "Cinestar Quốc Thanh", location: "Quận 1, TP.HCM", seatCapacity: 150, screenType: "2D", amenities: ["Âm thanh vòm"] },
            { theaterName: "Mega GS Cao Thắng", location: "Quận 3, TP.HCM", seatCapacity: 350, screenType: "IMAX", amenities: ["Phòng chiếu giường nằm"] }
        ]);

        console.log("Đang thêm danh sách Lịch Chiếu (10 Lịch chiếu)...");
        const today = new Date();
        const t1 = new Date(today); t1.setHours(18, 0, 0, 0);
        const t2 = new Date(today); t2.setHours(20, 30, 0, 0);
        const t3 = new Date(today); t3.setDate(today.getDate() + 1); t3.setHours(19, 0, 0, 0);
        const t4 = new Date(today); t4.setDate(today.getDate() + 1); t4.setHours(22, 0, 0, 0);
        const t5 = new Date(today); t5.setDate(today.getDate() + 2); t5.setHours(10, 0, 0, 0);
        
        await Schedule.insertMany([
            { movieName: "Avengers: Endgame", theaterName: "CGV Vincom Center", showTime: t1, ticketPrice: 150000, availableSeats: 300 },
            { movieName: "Avatar: The Way of Water", theaterName: "CGV Vincom Center", showTime: t2, ticketPrice: 180000, availableSeats: 300 },
            { movieName: "Mai", theaterName: "Lotte Cinema Nam Sài Gòn", showTime: t1, ticketPrice: 120000, availableSeats: 250 },
            { movieName: "Spider-Man: No Way Home", theaterName: "BHD Star Thảo Điền", showTime: t3, ticketPrice: 130000, availableSeats: 200 },
            { movieName: "Lật Mặt 7", theaterName: "Galaxy Nguyễn Du", showTime: t2, ticketPrice: 100000, availableSeats: 400 },
            { movieName: "Dune: Part Two", theaterName: "Lotte Cinema Nam Sài Gòn", showTime: t3, ticketPrice: 160000, availableSeats: 250 },
            { movieName: "Godzilla x Kong", theaterName: "Mega GS Cao Thắng", showTime: t4, ticketPrice: 140000, availableSeats: 350 },
            { movieName: "Kung Fu Panda 4", theaterName: "Cinestar Quốc Thanh", showTime: t5, ticketPrice: 90000, availableSeats: 150 },
            { movieName: "Mai", theaterName: "Galaxy Nguyễn Du", showTime: t5, ticketPrice: 95000, availableSeats: 400 },
            { movieName: "Avengers: Endgame", theaterName: "BHD Star Thảo Điền", showTime: t4, ticketPrice: 120000, availableSeats: 200 }
        ]);

        console.log("Đang thêm danh sách Đơn Đặt Vé (6 Đơn)...");
        await Booking.insertMany([
            { customerName: "Nguyễn Văn A", theaterName: "CGV Vincom Center", movieName: "Avengers: Endgame", showTime: t1, numberOfTickets: 2, totalAmount: 300000 },
            { customerName: "Trần Thị B", theaterName: "Lotte Cinema Nam Sài Gòn", movieName: "Mai", showTime: t1, numberOfTickets: 4, totalAmount: 480000 },
            { customerName: "Lê Cường", theaterName: "Galaxy Nguyễn Du", movieName: "Lật Mặt 7", showTime: t2, numberOfTickets: 1, totalAmount: 100000 },
            { customerName: "Phạm Dũng", theaterName: "BHD Star Thảo Điền", movieName: "Spider-Man: No Way Home", showTime: t3, numberOfTickets: 3, totalAmount: 390000 },
            { customerName: "Vũ Hải", theaterName: "CGV Vincom Center", movieName: "Avatar: The Way of Water", showTime: t2, numberOfTickets: 5, totalAmount: 900000 },
            { customerName: "Đinh Kiên", theaterName: "Mega GS Cao Thắng", movieName: "Godzilla x Kong", showTime: t4, numberOfTickets: 10, totalAmount: 1400000 }
        ]);

        // Cập nhật lại số ghế cho các lịch chiếu bị trừ đi số vé đã đặt
        console.log("Cập nhật lại trạng thái ghế trống...");
        await Schedule.updateOne({ movieName: "Avengers: Endgame", theaterName: "CGV Vincom Center", showTime: t1 }, { $inc: { availableSeats: -2 } });
        await Schedule.updateOne({ movieName: "Mai", theaterName: "Lotte Cinema Nam Sài Gòn", showTime: t1 }, { $inc: { availableSeats: -4 } });
        await Schedule.updateOne({ movieName: "Lật Mặt 7", theaterName: "Galaxy Nguyễn Du", showTime: t2 }, { $inc: { availableSeats: -1 } });
        await Schedule.updateOne({ movieName: "Spider-Man: No Way Home", theaterName: "BHD Star Thảo Điền", showTime: t3 }, { $inc: { availableSeats: -3 } });
        await Schedule.updateOne({ movieName: "Avatar: The Way of Water", theaterName: "CGV Vincom Center", showTime: t2 }, { $inc: { availableSeats: -5 } });
        await Schedule.updateOne({ movieName: "Godzilla x Kong", theaterName: "Mega GS Cao Thắng", showTime: t4 }, { $inc: { availableSeats: -10 } });

        console.log("Hoàn tất tạo seed dữ liệu mẫu phong phú cho Movie Booking!");
        process.exit(0);
    } catch (error) {
        console.error("Lỗi khi tạo seed dữ liệu:", error);
        process.exit(1);
    }
};

seedData();
