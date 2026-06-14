# Hướng Dẫn Kiểm Thử (Testing Guide) - CarRental (Dịch vụ thuê xe)

Tài liệu này hướng dẫn chi tiết cách chạy dự án và tiến hành kiểm thử (test) toàn bộ luồng chạy của dự án **CarRental** (Quản lý xe và Đơn thuê xe ô tô).

---

## 1. Chuẩn Bị Môi Trường Chạy Dự Án

Để tiến hành test, bạn cần khởi chạy ứng dụng Node.js:

1. **Cài đặt thư viện:**
   Mở terminal, chuyển hướng vào thư mục `TranKimThang_carRental` và cài đặt các dependencies:
   ```bash
   cd "f:/LEARN KÌ 7/SDN302 Node JS/assignment-1-KeyT9999/TranKimThang_carRental"
   npm install
   ```

2. **Cấu hình môi trường:**
   Kiểm tra nội dung file [.env](file:///f:/LEARN%20K%C3%8C%207/SDN302%20Node%20JS/assignment-1-KeyT9999/TranKimThang_carRental/.env) trong thư mục dự án:
   ```env
   MONGO_URI=mongodb://localhost:27017/carRental
   PORT=3000
   ```
   *Lưu ý: Đảm bảo MongoDB Local trên cổng `27017` đã hoạt động.*

3. **Khởi động Server:**
   Chạy lệnh dưới đây để bắt đầu khởi chạy máy chủ:
   ```bash
   npm run dev
   ```
   Khi màn hình log báo `MongoDB Connected: localhost` và `Server đang chạy tại http://localhost:3000`, server đã sẵn sàng.

---

## 2. Kiểm Thử Giao Diện Người Dùng (Manual UI Testing)

Truy cập địa chỉ: [http://localhost:3000](http://localhost:3000) trên trình duyệt để kiểm tra các luồng nghiệp vụ tích hợp cả xe và đặt xe trên cùng một trang (hoặc truy cập các trang riêng lẻ `/page/cars` và `/page/bookings`).

### Luồng 1: Quản Lý Xe (Car Management)
* **Thêm Xe mới:**
  1. Nhập thông tin xe:
     - Biển số xe: `30A-999.99`
     - Sức chứa: `5` (chỗ)
     - Giá thuê/ngày: `800000` (đơn vị VND)
     - Trạng thái: `available`
     - Tiện ích: `GPS, Tự động, Bản đồ` (phân tách bởi dấu phẩy)
  2. Nhấn **Thêm Xe**. 
  3. **Kết quả kỳ vọng:** Xe xuất hiện trong bảng danh sách phía dưới. Dropdown chọn xe ở phần Đặt xe cũng tự động xuất hiện xe này.
* **Kiểm thử Trùng lặp Biển số (Validation):**
  1. Thử thêm một xe khác có cùng biển số `30A-999.99`.
  2. **Kết quả kỳ vọng:** Hệ thống hiển thị cảnh báo lỗi (do biển số xe là khoá duy nhất - `unique`).
* **Sửa thông tin xe:**
  1. Nhấn nút **Sửa** trên dòng của xe `30A-999.99`. Form nhập liệu sẽ tự điền dữ liệu của xe và cuộn màn hình lên.
  2. Đổi giá thuê thành `900000` và nhấn **Cập Nhật**.
* **Xóa xe:**
  1. Nhấn nút **Xóa** ở cột Hành động và xác nhận popup. Xe sẽ bị xóa khỏi danh sách.

### Luồng 2: Quản Lý Đơn Đặt Xe (Booking Management)
* **Chuẩn bị dữ liệu xe:** Thêm 2 chiếc xe:
  - Xe 1: `30A-111.11` (Giá: `500000` VND/ngày, trạng thái `available`)
  - Xe 2: `30A-222.22` (Giá: `1000000` VND/ngày, trạng thái `maintenance`)
* **Kiểm thử hiển thị ước tính giá tiền tự động (Preview):**
  1. Tại Form đặt xe, chọn xe `30A-111.11`.
  2. Chọn Ngày bắt đầu là ngày hiện tại (ví dụ: `2026-06-10`) và Ngày kết thúc là 3 ngày sau (`2026-06-13`).
  3. **Kết quả kỳ vọng:** Bên dưới form lập tức hiển thị dòng chữ xem trước: `3 ngày × 500.000 VND = 1.500.000 VND`.
* **Tạo đơn đặt xe thành công:**
  1. Nhập tên khách hàng `Nguyễn Văn A`.
  2. Nhấn **Tạo Booking**.
  3. **Kết quả kỳ vọng:** Đơn thuê xe xuất hiện trong bảng danh sách. Tổng tiền hiển thị đúng `1.500.000 VND`. Đồng thời, trạng thái của xe `30A-111.11` chuyển sang `rented` (đã cho thuê).
* **Kiểm thử đặt xe đang bảo trì (Validation):**
  1. Thử tạo đơn đặt xe mới cho xe `30A-222.22` (xe đang có trạng thái `maintenance`).
  2. **Kết quả kỳ vọng:** Hệ thống báo lỗi: `Xe đang bảo trì, không thể đặt`.
* **Kiểm thử trùng lịch thuê (Overlapping Bookings - NGHIỆP VỤ CỐT LÕI):**
  1. Thử tạo một đơn đặt xe mới cho xe `30A-111.11` với khoảng thời gian giao thoa (Ví dụ từ `2026-06-11` đến `2026-06-14`).
  2. **Kết quả kỳ vọng:** Hệ thống báo lỗi: `Xe 30A-111.11 đã được đặt trong khoảng thời gian này` kèm chi tiết thông tin đơn hàng đang bị xung đột lịch.
* **Xóa/Hủy đơn thuê xe (Trả xe):**
  1. Nhấn nút **Xóa** đơn đặt xe của `Nguyễn Văn A`.
  2. **Kết quả kỳ vọng:** Đơn đặt xe biến mất khỏi danh sách. Trạng thái của xe `30A-111.11` tự động được cập nhật từ `rented` quay lại thành `available` (sẵn sàng cho thuê) do xe không còn lịch đặt nào khác.

---

## 3. Hướng Dẫn Kiểm Thử Bằng Postman (Postman Testing Guide)

Bạn có thể nhập hoặc tạo các Request sau trong phần mềm **Postman** để test trực tiếp các API của hệ thống:

### Bước 1: Khởi tạo biến trong Postman
Tạo biến toàn cục `url` trong Postman trỏ tới địa chỉ: `http://localhost:3000`.

### Bước 2: Thiết lập Request Body
Với các request `POST` và `PUT`, hãy chọn tab **Body** -> chọn **raw** -> chọn định dạng **JSON** để truyền dữ liệu.

---

### Bước 3: Gửi các request kiểm thử

#### 1. Thêm xe mới (POST /cars)
* **Method:** `POST`
* **URL:** `{{url}}/cars`
* **Body (JSON):**
  ```json
  {
    "carNumber": "29A-888.88",
    "capacity": 7,
    "pricePerDay": 1200000,
    "status": "available",
    "features": ["GPS", "Camera hành trình", "Cửa sổ trời"]
  }
  ```
* **Kết quả kỳ vọng (201 Created):** Trả về thông tin xe đã được tạo thành công trong MongoDB.

#### 2. Lấy danh sách toàn bộ xe (GET /cars)
* **Method:** `GET`
* **URL:** `{{url}}/cars`
* **Kết quả kỳ vọng (200 OK):** Trả về mảng chứa danh sách xe.

#### 3. Tạo đơn thuê xe thành công (POST /bookings)
* **Method:** `POST`
* **URL:** `{{url}}/bookings`
* **Body (JSON):**
  ```json
  {
    "customerName": "Trần Kim Thắng",
    "carNumber": "29A-888.88",
    "startDate": "2026-06-15",
    "endDate": "2026-06-20"
  }
  ```
* **Kết quả kỳ vọng (201 Created):** 
  * Máy chủ tính toán số ngày thuê là 5 ngày.
  * Tổng tiền tự động tính: `5 * 1.200.000 = 6.000.000 VND`.
  * Trạng thái xe `29A-888.88` được đổi thành `rented`.
  * Lưu lại giá trị `_id` của đơn booking vừa trả về (Ví dụ: `6483fb3b1d3d...`) để thực hiện sửa/xóa ở bước sau.

#### 4. Thử đặt trùng lịch xe (POST /bookings - Test Overlap)
* **Method:** `POST`
* **URL:** `{{url}}/bookings`
* **Body (JSON) - Lịch trùng đè lên khoảng ngày 15 đến 20 ở trên:**
  ```json
  {
    "customerName": "Khách hàng B",
    "carNumber": "29A-888.88",
    "startDate": "2026-06-18",
    "endDate": "2026-06-22"
  }
  ```
* **Kết quả kỳ vọng (409 Conflict):**
  ```json
  {
    "success": false,
    "message": "Xe 29A-888.88 đã được đặt trong khoảng thời gian này",
    "conflictBooking": {
      "customerName": "Trần Kim Thắng",
      "startDate": "2026-06-15T00:00:00.000Z",
      "endDate": "2026-06-20T00:00:00.000Z"
    }
  }
  ```

#### 5. Cập nhật đơn đặt thuê xe (PUT /bookings/:bookingId)
* **Method:** `PUT`
* **URL:** `{{url}}/bookings/<bookingId>` *(Điền ID thực tế thu được ở bước 3)*
* **Body (JSON) - Thay đổi ngày kết thúc ngắn lại hoặc đổi tên khách hàng:**
  ```json
  {
    "customerName": "Trần Kim Thắng - Đã cập nhật",
    "endDate": "2026-06-18"
  }
  ```
* **Kết quả kỳ vọng (200 OK):** Tổng tiền được cập nhật lại tương ứng với số ngày mới (3 ngày = 3.600.000 VND).

#### 6. Xóa/Hủy đơn đặt xe (DELETE /bookings/:bookingId)
* **Method:** `DELETE`
* **URL:** `{{url}}/bookings/<bookingId>`
* **Kết quả kỳ vọng (200 OK):** Đơn đặt xe được xóa thành công. Khi bạn gọi lại `GET {{url}}/cars`, trạng thái của xe `29A-888.88` đã tự động khôi phục về `available` do không còn đơn booking nào khác chiếm giữ xe này.
