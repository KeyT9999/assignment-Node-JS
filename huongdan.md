# 📖 Hướng Dẫn Test API: Cập Nhật Ngày Mượn Xe (Update Booking Dates)

## 📌 Thông Tin API

| Thuộc tính    | Giá trị                                          |
| ------------- | ------------------------------------------------ |
| **Endpoint**  | `PUT /bookings/:bookingId/update-dates`          |
| **Method**    | PUT                                              |
| **Base URL**  | `http://localhost:3000`                           |
| **Full URL**  | `http://localhost:3000/bookings/{bookingId}/update-dates` |

### Mô tả chức năng:
- Khách hàng có thể **cập nhật lại ngày mượn xe** (`startDate`, `endDate`) của một booking.
- **Giới hạn thời gian**: Chỉ được cập nhật **trong vòng 24 giờ** kể từ lúc tạo booking. Vượt quá 24 giờ sẽ bị từ chối.
- **Tính toán chênh lệch tiền**:
  - **Dư tiền**: Nếu giảm số ngày mượn (VD: 5 ngày → 3 ngày) → hoàn tiền.
  - **Thiếu tiền**: Nếu tăng số ngày mượn (VD: 3 ngày → 5 ngày) → khách phải trả thêm.

---

## 🛠️ Chuẩn Bị Trước Khi Test

### Bước 1: Chạy lệnh Seed tạo dữ liệu test

> ⚡ **Cách nhanh nhất**: Chạy 1 lệnh duy nhất để tạo toàn bộ dữ liệu test (xe + booking).
> Lệnh này sẽ **xóa toàn bộ dữ liệu cũ** và tạo lại từ đầu.

```bash
cd d:\Assignment_NodeJS\carRental
npm run seed
```

**Kết quả sau khi chạy seed:**

```
✅ Đã kết nối MongoDB
🗑️  Đã xóa toàn bộ dữ liệu cũ (cars & bookings)
🚗 Đã tạo 2 xe mẫu:
   - 29A-TEST01 | 4 chỗ | 500,000 VNĐ/ngày
   - 30B-TEST02 | 7 chỗ | 800,000 VNĐ/ngày

📋 Booking 1 (MỚI - có thể update trong 24h):
   ID: <BOOKING_1_ID>
   Khách: Nguyen Van A | Xe: 29A-TEST01
   Ngày: 01/07 → 06/07 (5 ngày) | Tổng: 2,500,000 VNĐ

📋 Booking 2 (CŨ - đã quá 24h, KHÔNG thể update):
   ID: <BOOKING_2_ID>
   Khách: Tran Van B | Xe: 30B-TEST02
   Ngày: 05/07 → 08/07 (3 ngày) | Tổng: 2,400,000 VNĐ

📋 Booking 3 (dùng để test TRÙNG LỊCH với Booking 1):
   ID: <BOOKING_3_ID>
   Khách: Le Thi C | Xe: 29A-TEST01
   Ngày: 15/07 → 20/07 (5 ngày) | Tổng: 2,500,000 VNĐ

🧪 HƯỚNG DẪN TEST VỚI POSTMAN (kèm URL chứa ID thật)
```

> ⚠️ **Quan trọng**: Copy các **Booking ID** từ kết quả seed để dùng trong Postman!

**Dữ liệu seed tạo ra:**

| Booking   | Khách hàng    | Xe          | Ngày thuê         | Số ngày | Tổng tiền     | Trạng thái        |
| --------- | ------------- | ----------- | ------------------ | ------- | ------------- | ----------------- |
| Booking 1 | Nguyen Van A  | 29A-TEST01  | 01/07 → 06/07     | 5       | 2,500,000 VNĐ | MỚI (trong 24h)  |
| Booking 2 | Tran Van B    | 30B-TEST02  | 05/07 → 08/07     | 3       | 2,400,000 VNĐ | CŨ (quá 24h)     |
| Booking 3 | Le Thi C      | 29A-TEST01  | 15/07 → 20/07     | 5       | 2,500,000 VNĐ | MỚI (test trùng) |

### Bước 2: Khởi động server

```bash
cd d:\Assignment_NodeJS\carRental
npm start
```

> Server chạy tại: `http://localhost:3000`

### (Tùy chọn) Tạo dữ liệu thủ công bằng Postman

<details>
<summary>📂 Click để mở hướng dẫn tạo dữ liệu thủ công (nếu không dùng seed)</summary>

#### Tạo xe mới

- **Method**: `POST`
- **URL**: `http://localhost:3000/cars`
- **Headers**: `Content-Type: application/json`
- **Body** (raw → JSON):

```json
{
  "carNumber": "29A-TEST01",
  "capacity": 4,
  "pricePerDay": 500000,
  "features": ["Điều hòa", "GPS"]
}
```

#### Tạo booking mới (thuê 5 ngày)

- **Method**: `POST`
- **URL**: `http://localhost:3000/bookings`
- **Headers**: `Content-Type: application/json`
- **Body** (raw → JSON):

```json
{
  "customerName": "Nguyen Van A",
  "carNumber": "29A-TEST01",
  "startDate": "2026-07-01",
  "endDate": "2026-07-06"
}
```

> Lưu lại `_id` từ response để dùng cho các bước test.

</details>

---

## 🧪 Các Kịch Bản Test

### ✅ Test Case 1: Giảm ngày mượn (5 ngày → 3 ngày) — DƯ TIỀN

**Mục đích**: Khách hàng giảm số ngày thuê, hệ thống tính tiền dư cần hoàn lại.

- **Method**: `PUT`
- **URL**: `http://localhost:3000/bookings/{bookingId}/update-dates`
  - Thay `{bookingId}` bằng `_id` thật từ bước tạo booking.
  - Ví dụ: `http://localhost:3000/bookings/6857abc123def456/update-dates`
- **Headers**: `Content-Type: application/json`
- **Body** (raw → JSON):

```json
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-04"
}
```

**Response mong đợi** (Status: `200 OK`):

```json
{
  "success": true,
  "message": "Cập nhật ngày mượn xe thành công",
  "data": {
    "_id": "6857abc123def456",
    "customerName": "Nguyen Van A",
    "carNumber": "29A-TEST01",
    "startDate": "2026-07-01T00:00:00.000Z",
    "endDate": "2026-07-04T00:00:00.000Z",
    "totalAmount": 1500000
  },
  "paymentAdjustment": {
    "oldDates": {
      "startDate": "2026-07-01T00:00:00.000Z",
      "endDate": "2026-07-06T00:00:00.000Z",
      "numberOfDays": 5
    },
    "newDates": {
      "startDate": "2026-07-01T00:00:00.000Z",
      "endDate": "2026-07-04T00:00:00.000Z",
      "numberOfDays": 3
    },
    "pricePerDay": 500000,
    "oldTotalAmount": 2500000,
    "newTotalAmount": 1500000,
    "amountDifference": 1000000,
    "paymentStatus": "Dư tiền - Cần hoàn lại cho khách hàng"
  }
}
```

**Giải thích**:
- Ban đầu: 5 ngày × 500,000 = **2,500,000 VNĐ**
- Sau update: 3 ngày × 500,000 = **1,500,000 VNĐ**
- Chênh lệch: **1,000,000 VNĐ** → Dư tiền, cần hoàn lại cho khách hàng.

---

### ✅ Test Case 2: Tăng ngày mượn (3 ngày → 5 ngày) — THIẾU TIỀN

**Mục đích**: Khách hàng tăng số ngày thuê, hệ thống tính tiền thiếu cần trả thêm.

> ⚠️ Sau Test Case 1, booking đang là 3 ngày (01/07 → 04/07). Bây giờ ta tăng lên 5 ngày.

- **Method**: `PUT`
- **URL**: `http://localhost:3000/bookings/{bookingId}/update-dates`
- **Headers**: `Content-Type: application/json`
- **Body** (raw → JSON):

```json
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-06"
}
```

**Response mong đợi** (Status: `200 OK`):

```json
{
  "success": true,
  "message": "Cập nhật ngày mượn xe thành công",
  "data": {
    "totalAmount": 2500000
  },
  "paymentAdjustment": {
    "oldDates": {
      "numberOfDays": 3
    },
    "newDates": {
      "numberOfDays": 5
    },
    "pricePerDay": 500000,
    "oldTotalAmount": 1500000,
    "newTotalAmount": 2500000,
    "amountDifference": 1000000,
    "paymentStatus": "Thiếu tiền - Khách hàng cần thanh toán thêm"
  }
}
```

**Giải thích**:
- Ban đầu (sau TC1): 3 ngày × 500,000 = **1,500,000 VNĐ**
- Sau update: 5 ngày × 500,000 = **2,500,000 VNĐ**
- Chênh lệch: **1,000,000 VNĐ** → Thiếu tiền, khách cần trả thêm.

---

### ✅ Test Case 3: Giữ nguyên số ngày nhưng đổi khoảng thời gian

- **Method**: `PUT`
- **URL**: `http://localhost:3000/bookings/{bookingId}/update-dates`
- **Body** (raw → JSON):

```json
{
  "startDate": "2026-07-10",
  "endDate": "2026-07-15"
}
```

**Response mong đợi** (Status: `200 OK`):
- `paymentStatus`: `"Không thay đổi - Số tiền giữ nguyên"`
- `amountDifference`: `0`

---

### ❌ Test Case 4: Update sau khi vượt quá 24 giờ

**Mục đích**: Kiểm tra hệ thống từ chối update khi booking đã tạo quá 24 giờ.

> ℹ️ Để test case này, bạn cần một booking đã được tạo **hơn 24 giờ trước**. Nếu không có, bạn có thể dùng MongoDB Compass hoặc mongosh để chỉnh `createdAt` của booking về thời gian cũ hơn.
>
> **Cách chỉnh bằng mongosh:**
> ```javascript
> db.bookings.updateOne(
>   { _id: ObjectId("YOUR_BOOKING_ID") },
>   { $set: { createdAt: new Date("2026-06-20T00:00:00.000Z") } }
> )
> ```

- **Method**: `PUT`
- **URL**: `http://localhost:3000/bookings/{bookingId}/update-dates`
- **Body** (raw → JSON):

```json
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-04"
}
```

**Response mong đợi** (Status: `400 Bad Request`):

```json
{
  "success": false,
  "message": "Chỉ được phép cập nhật ngày mượn trong vòng 24 giờ kể từ lúc tạo booking",
  "detail": {
    "bookingCreatedAt": "2026-06-20T00:00:00.000Z",
    "currentTime": "2026-06-22T...",
    "hoursElapsed": 48.5
  }
}
```

---

### ❌ Test Case 5: Thiếu dữ liệu đầu vào

**Mục đích**: Kiểm tra validate khi không gửi đủ `startDate` và `endDate`.

- **Method**: `PUT`
- **URL**: `http://localhost:3000/bookings/{bookingId}/update-dates`
- **Body** (raw → JSON):

```json
{
  "startDate": "2026-07-01"
}
```

**Response mong đợi** (Status: `400 Bad Request`):

```json
{
  "success": false,
  "message": "Vui lòng cung cấp cả ngày bắt đầu (startDate) và ngày kết thúc (endDate)"
}
```

---

### ❌ Test Case 6: Ngày kết thúc trước ngày bắt đầu

- **Method**: `PUT`
- **URL**: `http://localhost:3000/bookings/{bookingId}/update-dates`
- **Body** (raw → JSON):

```json
{
  "startDate": "2026-07-10",
  "endDate": "2026-07-05"
}
```

**Response mong đợi** (Status: `400 Bad Request`):

```json
{
  "success": false,
  "message": "Ngày kết thúc phải sau ngày bắt đầu"
}
```

---

### ❌ Test Case 7: Booking không tồn tại

- **Method**: `PUT`
- **URL**: `http://localhost:3000/bookings/000000000000000000000000/update-dates`
- **Body** (raw → JSON):

```json
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-04"
}
```

**Response mong đợi** (Status: `404 Not Found`):

```json
{
  "success": false,
  "message": "Không tìm thấy booking"
}
```

---

### ❌ Test Case 8: Trùng lịch xe với booking khác

**Chuẩn bị**: Tạo thêm 1 booking thứ 2 cho cùng xe nhưng khác khoảng thời gian:

```json
{
  "customerName": "Tran Van B",
  "carNumber": "29A-TEST01",
  "startDate": "2026-07-15",
  "endDate": "2026-07-20"
}
```

Sau đó, thử update booking đầu tiên trùng lịch với booking thứ 2:

- **Method**: `PUT`
- **URL**: `http://localhost:3000/bookings/{bookingId_1}/update-dates`
- **Body** (raw → JSON):

```json
{
  "startDate": "2026-07-14",
  "endDate": "2026-07-18"
}
```

**Response mong đợi** (Status: `409 Conflict`):

```json
{
  "success": false,
  "message": "Xe 29A-TEST01 đã được đặt trong khoảng thời gian mới này",
  "conflictBooking": {
    "customerName": "Tran Van B",
    "startDate": "2026-07-15T00:00:00.000Z",
    "endDate": "2026-07-20T00:00:00.000Z"
  }
}
```

---

## 📋 Tóm Tắt Tất Cả Các API Bookings

| #  | Method   | Endpoint                              | Mô tả                                          |
| -- | -------- | ------------------------------------- | ----------------------------------------------- |
| 1  | `GET`    | `/bookings`                           | Lấy danh sách tất cả bookings                  |
| 2  | `GET`    | `/bookings/:bookingId`                | Xem chi tiết 1 booking                         |
| 3  | `POST`   | `/bookings`                           | Tạo booking mới                                |
| 4  | `PUT`    | `/bookings/:bookingId`                | Cập nhật toàn bộ thông tin booking              |
| 5  | `DELETE` | `/bookings/:bookingId`                | Xóa booking                                    |
| 6  | `POST`   | `/bookings/:bookingId/cancel`         | Hủy booking (hoàn 90%, trong 24h)              |
| 7  | **`PUT`**| **`/bookings/:bookingId/update-dates`** | **Cập nhật ngày mượn (trong 24h, tính chênh lệch tiền)** |

---

## 🔧 Cấu Hình Postman Chi Tiết

### Cách tạo request trong Postman:

1. Mở **Postman** → Click **"New"** → Chọn **"HTTP Request"**
2. Chọn method **PUT**
3. Nhập URL: `http://localhost:3000/bookings/{bookingId}/update-dates`
   - Thay `{bookingId}` bằng ID thật
4. Vào tab **Headers**:
   - Key: `Content-Type`
   - Value: `application/json`
5. Vào tab **Body**:
   - Chọn **raw**
   - Chọn định dạng **JSON** (dropdown bên phải)
   - Nhập body JSON
6. Click **Send**

### Lưu ý về định dạng ngày:
- Sử dụng định dạng: `YYYY-MM-DD` (VD: `2026-07-01`)
- Hoặc ISO 8601: `2026-07-01T00:00:00.000Z`
