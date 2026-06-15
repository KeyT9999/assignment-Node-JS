# API Cancel Booking

**Endpoint:** `POST /bookings/:bookingId/cancel`

**Nghiệp vụ:** 
- Cho phép hủy booking trong vòng 24 giờ tính từ lúc tạo.
- Hoàn trả 90% tiền thuê.
- Tự động chuyển trạng thái xe về `available` nếu không còn lịch đặt.

---

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "message": "Đã hủy booking thành công",
  "data": {
    "bookingId": "64c...",
    "carNumber": "29A-12345",
    "totalAmount": 1000000,
    "refundAmount": 900000,
    "penaltyFee": 100000
  }
}
```

---

### Lỗi Thường Gặp
- **400 Bad Request:** Hủy sau 24 giờ (Hệ thống từ chối).
- **404 Not Found:** Sai ID hoặc booking không tồn tại.
# API: Lấy danh sách xe còn trống theo ngày

## Mô tả

API trả về danh sách các xe **còn trống** (available) trong khoảng thời gian từ `startDate` đến `endDate`. Một xe được coi là trống nếu:

- Không có booking nào trùng lịch trong khoảng thời gian yêu cầu
- Xe không ở trạng thái "maintenance" (bảo trì)

---

## Endpoint

```
GET http://localhost:3000/cars/available?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### Query Parameters

| Parameter   | Kiểu   | Bắt buộc | Mô tả                        |
|-------------|--------|----------|------------------------------|
| `startDate` | String | Có       | Ngày bắt đầu (YYYY-MM-DD)    |
| `endDate`   | String | Có       | Ngày kết thúc (YYYY-MM-DD)   |

### Response thành công (200)

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "carNumber": "29A-12345",
      "capacity": 5,
      "status": "available",
      "pricePerDay": 500000,
      "features": ["GPS", "Camera lùi"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Response lỗi (400) - Thiếu tham số

```json
{
  "success": false,
  "message": "Vui lòng cung cấp startDate và endDate (dạng YYYY-MM-DD)"
}
```

### Response lỗi (400) - Ngày không hợp lệ

```json
{
  "success": false,
  "message": "Ngày tháng không hợp lệ. Định dạng: YYYY-MM-DD"
}
```

### Response lỗi (400) - endDate <= startDate

```json
{
  "success": false,
  "message": "Ngày kết thúc phải sau ngày bắt đầu"
}
```

---

## File đã thay đổi

| File              | Thay đổi                                         |
|-------------------|---------------------------------------------------|
| `controllers/carController.js` | Thêm hàm `getAvailableCars`            |
| `routes/carRoutes.js`         | Thêm route `GET /available` (trước `/:carNumber`) |

---

## Cách test bằng Postman

### 1. Tạo dữ liệu mẫu

#### 1.1. Tạo xe

**Request:**
- Method: `POST`
- URL: `http://localhost:3000/cars`
- Headers: `Content-Type: application/json`
- Body (raw JSON):

```json
{
  "carNumber": "29A-12345",
  "capacity": 5,
  "status": "available",
  "pricePerDay": 500000,
  "features": ["GPS", "Camera lùi", "Bluetooth"]
}
```

Gửi request này 3 lần với các biển số khác nhau để tạo 3 xe:

| Xe | carNumber    | status      | pricePerDay |
|----|-------------|-------------|-------------|
| 1  | 29A-12345   | available   | 500000      |
| 2  | 30B-67890   | available   | 700000      |
| 3  | 31C-11111   | maintenance | 400000      |

#### 1.2. Tạo booking cho xe "29A-12345"

**Request:**
- Method: `POST`
- URL: `http://localhost:3000/bookings`
- Headers: `Content-Type: application/json`
- Body (raw JSON):

```json
{
  "customerName": "Nguyễn Văn A",
  "carNumber": "29A-12345",
  "startDate": "2026-06-10",
  "endDate": "2026-06-15"
}
```

### 2. Test API danh sách xe trống

**Request:**
- Method: `GET`
- URL: `http://localhost:3000/cars/available?startDate=2026-06-12&endDate=2026-06-14`

**Kết quả mong đợi:**
- Xe `29A-12345` bị loại vì có booking trùng (10/06 - 15/06 trùng với 12/06 - 14/06)
- Xe `31C-11111` bị loại vì đang maintenance
- Xe `30B-67890` trả về vì không có booking nào và không maintenance

### 3. Test thêm các trường hợp

| Test Case                               | URL                                                                     | Kết quả mong đợi                     |
|-----------------------------------------|-------------------------------------------------------------------------|--------------------------------------|
| Không trùng lịch                       | `?startDate=2026-06-16&endDate=2026-06-20`                              | 29A-12345 + 30B-67890 (trống)        |
| Khoảng thời gian nằm trong booking hiện tại | `?startDate=2026-06-11&endDate=2026-06-13`                              | Chỉ 30B-67890                        |
| Thiếu tham số                          | `?startDate=2026-06-16`                                                 | Lỗi 400                              |
| Ngày không hợp lệ                      | `?startDate=abc&endDate=2026-06-20`                                     | Lỗi 400                              |
| endDate trước startDate                | `?startDate=2026-06-20&endDate=2026-06-10`                              | Lỗi 400                              |

### 4. Kiểm tra tất cả xe (GET /cars)

```
GET http://localhost:3000/cars
```

Trả về toàn bộ danh sách xe (không lọc theo ngày).

### 5. Kiểm tra danh sách booking

```
GET http://localhost:3000/bookings
```

Trả về danh sách tất cả booking để xác nhận dữ liệu đã tạo.
