/**
 * @file authController.js
 * @description Controller quản lý các nghiệp vụ Xác thực & Phân quyền cho hệ thống EV Charging System.
 * Bao gồm Đăng ký tài khoản (register) và Đăng nhập (login).
 */

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Xử lý đăng ký tài khoản khách hàng hoặc quản trị viên mới.
 * Tự động cộng số dư khuyến mãi $50 cho khách hàng nếu hệ thống chạy ở chế độ PRICING_MODE = EV.
 * 
 * @async
 * @function register
 * @param {express.Request} req
 * @param {express.Response} res
 */
const register = async (req, res) => {
  try {
    const { username, password, role, balance } = req.body;
    
    // Kiểm tra các trường dữ liệu bắt buộc
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }
    
    // Kiểm tra tên đăng nhập đã được sử dụng hay chưa
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        message: 'Username already exists'
      });
    }
    
    // Gán vai trò mặc định nếu không truyền
    const userRole = role || 'customer';
    
    // Mã hóa mật khẩu bảo mật bằng bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Tính toán số dư khởi tạo
    let userBalance = balance;
    if (userBalance === undefined) {
      // Nghiệp vụ đặc thù: Nếu chế độ giá điện EV hoạt động, tự động tặng $50 số dư khuyến mãi cho vai trò customer
      if (userRole === 'customer' && process.env.PRICING_MODE === 'EV') {
        userBalance = 50;
      }  else {
        userBalance = 0;
      }
    }
    
    // Tạo tài khoản mới vào cơ sở dữ liệu
    const user = await User.create({
      username,
      password: hashedPassword,
      role: userRole,
      balance: userBalance
    });
    
    // Chuẩn bị dữ liệu trả về (không gửi mật khẩu)
    const userResponse = {
      _id: user._id,
      username: user.username,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt
    };
    return res.status(201).json(userResponse);
  }  catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({
      message: 'Server error during registration'
    });
  }
};

/**
 * Xử lý đăng nhập tài khoản.
 * Đối khớp tên đăng nhập & so sánh mật khẩu đã mã hóa.
 * Tạo JWT token chứa thông tin nhận diện cơ bản phục vụ cho các request tiếp theo.
 * 
 * @async
 * @function login
 * @param {express.Request} req
 * @param {express.Response} res
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Kiểm tra đầu vào
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }
    
    // Tìm kiếm người dùng dựa trên tên đăng nhập
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }
    
    // So sánh mật khẩu dạng thô với mật khẩu băm trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }
    
    // Tạo mã token JWT có hiệu lực 30 ngày chứa: id, username, role
    const token = jwt.sign({
      id: user._id,
      username: user.username,
      role: user.role
    }, process.env.JWT_SECRET || 'sdn302_secret_key', {
      expiresIn: '30d'
    });
    
    // Trả về token và dữ liệu thông tin tài khoản cơ bản cho Client
    return res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        balance: user.balance
      }
    });
  }  catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      message: 'Server error during login'
    });
  }
};

module.exports = {
  register,
  login
};

