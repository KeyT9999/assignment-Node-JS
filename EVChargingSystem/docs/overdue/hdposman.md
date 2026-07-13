# Hướng dẫn Cấu hình Postman API Lấy Phiên Sạc Quá Giờ

Tài liệu này hướng dẫn cách cấu hình và import nhanh bộ request kiểm thử API lấy danh sách các phiên sạc đã đến giờ nhưng khách hàng chưa tới (`GET /sessions/overdue`) vào Postman.

## 1. Thông tin Request

*   **URL:** `{{baseUrl}}/sessions/overdue` (Mặc định `http://localhost:9999/sessions/overdue`)
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization`: `Bearer {{adminToken}}` (Token đăng nhập của tài khoản Admin)
*   **Phân quyền:** Chỉ tài khoản có vai trò `admin` mới được quyền truy cập. Tài khoản `customer` sẽ trả về `403 Forbidden`.

---

## 2. Các Kịch Bản Kiểm Thử (Test Cases)

1.  **Đăng nhập tài khoản Admin (`admin1` / `123`)** để lấy JWT Token (`adminToken`).
2.  **Đăng nhập tài khoản Customer (`user1` / `123`)** để lấy JWT Token (`customerToken`).
3.  **Lấy danh sách phiên sạc quá giờ bằng quyền Admin:**
    *   Đầu vào: Gửi kèm header `Authorization: Bearer {{adminToken}}`.
    *   Mục tiêu: Server trả về `200 OK` cùng danh sách các phiên sạc có trạng thái `pending` và có thời gian bắt đầu `startTime <= hiện tại` (ví dụ: Session 3 trong seed dữ liệu).
4.  **Thử nghiệm truy cập bằng quyền Customer:**
    *   Đầu vào: Gửi kèm header `Authorization: Bearer {{customerToken}}`.
    *   Mục tiêu: Server từ chối và trả về mã lỗi `403 Forbidden` cùng thông báo `"You do not have permission"`.

---

## 3. Cách Import Collection Nhanh Vào Postman

Bạn có thể copy nội dung JSON bên dưới và dán vào tính năng **Import (Raw text)** của Postman để tạo nhanh các request mẫu:

```json
{
  "info": {
    "_postman_id": "f512e84a-9bb2-4c22-921f-829d892a0135",
    "name": "EVChargingSystem Overdue API",
    "description": "Collection test API lấy danh sách các phiên sạc quá giờ của hệ thống EVChargingSystem.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Login Admin",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"admin1\",\n  \"password\": \"123\"\n}"
        },
        "url": {
          "raw": "http://localhost:9999/auth/login",
          "protocol": "http",
          "host": [
            "localhost"
          ],
          "port": "9999",
          "path": [
            "auth",
            "login"
          ]
        }
      },
      "response": []
    },
    {
      "name": "Login Customer",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"user1\",\n  \"password\": \"123\"\n}"
        },
        "url": {
          "raw": "http://localhost:9999/auth/login",
          "protocol": "http",
          "host": [
            "localhost"
          ],
          "port": "9999",
          "path": [
            "auth",
            "login"
          ]
        }
      },
      "response": []
    },
    {
      "name": "Get Overdue Sessions (Admin)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}",
            "description": "Token của người dùng vai trò admin"
          }
        ],
        "url": {
          "raw": "http://localhost:9999/sessions/overdue",
          "protocol": "http",
          "host": [
            "localhost"
          ],
          "port": "9999",
          "path": [
            "sessions",
            "overdue"
          ]
        },
        "description": "Lấy các phiên sạc đã đến giờ mà khách hàng chưa tới (dành cho Admin)."
      },
      "response": []
    },
    {
      "name": "Get Overdue Sessions (Customer - Should Fail)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{customerToken}}",
            "description": "Token của người dùng vai trò customer"
          }
        ],
        "url": {
          "raw": "http://localhost:9999/sessions/overdue",
          "protocol": "http",
          "host": [
            "localhost"
          ],
          "port": "9999",
          "path": [
            "sessions",
            "overdue"
          ]
        },
        "description": "Thử nghiệm lấy danh sách phiên sạc trễ bằng tài khoản Customer. Mong đợi mã lỗi 403 Forbidden."
      },
      "response": []
    }
  ]
}
```
