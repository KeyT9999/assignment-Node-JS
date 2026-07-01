# Postman Collection - Cancel API Test

File: `EVChargingSystem_Cancel_API.postman_collection.json`

---

## 1. Login Customer

**Method:** `POST`

**URL:** `http://localhost:9999/auth/login`

**Headers:**
| Key | Value |
|---|---|
| Content-Type | application/json |

**Body:**
```json
{
    "username": "user1",
    "password": "123"
}
```

**Test Script:** Tự động lưu `token` vào collection variables.

---

## 2. Get Sessions

**Method:** `GET`

**URL:** `http://localhost:9999/sessions`

**Headers:**
| Key | Value |
|---|---|
| Authorization | Bearer {{token}} |

**Test Script:** Tự động lưu `_id` của session đầu tiên vào biến `sessionId`.

---

## 3. Cancel Session (Customer)

**Method:** `POST`

**URL:** `http://localhost:9999/sessions/cancel/ID_CUA_SESSION`

- Thay `ID_CUA_SESSION` bằng `_id` thực tế lấy từ API Get Sessions
- Ví dụ: `http://localhost:9999/sessions/cancel/65f1a2b3c4d5e6f7a8b9c0d1`

**Headers:**
| Key | Value |
|---|---|
| Authorization | Bearer {{token}} |
| Content-Type | application/json |

---

## Ví dụ Response

### Refund 100% (huỷ >= 2h trước giờ bắt đầu)
```json
{
    "message": "Session cancelled successfully",
    "session": {
        "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
        "status": "cancelled",
        "totalCost": 5.25,
        "refundAmount": 5.25,
        "refundPercentage": 100,
        "cancelledAt": "2026-07-01T12:00:00.000Z",
        "remainingBalance": 500.00
    }
}
```

### Refund 70% (huỷ < 2h trước giờ bắt đầu)
```json
{
    "message": "Session cancelled successfully",
    "session": {
        "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
        "status": "cancelled",
        "totalCost": 5.25,
        "refundAmount": 3.68,
        "refundPercentage": 70,
        "cancelledAt": "2026-07-01T12:00:00.000Z",
        "remainingBalance": 498.43
    }
}
```

### Lỗi - Session đã qua giờ
```json
{
    "message": "Cannot cancel a session that has already started or passed"
}
```

### Lỗi - Session không phải pending
```json
{
    "message": "Cannot cancel session with status \"cancelled\". Only pending sessions can be cancelled."
}
```

### Lỗi - Không phải chủ sở hữu
```json
{
    "message": "You can only cancel your own sessions"
}
```

---

## Flow Test

```
1. POST http://localhost:9999/auth/login         → lấy token
2. GET  http://localhost:9999/sessions            → lấy sessionId
3. POST http://localhost:9999/sessions/cancel/{id} → test cancel
```
