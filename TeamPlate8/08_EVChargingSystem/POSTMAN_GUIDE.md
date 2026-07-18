# Hướng dẫn kiểm thử Postman — 08_EVChargingSystem

Guide này được sinh đồng bộ từ `08_EVChargingSystem.postman_collection.json`. Có **9 test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.

## 1. Chuẩn bị

```bash
npm install
npm run seed
npm run dev
```

Import `08_EVChargingSystem.postman_collection.json` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.

### Collection Variables

| Variable | Giá trị ban đầu | Cách lấy |
|---|---|---|
| `base_url` | `http://localhost:9999` | URL server |
| `admin_token` | `_để trống_` | Script tự lưu từ response |
| `customer_token` | `_để trống_` | Script tự lưu từ response |
| `station_id` | `_để trống_` | Script tự lưu từ response |
| `token` | `_để trống_` | Điền thủ công nếu request yêu cầu |

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
  "username": "testuser",
  "password": "123",
  "role": "customer"
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Register Customer`.

### Test 2 — Register Admin

- Method: `POST`
- URL: `{{base_url}}/auth/register`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "admin1",
  "password": "123",
  "role": "admin"
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Register Admin`.

### Test 3 — Login Admin

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "admin1",
  "password": "123"
}
```
- Script sau response tự lưu: `admin_token`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Login Admin`.

### Test 4 — Login Customer

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "testuser",
  "password": "123"
}
```
- Script sau response tự lưu: `customer_token`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Login Customer`.

### Test 5 — Get All Stations

- Method: `GET`
- URL: `{{base_url}}/stations`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get All Stations`.

### Test 6 — Get Station By ID

- Method: `GET`
- URL: `{{base_url}}/stations/{{station_id}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get Station By ID`.

### Test 7 — Create Station (Admin)

- Method: `POST`
- URL: `{{base_url}}/stations`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{admin_token}}`
- Body:

```json
{
  "stationCode": "TEST-001",
  "type": "FastCharge",
  "status": "available",
  "pricePerKwh": 3850,
  "connectors": [
    "CCS2",
    "CHAdeMO"
  ]
}
```
- Script sau response tự lưu: `station_id`.
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Create Station (Admin)`.

### Test 8 — Get Sessions

- Method: `GET`
- URL: `{{base_url}}/sessions`
- Headers:
  - `Authorization: Bearer {{customer_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get Sessions`.

### Test 9 — Create Session

- Method: `POST`
- URL: `{{base_url}}/sessions/book`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{customer_token}}`
- Body:

```json
{
  "stationId": "{{station_id}}",
  "startTime": "2027-08-01T08:00:00.000Z",
  "endTime": "2027-08-01T10:00:00.000Z",
  "energyEstimate": 30.5
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Create Session`.

## 3. Thứ tự chạy và reset dữ liệu

1. Chạy `npm run seed` trước một lượt test mới.
2. Chạy các request login/register trước để có token.
3. Chạy request lấy hoặc tạo resource để collection lưu ID.
4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.
5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.

## 4. Ghi chú nghiệp vụ từ template

# Hướng dẫn Test Postman

## Cách nhanh: Import Collection
1. Mở Postman → Import → chọn file `08_EVChargingSystem.postman_collection.json`
2. Token tự động lưu sau khi Login!

## Cách thủ công:

### 1. Login
POST `http://localhost:9999/auth/login`
```json
{"username": "admin1", "password": "123"}
```

### 2. Copy token → Authorization → Bearer Token

### 3. Get stations
GET `http://localhost:9999/stations`

### 4. Create session
POST `http://localhost:9999/sessions`
```json
{"stationId": "<id>", "startTime": "2026-08-01T08:00:00Z", "endTime": "2026-08-01T10:00:00Z"}
```
