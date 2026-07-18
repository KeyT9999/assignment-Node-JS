# 08_EVChargingSystem

## SDN302 - Practical Examination

### Mô tả
Backend RESTful API bằng Node.js, Express, MongoDB/Mongoose.
Hệ thống quản lý station và session với JWT Authentication + RBAC.

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
| Admin | admin1 | 123 |
| Customer | user1 | 123 |

---
## API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | /auth/register | Đăng ký |
| POST | /auth/login | Đăng nhập → JWT |

### Station
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /stations | Public |
| GET | /stations/:id | Public |
| POST | /stations | Admin |
| PUT | /stations/:id | Admin |
| DELETE | /stations/:id | Admin |

### Session
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /sessions | JWT |
| POST | /sessions | JWT |
| POST | /sessions/book | JWT |

---
## Cấu trúc (MCR)
```
├── models/      (userModel, stationModel, sessionModel)
├── controllers/ (authController, stationController, sessionController)
├── routes/      (authRoutes, stationRoutes, sessionRoutes)
├── middlewares/  (authMiddleware, roleMiddleware)
├── utils/       (calculatePrice, checkOverlap, seedData)
├── config/      (db.js)
└── server.js
```

## Test Postman
1. Import file `08_EVChargingSystem.postman_collection.json` vào Postman
2. Chạy Login Admin → token tự lưu vào collection variable
3. Test các request
