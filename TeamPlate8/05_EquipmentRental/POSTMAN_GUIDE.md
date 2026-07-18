# Hướng dẫn kiểm thử Postman — 05_EquipmentRental

Guide này được sinh đồng bộ từ `05_EquipmentRental.postman_collection.json`. Có **11 test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.

## 1. Chuẩn bị

```bash
npm install
npm run seed
npm run dev
```

Import `05_EquipmentRental.postman_collection.json` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.

### Collection Variables

| Variable | Giá trị ban đầu | Cách lấy |
|---|---|---|
| `base_url` | `http://localhost:9999` | URL server |
| `token` | `_để trống_` | Script tự lưu từ response |
| `admin_token` | `_để trống_` | Script tự lưu từ response |
| `equipment_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `rental_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `user_id` | `_để trống_` | Script tự lưu từ response |
| `record_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |

### Quy tắc chụp kết quả

Mỗi ảnh nên hiển thị tên request, method, URL, Authorization/body, HTTP status và response. Với test lỗi, chụp cả message lỗi.

## 2. Test cases

### Test 1 — Register Customer

- Method: `POST`
- URL: `{{base_url}}/auth/register`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "newcustomer",
  "password": "123456"
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Register Customer`.

### Test 2 — Login

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "user1",
  "password": "123456"
}
```
- Script sau response tự lưu: `token`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Login`.

### Test 3 — Login Admin

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "admin1",
  "password": "123456"
}
```
- Script sau response tự lưu: `admin_token`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Login Admin`.

### Test 4 — List Equipment

- Method: `GET`
- URL: `{{base_url}}/equipment`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `List Equipment`.

### Test 5 — Admin List Users

- Method: `GET`
- URL: `{{base_url}}/users`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
- Script sau response tự lưu: `user_id`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Admin List Users`.

### Test 6 — Admin Delete User

- Method: `DELETE`
- URL: `{{base_url}}/users/{{user_id}}`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Admin Delete User`.

### Test 7 — Create Rental

- Method: `POST`
- URL: `{{base_url}}/rentals`
- Headers:
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "equipmentId": "{{equipment_id}}",
  "startDate": "2026-08-01",
  "endDate": "2026-08-03",
  "quantity": 2
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Create Rental`.

### Test 8 — Get Rentals

- Method: `GET`
- URL: `{{base_url}}/rentals`
- Headers:
  - `Authorization: Bearer {{token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get Rentals`.

### Test 9 — Return Equipment

- Method: `PATCH`
- URL: `{{base_url}}/rentals/{{rental_id}}/return`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Return Equipment`.

### Test 10 — Search Rentals By Date

- Method: `GET`
- URL: `{{base_url}}/rentalsByDate?start=2026-01-01&end=2026-12-31`
- Headers:
  - `Authorization: Bearer {{token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Search Rentals By Date`.

### Test 11 — 03 POST /equipment

- Method: `POST`
- URL: `{{base_url}}/equipment`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `03 POST /equipment`.

## 3. Thứ tự chạy và reset dữ liệu

1. Chạy `npm run seed` trước một lượt test mới.
2. Chạy các request login/register trước để có token.
3. Chạy request lấy hoặc tạo resource để collection lưu ID.
4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.
5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.

## 4. Ghi chú nghiệp vụ từ template

# Postman guide

Login at `POST /auth/login`, then use `Authorization: Bearer <token>`.

Create rental body:
```json
{"equipmentId":"<equipment id>","startDate":"2026-08-01","endDate":"2026-08-03","quantity":2}
```

Return it with `PATCH /rentals/<rental id>/return`. Search using `GET /rentalsByDate?start=2026-01-01&end=2026-12-31`.
