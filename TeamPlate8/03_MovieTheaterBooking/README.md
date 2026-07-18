# 03_MovieTheaterBooking

Movie Theater Booking System using Express, Mongoose and EJS (MVCR).

```bash
npm install
npm run seed
npm run dev
```

Open `http://localhost:9999` for the EJS interface.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/theaters` | List theaters |
| GET | `/schedules` | List schedules and available seats |
| GET | `/bookings` | List bookings |
| POST | `/bookings` | Reserve seats and calculate tickets × ticketPrice |
| PUT | `/bookings/:bookingId` | Update booking, price and seat inventory |
| DELETE | `/bookings/:bookingId` | Cancel and restore seats |
