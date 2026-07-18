/**
 * @file authController.js
 * @description Controller xử lý các logic nghiệp vụ về xác thực người dùng bao gồm:
 * Đăng ký tài khoản mới (register), Đăng nhập (login), và Lấy thông tin tài khoản hiện tại (me).
 */

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const authConfig = require('../config/authConfig');

/**
 * Hàm tiện ích để chuẩn hóa dữ liệu User trả về Client (Lọc sạch các dữ liệu nhạy cảm).
 * Tự động thêm trường liên kết (assignmentField) nếu có cấu hình từ môi trường.
 *
 * @param {Object} user - Tài liệu người dùng từ MongoDB.
 * @returns {Object} Dữ liệu người dùng đã được định dạng chuẩn an toàn.
 */
const publicUser = user => {
  const value = {
    userId: user._id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    balance: user.balance,
    createdAt: user.createdAt
  };
  
  // Nếu có trường liên kết đặc thù, đính kèm giá trị của trường đó vào kết quả phản hồi (nếu không có thì mặc định null).
  if (authConfig.assignmentField) {
    value[authConfig.assignmentField] = user[authConfig.assignmentField] || null;
  }
  return value;
};

/**
 * Xử lý đăng ký tài khoản người dùng mới.
 * Áp dụng các quy tắc ràng buộc nghiêm ngặt: kiểm tra đầu vào rỗng, mật khẩu tối thiểu 6 ký tự,
 * kiểm tra trùng lặp tên đăng nhập, chặn tạo vai trò Quản lý qua API công khai (nếu tắt),
 * và kiểm tra tính bắt buộc của trường liên kết đối với các vai trò được cấu hình.
 *
 * @async
 * @function register
 * @param {express.Request} req - Đối tượng Request từ Express.
 * @param {express.Response} res - Đối tượng Response gửi về Client.
 * @param {express.NextFunction} next - Chuyển tiếp tới error handler.
 */
exports.register = async (req, res, next) => {
  try {
    // Chuẩn hóa dữ liệu đầu vào từ body của request
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const fullName = String(req.body.fullName || username).trim();
    const requestedRole = req.body.role || authConfig.defaultRole;

    // RÀNG BUỘC 1: Tên đăng nhập, mật khẩu, và họ tên không được để trống.
    if (!username || !password || !fullName) {
      return res.status(400).json({ message: 'username, password and fullName are required' });
    }
    
    // RÀNG BUỘC 2: Mật khẩu bắt buộc phải từ 6 ký tự trở lên.
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must contain at least 6 characters' });
    }
    
    // RÀNG BUỘC 3: Vai trò đăng ký phải nằm trong tập vai trò được cho phép (allowedRoles).
    if (!authConfig.allowedRoles.includes(requestedRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // RÀNG BUỘC 4: Nếu vai trò thuộc nhóm Quản lý mà hệ thống KHÔNG CHO PHÉP tạo tài khoản Quản lý qua API công khai.
    if (authConfig.managerRoles.includes(requestedRole) && !authConfig.allowManagerCreationViaApi) {
      return res.status(400).json({ message: authConfig.managerCreationMessage });
    }
    
    // RÀNG BUỘC 5: Kiểm tra xem username đã tồn tại trong DB chưa để tránh xung đột tài khoản.
    if (await User.exists({ username })) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // RÀNG BUỘC 6: Kiểm tra yêu cầu ràng buộc liên kết tài nguyên (assignmentField).
    // Nếu vai trò yêu cầu liên kết nằm trong danh sách bắt buộc (assignmentRequiredRoles) mà Client không truyền dữ liệu liên kết.
    const assignment = authConfig.assignmentField ? req.body[authConfig.assignmentField] : undefined;
    if (authConfig.assignmentRequiredRoles.includes(requestedRole) && !assignment) {
      return res.status(400).json({ message: `${authConfig.assignmentField} is required for role ${requestedRole}` });
    }

    // Chuẩn bị dữ liệu để lưu vào Database.
    const data = {
      username,
      password,
      fullName,
      role: requestedRole,
      // Chỉ tặng số dư khởi điểm (welcomeBalance) đối với tài khoản thuộc vai trò mặc định (defaultRole).
      balance: requestedRole === authConfig.defaultRole ? authConfig.welcomeBalance : 0
    };
    
    // Bổ sung thuộc tính liên kết động vào dữ liệu bản ghi.
    if (authConfig.assignmentField) data[authConfig.assignmentField] = assignment || null;

    // Lưu người dùng mới vào Database.
    const user = await User.create(data);
    
    // Trả về mã thành công 210 và dữ liệu tài khoản định dạng an toàn.
    return res.status(201).json(publicUser(user));
  } catch (error) {
    return next(error);
  }
};

/**
 * Xử lý đăng nhập tài khoản người dùng.
 * Xác thực thông tin username/password, kiểm tra xem tài khoản có bị vô hiệu hóa (isActive === false) không.
 * Tạo mã token JWT chứa các thông tin định danh và quyền của người dùng nếu thông tin hợp lệ.
 *
 * @async
 * @function login
 * @param {express.Request} req - Đối tượng Request từ Express.
 * @param {express.Response} res - Đối tượng Response gửi về Client.
 * @param {express.NextFunction} next - Chuyển tiếp tới error handler.
 */
exports.login = async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    
    // Lấy thông tin tài khoản, bắt buộc lấy kèm thuộc tính password (vì trường này mặc định select: false).
    const user = await User.findOne({ username }).select('+password');

    // Kiểm tra tài khoản tồn tại và so khớp mật khẩu bằng hàm so sánh bcrypt.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // RÀNG BUỘC: Nếu tài khoản đã bị vô hiệu hóa bởi Quản lý (isActive === false), từ chối đăng nhập.
    if (!user.isActive) {
      return res.status(403).json({ message: authConfig.deactivatedMessage });
    }

    // Thiết lập payload cho mã JWT Token.
    const payload = {
      userId: user._id,
      role: user.role,
      fullName: user.fullName
    };
    
    // Đính kèm thông tin liên kết động vào payload token nếu có.
    if (authConfig.assignmentField) {
      payload[authConfig.assignmentField] = user[authConfig.assignmentField] || null;
    }

    // Ký và tạo token với thời hạn cấu hình từ biến môi trường.
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: authConfig.jwtExpiresIn
    });
    
    // Trả về token và dữ liệu thông tin cá nhân dạng an toàn cho Client.
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy thông tin tài khoản cá nhân hiện tại dựa trên token JWT gửi lên từ Client.
 * 
 * @async
 * @function me
 * @param {express.Request} req - Đối tượng Request (có chứa thông tin req.user gán bởi middleware verifyToken).
 * @param {express.Response} res - Đối tượng Response gửi về Client.
 * @param {express.NextFunction} next - Chuyển tiếp tới error handler.
 */
exports.me = async (req, res, next) => {
  try {
    // Tìm người dùng trong DB dựa trên userId trích xuất từ JWT token giải mã.
    const user = await User.findById(req.user.userId);
    
    // Kiểm tra tài khoản có tồn tại và còn trạng thái kích hoạt hay không.
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account is unavailable' });
    }
    
    // Trả về thông tin người dùng.
    return res.json(publicUser(user));
  } catch (error) {
    return next(error);
  }
};

