# HƯỚNG DẪN KIỂM THỬ BẰNG POSTMAN (POSTMAN TESTING GUIDE)
## Áp dụng cho môn SDN302 - Lập trình Node.js & MongoDB

Tài liệu này hướng dẫn chi tiết cách thiết lập và chạy các ca kiểm thử (Test Cases) trên Postman cho cả 2 đề thi: **Co-Working Space Booking** và **Smart EV Charging Station**.

---

## I. THIẾT LẬP CHUNG (GENERAL SETUP)
* **Base URL**: `http://localhost:9999`
* **Headers chung** cho tất cả các API gửi đi (trừ Đăng ký/Đăng nhập):
  * **Key**: `Content-Type` $\rightarrow$ **Value**: `application/json`
  * **Key**: `Authorization` $\rightarrow$ **Value**: `Bearer <nhập_token_jwt_ở_đây>` (Lấy token sau khi đăng nhập thành công).

---

## II. KỊCH BẢN KIỂM THỬ CHI TIẾT (TEST SCENARIOS)

### PHẦN 1: XÁC THỰC & PHÂN QUYỀN (AUTHENTICATION & AUTHORIZATION)

#### 1. Đăng ký tài khoản Customer (Register Customer)
* **Method**: `POST`
* **URL**: `http://localhost:9999/auth/register`
* **Body (JSON)**:
  ```json
  {
    "username": "user1",
    "password": "123",
    "role": "customer"
  }
  ```
* **Expected Response (201 Created)**: Tạo thành công tài khoản customer.

#### 2. Đăng ký tài khoản Admin (Register Admin)
* **Method**: `POST`
* **URL**: `http://localhost:9999/auth/register`
* **Body (JSON)**:
  ```json
  {
    "username": "admin1",
    "password": "123",
    "role": "admin"
  }
  ```
* **Expected Response (201 Created)**: Tạo thành công tài khoản admin.

#### 3. Đăng nhập để lấy Token (Login)
* **Method**: `POST`
* **URL**: `http://localhost:9999/auth/login`
* **Body (JSON)**:
  ```json
  {
    "username": "user1",
    "password": "123"
  }
  ```
* **Expected Response (200 OK)**: Trả về một đối tượng chứa `token`. 
  > **Hành động**: Hãy copy chuỗi token này và dán vào tab **Authorization** (chọn loại **Bearer Token**) trong Postman của các request tiếp theo.

---

### PHẦN 2: QUẢN LÝ TÀI NGUYÊN (RESOURCE MANAGEMENT - ADMIN ONLY)

> **Lưu ý**: Các API này yêu cầu Header `Authorization: Bearer <ADMIN_TOKEN>`.

#### 1. Thêm mới tài nguyên (Create Space / Station)
* **Method**: `POST`
* **URL (Co-working)**: `http://localhost:9999/spaces`
* **URL (EV Charging)**: `http://localhost:9999/stations`
* **Body (JSON) - Co-working**:
  ```json
  {
    "spaceCode": "MR-201",
    "type": "meetingRoom",
    "capacity": 8,
    "status": "available",
    "pricePerHour": 150000,
    "amenities": ["projector", "whiteboard", "air-conditioner"]
  }
  ```
* **Body (JSON) - EV Charging**:
  ```json
  {
    "stationCode": "EV-FAST-01",
    "type": "fastCharge",
    "capacity": 1,
    "status": "available",
    "pricePerKwh": 3500,
    "connectors": ["CCS2", "CHAdeMO"]
  }
  ```
* **Expected Response (201 Created)**: Trả về thông tin tài nguyên vừa tạo chứa `_id` (Lưu lại `_id` này để test API Đặt lịch).

#### 2. Cập nhật trạng thái tài nguyên sang Bảo trì (Update to Maintenance)
* **Method**: `PUT`
* **URL (Co-working)**: `http://localhost:9999/spaces/<SPACE_ID>`
* **URL (EV Charging)**: `http://localhost:9999/stations/<STATION_ID>`
* **Body (JSON)**:
  ```json
  {
    "status": "maintenance"
  }
  ```
* **Expected Response (200 OK)**: Trạng thái đổi thành công sang `maintenance`.

#### 3. Lấy danh sách tài nguyên (Get All - Public/Protected)
* **Method**: `GET`
* **URL (Co-working)**: `http://localhost:9999/spaces`
* **URL (EV Charging)**: `http://localhost:9999/stations`
* **Expected Response (200 OK)**: Trả về mảng danh sách tài nguyên.

---

### PHẦN 3: ĐẶT CHỖ & TÍNH TIỀN (BOOKING & RESERVATION)

> **Lưu ý**: Các API này yêu cầu Header `Authorization: Bearer <CUSTOMER_TOKEN>`.

#### 1. Đặt lịch hợp lệ (Tự động tính tiền và trừ ví)
* **Method**: `POST`
* **URL (Co-working)**: `http://localhost:9999/reservations`
* **URL (EV Charging)**: `http://localhost:9999/sessions/book`
* **Body (JSON) - Co-working**:
  ```json
  {
    "spaceId": "<PASTE_SPACE_ID_HERE>",
    "startTime": "2026-08-01T10:00:00.000Z",
    "endTime": "2026-08-01T12:00:00.000Z",
    "note": "Need markers for the whiteboard"
  }
  ```
* **Body (JSON) - EV Charging**:
  ```json
  {
    "stationId": "<PASTE_STATION_ID_HERE>",
    "startTime": "2026-08-01T10:00:00.000Z",
    "endTime": "2026-08-01T12:00:00.000Z",
    "energyEstimate": 30
  }
  ```
* **Expected Response (201 Created)**: Đặt thành công, kiểm tra xem `totalAmount`/`totalCost` có được tự động tính toán đúng không (giờ đặt là 2 tiếng).

#### 2. Test trùng lịch (Overlap Check - Trả về 409 Conflict)
* **Hành động**: Dùng lại Request đặt lịch phía trên, gửi lại một lần nữa với thời gian giao nhau (ví dụ: `11:00` đến `13:00` cùng ngày).
* **Expected Response (409 Conflict)**:
  ```json
  {
    "message": "The selected resource is already reserved for the requested time period."
  }
  ```

#### 3. Test đặt phòng đang bảo trì (Maintenance Check - Trả về 400 hoặc 403)
* **Hành động**: Chuyển trạng thái của tài nguyên sang `maintenance` (bằng tài khoản admin), sau đó dùng tài khoản customer gửi request đặt lịch.
* **Expected Response (400 hoặc 403 Forbidden)**: Báo lỗi tài nguyên đang bảo trì.

#### 4. Test thời gian không hợp lệ (Time Validation - Trả về 400 Bad Request)
* **Case A (startTime ở quá khứ)**: Đặt `startTime` trước thời gian hiện tại của server.
* **Case B (startTime >= endTime)**: Đặt `startTime` là `15:00` và `endTime` là `14:00`.
* **Expected Response (400 Bad Request)**: Trả về thông báo lỗi validate thời gian tương ứng.

---

### PHẦN 4: KIỂM TRA PHÂN QUYỀN (RBAC GET BOOKINGS)

#### 1. Đăng nhập bằng tài khoản Customer `user1`
* Gọi `GET /reservations` (hoặc `GET /sessions`).
* **Expected Response (200 OK)**: **Chỉ trả về** các bản ghi đặt chỗ thuộc về chính `user1` (lọc tự động theo `userId` trong JWT).

#### 2. Đăng nhập bằng tài khoản Admin `admin1`
* Gói `GET /reservations` (hoặc `GET /sessions`).
* **Expected Response (200 OK)**: Trả về **tất cả** các bản ghi đặt chỗ của toàn bộ hệ thống.
