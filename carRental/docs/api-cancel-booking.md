# API Cancel Booking

## Mô tả


Cách test nhanh
node seed.js              # Tạo dữ liệu mẫu
npm run dev               # Khởi động server
POST http://localhost:3000/bookings/6a2fa6ca67c2b077614ac22a/cancel

API hủy đơn đặt xe (soft cancel). Khi hủy, trạng thái booking chuyển từ `"active"` sang `"cancelled"`, khách hàng được hoàn lại **90%** tổng số tiền đã thanh toán. Nếu xe không còn booking active nào khác, trạng thái xe tự động chuyển về `"available"`.

## Điều kiện hủy

- **Thời gian hủy:** Trong vòng **24 giờ** kể từ lúc tạo booking (`createdAt`)
- **Số tiền hoàn trả:** **90%** của `totalAmount` (làm tròn số nguyên)
- **Chỉ hủy được 1 lần:** Nếu booking đã có status `"cancelled"` thì không thể hủy lại

## Endpoint

```
POST {{url}}/bookings/:bookingId/cancel
```

| Method | URL | Mô tả |
|--------|-----|-------|
| `POST` | `/bookings/:bookingId/cancel` | Hủy đơn đặt xe theo ID |

## Request

### Params

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `bookingId` | string | MongoDB ObjectId của booking cần hủy |

### Headers

```
Content-Type: application/json
```

## Response

### ✅ Thành công (200 OK) — Trong vòng 24h

```json
{
  "success": true,
  "message": "Hủy booking thành công",
  "data": {
    "_id": "6483fb3b1d3d...",
    "customerName": "Trần Kim Thắng",
    "carNumber": "29A-888.88",
    "startDate": "2026-06-26T00:00:00.000Z",
    "endDate": "2026-06-28T00:00:00.000Z",
    "totalAmount": 2400000,
    "status": "cancelled",
    "refundAmount": 2160000,
    "refundPercentage": "90%",
    "cancelledAt": "2026-06-15T12:00:00.000Z"
  }
}
```

### ❌ Quá 24h (400 Bad Request)

```json
{
  "success": false,
  "message": "Không thể hủy booking sau 24 giờ kể từ khi đặt. Đã quá thời hạn hủy cho phép.",
  "data": {
    "createdAt": "2026-06-13T12:00:00.000Z",
    "hoursSinceBooking": 48
  }
}
```

### ❌ Booking đã hủy trước đó (400 Bad Request)

```json
{
  "success": false,
  "message": "Booking đã được hủy trước đó"
}
```

### ❌ Không tìm thấy booking (404 Not Found)

```json
{
  "success": false,
  "message": "Không tìm thấy booking"
}
```

---

## Các bước test bằng Postman

### Bước 1: Chạy seed data

Mở terminal, chạy lệnh:

```bash
node seed.js
```

Kết quả: Tạo 2 xe và 3 bookings với thời gian khác nhau.

### Bước 2: Khởi tạo biến trong Postman

- `url`: `http://localhost:3000`

### Bước 3: Test các tình huống

#### Test 1: Hủy booking trong vòng 24h ✅

**Request:**
- Method: `POST`
- URL: `{{url}}/bookings/<bookingId_cua_Booking_2>/cancel`
- Body: *(không cần body)*

**Kết quả expected (200 OK):**
- `status` → `"cancelled"`
- `refundAmount` = 90% của `totalAmount` (Booking 2: 2.400.000 × 90% = 2.160.000)

#### Test 2: Hủy booking đã quá 24h ❌

**Request:**
- Method: `POST`
- URL: `{{url}}/bookings/<bookingId_cua_Booking_1>/cancel`

**Kết quả expected (400 Bad Request):**
- Message: `"Không thể hủy booking sau 24 giờ kể từ khi đặt"`

#### Test 3: Hủy booking đã hủy trước đó ❌

**Request:**
- Method: `POST`
- URL: `{{url}}/bookings/<bookingId_cua_Booking_2>/cancel`
  *(Sau khi đã hủy thành công ở Test 1)*

**Kết quả expected (400 Bad Request):**
- Message: `"Booking đã được hủy trước đó"`

#### Test 4: Hủy booking không tồn tại ❌

**Request:**
- Method: `POST`
- URL: `{{url}}/bookings/6483fb3b1d3d000000000000/cancel`

**Kết quả expected (404 Not Found):**
- Message: `"Không tìm thấy booking"`

---

## Luồng xử lý chi tiết

```
┌─────────────────────────────────────────────────────────────┐
│  POST /bookings/:bookingId/cancel                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Tìm booking theo bookingId                              │
│     ├─ Không tìm thấy → 404                                 │
│     └─ Tìm thấy → tiếp tục                                  │
│                                                             │
│  2. Kiểm tra status hiện tại                                │
│     ├─ status === "cancelled" → 400 (đã hủy rồi)           │
│     └─ status === "active" → tiếp tục                       │
│                                                             │
│  3. Kiểm tra thời gian hủy                                  │
│     ├─ (now - createdAt) > 24h → 400 (quá hạn)             │
│     └─ (now - createdAt) <= 24h → tiếp tục                  │
│                                                             │
│  4. Tính refundAmount = Math.round(totalAmount * 0.9)       │
│                                                             │
│  5. Cập nhật booking:                                       │
│     ├─ status = "cancelled"                                 │
│     └─ refundAmount = đã tính ở bước 4                      │
│                                                             │
│  6. Kiểm tra xe còn booking active khác không               │
│     ├─ Không còn → set car.status = "available"             │
│     └─ Còn → giữ nguyên                                     │
│                                                             │
│  7. Trả về 200 với thông tin hủy + refund                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
