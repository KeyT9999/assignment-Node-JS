# Postman guide

Use `http://localhost:9999`. Create a car first with `POST /cars`, then create a booking with `POST /bookings`.

```json
{"customerName":"Nguyen Van A","carNumber":"51A-12345","startDate":"2026-08-01","endDate":"2026-08-03"}
```

The server calculates `totalAmount`; do not send it from the client.
