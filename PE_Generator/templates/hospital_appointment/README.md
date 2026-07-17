# __PROJECT_NAME__

FPT Hospital Appointment Management API. Authentication is intentionally not included because the exam states all requests are verified staff requests.

```bash
npm install
npm run seed
npm run dev
```

Server: `http://localhost:9999`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/doctors` | Obtain doctor IDs for testing |
| GET | `/appointments` | List appointments with populated doctor details |
| POST | `/appointments/book` | Book; checks future time, availability and exact-slot conflict |
| PUT | `/appointments/:id/complete` | Complete and copy consultationFee into totalFee |

## Postman sequence
1. `GET /doctors`, copy an available doctor `_id`.
2. Book a future appointment; repeat the same doctor/time to verify HTTP 409.
3. Book with `DOC002` to verify unavailable-doctor rejection.
4. Get appointments and verify populated doctor fields.
5. Complete an appointment; repeat to verify HTTP 400.
