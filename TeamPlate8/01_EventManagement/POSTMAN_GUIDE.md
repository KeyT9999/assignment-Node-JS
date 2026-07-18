# Hướng dẫn kiểm thử Postman — 01_EventManagement

Guide này được sinh đồng bộ từ `01_EventManagement.postman_collection.json`. Có **8 test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.

## 1. Chuẩn bị

```bash
npm install
npm run seed
npm run dev
```

Import `01_EventManagement.postman_collection.json` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.

### Collection Variables

| Variable | Giá trị ban đầu | Cách lấy |
|---|---|---|
| `base_url` | `http://localhost:9999` | URL server |
| `admin_token` | `_để trống_` | Script tự lưu từ response |
| `student_token` | `_để trống_` | Script tự lưu từ response |
| `registration_id` | `_để trống_` | Script tự lưu từ response |
| `token` | `_để trống_` | Điền thủ công nếu request yêu cầu |

### Quy tắc chụp kết quả

Mỗi ảnh nên hiển thị tên request, method, URL, Authorization/body, HTTP status và response. Với test lỗi, chụp cả message lỗi.

## 2. Test cases

### Test 1 — Login Admin

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

### Test 2 — Login Student

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "student1",
  "password": "123456"
}
```
- Script sau response tự lưu: `student_token`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Login Student`.

### Test 3 — Get Events

- Method: `GET`
- URL: `{{base_url}}/events`
- Headers:
  - `Authorization: Bearer {{student_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get Events`.

### Test 4 — Register Event

- Method: `POST`
- URL: `{{base_url}}/registrations`
- Headers:
  - `Authorization: Bearer {{student_token}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "eventId": "65fd9dc542e1a12345678901"
}
```
- Script sau response tự lưu: `registration_id`.
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Register Event`.

### Test 5 — Admin List

- Method: `GET`
- URL: `{{base_url}}/listRegistrations?page=1&limit=5`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Admin List`.

### Test 6 — Student List Forbidden

- Method: `GET`
- URL: `{{base_url}}/listRegistrations`
- Headers:
  - `Authorization: Bearer {{student_token}}`
- Mong đợi: HTTP `403` và response đúng nghiệp vụ của request `Student List Forbidden`.

### Test 7 — Search By Date

- Method: `GET`
- URL: `{{base_url}}/getRegistrationsByDate?startDate=2026-01-01&endDate=2027-01-01`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Search By Date`.

### Test 8 — Unregister

- Method: `DELETE`
- URL: `{{base_url}}/registrations/{{registration_id}}`
- Headers:
  - `Authorization: Bearer {{student_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Unregister`.

## 3. Thứ tự chạy và reset dữ liệu

1. Chạy `npm run seed` trước một lượt test mới.
2. Chạy các request login/register trước để có token.
3. Chạy request lấy hoặc tạo resource để collection lưu ID.
4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.
5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.

## 4. Ghi chú nghiệp vụ từ template

# Postman
Import the generated collection, run both login requests, then run Event/Registration requests in order. Tokens and the created registration ID are saved automatically.
