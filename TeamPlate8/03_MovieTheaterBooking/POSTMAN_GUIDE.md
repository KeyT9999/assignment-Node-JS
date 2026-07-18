# Hướng dẫn kiểm thử Postman — 03_MovieTheaterBooking

Guide này được sinh đồng bộ từ `03_MovieTheaterBooking.postman_collection.json`. Có **6 test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.

## 1. Chuẩn bị

```bash
npm install
npm run seed
npm run dev
```

Import `03_MovieTheaterBooking.postman_collection.json` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.

### Collection Variables

| Variable | Giá trị ban đầu | Cách lấy |
|---|---|---|
| `base_url` | `http://localhost:9999` | URL server |
| `booking_id` | `_để trống_` | Script tự lưu từ response |
| `token` | `_để trống_` | Điền thủ công nếu request yêu cầu |

### Quy tắc chụp kết quả

Mỗi ảnh nên hiển thị tên request, method, URL, Authorization/body, HTTP status và response. Với test lỗi, chụp cả message lỗi.

## 2. Test cases

### Test 1 — Get Theaters

- Method: `GET`
- URL: `{{base_url}}/theaters`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get Theaters`.

### Test 2 — Get Schedules

- Method: `GET`
- URL: `{{base_url}}/schedules`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get Schedules`.

### Test 3 — Get Bookings

- Method: `GET`
- URL: `{{base_url}}/bookings`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get Bookings`.

### Test 4 — Create Booking

- Method: `POST`
- URL: `{{base_url}}/bookings`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "customerName": "Nguyen Van A",
  "theaterName": "Cineplex Downtown",
  "movieName": "Inception",
  "showTime": "2027-05-15T20:00:00Z",
  "numberOfTickets": 2
}
```
- Script sau response tự lưu: `booking_id`.
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Create Booking`.

### Test 5 — Update Booking

- Method: `PUT`
- URL: `{{base_url}}/bookings/{{booking_id}}`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "numberOfTickets": 3
}
```
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Update Booking`.

### Test 6 — Cancel Booking

- Method: `DELETE`
- URL: `{{base_url}}/bookings/{{booking_id}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Cancel Booking`.

## 3. Thứ tự chạy và reset dữ liệu

1. Chạy `npm run seed` trước một lượt test mới.
2. Chạy các request login/register trước để có token.
3. Chạy request lấy hoặc tạo resource để collection lưu ID.
4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.
5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.

## 4. Ghi chú nghiệp vụ từ template

# Postman guide

Import the generated collection. Run `Get Schedules`, copy a schedule's theaterName/movieName/showTime, then create a booking. The server calculates totalAmount and updates availableSeats.
