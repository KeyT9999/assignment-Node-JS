# Equipment Rental Management System

Practical Examination SDN302

## 1. Yêu cầu hệ thống & Cài đặt
- **Node.js**: Phiên bản 18+ (để dùng tính năng `--watch`).
- **MongoDB**: Chạy tại `localhost:27017`.
- **Cài đặt**:
  ```bash
  npm install
  ```
- **Khởi tạo dữ liệu mẫu (Database Seed)**:
  ```bash
  node seed.js
  ```
- **Chạy ứng dụng**:
  ```bash
  npm run dev
  ```

---

## 2. Tài khoản thử nghiệm (Sample Accounts)
| Role | Username | Password | Mô tả |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin1` | `123456` | Có toàn quyền quản lý |
| **Customer** | `user1` | `123456` | Khách hàng có 1 đơn thuê active |
| **Customer** | `user2` | `123456` | Khách hàng có đơn quá hạn (để test tiền phạt) |

---

## 3. Dữ liệu thiết bị mẫu (Sample Equipment)
- **Sony A7III** (Category: Camera, Price: 500,000, Deposit: 2,000,000)
- **Tripod Carbon** (Category: Accessory, Price: 100,000, Deposit: 500,000)
- **Lens 24-70mm GM** (Category: Lens, Price: 400,000, Deposit: 1,500,000)

---

## 4. Hướng dẫn Test bằng Postman (Step-by-Step)

### A. Authentication
1. **Đăng ký (Register)**:
   - `POST` `http://localhost:3000/auth/register`
   - Body (JSON): `{ "username": "newuser", "password": "password123" }`
2. **Đăng nhập (Login)**:
   - `POST` `http://localhost:3000/auth/login`
   - Body (JSON): `{ "username": "admin1", "password": "123456" }`
   - **Lưu ý**: Lấy chuỗi `token` trả về để dùng cho các bước sau.
3. **Cấu hình Token**:
   - Trong Postman, chọn tab **Authorization**, Type: **Bearer Token**, dán chuỗi token vào.

### B. User Management (Chỉ Admin)
1. **Lấy danh sách User**:
   - `GET` `http://localhost:3000/users`
2. **Xóa User**:
   - `DELETE` `http://localhost:3000/users/:id`
   - *Lưu ý*: Nếu xóa `user1`, server sẽ báo `"Cannot delete users with active rentals."`

### C. Rental Management
1. **Lấy danh sách thiết bị để lấy ID**:
   - Hiện tại chưa có API riêng, bạn có thể xem trong Database hoặc lấy từ danh sách đơn thuê.
2. **Tạo đơn thuê (Create Rental)**:
   - `POST` `http://localhost:3000/rentals`
   - Body (JSON): 
     ```json
     {
       "equipmentId": "ID_LAY_TU_DB",
       "startDate": "2024-03-20",
       "endDate": "2024-03-25",
       "quantity": 1
     }
     ```
3. **Trả thiết bị (Return - PATCH)**:
   - `PATCH` `http://localhost:3000/rentals/:id/return`
   - Hệ thống sẽ tự động tính `fineAmount` nếu trễ hạn so với `endDate`.
4. **Xem lịch sử thuê**:
   - `GET` `http://localhost:3000/rentals`
   - (Admin thấy tất cả, Customer thấy đơn của mình).

### D. Search & Reports
1. **Tìm kiếm theo ngày (Search by Date)**:
   - `GET` `http://localhost:3000/rentalsByDate?start=2024-03-01&end=2024-03-31`
   - Kết quả: Các đơn có ngày tạo trong tháng 3.
