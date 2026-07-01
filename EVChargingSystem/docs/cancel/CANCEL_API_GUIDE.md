# Hướng Dẫn API Cancel Charging - EV Charging System

---

## 1. Những Gì Đã Làm

### 1.1. Sửa file `models/sessionModel.js`
- Thêm field `refundAmount` (Number, default: 0) — lưu số tiền hoàn trả
- Thêm field `cancelledAt` (Date, default: null) — lưu thời điểm huỷ

### 1.2. Thêm file `controllers/sessionController.js`
Thêm function `cancelSession` với logic:
1. Kiểm tra session tồn tại (404 nếu không)
2. Kiểm tra quyền sở hữu — chỉ chủ sở hữu mới huỷ được (403)
3. Kiểm tra status — chỉ `"pending"` mới huỷ được (400)
4. Kiểm tra thời gian — không huỷ nếu `startTime <= now` (400)
5. Tính % hoàn tiền:
   - `>= 2 giờ` trước giờ bắt đầu → **100%**
   - `< 2 giờ` trước giờ bắt đầu → **70%**
6. Cộng tiền refund vào `balance` của user
7. Cập nhật session: `status = "cancelled"`, `refundAmount`, `cancelledAt`

### 1.3. Sửa file `routes/sessionRoutes.js`
Thêm route:
```
POST /sessions/cancel/:id  →  cancelSession (Customer only)
```

### 1.4. Thêm file `seed.js`
Script seed tạo dữ liệu test gồm:
- 2 users: `admin1/123`, `user1/123` (balance: 500)
- 2 stations: FastCharge, NormalCharge
- 4 sessions với các kịch bản test khác nhau

### 1.5. Cập nhật `package.json`
Thêm script:
```json
"seed": "node seed.js"
```

### 1.6. Cập nhật `EVChargingSystem.postman_collection.json`
- Thêm request **Cancel Session (Customer)**
- Thêm biến collection `sessionId`
- "Get Sessions" tự động lưu `sessionId`

---

## 2. Chuẩn Bị Môi Trường

### Yêu cầu
- Node.js
- MongoDB (đang chạy trên `localhost:27017`)
- Postman (hoặc curl)

### Cài đặt
```bash
cd EVChargingSystem
npm install
```

### Tạo file `.env`
```
PORT=9999
MONGO_URI=mongodb://127.0.0.1:27017/EVChargingSystem
JWT_SECRET=sdn302_pe_secret
JWT_EXPIRES=1d
```

---

## 3. Seed Dữ Liệu Test

Chạy lệnh sau để tạo dữ liệu mẫu:

```bash
npm run seed
```

Kết quả sẽ in ra terminal các session ID. Copy các ID này để dùng trong Postman.

### Dữ liệu được tạo:

| Session | startTime | Mục đích test |
|---|---|---|
| Session 1 | +3 giờ (so với hiện tại) | Test refund 100% |
| Session 2 | +30 phút | Test refund 70% |
| Session 3 | -1 giờ (quá khứ) | Test không được huỷ |
| Session 4 | +5 giờ (nhưng đã cancelled) | Test không huỷ được nữa |

---

## 4. Khởi Động Server

```bash
npm run dev
```

Server chạy tại `http://localhost:9999`

---

## 5. Hướng Dẫn Test Bằng Postman (Chi Tiết Từng Bước)

### Bước 1: Import Collection
1. Mở Postman
2. File → Import → Chọn `EVChargingSystem.postman_collection.json`
3. Kiểm tra biến `baseUrl` = `http://localhost:9999`

### Bước 2: Login Admin
- **Request:** `01. Authentication` → `Register Admin`
  - Body: `{"username": "admin1", "password": "123", "role": "admin"}`
  - Nhấn Send (có thể bỏ qua nếu seed đã tạo rồi)

- **Request:** `01. Authentication` → `Login Admin`
  - Body: `{"username": "admin1", "password": "123"}`
  - Nhấn Send → Token tự động lưu

### Bước 3: Tạo Station (Admin)
- **Request:** `02. Stations` → `Create Station (Admin)`
  - Body: 
    ```json
    {
        "stationCode": "ST-FAST-001",
        "type": "FastCharge",
        "status": "available",
        "pricePerKwh": 0.35,
        "connectors": ["CCS2", "CHAdeMO"]
    }
    ```
  - Nhấn Send → `stationId` tự động lưu

### Bước 4: Login Customer
- **Request:** `01. Authentication` → `Login Customer`
  - Body: `{"username": "user1", "password": "123"}`
  - Nhấn Send → Token tự động lưu (ghi đè token cũ)

### Bước 5: Book Session (để test cancel)
- **Request:** `03. Sessions` → `Book Session (Customer)`
  - Body (tự động sinh):
    ```json
    {
        "stationId": "{{stationId}}",
        "startTime": "{{startTime}}",
        "endTime": "{{endTime}}"
    }
    ```
  - Nhấn Send → Session mới được tạo, copy `_id` từ response

### Bước 6: Get Sessions (để lấy sessionId tự động)
- **Request:** `03. Sessions` → `Get Sessions`
  - Nhấn Send → `sessionId` tự động được cập nhật = session đầu tiên

### Bước 7: Test Cancel Session

#### Test 1: Huỷ session (cách >= 2h) → Refund 100%
1. Đảm bảo `{{sessionId}}` là ID của Session 1 (start +3h)
2. **Request:** `03. Sessions` → `Cancel Session (Customer)`
3. Nhấn Send

**Kết quả mong đợi:**
```json
{
    "message": "Session cancelled successfully",
    "session": {
        "_id": "...",
        "status": "cancelled",
        "totalCost": 5.25,
        "refundAmount": 5.25,
        "refundPercentage": 100,
        "remainingBalance": 500.00
    }
}
```

#### Test 2: Huỷ session (cách < 2h) → Refund 70%
1. Đặt `{{sessionId}}` = ID của Session 2 (start +30 phút)
2. Gửi request **Cancel Session (Customer)**

**Kết quả mong đợi:**
```json
{
    "message": "Session cancelled successfully",
    "session": {
        "_id": "...",
        "status": "cancelled",
        "totalCost": 5.25,
        "refundAmount": 3.68,
        "refundPercentage": 70,
        "remainingBalance": "..."
    }
}
```

#### Test 3: Huỷ session đã qua giờ → Lỗi 400
1. Đặt `{{sessionId}}` = ID của Session 3 (start -1h, quá khứ)
2. Gửi request

**Kết quả:**
```json
{
    "message": "Cannot cancel a session that has already started or passed"
}
```

#### Test 4: Huỷ session đã cancelled → Lỗi 400
1. Đặt `{{sessionId}}` = ID của Session 4 (status: cancelled)
2. Gửi request

**Kết quả:**
```json
{
    "message": "Cannot cancel session with status \"cancelled\". Only pending sessions can be cancelled."
}
```

#### Test 5: Customer huỷ session của người khác → Lỗi 403
1. Login bằng **Admin**
2. Đặt `{{sessionId}}` = ID session của user1
3. Gửi request **Cancel Session**

**Kết quả:**
```json
{
    "message": "You can only cancel your own sessions"
}
```

---

## 6. Test Bằng Curl (Nếu Không Dùng Postman)

### Login & lấy token
```bash
curl -s -X POST http://localhost:9999/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"123"}' | jq -r '.token'
```

### Cancel session
```bash
TOKEN="<token_tu_login>"
SESSION_ID="<session_id_tu_seed>"

curl -X POST "http://localhost:9999/sessions/cancel/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## 7. Kiểm Tra Kết Quả

Sau khi cancel thành công:
- **Balance** của user được cộng thêm tiền refund
- **Session status** chuyển thành `"cancelled"`
- **refundAmount** và **cancelledAt** được lưu trong session document

Chạy `GET /sessions` để xem toàn bộ thông tin.

---

## 8. Test Nhanh Bằng Seed Script

```bash
# Chạy seed (reset dữ liệu)
npm run seed

# Sau đó mở Postman, login user1 và test từng session ID được in ra
```
