# Postman guide

Login at `POST /auth/login`, then use `Authorization: Bearer <token>`.

Create rental body:
```json
{"equipmentId":"<equipment id>","startDate":"2026-08-01","endDate":"2026-08-03","quantity":2}
```

Return it with `PATCH /rentals/<rental id>/return`. Search using `GET /rentalsByDate?start=2026-01-01&end=2026-12-31`.
