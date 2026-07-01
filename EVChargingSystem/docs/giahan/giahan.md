# Tài Liệu Tổng Quan: Tính Năng Gia Hạn Phiên Sạc

Tài liệu này trình bày tổng quan về tính năng gia hạn phiên sạc pin của hệ thống **EVChargingSystem**.

---

## 1. Giới thiệu chức năng
Tính năng gia hạn phiên sạc cho phép khách hàng đang cắm sạc thực tế (phiên sạc ở trạng thái `active`) có thể kéo dài thời gian sạc bằng cách thay đổi thời gian kết thúc (`newEndTime`) mà không cần kết thúc phiên sạc hiện tại và khởi tạo một phiên sạc mới.

---

## 2. Quy tắc nghiệp vụ (Business Rules)

*   **Trạng thái hợp lệ:** Chỉ cho phép gia hạn các phiên sạc có trạng thái `active`.
*   **Điều kiện thời gian:** `newEndTime` mới phải lớn hơn `endTime` hiện tại của phiên sạc.
*   **Tránh xung đột lịch (No Overlaps):** Không được đè lên bất kỳ phiên sạc nào khác (đang ở trạng thái khác `cancelled`) tại cùng một trạm sạc trong khoảng thời gian sạc của phiên sạc tính từ lúc bắt đầu cho đến `newEndTime`.
*   **Thanh toán chênh lệch:**
    *   Hệ thống tính toán thời gian kéo dài thêm: `extraHours = newEndTime - oldEndTime`.
    *   Tính lượng điện năng ước tính phát sinh: `extraEnergy = extraHours * 15` (mặc định 15 kWh mỗi giờ sạc).
    *   Xác định đơn giá và giảm giá giờ vàng (Happy Hour từ 22:00 đến 04:00 sáng, giảm 30% tổng phí) dựa vào thời điểm bắt đầu phiên gốc `startTime`.
    *   Khách hàng cần trả thêm: `extraCost = extraEnergy * pricePerKwh` (có giảm giá nếu thuộc Happy Hour).
    *   Kiểm tra ví của khách hàng (`balance`). Nếu đủ tiền, trừ tiền từ số dư ví và cập nhật lại phiên sạc. Nếu không đủ tiền, báo lỗi `402 Payment Required`.

---

## 3. Đặc tả API (API Specification)

### Request
*   **Method:** `POST`
*   **Endpoint:** `/sessions/extend/:id`
*   **Phân quyền:** Chỉ `customer` (Khách hàng sở hữu chính phiên sạc đó) mới được quyền gọi API này.
*   **Body:**
    ```json
    {
      "newEndTime": "YYYY-MM-DDTHH:MM:SS.SSSZ"
    }
    ```

### Response (Thành công - 200 OK)
```json
{
  "message": "Session extended successfully",
  "session": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "userId": "65f1a2b3c4d5e6f7a8b9c0d2",
    "stationId": "65f1a2b3c4d5e6f7a8b9c0d3",
    "startTime": "2026-07-01T12:00:00.000Z",
    "endTime": "2026-07-01T15:00:00.000Z",
    "energyEstimate": 45,
    "totalCost": 90,
    "status": "active"
  },
  "billing": {
    "extraHours": 1.0,
    "extraEnergy": 15.0,
    "extraCost": 30.0,
    "hoursUpdated": 3.0,
    "totalCost": 90.0,
    "remainingBalance": 410.0
  }
}
```

### Các mã lỗi phản hồi
*   **400 Bad Request:** Thiếu tham số, định dạng ngày sai, hoặc `newEndTime` không lớn hơn `endTime` hiện tại, hoặc phiên sạc không ở trạng thái `active`.
*   **402 Payment Required:** Tài khoản khách hàng không đủ số dư để thanh toán chi phí gia hạn thêm.
*   **403 Forbidden:** Khách hàng không sở hữu phiên sạc này.
*   **404 Not Found:** Không tìm thấy phiên sạc hoặc trạm sạc.
*   **409 Conflict:** Bị trùng thời gian sạc với một phiên sạc khác đã đặt tại cùng trạm sạc.
