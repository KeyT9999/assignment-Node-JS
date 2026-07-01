# Hướng Dẫn Test API Cancel Charging

## 1. Mô Tả API

**Endpoint:** `POST /sessions/cancel/:id`

**Authentication:** Bearer Token (Customer)

**Quyền truy cập:** Chỉ Customer có thể huỷ session của chính mình.

---

## 2. Luật Hoàn Tiền (Refund Policy)

| Điều kiện | % Hoàn tiền | Mô tả |
|---|---|---|
| Huỷ trước giờ bắt đầu **>= 2 giờ** | **100%** | Hoàn lại toàn bộ số tiền đã trả |
| Huỷ trước giờ bắt đầu **< 2 giờ** | **70%** | Hoàn lại 70% số tiền đã trả |
| Đã đến giờ hoặc quá giờ bắt đầu | **Không được huỷ** | Trả về lỗi 400 |

Điều kiện bổ sung:
- Chỉ huỷ được session có status = `"pending"`
- Chỉ huỷ được session của chính mình

---

## 3. Các Bước Chuẩn Bị

### 3.1. Khởi động MongoDB
```bash
# Đảm bảo MongoDB đang chạy trên localhost:27017
mongod
```

### 3.2. Cài đặt dependencies
```bash
cd EVChargingSystem
npm install
```

### 3.3. Tạo file .env
```
PORT=9999
MONGO_URI=mongodb://127.0.0.1:27017/EVChargingSystem
JWT_SECRET=sdn302_pe_secret
JWT_EXPIRES=1d
```

### 3.4. Chạy seed data
```bash
npm run seed
```
Lệnh này sẽ tạo:
- 2 users: `admin1/123` và `user1/123`
- 2 stations: FastCharge và NormalCharge
- 4 sessions với các trạng thái khác nhau để test

### 3.5. Khởi động server
```bash
npm run dev
```

---

## 4. Import Postman Collection

1. Mở Postman
2. File → Import → Chọn file `EVChargingSystem.postman_collection.json`
3. Collection sẽ tự động có đầy đủ các biến môi trường

---

## 5. Test Flow Chi Tiết (bằng Postman)

### Bước 1: Login Customer
```
POST {{baseUrl}}/auth/login
Body:
{
    "username": "user1",
    "password": "123"
}
```
→ Token tự động lưu vào biến `{{token}}`

### Bước 2: Lấy danh sách sessions
```
GET {{baseUrl}}/sessions
```
→ Copy `_id` của session bạn muốn test (từ seed data)

### Bước 3a: Test - Huỷ session (cách >= 2h) → Refund 100%
```
POST {{baseUrl}}/sessions/cancel/SESSION_ID_1
```
**Kỳ vọng:** Status 200, `refundPercentage: 100`, `refundAmount` = `totalCost`

### Bước 3b: Test - Huỷ session (cách < 2h) → Refund 70%
```
POST {{baseUrl}}/sessions/cancel/SESSION_ID_2
```
**Kỳ vọng:** Status 200, `refundPercentage: 70`, `refundAmount` = `totalCost * 0.7`

### Bước 3c: Test - Huỷ session đã qua giờ → Lỗi
```
POST {{baseUrl}}/sessions/cancel/SESSION_ID_3
```
**Kỳ vọng:** Status 400, message: "Cannot cancel a session that has already started or passed"

### Bước 3d: Test - Huỷ session đã cancelled → Lỗi
```
POST {{baseUrl}}/sessions/cancel/SESSION_ID_4
```
**Kỳ vọng:** Status 400, message: "Cannot cancel session with status 'cancelled'"

### Bước 3e: Test - Huỷ session của người khác → Lỗi
Đăng nhập bằng admin, sau đó gọi cancel với session của user1
```
POST {{baseUrl}}/sessions/cancel/SESSION_ID_1
```
**Kỳ vọng:** Status 403, message: "You can only cancel your own sessions"

### Bước 4: Kiểm tra balance sau khi huỷ
```
GET {{baseUrl}}/sessions
```
→ Kiểm tra field `userId.balance` của user1 đã tăng lên tương ứng với số tiền refund.

---

## 6. Test Bằng Seed Data Script

Nếu không dùng Postman, bạn có thể test trực tiếp bằng script seed đã built-in sẵn:

```bash
npm run seed
```

Sau đó dùng curl hoặc Postman để gọi API.
