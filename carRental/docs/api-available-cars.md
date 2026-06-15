# API Cancel Booking

**Endpoint:** `POST /bookings/:bookingId/cancel`

**Nghiệp vụ:** 
- Cho phép hủy booking trong vòng 24 giờ tính từ lúc tạo.
- Hoàn trả 90% tiền thuê.
- Tự động chuyển trạng thái xe về `available` nếu không còn lịch đặt.

---

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "message": "Đã hủy booking thành công",
  "data": {
    "bookingId": "64c...",
    "carNumber": "29A-12345",
    "totalAmount": 1000000,
    "refundAmount": 900000,
    "penaltyFee": 100000
  }
}
```

---

### Lỗi Thường Gặp
- **400 Bad Request:** Hủy sau 24 giờ (Hệ thống từ chối).
- **404 Not Found:** Sai ID hoặc booking không tồn tại.
