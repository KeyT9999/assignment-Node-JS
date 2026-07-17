const User = require('../models/userModel');
const Rental = require('../models/rentalModel');

// Lấy danh sách tất cả người dùng (Chỉ Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Không trả về trường password
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Xóa người dùng (Chỉ Admin)
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // KIỂM TRA: Xem người dùng có đơn thuê nào chưa trả không
        const activeRentals = await Rental.findOne({ userId, status: 'active' });
        if (activeRentals) {
            return res.status(400).send("Cannot delete users with active rentals.");
        }

        // Nếu không có đơn thuê active, tiến hành xóa
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) return res.status(404).send("User not found");
        
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};