const mongoose = require('mongoose');
const User = require('./models/userModel');
const Equipment = require('./models/equipmentModel');
const Rental = require('./models/rentalModel');
const bcrypt = require('bcryptjs');

async function seedDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/fpt_rental');
        console.log("Connected to MongoDB for seeding...");

        // Xóa dữ liệu cũ
        await User.deleteMany({});
        await Equipment.deleteMany({});
        await Rental.deleteMany({});

        // 1. Thêm Users
        const hashedPw = await bcrypt.hash('123456', 10);
        const admin = await User.create({ username: 'admin1', password: hashedPw, role: 'admin' });
        const user1 = await User.create({ username: 'user1', password: hashedPw, role: 'customer' });
        const user2 = await User.create({ username: 'user2', password: hashedPw, role: 'customer' });

        // 2. Thêm Equipment
        const e1 = await Equipment.create({ 
            name: 'Sony A7III', category: 'Camera', pricePerDay: 500000, depositFee: 2000000, stockQuantity: 5 
        });
        const e2 = await Equipment.create({ 
            name: 'Tripod Carbon', category: 'Accessory', pricePerDay: 100000, depositFee: 500000, stockQuantity: 10 
        });
        const e3 = await Equipment.create({ 
            name: 'Lens 24-70mm GM', category: 'Lens', pricePerDay: 400000, depositFee: 1500000, stockQuantity: 3 
        });

        // 3. Thêm Rentals mẫu
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);

        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);

        await Rental.create([
            // Đơn thuê đang hoạt động (Active)
            {
                userId: user1._id,
                equipmentId: e1._id,
                startDate: yesterday,
                endDate: today,
                quantity: 1,
                deposit: e1.depositFee,
                status: 'active',
                rentalDate: yesterday
            },
            // Đơn thuê đã trả (Returned)
            {
                userId: user1._id,
                equipmentId: e2._id,
                startDate: lastWeek,
                endDate: yesterday,
                quantity: 2,
                deposit: e2.depositFee * 2,
                status: 'returned',
                rentalDate: lastWeek
            },
            // Đơn thuê quá hạn (Overdue - để test tiền phạt)
            {
                userId: user2._id,
                equipmentId: e3._id,
                startDate: lastWeek,
                endDate: twoDaysAgo,
                quantity: 1,
                deposit: e3.depositFee,
                status: 'active', // Vẫn active nhưng đã quá endDate
                rentalDate: lastWeek
            }
        ]);

        console.log("Seed data toàn bộ hệ thống thành công!");
    } catch (err) {
        console.error("Seed error:", err);
    } finally {
        process.exit();
    }
}

seedDB();