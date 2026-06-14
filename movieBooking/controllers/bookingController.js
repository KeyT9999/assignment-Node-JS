// File: controllers/bookingController.js
// Chức năng: Xử lý các nghiệp vụ (Controller) liên quan đến đặt vé phim bao gồm:
// lấy lịch sử đặt vé, tạo vé mới (giảm số lượng ghế còn trống), cập nhật vé (thay đổi số lượng vé và tính lại số ghế trống),
// hủy vé (xóa bản ghi đặt vé và hoàn trả lại số ghế trống cho lịch chiếu tương ứng).

const Booking = require('../models/bookingModel');
const Schedule = require('../models/scheduleModel');

// 1. API GET /bookings: Lấy danh sách toàn bộ các đơn đặt vé xem phim
exports.getAllBookings = async (req, res) => {
    try {
        // Tìm toàn bộ dữ liệu đơn đặt vé từ MongoDB
        const bookings = await Booking.find();
        // Trả về danh sách vé với mã HTTP 200 (Thành công) dưới dạng JSON
        res.status(200).json(bookings);
    } catch (error) {
        // Trả về mã lỗi HTTP 500 (Lỗi hệ thống) nếu xảy ra lỗi trong quá trình truy vấn
        res.status(500).json({ message: error.message });
    }
};

// 2. API POST /bookings: Tạo một đơn đặt vé xem phim mới
exports.createBooking = async (req, res) => {
    try {
        // Nhận các thông tin cần thiết từ body của HTTP request
        const {
            customerName,
            theaterName,
            movieName,
            showTime,
            numberOfTickets
        } = req.body;

        // Tìm lịch chiếu (Schedule) khớp chính xác với rạp, phim và thời gian chiếu
        const schedule = await Schedule.findOne({
            theaterName,
            movieName,
            showTime: new Date(showTime)
        });

        // Nếu không tìm thấy lịch chiếu tương thích, trả về lỗi HTTP 404
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Kiểm tra xem số lượng ghế trống còn đủ cho số lượng vé yêu cầu không
        if (schedule.availableSeats < numberOfTickets) {
            return res.status(400).json({ message: 'Not enough available seats' });
        }

        // Tính toán tổng số tiền dựa trên: Số lượng vé * Đơn giá của lịch chiếu đó
        const totalAmount = numberOfTickets * schedule.ticketPrice;

        // Tiến hành lưu bản ghi đặt vé mới vào MongoDB
        const booking = await Booking.create({
            customerName,
            theaterName,
            movieName,
            showTime,
            numberOfTickets,
            totalAmount
        });

        // Cập nhật số ghế trống còn lại trong lịch chiếu: trừ đi số lượng vé khách vừa đặt
        schedule.availableSeats -= numberOfTickets;
        // Lưu lại sự thay đổi này vào bộ sưu tập Schedule
        await schedule.save();

        // Trả về thông tin đơn đặt vé vừa tạo cùng mã HTTP 201 (Tạo mới thành công)
        res.status(201).json(booking);
    } catch (error) {
        // Trả về mã lỗi HTTP 500 nếu có lỗi bất ngờ xảy ra
        res.status(500).json({ message: error.message });
    }
};

// 3. API PUT /bookings/:bookingId: Cập nhật thông tin đơn đặt vé (Đổi vé)
exports.updateBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Nhận dữ liệu cập nhật từ HTTP request body
        const {
            customerName,
            theaterName,
            movieName,
            showTime,
            numberOfTickets
        } = req.body;

        // Tìm đơn đặt vé cũ trong hệ thống bằng ID
        const oldBooking = await Booking.findById(bookingId);

        // Trả về lỗi 404 nếu không tìm thấy đơn đặt vé cần sửa
        if (!oldBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Tìm lịch chiếu tương ứng với các thông tin phim mới (hoặc cũ)
        const schedule = await Schedule.findOne({
            theaterName,
            movieName,
            showTime: new Date(showTime)
        });

        // Trả về lỗi 404 nếu lịch chiếu mới không tồn tại
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Tính chênh lệch số lượng vé: (Số lượng mới - Số lượng cũ)
        // Ví dụ: Đặt từ 2 vé lên 3 vé -> chênh lệch = +1 ghế (Cần trừ thêm 1 ghế trống ở lịch chiếu)
        // Đặt từ 3 vé xuống 1 vé -> chênh lệch = -2 ghế (Cần cộng trả lại 2 ghế trống ở lịch chiếu)
        const seatDifference = numberOfTickets - oldBooking.numberOfTickets;

        // Nếu số lượng vé tăng thêm và rạp không còn đủ số ghế trống đáp ứng chênh lệch này
        if (schedule.availableSeats < seatDifference) {
            return res.status(400).json({ message: 'Not enough available seats' });
        }

        // Tính lại tổng số tiền thanh toán mới
        const totalAmount = numberOfTickets * schedule.ticketPrice;

        // Thực hiện cập nhật thông tin đơn đặt vé trong MongoDB
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                customerName,
                theaterName,
                movieName,
                showTime,
                numberOfTickets,
                totalAmount
            },
            { new: true } // Tham số { new: true } dùng để trả về bản ghi sau khi đã cập nhật xong
        );

        // Cập nhật lại số ghế trống của lịch chiếu dựa trên số chênh lệch
        schedule.availableSeats -= seatDifference;
        await schedule.save();

        // Trả về thông tin vé đã cập nhật cùng mã HTTP 200 (Thành công)
        res.status(200).json(updatedBooking);
    } catch (error) {
        // Trả về mã lỗi HTTP 500 nếu xảy ra lỗi
        res.status(500).json({ message: error.message });
    }
};

// 4. API DELETE /bookings/:bookingId: Hủy đơn đặt vé xem phim
exports.deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Tìm đơn đặt vé cần xóa bằng ID
        const booking = await Booking.findById(bookingId);

        // Nếu không tìm thấy vé, trả về lỗi HTTP 404
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Tìm lịch chiếu tương ứng của đơn đặt vé đó
        const schedule = await Schedule.findOne({
            theaterName: booking.theaterName,
            movieName: booking.movieName,
            showTime: booking.showTime
        });

        // Nếu tìm thấy lịch chiếu, ta thực hiện hoàn trả lại số ghế trống
        if (schedule) {
            schedule.availableSeats += booking.numberOfTickets; // Cộng lại số ghế của vé đã đặt
            await schedule.save(); // Lưu lại thay đổi số ghế trống
        }

        // Thực hiện xóa đơn đặt vé khỏi cơ sở dữ liệu MongoDB
        await Booking.findByIdAndDelete(bookingId);

        // Trả về thông báo thành công cùng mã HTTP 200
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        // Trả về lỗi hệ thống 500 nếu thất bại
        res.status(500).json({ message: error.message });
    }
};