# Hướng dẫn kiểm thử Postman — TranKimThang_parcelDelivery

Guide này được sinh đồng bộ từ `TranKimThang_parcelDelivery.postman_collection.json`. Có **7 test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.

## 1. Chuẩn bị

```bash
npm install
npm run dev
```

Import `TranKimThang_parcelDelivery.postman_collection.json` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.

### Collection Variables

| Variable | Giá trị ban đầu | Cách lấy |
|---|---|---|
| `base_url` | `http://localhost:9999` | URL server |
| `token` | `_để trống_` | Script tự lưu từ response |
| `record_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |

### Quy tắc chụp kết quả

Mỗi ảnh nên hiển thị tên request, method, URL, Authorization/body, HTTP status và response. Với test lỗi, chụp cả message lỗi.

## 2. Test cases

### Test 1 — 01 POST /auth/login

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "testuser",
  "password": "123456"
}
```
- Script sau response tự lưu: `token`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `01 POST /auth/login`.

### Test 2 — 02 POST /auth/register

- Method: `POST`
- URL: `{{base_url}}/auth/register`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "testuser",
  "password": "123456",
  "fullName": "Test User"
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `02 POST /auth/register`.

### Test 3 — 03 POST /delivery-zones

- Method: `POST`
- URL: `{{base_url}}/delivery-zones`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{
  "zoneCode": "TEST-001"
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `03 POST /delivery-zones`.

### Test 4 — 04 GET /delivery-zones

- Method: `GET`
- URL: `{{base_url}}/delivery-zones`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `04 GET /delivery-zones`.

### Test 5 — 05 POST /shipments

- Method: `POST`
- URL: `{{base_url}}/shipments`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `05 POST /shipments`.

### Test 6 — 06 GET /shipments

- Method: `GET`
- URL: `{{base_url}}/shipments`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `06 GET /shipments`.

### Test 7 — 07 PATCH /shipments/:id/status

- Method: `PATCH`
- URL: `{{base_url}}/shipments/{{record_id}}/status`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{
  "status": "confirmed"
}
```
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `07 PATCH /shipments/:id/status`.

## 3. Thứ tự chạy và reset dữ liệu

1. Chuẩn bị dữ liệu mẫu/ID theo đề trước một lượt test mới.
2. Chạy các request login/register trước để có token.
3. Chạy request lấy hoặc tạo resource để collection lưu ID.
4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.
5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.
