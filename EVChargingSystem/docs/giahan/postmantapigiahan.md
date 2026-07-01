# Hướng dẫn Cấu hình Postman API Gia hạn Phiên Sạc

Tài liệu này hướng dẫn cách cấu hình và import nhanh request kiểm thử API gia hạn phiên sạc (`POST /sessions/extend/:id`) vào Postman.

## 1. Thông tin Request

*   **URL:** `{{baseUrl}}/sessions/extend/:id`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type`: `application/json`
    *   `Authorization`: `Bearer {{customerToken}}` (Token đăng nhập của Customer)
*   **Path Variable:**
    *   `id`: ID của phiên sạc muốn gia hạn (phải ở trạng thái `active`).
*   **Body (JSON - raw):**
    ```json
    {
      "newEndTime": "2026-07-02T12:00:00.000Z"
    }
    ```

---

## 2. Cách Import Collection Nhanh Vào Postman

Bạn có thể copy nội dung JSON bên dưới và dán vào tính năng **Import (Raw text)** của Postman để tạo nhanh bộ request kiểm thử:

```json
{
  "info": {
    "_postman_id": "7f12e84a-9bb2-4c22-921f-829d892a0134",
    "name": "EVChargingSystem Extension API",
    "description": "Collection test API gia hạn phiên sạc của hệ thống EVChargingSystem.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Extend Session (Customer)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{customerToken}}",
            "description": "Token của người dùng vai trò customer"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"newEndTime\": \"2026-07-02T12:00:00.000Z\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/sessions/extend/:id",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "sessions",
            "extend",
            ":id"
          ],
          "variable": [
            {
              "key": "id",
              "value": "SESSION_ID_CUA_BAN",
              "description": "ID của phiên sạc có trạng thái active"
            }
          ]
        },
        "description": "Gia hạn thêm thời gian cho phiên sạc đang hoạt động."
      },
      "response": []
    }
  ]
}
```
