# __PROJECT_NAME__

Equipment Rental Management API using Node.js, Express, MongoDB, JWT and RBAC.

## Run

```bash
npm install
npm run seed
npm run dev
```

Server: `http://localhost:9999`

## Test accounts

| Role | Username | Password |
|---|---|---|
| Admin | admin1 | __ADMIN_PASSWORD__ |
| Customer | user1 | __CUSTOMER_PASSWORD__ |

## Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/register` | Public; always creates customer |
| POST | `/auth/login` | Public |
| GET | `/users` | Admin |
| DELETE | `/users/:id` | Admin; rejects active rentals |
| GET | `/equipment` | Public |
| POST | `/equipment` | Admin |
| POST | `/rentals` | Customer; validates/deducts stock |
| PATCH | `/rentals/:id/return` | Admin; restores stock and calculates fine |
| GET | `/rentals` | Admin all; customer own |
| GET | `/rentalsByDate?start=YYYY-MM-DD&end=YYYY-MM-DD` | JWT |
