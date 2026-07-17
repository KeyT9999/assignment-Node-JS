# Postman guide

Import `__PROJECT_NAME__.postman_collection.json`. Set `doctor_id` using `GET /doctors`; the collection automatically saves the first doctor ID and saves a created `appointment_id`.

Booking example:
```json
{"doctorId":"<doctor id>","patientName":"Nguyen Van A","appointmentTime":"2027-08-01T09:00:00.000Z","note":"Chest pain"}
```
Do not send `patientId` or `totalFee`; both are controlled by the server.
