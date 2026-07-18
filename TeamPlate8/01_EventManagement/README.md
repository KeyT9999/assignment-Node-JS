# 01_EventManagement

Event Management System with JWT and role-based access control.

```bash
npm install
npm run seed
npm run dev
```

Accounts: `admin1/123456`, `student1/123456`.

| Method | Endpoint | Role |
|---|---|---|
| POST | `/auth/login` | Public |
| GET | `/events` | JWT |
| POST | `/registrations` | Student |
| DELETE | `/registrations/:registrationId` | Student owner |
| GET | `/listRegistrations?page=1&limit=5` | Admin |
| GET | `/getRegistrationsByDate?startDate=...&endDate=...` | Admin |

Capacity comes from `db.json`; it is not hardcoded. Successful registration logs a real-time notification and includes a notification in the response.
