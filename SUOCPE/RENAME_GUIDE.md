# CẨM NANG ĐỔI TÊN DỰ ÁN MẪU (EXAM RENAMING GUIDE)
## Áp dụng cụ thể cho Đề: Co-Working Space Booking Management System

Tài liệu này hướng dẫn chi tiết cách đổi tên các hàm, các tệp, các biến và đường dẫn từ dự án mẫu generic (`SUOCPE`) sang dự án cụ thể là **Co-Working Space Booking Management System** (`coworkingBooking`) theo yêu cầu đề thi [PE.docx.md](file:///d:/Assignment_NodeJS/PE.docx.md).

> [!NOTE]
> Bạn chỉ nên sử dụng tính năng **Global Find & Replace** (Tìm kiếm & Thay thế toàn cục) của VS Code (`Ctrl + Shift + H`) để hoàn thành việc này trong vòng 3 - 5 phút.

---

## BƯỚC 1: Khởi tạo và Đổi tên thư mục
1. Đổi tên thư mục gốc của dự án từ `SUOCPE` thành:
   `[tên_của_bạn]_coworkingBooking`
2. Mở tệp `package.json` và cập nhật trường `"name"`:
   ```json
   "name": "coworking-booking"
   ```

---

## BƯỚC 2: Cấu hình tệp môi trường `.env`
Mở tệp `.env` và thiết lập cấu hình:
```env
PORT=9999
MONGO_URI=mongodb://127.0.0.1:27017/coworkingBooking
JWT_SECRET=sdn302_secret_key

# Giữ nguyên chế độ NORMAL cho Co-working
PRICING_MODE=NORMAL
ENABLE_HAPPY_HOUR=false
ENABLE_WALLET=false
```

---

## BƯỚC 3: Đổi tên các Tệp (Files)
Hãy đổi tên các file trong thư mục của bạn theo bảng sau:

| Thư mục | Tên tệp cũ | Tên tệp mới |
| :--- | :--- | :--- |
| `/models` | `resourceModel.js` | `spaceModel.js` |
| | `bookingModel.js` | `reservationModel.js` |
| `/controllers` | `resourceController.js` | `spaceController.js` |
| | `bookingController.js` | `reservationController.js` |
| `/routes` | `resourceRoutes.js` | `spaceRoutes.js` |
| | `bookingRoutes.js` | `reservationRoutes.js` |

---

## BƯỚC 4: Tìm kiếm & Thay thế Toàn cục (Global Search & Replace)
Sử dụng tổ hợp phím `Ctrl + Shift + H` trong VS Code để thay thế đồng loạt các từ khóa trong toàn bộ dự án.

> [!WARNING]
> Tích chọn chế độ **Match Case** (Khớp chữ hoa/chữ thường) trong thanh tìm kiếm để đảm bảo tính chính xác của tên Model (chữ hoa đầu) và biến (chữ thường đầu).

### 1. Thay thế tên Mongoose Model (Chữ hoa)
* **Tìm kiếm**: `Resource` -> **Thay thế**: `Space`
* **Tìm kiếm**: `Booking` -> **Thay thế**: `Reservation`
  *(Ví dụ: `const Resource = require(...)` sẽ tự động thành `const Space = require(...)`)*

### 2. Thay thế tên Biến và Thuộc tính (Chữ thường)
* **Tìm kiếm**: `resourceCode` -> **Thay thế**: `spaceCode`
* **Tìm kiếm**: `pricePerUnit` -> **Thay thế**: `pricePerHour`
* **Tìm kiếm**: `features` -> **Thay thế**: `amenities`
* **Tìm kiếm**: `resourceId` -> **Thay thế**: `spaceId`

### 3. Thay thế các Import và Require
* **Tìm kiếm**: `resourceModel` -> **Thay thế**: `spaceModel`
* **Tìm kiếm**: `bookingModel` -> **Thay thế**: `reservationModel`
* **Tìm kiếm**: `resourceController` -> **Thay thế**: `spaceController`
* **Tìm kiếm**: `bookingController` -> **Thay thế**: `reservationController`
* **Tìm kiếm**: `resourceRoutes` -> **Thay thế**: `spaceRoutes`
* **Tìm kiếm**: `bookingRoutes` -> **Thay thế**: `reservationRoutes`

### 4. Thay thế API Endpoints (Đường dẫn Router)
* **Tìm kiếm**: `/resources` -> **Thay thế**: `/spaces`
* **Tìm kiếm**: `/bookings` -> **Thay thế**: `/reservations`

---

## BƯỚC 5: Thay thế tên các Hàm (Functions) trong Controller
Mặc dù bước 4 đã xử lý phần lớn code, bạn nên vào các controller đổi tên hàm cho chuẩn nghiệp vụ để giám thị dễ chấm điểm:

### Trong `spaceController.js` (cũ là `resourceController.js`):
* `getAllResources` -> `getAllSpaces`
* `getResourceById` -> `getSpaceById`
* `createResource` -> `createSpace`
* `updateResource` -> `updateSpace`
* `deleteResource` -> `deleteSpace`

### Trong `reservationController.js` (cũ là `bookingController.js`):
* `getBookings` -> `getReservations`
* `createBooking` -> `createReservation`

> [!TIP]
> Hãy nhớ cập nhật lại tên hàm tương ứng khi exports ở cuối file controller và khi require/gọi ở file routes.

---

## BƯỚC 6: Kiểm tra các Nghiệp vụ đặc thù của đề Co-working
Đề thi Co-working có một số điểm nhỏ cần tinh chỉnh thủ công:

1. **startTime trong quá khứ**:
   Trong `reservationController.js` (hàm `createReservation`), dòng kiểm tra `startTime` không được ở quá khứ đã được viết sẵn:
   ```javascript
   if (start < now) {
     return res.status(400).json({ message: 'Start time cannot be in the past' });
   }
   ```
   *(Hãy giữ nguyên logic này).*

2. **Dữ liệu Seed (`utils/seedData.js`)**:
   Sau khi Replace, dữ liệu seed sẽ đổi sang sử dụng model `Space` và `Reservation`. Bạn nên sửa lại tên các trường mô tả tài nguyên mẫu trong `seedData.js` cho phù hợp với co-working (ví dụ: `spaceCode: "MR-201"`, `type: "meetingRoom"`, `pricePerHour: 150000`, `amenities: ["projector", "whiteboard"]`).

3. **Chạy thử và Test**:
   Chạy lệnh seeding và khởi động server để kiểm tra xem mọi thứ hoạt động trơn tru chưa:
   ```bash
   npm run seed
   npm run dev
   ```
