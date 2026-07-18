/**
 * @file dropDB.js
 * @description Script dọn dẹp (drop) các cơ sở dữ liệu bị xung đột trùng tên trong MongoDB.
 * Phục vụ cho việc reset trạng thái ban đầu của hệ thống để bắt đầu nạp lại seed sạch sẽ.
 */

const mongoose = require('mongoose');

/**
 * Kết nối tới Mongo server, lấy danh sách database và tiến hành drop (xóa) các database xung đột trùng tên.
 * 
 * @async
 * @function dropDatabases
 */
const dropDatabases = async () => {
  const connectionString = 'mongodb://127.0.0.1:27017';
  console.log('Connecting to MongoDB...');
  
  try {
    const conn = await mongoose.connect(connectionString);
    const adminDb = conn.connection.db.admin();
    
    // Lấy danh sách toàn bộ cơ sở dữ liệu trên server MongoDB hiện tại
    const dbs = await adminDb.listDatabases();
    const dbNames = dbs.databases.map(db => db.name);
    console.log('Current databases:', dbNames);

    // Danh sách tên cơ sở dữ liệu có khả năng bị trùng/xung đột cần dọn dẹp
    const targets = ['eVChargingSystem', 'EVChargingSystem', 'evChargingSystem'];
    
    for (const target of targets) {
      // Nếu database thực tế trùng khớp với một trong các tên mục tiêu (không phân biệt chữ hoa/thường)
      if (dbNames.some(name => name.toLowerCase() === target.toLowerCase())) {
        console.log(`Dropping conflicting database: ${target}...`);
        
        // Chuyển kết nối tới database cần xóa và gọi lệnh drop
        const dbToDrop = conn.connection.useDb(target);
        await dbToDrop.dropDatabase();
        console.log(`Successfully dropped ${target}`);
      }
    }
    
    console.log('All conflicting databases dropped successfully! You can now seed and run the project.');
  } catch (error) {
    console.error('Error dropping database:', error.message);
  } finally {
    // Ngắt kết nối MongoDB một cách an toàn
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

dropDatabases();

