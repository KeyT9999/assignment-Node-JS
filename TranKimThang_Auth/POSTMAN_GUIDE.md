# Hướng dẫn Postman — TranKimThang_Auth

## Chuẩn bị

```powershell
npm run seed
npm run dev
```

Import `TranKimThang_Auth.postman_collection.json`. Nếu dev launcher đổi port, cập nhật `base_url` theo URL trong terminal.

## Public registration mode

1. `Register Customer` → mong đợi `201` và không có password trong response.
2. Chạy lại request trên → `409 Username already exists`.
3. `Register Admin - Blocked` → `400`, chống privilege escalation.
4. `Login Customer` → `200`, collection tự lưu `user_token`.
5. `Get Me` → `200` với `Bearer {{user_token}}`.
6. `Customer Calls Manager Route` → `403`.
7. `Login Wrong Password` → `401`.
8. `Login Deactivated` → `403`.
9. `Login Manager` → `200`, tự lưu `manager_token`.
10. `Manager Route` → `200`.

## Manager-only registration mode

Đổi `.env` sang preset WarePro hoặc LabTrack, seed lại rồi restart server.

1. Register không token → `401`.
2. Register bằng token user thường → `403`.
3. Register bằng manager token → `201`.
4. Cố tạo manager → `400`.
5. Thiếu assignment bắt buộc → `400`.

Khi đổi `AUTH_ASSIGNMENT_FIELD`, đổi key tương ứng trong JSON body, ví dụ `assignedWarehouse` hoặc `assignedLaboratory`.
