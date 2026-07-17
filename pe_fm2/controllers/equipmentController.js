const Equipment = require('../models/equipmentModel');

// Thêm thiết bị mới (Dành cho Admin để khởi tạo dữ liệu)
exports.createEquipment = async (req, res) => {
    try {
        const newEquipment = new Equipment(req.body); // Chứa các trường name, category, stockQuantity... [cite: 35]
        await newEquipment.save();
        res.status(201).json(newEquipment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Lấy danh sách thiết bị để khách hàng có thể browse [cite: 4]
exports.getAllEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.find();
        res.json(equipment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};