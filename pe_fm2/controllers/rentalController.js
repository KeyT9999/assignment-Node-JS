const Rental = require('../models/rentalModel');
const Equipment = require('../models/equipmentModel');

// Tạo đơn thuê mới
exports.createRental = async (req, res) => {
    try {
        const { equipmentId, startDate, endDate, quantity } = req.body;
        const equipment = await Equipment.findById(equipmentId);

        if (!equipment) return res.status(404).send("Equipment not found");

        // Kiểm tra số lượng tồn kho
        if (equipment.stockQuantity < quantity) {
            return res.status(400).send("Not enough stock available.");
        }

        // Trừ tồn kho
        equipment.stockQuantity -= quantity;
        await equipment.save();

        // Tính tiền đặt cọc = Phí đặt cọc * Số lượng
        const deposit = equipment.depositFee * quantity;
        const rental = new Rental({
            userId: req.user.id, // Lấy ID từ JWT token
            equipmentId,
            startDate,
            endDate,
            quantity,
            deposit,
            status: 'active',
            rentalDate: new Date()
        });
        await rental.save();
        res.status(201).json(rental);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Xử lý trả thiết bị
exports.returnEquipment = async (req, res) => {
    try {
        const rental = await Rental.findById(req.params.id);
        if (!rental) return res.status(404).send("Rental not found");
        if (rental.status === 'returned') return res.status(400).send("Already returned");

        const equipment = await Equipment.findById(rental.equipmentId);

        // Cập nhật trạng thái và hoàn trả kho
        rental.status = 'returned';
        equipment.stockQuantity += rental.quantity;

        const actualReturnDate = new Date();
        const endDate = new Date(rental.endDate);

        // TÍNH TIỀN PHẠT: Nếu ngày trả trễ hơn ngày kết thúc
        if (actualReturnDate > endDate) {
            const diffTime = Math.abs(actualReturnDate - endDate);
            const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Chuyển đổi ms sang ngày
            // Fine = 10% * giá/ngày * số ngày trễ * số lượng
            const fine = 0.1 * equipment.pricePerDay * lateDays * rental.quantity;
            rental.fineAmount = fine;
        }

        await rental.save();
        await equipment.save();
        res.json(rental);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Lấy danh sách tất cả đơn thuê
exports.getRentals = async (req, res) => {
    try {
        let query = {};
        // Nếu là Customer, chỉ cho xem đơn của chính họ
        if (req.user.role === 'customer') {
            query.userId = req.user.id;
        }
        const rentals = await Rental.find(query);
        res.json(rentals);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Tìm kiếm đơn thuê theo khoảng ngày
exports.searchByDateRange = async (req, res) => {
    try {
        const { start, end } = req.query;
        // Validation ngày tháng
        if (!start || !end || isNaN(new Date(start)) || isNaN(new Date(end))) {
            return res.status(400).send("Invalid date range.");
        }

        // Tìm đơn trong khoảng rentalDate
        const rentals = await Rental.find({
            rentalDate: { $gte: new Date(start), $lte: new Date(end) }
        });
        res.json(rentals);
    } catch (err) {
        res.status(500).send(err.message);
    }
};