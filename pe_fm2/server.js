const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Load biến môi trường từ file .env

const app = express();
app.use(express.json()); // Middleware để đọc JSON từ body của request

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fpt_rental';

// Kết nối tới CSDL MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Đăng ký các Route (Đường dẫn API)
app.use('/auth', require('./routes/authRoutes'));
app.use('/rentals', require('./routes/rentalRoutes'));
app.use('/users', require('./routes/userRoutes'));

// Route đặc biệt cho việc tìm kiếm theo ngày (Top-level route theo đề bài)
app.get('/rentalsByDate', 
    require('./middlewares/authMiddleware').verifyToken, 
    require('./controllers/rentalController').searchByDateRange
);

// Khởi chạy Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));