# Hướng dẫn kiểm thử Postman — __PROJECT_NAME__

Tài liệu này mô tả đầy đủ các test case cần chạy và chụp màn hình cho WarePro. Đề bài ghi 20 ảnh, nhưng khi tách riêng trường hợp export thường và export có `lowStockWarning`, danh sách chi tiết có 21 test case.

## 1. Chuẩn bị

```bash
npm install
npm run seed
npm run dev
```

Import collection `__PROJECT_NAME__.postman_collection.json` và tạo các Collection Variables:

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
