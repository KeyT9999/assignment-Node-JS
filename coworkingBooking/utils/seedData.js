// Thư viện Mongoose dùng để làm việc với MongoDB
const mongoose = require('mongoose');
// Thư viện bcryptjs để băm (hash) mật khẩu của tài khoản mẫu
const bcrypt = require('bcryptjs');
// Thư viện path giúp định cấu hình đường dẫn tệp tin
const path = require('path');

// Nạp cấu hình từ file .env ở thư mục gốc của dự án
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Nạp các model dữ liệu để thực hiện thao tác xóa/chèn
const User = require('../models/userModel');
const Space = require('../models/spaceModel');
const Reservation = require('../models/reservationModel');

/**
 * Hàm bất đồng bộ chính thực hiện chạy script seeding dữ liệu mẫu.
 */
const seedDB = async () => {
  try {
    // Lấy URI từ môi trường hoặc dùng URI MongoDB local làm mặc định
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sdn302_pe_template';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Xóa sạch dữ liệu cũ trong các collection trước khi tạo mới để tránh trùng lặp
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Space.deleteMany({});
    await Reservation.deleteMany({});

    // Tạo chuỗi muối (salt) và băm mật khẩu '123456' để dùng chung cho các tài khoản mẫu
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('123456', salt);
    const hashedUserPassword = await bcrypt.hash('123456', salt);

    // Thêm các người dùng mẫu vào database (1 Quản trị viên, 1 Khách hàng)
    console.log('Seeding users...');
    const users = await User.create([
      {
        username: 'admin1',
        password: hashedAdminPassword,
        role: 'admin',
        balance: 1000000 // Số dư ví ban đầu là 1,000,000
      },
      {
        username: 'user1',
        password: hashedUserPassword,
        role: 'customer',
        balance: 1000000 // Số dư ví ban đầu là 1,000,000
      }
    ]);

    // Thêm các không gian làm việc mẫu vào database (2 phòng họp mẫu)
    console.log('Seeding resources...');
    const resources = await Space.create([
      {
        spaceCode: 'MR-201',
        type: 'meetingRoom',
        capacity: 8,
        status: 'available',
        pricePerHour: 150000, // 150,000 VNĐ một giờ
        amenities: ['projector', 'whiteboard', 'air-conditioner']
      },
      {
        spaceCode: 'MR-202',
        type: 'meetingRoom',
        capacity: 8,
        status: 'available',
        pricePerHour: 160000, // 160,000 VNĐ một giờ
        amenities: ['projector', 'whiteboard', 'air-conditioner']
      }
    ]);

    console.log('Seeding completed successfully!');
    console.log('------------------------------------');
    console.log('Test Accounts:');
    console.log('- Admin   : username: admin1, password: 123456');
    console.log('- Customer: username: user1, password: 123456');
    console.log('------------------------------------');
    console.log('Sample Spaces:');
    console.log(`- Meeting Room ID: ${resources[0]._id} (Code: MR-201)`);
    console.log(`- EV Station ID  : ${resources[1]._id} (Code: EV-FAST-HANOI-01)`);
    console.log('------------------------------------');

    // Thoát script thành công (exit code 0)
    process.exit(0);
  } catch (error) {
    // In ra lỗi nếu quá trình seeding thất bại và thoát với lỗi (exit code 1)
    console.error('Seeding database failed:', error.message);
    process.exit(1);
  }
};

// Thực thi hàm seedDB
seedDB();
