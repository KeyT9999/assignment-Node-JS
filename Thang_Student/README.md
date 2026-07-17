# Thang_event - Hệ thống Quản lý Đăng ký Sự kiện (Event Management System)

Đây là bài làm thực hành Practical Exam môn **SDN302** tại FPT University Đà Nẵng, triển khai RESTful API bằng **Node.js, Express, và MongoDB/Mongoose**, tuân thủ mô hình **Model-Controller-Routes (MCR)**.

---

## 1. Cấu trúc Thư mục Dự án

```text
├── config/
│   └── db.js            # Kết nối cơ sở dữ liệu MongoDB
├── controllers/
│   ├── authController.js         # Xử lý Đăng ký & Đăng nhập người dùng
│   └── registrationController.js # Xử lý đăng ký, hủy đăng ký và tra cứu sự kiện
├── models/
│   ├── userModel.js              # Định nghĩa schema Người dùng (User)
│   ├── eventModel.js             # Định nghĩa schema Sự kiện (Event)
│   └── registrationModel.js      # Định nghĩa schema Đăng ký Sự kiện (Registration)
├── middlewares/
│   ├── authMiddleware.js         # Bảo mật JWT Token (protect)
│   └── roleMiddleware.js         # Phân quyền Role-based Access Control (RBAC)
├── routes/
│   ├── authRoutes.js             # Routes xác thực (/auth/register, /auth/login)
│   └── registrationRoutes.js     # Routes chức năng đăng ký, hủy và danh sách admin
├── utils/
│   └── seedData.js               # Script nạp dữ liệu mẫu vào MongoDB từ db.json
├── db.json                       # File chứa dữ liệu sự kiện mẫu (sử dụng để seed)
├── package.json                  # Cấu hình dự án và dependencies
├── server.js                     # Điểm khởi chạy của ứng dụng Express
└── Thang_event.postman_collection.json # Bộ testcase API đầy đủ trên Postman
```

---

## 2. Hướng dẫn Khởi chạy & Thiết lập

### Bước 1: Cấu hình môi trường `.env`
Tạo file `.env` ở thư mục gốc (hoặc copy từ `.env.example`) và cập nhật các thông số:
```env
PORT=9999
MONGO_URI=mongodb://127.0.0.1:27017/Thang_event
JWT_SECRET=sdn302_secret_key
```

### Bước 2: Seed dữ liệu mẫu
Hệ thống sử dụng file `db.json` để seed danh sách các sự kiện khả dụng vào MongoDB. Chạy lệnh sau để nạp tài khoản test và dữ liệu sự kiện:
```bash
npm run seed
```

### Bước 3: Chạy ứng dụng Express
Chạy server ở chế độ phát triển (sử dụng `nodemon` để tự động khởi động lại khi sửa code):
```bash
npm run dev
```
Server sẽ chạy tại địa chỉ: `http://localhost:9999`

---

## 3. Tài khoản Test Mẫu

| Role | Username | Password | Mô tả quyền hạn |
|------|----------|----------|------------------|
| **Admin** | `admin1` | `123456` | Có quyền xem toàn bộ danh sách đăng ký và lọc theo ngày. |
| **Student** | `student1` | `123456` | Có quyền đăng ký sự kiện và hủy đăng ký sự kiện của chính mình. |
| **Student** | `student2` | `123456` | Có quyền tương tự như student1. |

---

## 4. Danh sách các API Endpoints

### 4.1. Authentication (Xác thực)
* **POST `/auth/register`**: Cho phép đăng ký tài khoản mới (mặc định role là `student`).
* **POST `/auth/login`**: Đăng nhập hệ thống, trả về thông tin user và **JWT Token** lưu trong header.

### 4.2. Student Operations (Chức năng dành cho Sinh viên)
* **POST `/registrations`**: Sinh viên đăng ký một sự kiện.
  * *Ràng buộc:* Yêu cầu gửi kèm header `Authorization: Bearer <token_student>`.
  * *Logic:* Kiểm tra xem sự kiện có tồn tại không, sinh viên đã đăng ký sự kiện này trước đó chưa, và sự kiện đã đạt **giới hạn số người đăng ký tối đa (Capacity)** chưa. Nếu đạt giới hạn, hệ thống sẽ chặn và trả về lỗi.
* **DELETE `/registrations/:registrationId`**: Sinh viên hủy đăng ký sự kiện.
  * *Ràng buộc:* Yêu cầu gửi kèm header `Authorization: Bearer <token_student>`.
  * *Logic:* Kiểm tra xem phiếu đăng ký sự kiện có thuộc về sinh viên hiện tại hay không (Ownership check). Tránh trường hợp sinh viên này hủy phiếu của sinh viên khác.

### 4.3. Admin Operations (Chức năng dành cho Quản trị viên)
* **GET `/listRegistrations`**: Lấy danh sách toàn bộ lượt đăng ký của sinh viên (Hỗ trợ phân trang).
  * *Ràng buộc:* Yêu cầu gửi kèm header `Authorization: Bearer <token_admin>`.
  * *Logic:* Trả về dữ liệu phân trang. Nếu chưa có sinh viên nào đăng ký, hệ thống trả về thông báo: `"No student has registered for any events yet."`.
* **GET `/getRegistrationsByDate`**: Lọc danh sách đăng ký sự kiện theo khoảng ngày (`startDate` và `endDate`).
  * *Ràng buộc:* Yêu cầu gửi kèm header `Authorization: Bearer <token_admin>`.
  * *Logic:* Kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc (`startDate < endDate`). Nếu không hợp lệ sẽ trả về thông báo lỗi.

---

## 5. Hướng dẫn Test bằng Postman

1. Mở Postman và **Import** file `Thang_event.postman_collection.json` từ thư mục gốc dự án.
2. Bộ sưu tập sẽ tự động tạo sẵn các Request thử nghiệm theo trình tự logic và có tích hợp sẵn scripts tự động lưu JWT token vào biến môi trường của collection:
   * **Đăng nhập Student/Admin:** Token sẽ được lưu tự động.
   * **Sinh viên đăng ký sự kiện:** `registration_id` sinh ra sẽ tự động lưu lại phục vụ cho test case Hủy đăng ký kế tiếp.
   * **Kiểm tra giới hạn Capacity:** Seed sẵn sự kiện "Spring Hackathon 2026" có dung lượng `capacity: 2`. Bạn có thể dùng `student1` và `student2` đăng ký hết 2 slot, sau đó đăng ký lượt thứ 3 sẽ bị hệ thống báo lỗi không cho phép thành công.
