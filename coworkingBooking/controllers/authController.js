// Nhập model User để thực hiện truy vấn và thao tác trên collection users
const User = require('../models/userModel');
// Thư viện bcryptjs để băm mật khẩu bảo mật
const bcrypt = require('bcryptjs');
// Thư viện jsonwebtoken để ký (tạo) token JWT cho người dùng
const jwt = require('jsonwebtoken');

/**
 * API đăng ký tài khoản mới (Register).
 * POST /auth/register
 */
const register = async (req, res) => {
  try {
    const { username, password, role, balance } = req.body;

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào (bắt buộc phải có tên đăng nhập và mật khẩu)
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Kiểm tra xem tên đăng nhập đã tồn tại trong hệ thống chưa
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Xác định vai trò của người dùng (mặc định là customer)
    const userRole = role || 'customer';

    // Băm mật khẩu (hashing) trước khi lưu vào cơ sở dữ liệu để bảo mật thông tin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Xác định số dư tài khoản ban đầu
    let userBalance = balance;
    if (userBalance === undefined) {
      // Nếu là khách hàng (customer) và chế độ tính tiền là 'EV' (Sạc xe điện)
      // thì tặng số dư mặc định ban đầu là 50 đơn vị tiền
      if (userRole === 'customer' && process.env.PRICING_MODE === 'EV') {
        userBalance = 50;
      } else {
        userBalance = 0;
      }
    }

    // Tạo bản ghi người dùng mới trong database
    const user = await User.create({
      username,
      password: hashedPassword,
      role: userRole,
      balance: userBalance
    });

    // Tạo đối tượng phản hồi loại bỏ mật khẩu để đảm bảo an toàn thông tin
    const userResponse = {
      _id: user._id,
      username: user.username,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt
    };

    return res.status(201).json(userResponse);
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * API đăng nhập hệ thống (Login).
 * POST /auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra yêu cầu nhập đủ username và password
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Tìm kiếm người dùng dựa trên username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // So sánh mật khẩu khách hàng gửi lên với mật khẩu băm đã lưu trong cơ sở dữ liệu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Ký token JWT chứa thông tin id, username và role của người dùng
    // Token này có hiệu lực trong vòng 30 ngày (30d)
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'sdn302_secret_key',
      { expiresIn: '30d' }
    );

    // Trả về token và thông tin người dùng cho phía client lưu trữ
    return res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = {
  register,
  login
};
