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

## 3. Hướng Dẫn Kiểm Thử Bằng Postman (Postman Testing Guide)

Bạn có thể nhập hoặc tạo các Request sau trong phần mềm **Postman** để test trực tiếp các API của hệ thống:

### Bước 1: Khởi tạo biến trong Postman
Tạo biến toàn cục `url` trong Postman trỏ tới địa chỉ: `http://localhost:3000`.

### Bước 2: Thiết lập Request Body
Với các request `POST` và `PUT`, hãy chọn tab **Body** -> chọn **raw** -> chọn định dạng **JSON** để truyền dữ liệu.

---

### Bước 3: Gửi các request kiểm thử

#### A. Quản lý Rạp Chiếu Phim (Theaters)

##### 1. Thêm rạp chiếu phim mới (POST /theaters)
* **Method:** `POST`
* **URL:** `{{url}}/theaters`
* **Body (JSON):**
  ```json
  {
    "theaterName": "Megaplex Midtown",
    "location": "456 Broadway Ave",
    "seatCapacity": 120,
    "screenType": "IMAX",
    "amenities": ["Dolby Atmos", "Recliner Seats", "Popcorn Bar"]
  }
  ```
* **Kết quả kỳ vọng (201 Created):** Trả về thông tin rạp chiếu phim đã được tạo thành công trong MongoDB.

##### 2. Lấy danh sách toàn bộ rạp chiếu phim (GET /theaters)
* **Method:** `GET`
* **URL:** `{{url}}/theaters`
* **Kết quả kỳ vọng (200 OK):** Trả về mảng chứa danh sách rạp chiếu phim.

---

#### B. Quản lý Lịch Chiếu Phim (Schedules)

##### 1. Tạo lịch chiếu phim mới (POST /schedules)
* **Method:** `POST`
* **URL:** `{{url}}/schedules`
* **Body (JSON):**
  ```json
  {
    "movieName": "Interstellar",
    "theaterName": "Megaplex Midtown",
    "showTime": "2026-06-12T19:00:00.000Z",
    "ticketPrice": 14.5,
    "availableSeats": 120
  }
  ```
* **Kết quả kỳ vọng (201 Created):** Trả về thông tin lịch chiếu đã được tạo.

##### 2. Lấy danh sách toàn bộ lịch chiếu phim (GET /schedules)
* **Method:** `GET`
* **URL:** `{{url}}/schedules`
* **Kết quả kỳ vọng (200 OK):** Trả về danh sách toàn bộ các lịch chiếu phim hiện có.
*(Hãy sao chép các thông tin `theaterName`, `movieName`, `showTime` từ Response này để sử dụng làm Body cho request đặt vé ở bước sau).*

##### 3. Tìm kiếm phim theo rạp và giờ chiếu (GET /schedules/search)
Tìm các bộ phim có cùng rạp chiếu và giờ chiếu cụ thể.
* **Method:** `GET`
* **URL:** `{{url}}/schedules/search?theaterName=Megaplex Midtown&showTime=2026-06-12T19:00:00.000Z`
* **Kết quả kỳ vọng (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "theaterName": "Megaplex Midtown",
    "showTime": "2026-06-12T19:00:00.000Z",
    "movies": [
      {
        "movieName": "Interstellar",
        "ticketPrice": 14.5,
        "availableSeats": 120
      }
    ]
  }
  ```

---

#### C. Quản lý Đặt Vé (Bookings)

##### 1. Đặt vé xem phim mới (POST /bookings)
* **Method:** `POST`
* **URL:** `{{url}}/bookings`
* **Body (JSON):**
  ```json
  {
    "customerName": "Tran Kim Thang",
    "theaterName": "Megaplex Midtown",
    "movieName": "Interstellar",
    "showTime": "2026-06-12T19:00:00.000Z",
    "numberOfTickets": 3
  }
  ```
* **Kết quả kỳ vọng (201 Created):**
  * Server tính tổng số tiền: `3 * 14.5 = 43.5`.
  * Trả về thông tin đặt vé thành công.
  * Số ghế trống (`availableSeats`) trong lịch chiếu giảm từ `120` xuống còn `117`.
  * Lưu lại giá trị `_id` của đơn booking vừa trả về để thực hiện sửa/xóa ở bước sau.

##### 2. Lấy danh sách toàn bộ vé đã đặt (GET /bookings)
* **Method:** `GET`
* **URL:** `{{url}}/bookings`
* **Kết quả kỳ vọng (200 OK):** Trả về mảng chứa danh sách các đơn đặt vé.

##### 3. Đặt vé lỗi do không đủ ghế trống (POST /bookings - Validation)
* **Method:** `POST`
* **URL:** `{{url}}/bookings`
* **Body (JSON - Đặt vượt quá số ghế còn lại):**
  ```json
  {
    "customerName": "Nguyen Van A",
    "theaterName": "Megaplex Midtown",
    "movieName": "Interstellar",
    "showTime": "2026-06-12T19:00:00.000Z",
    "numberOfTickets": 200
  }
  ```
* **Kết quả kỳ vọng (400 Bad Request):**
  ```json
  {
    "message": "Not enough available seats"
  }
  ```

##### 4. Chỉnh sửa thay đổi số vé đã đặt (PUT /bookings/:bookingId)
* **Method:** `PUT`
* **URL:** `{{url}}/bookings/<bookingId>` *(Điền ID thực tế thu được ở bước tạo booking)*
* **Body (JSON) - Thay đổi số lượng vé (ví dụ tăng từ 3 lên 5 vé):**
  ```json
  {
    "customerName": "Tran Kim Thang (Updated)",
    "theaterName": "Megaplex Midtown",
    "movieName": "Interstellar",
    "showTime": "2026-06-12T19:00:00.000Z",
    "numberOfTickets": 5
  }
  ```
* **Kết quả kỳ vọng (200 OK):**
  * Tổng số tiền được tính lại: `5 * 14.5 = 72.5`.
  * Số ghế trống của lịch chiếu phim được cập nhật tương ứng (giảm tiếp 2 ghế từ `117` xuống còn `115`).

##### 5. Hủy đơn đặt vé (DELETE /bookings/:bookingId)
* **Method:** `DELETE`
* **URL:** `{{url}}/bookings/<bookingId>` *(Điền ID thực tế)*
* **Kết quả kỳ vọng (200 OK):**
  ```json
  {
    "message": "Booking deleted successfully"
  }
  ```
  * Số ghế trống của lịch chiếu phim được hoàn lại đầy đủ (từ `115` tăng lại về `120`).

---

## 4. Cách Import Nhanh Vào Postman (Postman Collection JSON)

Để không phải tự tay nhập thủ công từng Request và Body, bạn có thể sử dụng tính năng **Import** của Postman:

1. Copy toàn bộ đoạn JSON bên dưới.
2. Mở phần mềm **Postman**, chọn nút **Import** ở góc trên cùng bên trái.
3. Chuyển sang tab **Raw text** (hoặc dán thẳng vào ô nhập liệu của Import).
4. Dán nội dung JSON đã copy vào và nhấn **Import** để tạo Collection tên `MovieBooking API Collection`.
5. Mặc định biến `url` trong Collection đã được thiết lập sẵn là `http://localhost:3000` (hoặc port chạy dự án của bạn). Bạn có thể thay đổi bằng cách click vào Collection -> Chọn tab **Variables**.

```json
{
  "info": {
    "_postman_id": "4e75d045-8f6a-4d92-bf3c-35cd29efb925",
    "name": "MovieBooking API Collection",
    "description": "Bộ sưu tập API cho dịch vụ Đặt vé xem phim (MovieBooking) dùng để kiểm thử nhanh trên Postman.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Quản lý Rạp chiếu (Theaters)",
      "item": [
        {
          "name": "Lấy danh sách rạp",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{url}}/theaters",
              "host": [
                "{{url}}"
              ],
              "path": [
                "theaters"
              ]
            }
          },
          "response": []
        },
        {
          "name": "Thêm rạp chiếu phim mới",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"theaterName\": \"Megaplex Midtown\",\n  \"location\": \"456 Broadway Ave\",\n  \"seatCapacity\": 120,\n  \"screenType\": \"IMAX\",\n  \"amenities\": [\"Dolby Atmos\", \"Recliner Seats\", \"Popcorn Bar\"]\n}"
            },
            "url": {
              "raw": "{{url}}/theaters",
              "host": [
                "{{url}}"
              ],
              "path": [
                "theaters"
              ]
            }
          },
          "response": []
        }
      ]
    },
    {
      "name": "Quản lý Lịch chiếu (Schedules)",
      "item": [
        {
          "name": "Lấy danh sách lịch chiếu",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{url}}/schedules",
              "host": [
                "{{url}}"
              ],
              "path": [
                "schedules"
              ]
            }
          },
          "response": []
        },
        {
          "name": "Tạo lịch chiếu mới",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"movieName\": \"Interstellar\",\n  \"theaterName\": \"Megaplex Midtown\",\n  \"showTime\": \"2026-06-12T19:00:00.000Z\",\n  \"ticketPrice\": 14.5,\n  \"availableSeats\": 120\n}"
            },
            "url": {
              "raw": "{{url}}/schedules",
              "host": [
                "{{url}}"
              ],
              "path": [
                "schedules"
              ]
            }
          },
          "response": []
        },
        {
          "name": "Tìm kiếm phim theo rạp và giờ chiếu",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{url}}/schedules/search?theaterName=Megaplex Midtown&showTime=2026-06-12T19:00:00.000Z",
              "host": [
                "{{url}}"
              ],
              "path": [
                "schedules",
                "search"
              ],
              "query": [
                {
                  "key": "theaterName",
                  "value": "Megaplex Midtown"
                },
                {
                  "key": "showTime",
                  "value": "2026-06-12T19:00:00.000Z"
                }
              ]
            }
          },
          "response": []
        }
      ]
    },
    {
      "name": "Quản lý Đặt vé (Bookings)",
      "item": [
        {
          "name": "Lấy danh sách vé đã đặt",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{url}}/bookings",
              "host": [
                "{{url}}"
              ],
              "path": [
                "bookings"
              ]
            }
          },
          "response": []
        },
        {
          "name": "Đặt vé xem phim mới thành công",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"customerName\": \"Tran Kim Thang\",\n  \"theaterName\": \"Megaplex Midtown\",\n  \"movieName\": \"Interstellar\",\n  \"showTime\": \"2026-06-12T19:00:00.000Z\",\n  \"numberOfTickets\": 3\n}"
            },
            "url": {
              "raw": "{{url}}/bookings",
              "host": [
                "{{url}}"
              ],
              "path": [
                "bookings"
              ]
            }
          },
          "response": []
        },
        {
          "name": "Đặt vé lỗi do không đủ ghế trống",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"customerName\": \"Nguyen Van A\",\n  \"theaterName\": \"Megaplex Midtown\",\n  \"movieName\": \"Interstellar\",\n  \"showTime\": \"2026-06-12T19:00:00.000Z\",\n  \"numberOfTickets\": 200\n}"
            },
            "url": {
              "raw": "{{url}}/bookings",
              "host": [
                "{{url}}"
              ],
              "path": [
                "bookings"
              ]
            }
          },
          "response": []
        },
        {
          "name": "Cập nhật đơn đặt vé (Đổi vé)",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"customerName\": \"Tran Kim Thang (Updated)\",\n  \"theaterName\": \"Megaplex Midtown\",\n  \"movieName\": \"Interstellar\",\n  \"showTime\": \"2026-06-12T19:00:00.000Z\",\n  \"numberOfTickets\": 5\n}"
            },
            "url": {
              "raw": "{{url}}/bookings/CHANGE_TO_BOOKING_ID",
              "host": [
                "{{url}}"
              ],
              "path": [
                "bookings",
                "CHANGE_TO_BOOKING_ID"
              ]
            }
          },
          "response": []
        },
        {
          "name": "Hủy đặt vé",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{url}}/bookings/CHANGE_TO_BOOKING_ID",
              "host": [
                "{{url}}"
              ],
              "path": [
                "bookings",
                "CHANGE_TO_BOOKING_ID"
              ]
            }
          },
          "response": []
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "url",
      "value": "http://localhost:3000",
      "type": "string"
    }
  ]
}
```

---

## 5. Giải Thích Luồng Nghiệp Vụ Chính (Business Logic Flow)

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
