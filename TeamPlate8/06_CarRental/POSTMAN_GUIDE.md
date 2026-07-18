# Hướng dẫn kiểm thử Postman — 06_CarRental

Guide này được sinh đồng bộ từ `06_CarRental.postman_collection.json`. Có **8 test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.

## 1. Chuẩn bị

```bash
npm install
npm run seed
npm run dev
```

Import `06_CarRental.postman_collection.json` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.

### Collection Variables

| Variable | Giá trị ban đầu | Cách lấy |
|---|---|---|
| `base_url` | `http://localhost:9999` | URL server |
| `booking_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `token` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `car_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |

### Quy tắc chụp kết quả

Mỗi ảnh nên hiển thị tên request, method, URL, Authorization/body, HTTP status và response. Với test lỗi, chụp cả message lỗi.

## 2. Test cases

### Test 1 — List Cars

- Method: `GET`
- URL: `{{base_url}}/cars`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `List Cars`.

### Test 2 — Create Car

- Method: `POST`
- URL: `{{base_url}}/cars`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "carNumber": "51A-99999",
  "capacity": 5,
  "status": "available",
  "pricePerDay": 500000,
  "features": [
    "GPS"
  ]
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Create Car`.

### Test 3 — List Bookings

- Method: `GET`
- URL: `{{base_url}}/bookings`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `List Bookings`.

### Test 4 — Create Booking

- Method: `POST`
- URL: `{{base_url}}/bookings`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "customerName": "Nguyen Van A",
  "carNumber": "51A-12345",
  "startDate": "2026-08-01",
  "endDate": "2026-08-03"
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Create Booking`.

### Test 5 — Update Booking

- Method: `PUT`
- URL: `{{base_url}}/bookings/{{booking_id}}`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "endDate": "2026-08-04"
}
```
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Update Booking`.

### Test 6 — Delete Booking

- Method: `DELETE`
- URL: `{{base_url}}/bookings/{{booking_id}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Delete Booking`.

### Test 7 — 07 PUT /cars/:carId

- Method: `PUT`
- URL: `{{base_url}}/cars/{{car_id}}`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{
  "carNumber": "TEST-001"
}
```
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `07 PUT /cars/:carId`.

### Test 8 — 08 DELETE /cars/:carId

- Method: `DELETE`
- URL: `{{base_url}}/cars/{{car_id}}`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `08 DELETE /cars/:carId`.

## 3. Thứ tự chạy và reset dữ liệu

1. Chạy `npm run seed` trước một lượt test mới.
2. Chạy các request login/register trước để có token.
3. Chạy request lấy hoặc tạo resource để collection lưu ID.
4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.
5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.

## 4. Ghi chú nghiệp vụ từ template

# Postman guide

Use `http://localhost:9999`. Create a car first with `POST /cars`, then create a booking with `POST /bookings`.

```json
{"customerName":"Nguyen Van A","carNumber":"51A-12345","startDate":"2026-08-01","endDate":"2026-08-03"}
```

The server calculates `totalAmount`; do not send it from the client.
