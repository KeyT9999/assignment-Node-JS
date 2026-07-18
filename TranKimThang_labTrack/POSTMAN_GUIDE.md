# Hướng dẫn kiểm thử Postman — TranKimThang_labTrack

Guide này được sinh đồng bộ từ `TranKimThang_labTrack.postman_collection.json`. Có **9 test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.

## 1. Chuẩn bị

```bash
npm install
npm run dev
```

Import `TranKimThang_labTrack.postman_collection.json` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.

### Collection Variables

| Variable | Giá trị ban đầu | Cách lấy |
|---|---|---|
| `base_url` | `http://localhost:9999` | URL server |
| `token` | `_để trống_` | Script tự lưu từ response |
| `sample_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |
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

### Test 3 — 03 GET /reagents

- Method: `GET`
- URL: `{{base_url}}/reagents`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `03 GET /reagents`.

### Test 4 — 04 POST /reagents/restock

- Method: `POST`
- URL: `{{base_url}}/reagents/restock`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{
  "executionCode": "TEST-001",
  "sampleId": "{{sample_id}}",
  "transactionCode": "TEST-001"
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `04 POST /reagents/restock`.

### Test 5 — 05 GET /reports/reagent-usage

- Method: `GET`
- URL: `{{base_url}}/reports/reagent-usage`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `05 GET /reports/reagent-usage`.

### Test 6 — 06 GET /reports/sample-turnaround

- Method: `GET`
- URL: `{{base_url}}/reports/sample-turnaround`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `06 GET /reports/sample-turnaround`.

### Test 7 — 07 POST /samples

- Method: `POST`
- URL: `{{base_url}}/samples`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{
  "sampleCode": "TEST-001"
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `07 POST /samples`.

### Test 8 — 08 PATCH /samples/:id/complete

- Method: `PATCH`
- URL: `{{base_url}}/samples/{{record_id}}/complete`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{
  "score": 8,
  "endStation": "Station B"
}
```
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `08 PATCH /samples/:id/complete`.

### Test 9 — 09 POST /samples/:id/start-test

- Method: `POST`
- URL: `{{base_url}}/samples/{{record_id}}/start-test`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{
  "sampleCode": "TEST-001"
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `09 POST /samples/:id/start-test`.

## 3. Thứ tự chạy và reset dữ liệu

1. Chuẩn bị dữ liệu mẫu/ID theo đề trước một lượt test mới.
2. Chạy các request login/register trước để có token.
3. Chạy request lấy hoặc tạo resource để collection lưu ID.
4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.
5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.
