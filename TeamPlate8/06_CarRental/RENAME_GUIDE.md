# CẨM NANG ĐỔI TÊN DỰ ÁN MẪU (EXAM RENAMING GUIDE)
## Áp dụng cho dạng đề: Car Rental Management System (`06_CarRental`)

Tài liệu này hướng dẫn cách đổi nhanh tên dự án, tên các tệp, các biến và đường dẫn từ dự án mẫu `06_CarRental` sang đề thi cụ thể ngày mai bằng tính năng **Global Find & Replace (Ctrl + Shift + H)** của VS Code.

> [!TIP]
> Chỉ mất từ 3 đến 5 phút để hoàn thành việc này trong phòng thi!

---

## BƯỚC 1: Khởi tạo và Đổi tên thư mục gốc
1. Đổi tên thư mục gốc `06_CarRental` thành:
   `[tên_của_bạn]_[tên_dự_án_trong_đề]` (Ví dụ: `john_coworkingBooking`).
2. Mở tệp `package.json` và cập nhật trường `"name"` thành tên viết thường của dự án mới.

---

## BƯỚC 2: Cấu hình tệp môi trường `.env`
Mở tệp `.env` và cập nhật cấu hình MongoDB:
```env
MONGO_URI=mongodb://127.0.0.1:27017/<tên_db_theo_đề_mới>
```

---

## BƯỚC 3: Đổi tên các Tệp (Files)
Hãy đổi tên các file trong thư mục dự án theo bảng sau:

| Thư mục | Tên tệp hiện tại | Tên tệp mới (Đề thi mới) |
| :--- | :--- | :--- |
| `/models` | `carModel.js` | `<newResourceName>Model.js` |
| | `bookingModel.js` | `<newBookingName>Model.js` |
| `/controllers` | `carController.js` | `<newResourceName>Controller.js` |
| | `bookingController.js` | `<newBookingName>Controller.js` |
| `/routes` | `carRoutes.js` | `<newResourceName>Routes.js` |
| | `bookingRoutes.js` | `<newBookingName>Routes.js` |

---

## BƯỚC 4: Tìm kiếm & Thay thế Toàn cục (Global Search & Replace)
Nhấn **Ctrl + Shift + H** trong VS Code. 

> [!WARNING]
> Tích chọn chế độ **Match Case** (Khớp chữ hoa/chữ thường) để tránh đổi nhầm tên Model (chữ hoa đầu) và tên biến (chữ thường đầu).

### 1. Thay thế tên Mongoose Model (Khớp chữ hoa đầu)
* **Tìm kiếm**: `Car` $ightarrow$ **Thay thế**: `<TênModelResourceMới>`
* **Tìm kiếm**: `Booking` $ightarrow$ **Thay thế**: `<TênModelBookingMới>`
*(Ví dụ: `const Car = require(...)` sẽ tự động đổi thành `const Space = require(...)`)*

### 2. Thay thế tên Biến và Thuộc tính (Khớp chữ thường đầu)
* **Tìm kiếm**: `carNumber` $ightarrow$ **Thay thế**: `<tên_mã_mới>` (ví dụ: `spaceCode`, `carNumber`)
* **Tìm kiếm**: `pricePerDay` $ightarrow$ **Thay thế**: `<tên_giá_mới>` (ví dụ: `pricePerHour`, `pricePerDay`)
* **Tìm kiếm**: `features` $ightarrow$ **Thay thế**: `<tên_tiện_ích_mới>` (ví dụ: `amenities`, `features`)
* **Tìm kiếm**: `carNumber` $ightarrow$ **Thay thế**: `<tên_id_tham_chiếu_mới>` (ví dụ: `spaceId`, `doctorId`)
* **Tìm kiếm**: `totalAmount` $ightarrow$ **Thay thế**: `<tên_tổng_tiền_mới>` (ví dụ: `totalCost`, `totalAmount`)

### 3. Thay thế các Import và Require trong code
* **Tìm kiếm**: `carModel` $ightarrow$ **Thay thế**: `<newResourceName>Model`
* **Tìm kiếm**: `bookingModel` $ightarrow$ **Thay thế**: `<newBookingName>Model`
* **Tìm kiếm**: `carController` $ightarrow$ **Thay thế**: `<newResourceName>Controller`
* **Tìm kiếm**: `bookingController` $ightarrow$ **Thay thế**: `<newBookingName>Controller`
* **Tìm kiếm**: `carRoutes` $ightarrow$ **Thay thế**: `<newResourceName>Routes`
* **Tìm kiếm**: `bookingRoutes` $ightarrow$ **Thay thế**: `<newBookingName>Routes`

### 4. Thay thế API Endpoints (Đường dẫn Router)
* **Tìm kiếm**: `/cars` $ightarrow$ **Thay thế**: `/<đường_dẫn_tài_nguyên_mới>`
* **Tìm kiếm**: `/bookings` $ightarrow$ **Thay thế**: `/<đường_dẫn_đặt_chỗ_mới>`

---

## BƯỚC 5: Thay thế tên các Hàm (Functions) trong Controller
Mở các file Controller mới và đổi tên hàm cho phù hợp với nghiệp vụ cụ thể của đề thi:

### Trong file controller của Tài nguyên (Resource):
* `getAllCars` $ightarrow$ `getAll<NewResource>s`
* `getCarById` $ightarrow$ `get<NewResource>ById`
* `createCar` $ightarrow$ `create<NewResource>`
* `updateCar` $ightarrow$ `update<NewResource>`
* `deleteCar` $ightarrow$ `delete<NewResource>`

### Trong file controller của Giao dịch/Đặt chỗ (Booking):
* `getBookings` $ightarrow$ `get<NewBooking>s`
* `createBooking` $ightarrow$ `create<NewBooking>`

---

## BƯỚC 6: Xử lý phần thừa/thiếu theo nghiệp vụ
* **Đối chiếu Schema:** Kiểm tra xem schema của đề thi mới có thiếu hoặc dư thuộc tính nào so với template hiện tại không. Tiến hành xóa thuộc tính thừa ở:
  1. File Model (`/models/`).
  2. File Controller khi nhận dữ liệu từ `req.body` để lưu hoặc cập nhật.
  3. File Seed dữ liệu mẫu (`/utils/seedData.js` hoặc `/seed.js`).
* **Đồng bộ hóa các Helper:**
  * Nếu dùng `checkOverlap.js` hoặc `calculatePrice.js`, hãy cập nhật tên model và thuộc tính sạc/thuê tương ứng bên trong.

---

## BƯỚC 7: Test lại toàn bộ hệ thống
Chạy lệnh seed và dev để kiểm tra lỗi cú pháp hoặc import:
```bash
npm run seed
npm run dev
```
Mở Postman, import file collection `.json` mới đã đổi tên của bạn và tiến hành test thử các API.
