# 06_CarRental

Car Rental Management System using Node.js, Express, MongoDB/Mongoose and EJS (MVCR).

```bash
npm install
npm run seed
npm run dev
```

Open `http://localhost:9999` for the EJS interface.

| Method | Endpoint | Function |
|---|---|---|
| GET | `/cars` | List cars |
| POST | `/cars` | Create car |
| PUT | `/cars/:carId` | Update car |
| DELETE | `/cars/:carId` | Delete car |
| GET | `/bookings` | List bookings |
| POST | `/bookings` | Create, check overlap and calculate payment |
| PUT | `/bookings/:bookingId` | Update and recalculate booking |
| DELETE | `/bookings/:bookingId` | Delete booking |
