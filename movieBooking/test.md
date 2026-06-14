# Hướng Dẫn Kiểm Thử Dự Án MovieBooking (Đặt Vé Xem Phim)

Tài liệu này hướng dẫn chi tiết cách thiết lập môi trường, kiểm thử giao diện người dùng (UI) trên trình duyệt, và kiểm thử API thông qua phần mềm **Postman**.

---

## 1. Thiết Lập Môi Trường Chạy Dự Án

Trước khi thực hiện kiểm thử, bạn cần cài đặt thư viện và khởi chạy máy chủ Express.

### Bước 1: Mở Terminal tại thư mục dự án
Đảm bảo bạn đang ở thư mục:
`f:\LEARN KÌ 7\SDN302 Node JS\assignment-1-KeyT9999\TranKimThang_movieBooking`

### Bước 2: Cài đặt các thư viện cần thiết
Chạy lệnh sau để tải các package từ file `package.json` (`express`, `mongoose`, `ejs`, `dotenv`, `cors`, `nodemon`):
```bash
npm install
```

### Bước 3: Kiểm tra cấu hình kết nối MongoDB
Kiểm tra nội dung tệp `.env` trong thư mục gốc. Chuỗi kết nối MongoDB mặc định:
```env
MONGO_URI=mongodb://localhost:27017/movieBookingDB
PORT=3000
```
> **Lưu ý:** Đảm bảo dịch vụ MongoDB trên máy của bạn đang chạy trước khi khởi động server.

### Bước 4: Khởi động Server ở chế độ phát triển
Chạy lệnh sau để khởi chạy ứng dụng với Nodemon (tự động tải lại code khi sửa đổi):
```bash
npm run dev
```
Khi hiển thị thông báo:
```text
MongoDB connected successfully!
Mock theaters seeded successfully.
Mock schedules seeded successfully.
Server is running at http://localhost:3000
```
Nghĩa là cơ sở dữ liệu đã được nạp dữ liệu rạp và lịch chiếu tự động thành công và máy chủ đã sẵn sàng hoạt động tại cổng **3000**.

---

## 2. Kiểm Thử Trên Giao Diện Người Dùng (Manual Browser Testing)

Mở trình duyệt Web (Chrome, Edge, Firefox) và truy cập địa chỉ: [http://localhost:3000](http://localhost:3000).

### Kịch bản 1: Xem Lịch Chiếu & Đặt Vé
1. Tại trang chủ (`/`), bạn sẽ thấy danh sách 4 suất chiếu phim được nạp mẫu (ví dụ: *Inception*, *Avatar: The Way of Water*, *Interstellar*).
2. Nhấp vào nút **Đặt Vé Ngay** ở một suất chiếu còn ghế trống.
3. Nhập **Họ và tên** của bạn.
4. Điều chỉnh **Số lượng vé** (ví dụ: tăng lên `3` vé). Bạn sẽ thấy tổng tiền hiển thị thay đổi động.
5. Nhấp nút **Xác Nhận Đặt Vé**.
6. **Kết quả mong đợi:** Một hộp thoại thông báo màu xanh "Đặt vé xem phim thành công!" xuất hiện ở góc dưới bên phải, số ghế trống trên thẻ phim sẽ giảm đi tương ứng, và modal đặt vé tự động đóng lại.

### Kịch bản 2: Kiểm Tra Ràng Buộc Đặt Vé
1. Chọn một lịch chiếu còn 50 ghế trống.
2. Nhấp **Đặt Vé Ngay** và nhập số lượng vé vượt quá số ghế còn trống (ví dụ: `51` vé hoặc nhập số lớn hơn `10` nếu form giới hạn).
3. **Kết quả mong đợi:** Không thể bấm đặt hoặc nếu bấm được, hệ thống sẽ trả về cảnh báo "Không đủ ghế trống" để ngăn chặn hành động đặt vượt hạn mức.

### Kịch bản 3: Chỉnh Sửa Số Vé Đã Đặt
1. Nhấp vào menu **Vé Đã Đặt** trên thanh điều hướng hoặc truy cập [http://localhost:3000/page/bookings](http://localhost:3000/page/bookings).
2. Bạn sẽ thấy danh sách vé mình vừa đặt.
3. Nhấp nút **Đổi Vé**.
4. Chỉnh sửa **Họ và Tên** hoặc thay đổi **Số lượng vé mới** (Ví dụ: Đổi từ `3` vé xuống `1` vé).
5. Nhấp **Cập Nhật Vé**.
6. **Kết quả mong đợi:** Thông báo thành công hiển thị, số tiền được tính lại, và khi bạn quay lại trang **Lịch Chiếu**, số lượng ghế trống của lịch đó sẽ tự động được hoàn lại `2` chỗ trống.

### Kịch bản 4: Hủy Vé (Trả lại ghế)
1. Trong trang **Vé Đã Đặt**, nhấp nút **Hủy Vé** ở một đơn đặt vé.
2. Một hộp thoại xác nhận của hệ thống hiện lên hỏi bạn: *"Bạn có chắc chắn muốn hủy đơn đặt vé này không?"* -> Nhấp **OK**.
3. **Kết quả mong đợi:** Đơn vé biến mất khỏi danh sách. Khi quay lại trang **Lịch Chiếu**, số ghế của lịch tương ứng được hoàn trả lại đúng số lượng ban đầu.

---

## 3. Kiểm Thử Bằng Postman (Postman API Testing)

Mở ứng dụng Postman lên để bắt đầu kiểm tra trực tiếp các API Endpoint của Server.

### Thiết lập chung:
* Tạo các request có **Headers**:
  * `Content-Type`: `application/json`

---

### Kịch bản 1: Lấy danh sách toàn bộ Lịch Chiếu (Schedules)
Dùng để lấy danh sách các suất chiếu và xem thông tin (Tên phim, Rạp, Giá vé, Số ghế trống hiện tại).
* **HTTP Method:** `GET`
* **URL:** `http://localhost:3000/schedules`
* **Headers:** `Content-Type: application/json`
* **Response mong đợi (Status 200 OK):**
```json
[
  {
    "_id": "647f2a1b9f7123abcd000001",
    "movieName": "Inception",
    "theaterName": "Cineplex Downtown",
    "showTime": "2026-06-11T13:00:00.000Z",
    "ticketPrice": 12.5,
    "availableSeats": 100,
    "__v": 0
  },
  {
    "_id": "647f2a1b9f7123abcd000002",
    "movieName": "Avatar: The Way of Water",
    "theaterName": "Megaplex Midtown",
    "showTime": "2026-06-11T13:00:00.000Z",
    "ticketPrice": 15.0,
    "availableSeats": 80,
    "__v": 0
  }
]
```
*(Hãy sao chép các thông tin `theaterName`, `movieName`, `showTime` từ Response này để sử dụng làm Body cho request đặt vé ở bước sau).*

---

### Kịch bản 2: Đặt vé xem phim mới (POST)
Gửi yêu cầu đặt vé cho khách hàng.
* **HTTP Method:** `POST`
* **URL:** `http://localhost:3000/bookings`
* **Headers:** `Content-Type: application/json`
* **Body (dạng JSON Raw):**
```json
{
  "customerName": "Tran Kim Thang",
  "theaterName": "Cineplex Downtown",
  "movieName": "Inception",
  "showTime": "2026-06-11T13:00:00.000Z",
  "numberOfTickets": 3
}
```
*(Lưu ý: Giá trị `showTime` phải trùng khớp định dạng chuỗi ISO Date trả về từ API lấy lịch chiếu).*

* **Response mong đợi (Status 201 Created):**
```json
{
  "_id": "647f2c8d9f7123abcd000099",
  "customerName": "Tran Kim Thang",
  "theaterName": "Cineplex Downtown",
  "movieName": "Inception",
  "showTime": "2026-06-11T13:00:00.000Z",
  "numberOfTickets": 3,
  "totalAmount": 37.5,
  "__v": 0
}
```
> **Kiểm tra tính logic:** Lúc này, nếu bạn chạy lại API `GET /schedules`, trường `availableSeats` của phim *Inception* tại rạp *Cineplex Downtown* phải giảm từ `100` xuống còn `97`.

---

### Kịch bản 3: Đặt vé lỗi do không đủ ghế trống (POST Validation)
* **HTTP Method:** `POST`
* **URL:** `http://localhost:3000/bookings`
* **Headers:** `Content-Type: application/json`
* **Body (Đặt quá số ghế khả dụng):**
```json
{
  "customerName": "Nguyen Van A",
  "theaterName": "Cineplex Downtown",
  "movieName": "Inception",
  "showTime": "2026-06-11T13:00:00.000Z",
  "numberOfTickets": 200
}
```
* **Response mong đợi (Status 400 Bad Request):**
```json
{
  "message": "Not enough available seats"
}
```

---

### Kịch bản 4: Lấy danh sách toàn bộ vé đã đặt (GET)
* **HTTP Method:** `GET`
* **URL:** `http://localhost:3000/bookings`
* **Response mong đợi (Status 200 OK):**
```json
[
  {
    "_id": "647f2c8d9f7123abcd000099",
    "customerName": "Tran Kim Thang",
    "theaterName": "Cineplex Downtown",
    "movieName": "Inception",
    "showTime": "2026-06-11T13:00:00.000Z",
    "numberOfTickets": 3,
    "totalAmount": 37.5,
    "__v": 0
  }
]
```
*(Hãy sao chép giá trị `_id` của đơn đặt vé vừa tạo - ví dụ `"647f2c8d9f7123abcd000099"` - để làm tham số cho API PUT và DELETE).*

---

### Kịch bản 5: Chỉnh sửa thay đổi số vé đã đặt (PUT)
Sử dụng ID đơn đặt vé lấy được từ API GET trước để cập nhật thay đổi số lượng vé từ `3` vé lên `5` vé.
* **HTTP Method:** `PUT`
* **URL:** `http://localhost:3000/bookings/647f2c8d9f7123abcd000099` (Thay ID thật của bạn vào cuối URL)
* **Headers:** `Content-Type: application/json`
* **Body (dạng JSON Raw):**
```json
{
  "customerName": "Tran Kim Thang (Updated)",
  "theaterName": "Cineplex Downtown",
  "movieName": "Inception",
  "showTime": "2026-06-11T13:00:00.000Z",
  "numberOfTickets": 5
}
```
* **Response mong đợi (Status 200 OK):**
```json
{
  "_id": "647f2c8d9f7123abcd000099",
  "customerName": "Tran Kim Thang (Updated)",
  "theaterName": "Cineplex Downtown",
  "movieName": "Inception",
  "showTime": "2026-06-11T13:00:00.000Z",
  "numberOfTickets": 5,
  "totalAmount": 62.5,
  "__v": 0
}
```
> **Kiểm tra tính logic:** Vì số lượng vé tăng từ `3` lên `5` (chênh lệch `+2`), số ghế trống của lịch chiếu Inception tại rạp Cineplex Downtown giờ đây phải giảm tiếp thêm 2 ghế nữa, tức là từ `97` xuống còn `95`. Hãy gọi `GET /schedules` để kiểm tra.

---

### Kịch bản 6: Hủy đặt vé (DELETE)
Hủy bỏ đơn đặt vé và trả lại ghế trống cho lịch chiếu phim.
* **HTTP Method:** `DELETE`
* **URL:** `http://localhost:3000/bookings/647f2c8d9f7123abcd000099` (Thay ID thật của bạn vào cuối URL)
* **Response mong đợi (Status 200 OK):**
```json
{
  "message": "Booking deleted successfully"
}
```
> **Kiểm tra tính logic:** Sau khi hủy thành công vé 5 ghế này, gọi lại API `GET /schedules` để xác minh số ghế trống của lịch chiếu Inception tại rạp Cineplex Downtown đã được cộng trả lại thành công từ `95` lên lại `100` ghế trống ban đầu.

---

## 4. Giải Thích Luồng Nghiệp Vụ Chính (Business Logic Flow)

Dự án tuân theo kiến trúc MVC đơn giản kết hợp cơ sở dữ liệu MongoDB:
1. **Khởi chạy ứng dụng (`server.js`)**: Kết nối MongoDB -> Tự động nạp trước các tài liệu rạp phim và lịch chiếu mẫu vào Database nếu chưa có sẵn.
2. **Khách truy cập (`views/index.ejs`)**: Trang web gọi API `GET /schedules` để nhận danh sách phim và ghế trống để render ra giao diện. Khi người dùng nhấp **Đặt vé**, EJS script gửi request **POST** lên endpoint `/bookings`.
3. **Xử lý đặt vé (`bookingController.js` - `createBooking`)**:
   * Kiểm tra lịch chiếu tồn tại.
   * Kiểm tra ghế trống còn đủ không.
   * Tính tiền tổng cộng.
   * Tạo bản ghi đơn vé.
   * Cập nhật trừ số ghế trống ở bảng lịch chiếu.
4. **Hủy đơn vé (`bookingController.js` - `deleteBooking`)**:
   * Lấy số lượng vé của đơn đặt vé.
   * Định vị lịch chiếu phim và cộng lại số ghế đã hoàn trả.
   * Xóa bản ghi vé đặt trong cơ sở dữ liệu.
