# 02_CoWorkingBooking

## SDN302 - Practical Examination

### Mô tả
Backend RESTful API bằng Node.js, Express, MongoDB/Mongoose.
Hệ thống quản lý space và reservation với JWT Authentication + RBAC.

---
## Cài đặt
```bash
npm install
```

## Seed dữ liệu mẫu
```bash
npm run seed
```

## Chạy server
```bash
npm run dev
```
Server: `http://localhost:9999`

---
## Tài khoản Test

| Role | Username | Password |
|------|----------|----------|
| Admin | admin1 | 123456 |
| Customer | user1 | 123456 |

---
## API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | /auth/register | Đăng ký |
| POST | /auth/login | Đăng nhập → JWT |

### Space
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /spaces | Public |
| GET | /spaces/:id | Public |
| POST | /spaces | Admin |
| PUT | /spaces/:id | Admin |
| DELETE | /spaces/:id | Admin |

### Reservation
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /reservations | JWT |
| POST | /reservations | JWT |
| POST | /reservations/book | JWT |

---
## Cấu trúc (MCR)
```
├── models/      (userModel, spaceModel, reservationModel)
├── controllers/ (authController, spaceController, reservationController)
├── routes/      (authRoutes, spaceRoutes, reservationRoutes)
├── middlewares/  (authMiddleware, roleMiddleware)
├── utils/       (calculatePrice, checkOverlap, seedData)
├── config/      (db.js)
└── server.js
```

## Test Postman
1. Import file `02_CoWorkingBooking.postman_collection.json` vào Postman
2. Chạy Login Admin → token tự lưu vào collection variable
3. Test các request
