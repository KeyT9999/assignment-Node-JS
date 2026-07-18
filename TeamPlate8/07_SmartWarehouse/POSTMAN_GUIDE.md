# Hướng dẫn kiểm thử Postman — 07_SmartWarehouse

Guide này được sinh đồng bộ từ `07_SmartWarehouse.postman_collection.json`. Có **10 test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.

## 1. Chuẩn bị

```bash
npm install
npm run seed
npm run dev
```

Import `07_SmartWarehouse.postman_collection.json` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.

### Collection Variables

| Variable | Giá trị ban đầu | Cách lấy |
|---|---|---|
| `base_url` | `http://localhost:9999` | URL server |
| `manager_token` | `_để trống_` | Script tự lưu từ response |
| `keeper_token` | `_để trống_` | Script tự lưu từ response |
| `auditor_token` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `product_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `warehouse_1` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `warehouse_2` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `token` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `warehouse_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |

### Quy tắc chụp kết quả

Mỗi ảnh nên hiển thị tên request, method, URL, Authorization/body, HTTP status và response. Với test lỗi, chụp cả message lỗi.

## 2. Test cases

### Test 1 — Login Manager

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "manager1",
  "password": "123456"
}
```
- Script sau response tự lưu: `manager_token`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Login Manager`.

### Test 2 — Login Keeper

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "keeper1",
  "password": "123456"
}
```
- Script sau response tự lưu: `keeper_token`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Login Keeper`.

### Test 3 — Low Stock Products

- Method: `GET`
- URL: `{{base_url}}/products?lowStock=true`
- Headers:
  - `Authorization: Bearer {{auditor_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Low Stock Products`.

### Test 4 — Import

- Method: `POST`
- URL: `{{base_url}}/transactions/import`
- Headers:
  - `Authorization: Bearer {{keeper_token}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "productId": "{{product_id}}",
  "warehouseId": "{{warehouse_1}}",
  "quantity": 10,
  "unitPrice": 500000
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Import`.

### Test 5 — Export

- Method: `POST`
- URL: `{{base_url}}/transactions/export`
- Headers:
  - `Authorization: Bearer {{keeper_token}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "productId": "{{product_id}}",
  "warehouseId": "{{warehouse_1}}",
  "quantity": 5,
  "unitPrice": 500000
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Export`.

### Test 6 — Transfer

- Method: `POST`
- URL: `{{base_url}}/transactions/transfer`
- Headers:
  - `Authorization: Bearer {{manager_token}}`
  - `Content-Type: application/json`
- Body:

```json
{
  "productId": "{{product_id}}",
  "sourceWarehouseId": "{{warehouse_1}}",
  "destinationWarehouseId": "{{warehouse_2}}",
  "quantity": 5
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Transfer`.

### Test 7 — Stock Summary

- Method: `GET`
- URL: `{{base_url}}/reports/stock-summary`
- Headers:
  - `Authorization: Bearer {{manager_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Stock Summary`.

### Test 8 — Transaction Report

- Method: `GET`
- URL: `{{base_url}}/reports/transactions?type=transfer_out`
- Headers:
  - `Authorization: Bearer {{manager_token}}`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Transaction Report`.

### Test 9 — 02 POST /auth/register

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

### Test 10 — 03 POST /products

- Method: `POST`
- URL: `{{base_url}}/products`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- Body:

```json
{
  "sku": "test-value",
  "name": "Test record",
  "category": "test-value",
  "unit": "test-value",
  "unitPrice": 1,
  "reorderLevel": 1
}
```
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `03 POST /products`.

## 3. Thứ tự chạy và reset dữ liệu

1. Chạy `npm run seed` trước một lượt test mới.
2. Chạy các request login/register trước để có token.
3. Chạy request lấy hoặc tạo resource để collection lưu ID.
4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.
5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.

## 4. Ghi chú nghiệp vụ từ template

# Hướng dẫn kiểm thử Postman — 07_SmartWarehouse

Tài liệu này mô tả đầy đủ các test case cần chạy và chụp màn hình cho WarePro. Đề bài ghi 20 ảnh, nhưng khi tách riêng trường hợp export thường và export có `lowStockWarning`, danh sách chi tiết có 21 test case.

## 1. Chuẩn bị

```bash
npm install
npm run seed
npm run dev
```

Import collection `07_SmartWarehouse.postman_collection.json` và tạo các Collection Variables:

| Variable | Giá trị ban đầu |
|---|---|
| `base_url` | `http://localhost:9999` |
| `manager_token` | để trống |
| `keeper_token` | để trống |
| `auditor_token` | để trống |
| `product_id` | `_id` của `SKU-0042` |
| `warehouse_1` | `_id` của `WH-01` |
| `warehouse_2` | `_id` của `WH-02` |

Tài khoản seed: `manager1/123456`, `keeper1/123456`, `auditor1/123456`. Chạy lại `npm run seed` trước một lượt test mới để dữ liệu tồn kho trở về trạng thái ban đầu.

Mỗi ảnh nên hiển thị rõ tên request, method, URL, headers/body, HTTP status và response.

## 2. Authentication & RBAC — 5 test cases

### Test 1 — Login manager thành công

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Body:

```json
{"username":"manager1","password":"123456"}
```

- Mong đợi: `200 OK`, response có `token`. Lưu token vào `manager_token`.

### Test 2 — Register thành công

- Method: `POST`
- URL: `{{base_url}}/auth/register`
- Authorization: `Bearer {{manager_token}}`
- Body:

```json
{"username":"newkeeper_test","password":"123456","fullName":"Test Stock Keeper","role":"stock_keeper"}
```

- Mong đợi: `201 Created`, trả về user mới và không trả password.

### Test 3 — Register bằng keeper

Đăng nhập `keeper1/123456`, lưu token vào `keeper_token`, sau đó gửi:

- Method: `POST`
- URL: `{{base_url}}/auth/register`
- Authorization: `Bearer {{keeper_token}}`
- Body:

```json
{"username":"unauthorized_user","password":"123456","fullName":"Unauthorized User","role":"stock_keeper"}
```

- Mong đợi: `403 Forbidden`.

### Test 4 — Cố tạo manager qua API

- Method: `POST`
- URL: `{{base_url}}/auth/register`
- Authorization: `Bearer {{manager_token}}`
- Body:

```json
{"username":"fake_manager","password":"123456","fullName":"Fake Manager","role":"warehouse_manager"}
```

- Mong đợi: `400 Bad Request`, message `Cannot register another manager via API`.

### Test 5 — Login tài khoản bị vô hiệu hóa

Test này cần có user `deactivated1` với `isActive: false` trong database.

- Method: `POST`
- URL: `{{base_url}}/auth/login`
- Body:

```json
{"username":"deactivated1","password":"123456"}
```

- Mong đợi: `403 Forbidden`, message `Account is deactivated. Contact your manager.`

## 3. Product Management — 3 test cases

### Test 6 — Tạo product thành công

- Method: `POST`
- URL: `{{base_url}}/products`
- Authorization: `Bearer {{manager_token}}`
- Body:

```json
{"sku":"SKU-9999","name":"Heavy Duty Rack","category":"furniture","unit":"pcs","unitPrice":1500000,"reorderLevel":10}
```

- Mong đợi: `201 Created`.

### Test 7 — Trùng SKU

Gửi lại chính request Test 6.

- Mong đợi: `409 Conflict`, message cho biết SKU đã tồn tại.

### Test 8 — Danh sách low stock

- Method: `GET`
- URL: `{{base_url}}/products?lowStock=true`
- Authorization: `Bearer {{keeper_token}}`
- Mong đợi: `200 OK`; `SKU-0042` có tổng tồn kho 80, thấp hơn `reorderLevel` 100, nên xuất hiện với `lowStock: true`.

## 4. Inventory & Transactions — 8 test cases

### Test 9 — Import thành công

- Method: `POST`
- URL: `{{base_url}}/transactions/import`
- Authorization: `Bearer {{keeper_token}}`
- Body:

```json
{"productId":"{{product_id}}","warehouseId":"{{warehouse_1}}","quantity":50,"unitPrice":500000,"note":"Importing scanner units"}
```

- Mong đợi: `201 Created`, có `transactionCode` dạng `TXN-YYYYMMDD-XXX` và `totalValue: 25000000`.

### Test 10 — Import vượt sức chứa

- Method: `POST`
- URL: `{{base_url}}/transactions/import`
- Authorization: `Bearer {{keeper_token}}`
- Body:

```json
{"productId":"{{product_id}}","warehouseId":"{{warehouse_1}}","quantity":2000,"unitPrice":500000}
```

- Mong đợi: `409 Conflict`, message bắt đầu bằng `Insufficient warehouse capacity. Available:`.

### Test 11 — Export thành công

- Method: `POST`
- URL: `{{base_url}}/transactions/export`
- Authorization: `Bearer {{keeper_token}}`
- Body:

```json
{"productId":"{{product_id}}","warehouseId":"{{warehouse_1}}","quantity":10,"unitPrice":500000,"note":"Exporting scanner units"}
```

- Mong đợi: `201 Created`, có `totalValue: 5000000`.

### Test 12 — Export sinh cảnh báo low stock

Sau Test 9 và Test 11, kho có 120 scanner. Xuất thêm 30 để tổng tồn còn 90, thấp hơn reorder level 100.

- Method: `POST`
- URL: `{{base_url}}/transactions/export`
- Authorization: `Bearer {{keeper_token}}`
- Body:

```json
{"productId":"{{product_id}}","warehouseId":"{{warehouse_1}}","quantity":30,"unitPrice":500000}
```

- Mong đợi: `201 Created`, response có `lowStockWarning`.

### Test 13 — Export thiếu tồn kho

- Method: `POST`
- URL: `{{base_url}}/transactions/export`
- Authorization: `Bearer {{keeper_token}}`
- Body:

```json
{"productId":"{{product_id}}","warehouseId":"{{warehouse_1}}","quantity":99999,"unitPrice":500000}
```

- Mong đợi: `409 Conflict`, message `Insufficient stock. Available: ... units, requested: 99999`.

### Test 14 — Transfer thành công

- Method: `POST`
- URL: `{{base_url}}/transactions/transfer`
- Authorization: `Bearer {{manager_token}}`
- Body:

```json
{"productId":"{{product_id}}","sourceWarehouseId":"{{warehouse_1}}","destinationWarehouseId":"{{warehouse_2}}","quantity":10,"note":"Transfer stock to WH-02"}
```

- Mong đợi: `201 Created`, trả về hai record `transfer_out` và `transfer_in` có chung prefix `TRF-YYYYMMDD-XXX`.

### Test 15 — Transfer thiếu stock nguồn

- Method: `POST`
- URL: `{{base_url}}/transactions/transfer`
- Authorization: `Bearer {{manager_token}}`
- Body:

```json
{"productId":"{{product_id}}","sourceWarehouseId":"{{warehouse_1}}","destinationWarehouseId":"{{warehouse_2}}","quantity":99999}
```

- Mong đợi: `409 Conflict`, message `Insufficient stock in source warehouse`.

### Test 16 — Transfer cùng warehouse

- Method: `POST`
- URL: `{{base_url}}/transactions/transfer`
- Authorization: `Bearer {{manager_token}}`
- Body:

```json
{"productId":"{{product_id}}","sourceWarehouseId":"{{warehouse_1}}","destinationWarehouseId":"{{warehouse_1}}","quantity":10}
```

- Mong đợi: `400 Bad Request`, message `Source and destination warehouse cannot be the same`.

## 5. Reports & Audit — 5 test cases

### Test 17 — Stock summary tất cả warehouse

- Method: `GET`
- URL: `{{base_url}}/reports/stock-summary`
- Authorization: `Bearer {{manager_token}}`
- Mong đợi: `200 OK`, trả về ba warehouse, `utilizationPercent` và products của từng warehouse.

### Test 18 — Stock summary theo warehouse

- Method: `GET`
- URL: `{{base_url}}/reports/stock-summary?warehouseId={{warehouse_1}}`
- Authorization: `Bearer {{manager_token}}`
- Mong đợi: `200 OK`, chỉ trả về `WH-01`.

### Test 19 — Toàn bộ transaction

- Method: `GET`
- URL: `{{base_url}}/reports/transactions`
- Authorization: `Bearer {{manager_token}}`
- Mong đợi: `200 OK`; `productId` và `performedBy` đã được populate.

### Test 20 — Transaction loại transfer_out

- Method: `GET`
- URL: `{{base_url}}/reports/transactions?type=transfer_out`
- Authorization: `Bearer {{manager_token}}`
- Mong đợi: `200 OK`, mọi record trả về đều có `type: transfer_out`.

### Test 21 — Transaction theo khoảng ngày

- Method: `GET`
- URL: `{{base_url}}/reports/transactions?from=2026-07-01&to=2026-07-31`
- Authorization: `Bearer {{manager_token}}`
- Mong đợi: `200 OK`, chỉ có transaction trong khoảng ngày đã chọn. Điều chỉnh ngày theo ngày thực tế chạy test nếu cần.

## 6. Thứ tự chạy đề xuất

1. Chạy `npm run seed`.
2. Login manager, keeper và auditor; lưu ba token.
3. Điền `product_id`, `warehouse_1`, `warehouse_2` bằng ObjectId thật.
4. Chạy Test 2–8.
5. Chạy Test 9–16 đúng thứ tự để số lượng tồn kho khớp với kết quả mô tả.
6. Chạy Test 17–21 và chụp ảnh kết quả.

Không gửi `performedBy` trong body; API phải lấy trường này từ JWT.
