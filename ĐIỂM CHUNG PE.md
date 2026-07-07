Hai đề PE này có **khung yêu cầu gần như giống nhau**, chỉ khác domain:  
một đề là **EV Charging Station**, một đề là **Co-working Space Booking**.

## **Các yêu cầu chung của cả 2 đề**

### **1\. Khởi tạo project Node.js**

Cả 2 đều yêu cầu:

mkdir \<yourname\>\_...  
npm init

Tức là bạn phải tạo project backend bằng **Node.js**.

---

### **2\. Có Authentication & Authorization**

Cả 2 đề đều bắt làm:

POST /auth/register  
POST /auth/login

Yêu cầu chung:

* Có `userModel.js`  
* Có `username`  
* Có `password` được hash bằng `bcrypt`  
* Có `role`: `"admin"` hoặc `"customer"`  
* Có `createdAt`  
* Login thành công trả về **JWT token**  
* Token phải chứa `role`

---

### **3\. Có RBAC phân quyền admin/customer**

Cả 2 đề đều yêu cầu phân quyền:

* `admin`: xem được toàn bộ dữ liệu booking/session  
* `customer`: chỉ xem dữ liệu của chính mình  
* `userId` phải lấy từ **JWT token**, không lấy trực tiếp từ body

Đây là phần rất quan trọng vì cả 2 đề đều nhấn mạnh **Login and Role-based Access Control**.

---

### **4\. Có 2 model nghiệp vụ chính**

Cả 2 đề đều có cấu trúc giống nhau:

| Đề Co-working | Đề EV Charging |
| ----- | ----- |
| `spaceModel.js` | `stationModel.js` |
| `reservationModel.js` | `sessionModel.js` |

Model thứ nhất là **tài nguyên được đặt**:

* Co-working: room/desk  
* EV: charging station

Model thứ hai là **lượt đặt/chốt giao dịch**:

* Co-working: reservation  
* EV: charging session

---

### **5\. Model booking/session đều có reference**

Cả 2 đều yêu cầu model booking/session có:

userId: ObjectId

và reference tới tài nguyên:

spaceId: ObjectId

hoặc:

stationId: ObjectId

Tức là phải dùng Mongoose `ref`.

---

### **6\. Có API lấy danh sách booking/session**

Cả 2 đều có API dạng:

GET /reservations

hoặc:

GET /sessions

Logic giống nhau:

* Admin xem tất cả  
* Customer chỉ xem dữ liệu của chính mình

---

### **7\. Có API tạo booking/session**

Cả 2 đều yêu cầu tạo lượt đặt:

POST /reservations

hoặc:

POST /sessions/book

Logic chung:

* Kiểm tra `startTime < endTime`  
* Kiểm tra tài nguyên có tồn tại không  
* Kiểm tra tài nguyên có đang bảo trì/offline không  
* Kiểm tra trùng lịch bằng công thức overlap:

Snew \< Eold && Enew \> Sold

* Nếu trùng lịch thì không cho đặt  
* Tính tiền tự động  
* Lưu booking/session vào database

---

### **8\. Có tính tiền tự động**

Cả 2 đề đều yêu cầu backend tự tính tiền, không tin dữ liệu tiền từ client.

Co-working:

totalAmount \= hours \* pricePerHour

EV Charging:

totalCost \= hours \* 15kWh \* pricePerKwh

---

### **9\. Có yêu cầu Project Structure theo MCR**

Cả 2 đều bắt tổ chức code theo:

/models  
/controllers  
/routes

Tức là nên làm theo kiểu:

models/userModel.js  
models/spaceModel.js hoặc stationModel.js  
models/reservationModel.js hoặc sessionModel.js

controllers/authController.js  
controllers/reservationController.js hoặc sessionController.js

routes/authRoutes.js  
routes/reservationRoutes.js hoặc sessionRoutes.js

---

### **10\. Yêu cầu nộp bài giống nhau**

Cả 2 đều yêu cầu nộp:

* Toàn bộ file `.js`  
* `package.json`  
* `README.md`

Trong `README.md` phải có:

* Hướng dẫn cài đặt  
* Hướng dẫn chạy project  
* Hướng dẫn test bằng Postman  
* Tài khoản mẫu admin/customer

---

## **Tóm tắt ngắn gọn**

Điểm chung lớn nhất của 2 đề là:

Xây dựng backend RESTful API bằng Node.js, Express, MongoDB/Mongoose, có JWT Authentication, RBAC admin/customer, model tài nguyên, model booking/session, kiểm tra trùng thời gian, tính tiền tự động, và tổ chức code theo MCR.

Nói cách khác, bạn chỉ cần nắm chắc một template backend gồm:

Auth \+ JWT \+ Role  
Mongoose Models  
Routes  
Controllers  
Booking Logic  
Overlap Check  
Auto Payment  
README \+ Postman Guide

là có thể áp dụng cho cả 2 đề.

