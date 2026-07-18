# CẨM NANG ĐỔI TÊN DỰ ÁN MẪU (EXAM RENAMING GUIDE)
## Áp dụng cho dạng đề: Co-Working Space Booking System (`02_CoWorkingBooking`)

Tài liệu này hướng dẫn cách đổi nhanh tên dự án, tên các tệp, các biến và đường dẫn từ dự án mẫu `02_CoWorkingBooking` sang đề thi cụ thể ngày mai bằng tính năng **Global Find & Replace (Ctrl + Shift + H)** của VS Code.

> [!TIP]
> Chỉ mất từ 3 đến 5 phút để hoàn thành việc này trong phòng thi!

---

## BƯỚC 1: Khởi tạo và Đổi tên thư mục gốc
1. Đổi tên thư mục gốc `02_CoWorkingBooking` thành:
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
| `/models` | `spaceModel.js` | `<newResourceName>Model.js` |
| | `reservationModel.js` | `<newBookingName>Model.js` |
| `/controllers` | `spaceController.js` | `<newResourceName>Controller.js` |
| | `reservationController.js` | `<newBookingName>Controller.js` |
| `/routes` | `spaceRoutes.js` | `<newResourceName>Routes.js` |
| | `reservationRoutes.js` | `<newBookingName>Routes.js` |

---

## BƯỚC 4: Tìm kiếm & Thay thế Toàn cục (Global Search & Replace)
Nhấn **Ctrl + Shift + H** trong VS Code. 

> [!WARNING]
> Tích chọn chế độ **Match Case** (Khớp chữ hoa/chữ thường) để tránh đổi nhầm tên Model (chữ hoa đầu) và tên biến (chữ thường đầu).

### 1. Thay thế tên Mongoose Model (Khớp chữ hoa đầu)
* **Tìm kiếm**: `Space` $ightarrow$ **Thay thế**: `<TênModelResourceMới>`
* **Tìm kiếm**: `Reservation` $ightarrow$ **Thay thế**: `<TênModelBookingMới>`
*(Ví dụ: `const Space = require(...)` sẽ tự động đổi thành `const Space = require(...)`)*

### 2. Thay thế tên Biến và Thuộc tính (Khớp chữ thường đầu)
* **Tìm kiếm**: `spaceCode` $ightarrow$ **Thay thế**: `<tên_mã_mới>` (ví dụ: `spaceCode`, `carNumber`)
* **Tìm kiếm**: `pricePerHour` $ightarrow$ **Thay thế**: `<tên_giá_mới>` (ví dụ: `pricePerHour`, `pricePerDay`)
* **Tìm kiếm**: `amenities` $ightarrow$ **Thay thế**: `<tên_tiện_ích_mới>` (ví dụ: `amenities`, `features`)
* **Tìm kiếm**: `spaceId` $ightarrow$ **Thay thế**: `<tên_id_tham_chiếu_mới>` (ví dụ: `spaceId`, `doctorId`)
* **Tìm kiếm**: `totalAmount` $ightarrow$ **Thay thế**: `<tên_tổng_tiền_mới>` (ví dụ: `totalCost`, `totalAmount`)

### 3. Thay thế các Import và Require trong code
* **Tìm kiếm**: `spaceModel` $ightarrow$ **Thay thế**: `<newResourceName>Model`
* **Tìm kiếm**: `reservationModel` $ightarrow$ **Thay thế**: `<newBookingName>Model`
* **Tìm kiếm**: `spaceController` $ightarrow$ **Thay thế**: `<newResourceName>Controller`
* **Tìm kiếm**: `reservationController` $ightarrow$ **Thay thế**: `<newBookingName>Controller`
* **Tìm kiếm**: `spaceRoutes` $ightarrow$ **Thay thế**: `<newResourceName>Routes`
* **Tìm kiếm**: `reservationRoutes` $ightarrow$ **Thay thế**: `<newBookingName>Routes`

### 4. Thay thế API Endpoints (Đường dẫn Router)
* **Tìm kiếm**: `/spaces` $ightarrow$ **Thay thế**: `/<đường_dẫn_tài_nguyên_mới>`
* **Tìm kiếm**: `/reservations` $ightarrow$ **Thay thế**: `/<đường_dẫn_đặt_chỗ_mới>`

---

## BƯỚC 5: Thay thế tên các Hàm (Functions) trong Controller
Mở các file Controller mới và đổi tên hàm cho phù hợp với nghiệp vụ cụ thể của đề thi:

### Trong file controller của Tài nguyên (Resource):
* `getAllSpaces` $ightarrow$ `getAll<NewResource>s`
* `getSpaceById` $ightarrow$ `get<NewResource>ById`
* `createSpace` $ightarrow$ `create<NewResource>`
* `updateSpace` $ightarrow$ `update<NewResource>`
* `deleteSpace` $ightarrow$ `delete<NewResource>`

### Trong file controller của Giao dịch/Đặt chỗ (Booking):
* `getReservations` $ightarrow$ `get<NewBooking>s`
* `createReservation` $ightarrow$ `create<NewBooking>`

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
