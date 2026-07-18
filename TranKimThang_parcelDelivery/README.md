# Parcel Delivery Management System (TranKimThang_parcelDelivery)

Dự án Xây dựng hệ thống quản lý giao hàng (SDN302 Practical Exam). Hệ thống được triển khai bằng **Node.js, Express, và MongoDB** theo mô hình **MCR (Model-Controller-Route)**, tích hợp **JWT Authentication** và **RBAC (Role-based Access Control)**.

---

## 1. Hướng dẫn cài đặt và chạy ứng dụng

### Yêu cầu hệ thống
* **Node.js** (v16 trở lên)
* **MongoDB Server** (chạy tại địa chỉ `mongodb://127.0.0.1:27017`)

### Các bước cài đặt
1. Giải nén/Truy cập thư mục dự án `TranKimThang_parcelDelivery`
2. Tạo file cấu hình `.env` từ file mẫu:
   ```bash
   cp .env.example .env
   # Hoặc sao chép thủ công và đảm bảo thông tin MONGO_URI khớp với MongoDB local của bạn
   ```
3. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
4. Chạy dữ liệu mẫu (Seeding Database):
   ```bash
   npm run seed
   ```
   *Lệnh này sẽ tự động dọn dẹp các bản ghi cũ và tạo các tài khoản Test cùng các Khu vực giao hàng mẫu (Delivery Zones).*

5. Khởi chạy ứng dụng ở chế độ Development:
   ```bash
   npm run dev
   ```
   *Ứng dụng sẽ chạy tại cổng `9999` (hoặc tự động đổi sang cổng rảnh tiếp theo như `10000` nếu cổng `9999` bị bận).*

---

## 2. Tài khoản thử nghiệm mẫu (Sample Test Accounts)

Sau khi chạy lệnh `npm run seed`, cơ sở dữ liệu sẽ chứa các tài khoản sau:

| Role | Username | Password | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin1` | `123456` | Có toàn quyền quản lý Delivery Zones và cập nhật trạng thái mọi Shipment |
| **Customer** | `user1` | `123456` | Chỉ có quyền tạo Shipment mới và xem danh sách Shipment cá nhân của mình |

---

## 3. Cấu trúc thư mục dự án (MCR Pattern)

Dự án tuân thủ nghiêm ngặt cấu trúc MCR:
* `models/`
  * `userModel.js` - Định nghĩa Schema cho User (username, password, role, createdAt)
  * `deliveryZoneModel.js` - Định nghĩa Schema cho Delivery Zone (zoneCode, status, maxWeightKg, baseFee, feePerKm, feePerKg)
  * `shipmentModel.js` - Định nghĩa Schema cho Shipment (userId, zoneId, totalFee, status, v.v.)
* `controllers/`
  * `authController.js` - Xử lý Đăng ký/Đăng nhập & tạo token JWT
  * `deliveryZoneController.js` - Quản lý các Khu vực giao hàng (Xem danh sách, thêm mới)
  * `shipmentController.js` - Quản lý đơn hàng (Tạo đơn, tính phí tự động, lọc danh sách theo vai trò, cập nhật trạng thái)
* `routes/`
  * `authRoutes.js`
  * `deliveryZoneRoutes.js`
  * `shipmentRoutes.js`
* `middlewares/`
  * `authMiddleware.js` - Xác thực JWT token từ header `Authorization: Bearer <token>`
* `utils/`
  * `seedData.js` - Script nạp dữ liệu mẫu
  * `startDev.js` - Script khởi chạy server an toàn chống xung đột cổng

---

## 4. Hướng dẫn kiểm thử Postman (Postman Testing Guide)

File collection đi kèm: **`TranKimThang_parcelDelivery.postman_collection.json`**

### Quy trình chạy Test:
1. **Đăng nhập (POST /auth/login)**:
   * Body gồm `username` và `password`.
   * Trả về JWT token dùng để xác thực các API sau.
2. **Quản lý Delivery Zone (POST & GET /delivery-zones)**:
   * **GET `/delivery-zones`**: Lấy danh sách khu vực giao hàng.
   * **POST `/delivery-zones`**: Thêm mới khu vực giao hàng (Yêu cầu vai trò **Admin**).
3. **Tạo đơn hàng (POST /shipments)**:
   * Yêu cầu JWT token của Customer/Admin.
   * Hệ thống tự động kiểm tra xem khu vực giao hàng có bị tạm dừng (`status: "suspended"`) không và khối lượng hàng có vượt mức tối đa (`maxWeightKg`) không.
   * **Tự động tính phí (`totalFee`)**:
     * `Basic fee = baseFee + (distanceKm × feePerKm) + (weightKg × feePerKg)`
     * Nếu loại giao hàng `deliveryType` là `"express"` -> Nhân thêm `1.4` (tăng 40%).
     * Nếu giá trị hàng hóa `declaredValue` > `2,000,000` -> Cộng thêm phí bảo hiểm `1%` giá trị declaredValue.
4. **Xem đơn hàng (GET /shipments)**:
   * **Admin**: Nhận được toàn bộ đơn hàng trong hệ thống.
   * **Customer**: Chỉ nhận được các đơn hàng do chính mình tạo ra.
5. **Cập nhật trạng thái đơn (PATCH /shipments/:id/status)**:
   * Chỉ vai trò **Admin** mới có quyền thực hiện.
   * Trạng thái đi theo chu kỳ cố định: `pending` → `accepted` → `in_transit` → `delivered`.
   * Có thể chuyển từ `pending` → `cancelled`.
   * Nếu đơn hàng đã ở trạng thái `delivered` hoặc `cancelled`, hệ thống sẽ chặn không cho phép cập nhật nữa.
