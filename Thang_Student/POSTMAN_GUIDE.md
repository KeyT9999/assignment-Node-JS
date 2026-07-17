# Hướng dẫn Test Postman

## Cách nhanh: Import Collection
1. Mở Postman → Import → chọn file `Thang_projectBooking.postman_collection.json`
2. Token tự động lưu sau khi Login!

## Cách thủ công:

### 1. Login
POST `http://localhost:9999/auth/login`
```json
{"username": "admin1", "password": "123456"}
```

### 2. Copy token → Authorization → Bearer Token

### 3. Get spaces
GET `http://localhost:9999/spaces`

### 4. Create reservation
POST `http://localhost:9999/reservations`
```json
{"spaceId": "<id>", "startTime": "2026-08-01T08:00:00Z", "endTime": "2026-08-01T10:00:00Z"}
```
