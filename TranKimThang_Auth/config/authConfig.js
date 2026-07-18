/**
 * @file authConfig.js
 * @description Quản lý và kiểm tra tính hợp lệ của các cấu hình bảo mật, phân quyền (RBAC),
 * và các thiết lập nghiệp vụ liên quan đến tài khoản người dùng từ biến môi trường (.env).
 */

/**
 * Chuyển đổi một chuỗi danh sách phân tách bằng dấu phẩy thành một mảng các giá trị duy nhất, không trùng lặp và không rỗng.
 *
 * @param {string|undefined} value - Chuỗi đầu vào từ biến môi trường.
 * @param {string[]} [fallback=[]] - Giá trị mặc định nếu đầu vào không xác định.
 * @returns {string[]} Mảng các chuỗi đã lọc sạch khoảng trắng và các phần tử trùng lặp.
 */
const list = (value, fallback = []) => {
  const source = value === undefined ? fallback.join(',') : value;
  return [...new Set(String(source).split(',').map(item => item.trim()).filter(Boolean))];
};

/**
 * Chuyển đổi một giá trị chuỗi cấu hình thành kiểu Boolean (true/false).
 *
 * @param {any} value - Giá trị cần kiểm tra.
 * @param {boolean} [fallback=false] - Giá trị mặc định nếu không có cấu hình.
 * @returns {boolean} Trả về true nếu chuỗi là 'true' (không phân biệt hoa thường), ngược lại là false.
 */
const boolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

// --- Đọc cấu hình từ biến môi trường và chuẩn hóa ---

// Danh sách các vai trò (roles) được phép trong hệ thống. Mặc định là ['admin', 'customer'].
const allowedRoles = list(process.env.AUTH_ALLOWED_ROLES, ['admin', 'customer']);

// Vai trò mặc định gán cho người dùng mới khi đăng ký mà không truyền vai trò cụ thể. Mặc định: 'customer'.
const defaultRole = process.env.AUTH_DEFAULT_ROLE || 'customer';

// Danh sách các vai trò có quyền Quản lý (Manager). Mặc định là ['admin'].
const managerRoles = list(process.env.AUTH_MANAGER_ROLES, ['admin']);

// Tên trường liên kết (ví dụ: 'assignedWarehouse', 'assignedStation') dùng để ràng buộc người dùng với một tài nguyên cụ thể.
const assignmentField = (process.env.AUTH_ASSIGNMENT_FIELD || '').trim();

// --- Kiểm tra tính hợp lệ của cấu hình hệ thống ---

// RÀNG BUỘC: Vai trò mặc định bắt buộc phải nằm trong danh sách các vai trò được phép.
if (!allowedRoles.includes(defaultRole)) {
  throw new Error('AUTH_DEFAULT_ROLE must be included in AUTH_ALLOWED_ROLES');
}

// RÀNG BUỘC: Mọi vai trò quản lý phải là vai trò hợp lệ trong danh sách được phép.
if (managerRoles.some(role => !allowedRoles.includes(role))) {
  throw new Error('Every AUTH_MANAGER_ROLES value must be included in AUTH_ALLOWED_ROLES');
}

// RÀNG BUỘC: Nếu có sử dụng trường liên kết (assignmentField), nó phải tuân thủ định dạng tên biến Javascript hợp lệ.
if (assignmentField && !/^[A-Za-z_$][\w$]*$/.test(assignmentField)) {
  throw new Error('AUTH_ASSIGNMENT_FIELD must be a valid JavaScript field name');
}

/**
 * Xuất ra cấu hình dưới dạng một Object đóng băng (Object.freeze) để tránh bị thay đổi trong thời gian chạy.
 */
module.exports = Object.freeze({
  allowedRoles,                                                           // Mảng vai trò hợp lệ
  defaultRole,                                                            // Vai trò mặc định
  managerRoles,                                                           // Mảng vai trò quản lý
  // Chế độ đăng ký: 'manager_only' (chỉ quản lý được tạo tài khoản) hoặc 'public' (tất cả mọi người)
  registrationMode: process.env.AUTH_REGISTRATION_MODE === 'manager_only' ? 'manager_only' : 'public',
  // Có cho phép tạo thêm tài khoản quản lý qua API đăng ký công khai hay không
  allowManagerCreationViaApi: boolean(process.env.AUTH_ALLOW_MANAGER_CREATION_VIA_API),
  // Thông báo trả về khi vi phạm chặn tạo quản lý qua API
  managerCreationMessage: process.env.AUTH_MANAGER_CREATION_MESSAGE || 'Cannot register another manager via API',
  // Thông báo trả về khi đăng nhập vào tài khoản bị vô hiệu hóa
  deactivatedMessage: process.env.AUTH_DEACTIVATED_MESSAGE || 'Account is deactivated. Contact your manager.',
  assignmentField,                                                        // Tên trường liên kết
  assignmentRef: process.env.AUTH_ASSIGNMENT_REF || 'Resource',          // Tên Model liên kết cho trường đó (Mongoose ref)
  assignmentRequiredRoles: list(process.env.AUTH_ASSIGNMENT_REQUIRED_ROLES), // Các vai trò bắt buộc phải đi kèm với liên kết này khi đăng ký
  welcomeBalance: Number(process.env.AUTH_WELCOME_BALANCE || 0),          // Số dư ví khuyến mãi mặc định khi người dùng đăng ký
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d'                        // Thời hạn sử dụng của JWT token
});

