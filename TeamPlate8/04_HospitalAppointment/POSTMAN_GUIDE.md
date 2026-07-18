# Hướng dẫn kiểm thử Postman — 04_HospitalAppointment

Guide này được sinh đồng bộ từ `04_HospitalAppointment.postman_collection.json`. Có **6 test cases**; mỗi test ghi rõ request và kết quả tối thiểu cần kiểm tra.

## 1. Chuẩn bị

```bash
npm install
npm run seed
npm run dev
```

Import `04_HospitalAppointment.postman_collection.json` vào Postman. Chạy request theo đúng thứ tự bên dưới vì các script có thể lưu token hoặc ID cho bước sau.

### Collection Variables

| Variable | Giá trị ban đầu | Cách lấy |
|---|---|---|
| `base_url` | `http://localhost:9999` | URL server |
| `doctor_id` | `_để trống_` | Script tự lưu từ response |
| `appointment_id` | `_để trống_` | Script tự lưu từ response |
| `token` | `_để trống_` | Điền thủ công nếu request yêu cầu |
| `record_id` | `_để trống_` | Điền thủ công nếu request yêu cầu |

### Quy tắc chụp kết quả

Mỗi ảnh nên hiển thị tên request, method, URL, Authorization/body, HTTP status và response. Với test lỗi, chụp cả message lỗi.

## 2. Test cases

### Test 1 — Get Doctors

- Method: `GET`
- URL: `{{base_url}}/doctors`
- Script sau response tự lưu: `doctor_id`.
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get Doctors`.

### Test 2 — Get Appointments

- Method: `GET`
- URL: `{{base_url}}/appointments`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Get Appointments`.

### Test 3 — Book Appointment

- Method: `POST`
- URL: `{{base_url}}/appointments/book`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "doctorId": "{{doctor_id}}",
  "patientName": "Nguyen Van A",
  "appointmentTime": "2027-08-01T09:00:00.000Z",
  "note": "Chest pain"
}
```
- Script sau response tự lưu: `appointment_id`.
- Mong đợi: HTTP `201` và response đúng nghiệp vụ của request `Book Appointment`.

### Test 4 — Duplicate Slot - expect 409

- Method: `POST`
- URL: `{{base_url}}/appointments/book`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "doctorId": "{{doctor_id}}",
  "patientName": "Another Patient",
  "appointmentTime": "2027-08-01T09:00:00.000Z"
}
```
- Mong đợi: HTTP `409` và response đúng nghiệp vụ của request `Duplicate Slot - expect 409`.

### Test 5 — Complete Appointment

- Method: `PUT`
- URL: `{{base_url}}/appointments/{{appointment_id}}/complete`
- Mong đợi: HTTP `200` và response đúng nghiệp vụ của request `Complete Appointment`.

### Test 6 — Complete Again - expect 400

- Method: `PUT`
- URL: `{{base_url}}/appointments/{{appointment_id}}/complete`
- Mong đợi: HTTP `400` và response đúng nghiệp vụ của request `Complete Again - expect 400`.

## 3. Thứ tự chạy và reset dữ liệu

1. Chạy `npm run seed` trước một lượt test mới.
2. Chạy các request login/register trước để có token.
3. Chạy request lấy hoặc tạo resource để collection lưu ID.
4. Chạy các request nghiệp vụ và trường hợp lỗi theo thứ tự Test 1 → Test cuối.
5. Nếu kết quả phụ thuộc dữ liệu của lần chạy trước, seed lại rồi chạy lại toàn bộ thứ tự.

## 4. Ghi chú nghiệp vụ từ template

# Postman guide

Import `04_HospitalAppointment.postman_collection.json`. Set `doctor_id` using `GET /doctors`; the collection automatically saves the first doctor ID and saves a created `appointment_id`.

Booking example:
```json
{"doctorId":"<doctor id>","patientName":"Nguyen Van A","appointmentTime":"2027-08-01T09:00:00.000Z","note":"Chest pain"}
```
Do not send `patientId` or `totalFee`; both are controlled by the server.
