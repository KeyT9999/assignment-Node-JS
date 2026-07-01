# Hướng Dẫn API Extend Session - Gia Hạn Phiên Sạc

---

## 1. Những Gì Đã Làm

### 1.1. Sửa file `models/sessionModel.js`
- Thêm enum cho field `status`: `["pending", "active", "completed", "cancelled"]`

### 1.2. Thêm function `extendSession` trong `controllers/sessionController.js`
Logic xử lý:
1. Kiểm tra session tồn tại (404 nếu không)
2. Kiểm tra quyền sở hữu — chỉ chủ sở hữu mới gia hạn được (403)
3. Kiểm tra status — chỉ `"active"` mới gia hạn được (400)
4. Kiểm tra `newEndTime > endTime` hiện tại (400 nếu không)
5. Kiểm tra trùng lịch với các session khác tại cùng trạm (400 nếu overlap)
6. Tính `ExtraHours = NewEndTime - StartTime` (tổng thời gian từ start đến newEnd)
7. Tính phí gia hạn dựa trên số giờ thêm (`additionalHours = ExtraHours - originalHours`)
8. Kiểm tra số dư ví (402 nếu không đủ)
9. Trừ tiền, cập nhật `endTime`, `energyEstimate`, `totalCost` của session

### 1.3. Sửa file `routes/sessionRoutes.js`
Thêm route:
```
POST /sessions/extend/:id  →  extendSession (Customer only)
```

### 1.4. Cập nhật `seed.js`
Thêm dữ liệu test cho extend:
- **Session 5**: Active session (đang sạc) — dùng để test extend thành công
- **Session 6**: Active session ở cùng trạm — dùng để test overlap

---

## 2. API Endpoint

### Request
```
POST /sessions/extend/:id
Authorization: Bearer <token>
Content-Type: application/json

{
    "newEndTime": "2026-07-01T15:00:00.000Z"
}
```

### Response thành công (200)
```json
{
    "message": "Session extended successfully",
    "session": {
        "_id": "...",
        "stationId": "...",
        "startTime": "2026-07-01T12:30:00.000Z",
        "oldEndTime": "2026-07-01T14:00:00.000Z",
        "newEndTime": "2026-07-01T15:00:00.000Z",
        "status": "active",
        "totalCost": 8.76,
        "energyEstimate": 37.5
    },
    "billing": {
        "originalHours": 1.50,
        "extraHours": 2.50,
        "additionalHours": 1.00,
        "additionalEnergy": 15.00,
        "isHappyHour": false,
        "pricePerKwh": 0.35,
        "extensionFee": 5.25,
        "remainingBalance": 494.75
    }
}
```

### Các lỗi có thể gặp

| Status | Message | Giải thích |
|--------|---------|------------|
| 400 | `newEndTime is required` | Thiếu field newEndTime |
| 400 | `newEndTime must be greater than current endTime` | newEndTime <= endTime hiện tại |
| 400 | `Cannot extend session with status "..."` | Session không ở trạng thái active |
| 400 | `Cannot extend: overlapping with another session at this station` | Trùng lịch với session khác |
| 402 | `Insufficient balance to extend session` | Không đủ tiền trong ví |
| 403 | `You can only extend your own sessions` | Không phải session của bạn |
| 404 | `Session not found` | Không tìm thấy session |

---

## 3. Seed Dữ Liệu Test

Chạy lệnh:
```bash
npm run seed
```

Dữ liệu mới được tạo thêm:

| Session | startTime | endTime | status | Mục đích test |
|---------|-----------|---------|--------|---------------|
| Session 5 | -30 phút | +1 giờ | active | Test extend thành công |
| Session 6 | +2 giờ | +4 giờ | active | Test overlap (nếu extend Session 5 qua 2h) |

> **Lưu ý:** Session 5 có `endTime = now + 1h`. Bạn cần extend với `newEndTime` lớn hơn thời gian này.
> Session 6 bắt đầu lúc `now + 2h`. Nếu extend Session 5 qua mốc `now + 2h` thì sẽ bị lỗi overlap.

---

## 4. Hướng Dẫn Test Bằng Postman (Chi Tiết Từng Bước)

### Bước 1: Import Collection
1. Mở Postman
2. File → Import → Chọn `EVChargingSystem.postman_collection.json`
3. Kiểm tra biến `baseUrl` = `http://localhost:9999`

### Bước 2: Login Customer
- **Request:** `01. Authentication` → `Login Customer`
  - Body: `{"username": "user1", "password": "123"}`
  - Nhấn Send → Token tự động lưu

### Bước 3: Seed dữ liệu
```bash
npm run seed
```
Copy Session ID của **Session 5** (active session) từ terminal output.

### Bước 4: Test các kịch bản

#### Test 1: Extend session thành công
- **Request:** Gửi POST tới `{{baseUrl}}/sessions/extend/{{sessionId}}`
- Headers: `Authorization: Bearer {{token}}`
- Body:
```json
{
    "newEndTime": "2026-07-01T15:00:00.000Z"
}
```
(Thay thời gian ISO string tương ứng với `endTime hiện tại + 1h`)

**Kết quả mong đợi:**
```json
{
    "message": "Session extended successfully",
    "session": {
        "oldEndTime": "...",
        "newEndTime": "2026-07-01T15:00:00.000Z",
        "status": "active",
        "totalCost": 10.76
    },
    "billing": {
        "additionalHours": 1.0,
        "extensionFee": 5.25
    }
}
```

#### Test 2: Extend với newEndTime nhỏ hơn endTime hiện tại → Lỗi 400
- Dùng Session 5
- Body:
```json
{
    "newEndTime": "2026-07-01T10:00:00.000Z"
}
```
(Chọn thời gian trong quá khứ hoặc trước endTime hiện tại)

**Kết quả:**
```json
{
    "message": "newEndTime must be greater than current endTime"
}
```

#### Test 3: Extend gây overlap với Session 6 → Lỗi 400
- Dùng Session 5
- Body: chọn `newEndTime` vượt quá `startTime` của Session 6 (now + 2h)
```json
{
    "newEndTime": "2026-07-01T16:00:00.000Z"
}
```
(Trong đó 16:00 > startTime của Session 6 là 14:00)

**Kết quả:**
```json
{
    "message": "Cannot extend: overlapping with another session at this station"
}
```

#### Test 4: Extend session không phải active (pending/cancelled) → Lỗi 400
- Dùng Session 1 (pending) hoặc Session 4 (cancelled)
- Body hợp lệ:
```json
{
    "newEndTime": "2026-07-01T20:00:00.000Z"
}
```

**Kết quả:**
```json
{
    "message": "Cannot extend session with status \"pending\". Only active sessions can be extended."
}
```

#### Test 5: Extend session của người khác → Lỗi 403
1. Login bằng **Admin** token
2. Gọi extend với Session 5
3. Body hợp lệ

**Kết quả:**
```json
{
    "message": "You can only extend your own sessions"
}
```

#### Test 6: Không đủ balance → Lỗi 402
- Dùng Session 5
- Chọn `newEndTime` rất xa để phí gia hạn rất lớn (> balance hiện tại)

**Kết quả:**
```json
{
    "message": "Insufficient balance to extend session",
    "currentBalance": 500,
    "extensionFee": "..."
}
```

---

## 5. Test Bằng Curl

### Login & lấy token
```bash
curl -s -X POST http://localhost:9999/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"123"}' | jq -r '.token'
```

### Extend session
```bash
TOKEN="<token_tu_login>"
SESSION_ID="<session_id_cua_session_5>"

curl -X POST "http://localhost:9999/sessions/extend/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newEndTime": "2026-07-01T15:00:00.000Z"}'
```
