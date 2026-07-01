# Hướng Dẫn Kiểm Thử (Test) API Gia Hạn Phiên Sạc

Tài liệu này cung cấp các kịch bản và các bước chi tiết để kiểm thử tính năng gia hạn phiên sạc (`POST /sessions/extend/:id`).

---

## 1. Chuẩn Bị Dữ Liệu Test (Database Setup)

Để chuẩn bị đầy đủ các bản ghi dữ liệu mẫu phục vụ kiểm thử, bạn hãy chạy lệnh seed:

```bash
npm run seed
```

Lệnh này sẽ dọn sạch DB cũ, tạo mới 2 trạm sạc và các phiên sạc tương ứng với các kịch bản test:
1.  **Session 1, 2 (pending):** Có trạng thái `pending`, dùng để test lỗi khi cố tình gia hạn phiên sạc không phải `active`.
2.  **Session 5 (active):** Có trạng thái `active`, thuộc trạm `ST-FAST-001`, thời gian kết thúc ban đầu là `now + 1h`. Đây là phiên sạc đích để thực hiện kịch bản thành công.
3.  **Session 6 (pending - future):** Phiên sạc đã đặt trước cùng trạm `ST-FAST-001`, bắt đầu từ `now + 3h` đến `now + 4h`. Dùng để kiểm tra trùng lịch biểu nếu kéo dài Session 5 vượt quá thời điểm `now + 3h`.

---

## 2. Các Kịch Bản Kiểm Thử (Test Cases)

### Kịch bản 1: Gia hạn thành công (Happy Path)
*   **Mô tả:** Khách hàng sở hữu phiên sạc (Session 5), muốn gia hạn thời gian kết thúc từ `now + 1h` thành `now + 2h`.
*   **Endpoint:** `POST {{baseUrl}}/sessions/extend/:id` (Với `:id` là ID của **Session 5** thu được khi chạy lệnh seed).
*   **Headers:**
    *   `Authorization`: `Bearer <TOKEN_CUSTOMER_1>`
*   **Body (JSON):**
    ```json
    {
      "newEndTime": "Thời gian mới (ví dụ: cộng thêm 2 giờ từ lúc bắt đầu sạc, lớn hơn endTime cũ)"
    }
    ```
*   **Kết quả kỳ vọng (Status: 200 OK):**
    *   Số dư ví tài khoản của người dùng bị trừ đi khoản phí chênh lệch tương ứng.
    *   `endTime` của phiên sạc được cập nhật thành `newEndTime`.
    *   `energyEstimate` và `totalCost` được tính toán lại tăng lên tương đương.
    *   Response trả về có thông tin:
        *   `extraHours` (số giờ gia hạn thêm).
        *   `hoursUpdated` (tổng thời lượng mới = `newEndTime` - `startTime`).
        *   `extraCost` (phí gia hạn).
        *   `remainingBalance` (số dư ví còn lại).

---

### Kịch bản 2: Gia hạn thất bại - Sai trạng thái phiên sạc
*   **Mô tả:** Thử gia hạn phiên sạc có trạng thái khác `active` (ví dụ: **Session 1** có trạng thái `pending`).
*   **Endpoint:** `POST {{baseUrl}}/sessions/extend/:id` (Với `:id` là ID của **Session 1**).
*   **Body (JSON):**
    ```json
    {
      "newEndTime": "2026-07-02T15:00:00.000Z"
    }
    ```
*   **Kết quả kỳ vọng (Status: 400 Bad Request):**
    *   Mã phản hồi lỗi: `Cannot extend session with status "pending". Only active sessions can be extended.`

---

### Kịch bản 3: Gia hạn thất bại - Thời gian mới không hợp lệ
*   **Mô tả:** Thử gia hạn **Session 5** với `newEndTime` nhỏ hơn hoặc bằng `endTime` hiện tại.
*   **Body (JSON):**
    ```json
    {
      "newEndTime": "Thời gian cũ hoặc nhỏ hơn"
    }
    ```
*   **Kết quả kỳ vọng (Status: 400 Bad Request):**
    *   Mã phản hồi lỗi: `newEndTime must be greater than current endTime`.

---

### Kịch bản 4: Gia hạn thất bại - Trùng lịch sạc tại trạm
*   **Mô tả:** Gia hạn thời gian của **Session 5** vượt quá thời điểm bắt đầu của **Session 6** (ví dụ gia hạn đến `now + 3.5h` trong khi Session 6 bắt đầu tại `now + 3h`).
*   **Endpoint:** `POST {{baseUrl}}/sessions/extend/:id` (Với `:id` là ID của **Session 5**).
*   **Body (JSON):**
    ```json
    {
      "newEndTime": "Thời gian trùng lịch (ví dụ: now + 3h30p)"
    }
    ```
*   **Kết quả kỳ vọng (Status: 409 Conflict):**
    *   Mã phản hồi lỗi: `Station is already booked by another session during the extended interval`.

---

### Kịch bản 5: Gia hạn thất bại - Tài khoản không đủ tiền thanh toán
*   **Mô tả:** Ví của khách hàng còn quá ít tiền so với chi phí phát sinh khi gia hạn thêm giờ sạc. Để test, bạn có thể chỉnh ví user xuống 0 hoặc gia hạn thời gian cực lớn.
*   **Kết quả kỳ vọng (Status: 402 Payment Required):**
    *   Mã phản hồi lỗi: `Insufficient balance to extend session`.
