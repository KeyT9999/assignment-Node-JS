# Smart EV Charging Station Management System

This project is the backend system for a network of Smart EV Charging Stations. It handles authentication, role-based access control, charging slots, user balances, station management, and automated booking with dynamic pricing and wallet deductions.

Built with Node.js, Express, and MongoDB.

---

## 1. Installation & Running Instructions

### Prerequisites
- Node.js (version 18.x or later)
- MongoDB running locally on `mongodb://127.0.0.1:27017/`

### Setup Steps
1. Navigate into the project folder:
   ```bash
   cd TranKimThang_EVChargingSystem
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables in `.env`:
   ```env
   PORT=9999
   MONGO_URI=mongodb://127.0.0.1:27017/EVChargingSystem
   JWT_SECRET=sdn302_pe_secret
   JWT_EXPIRES=1d
   ```
4. Start the application in development mode (using nodemon):
   ```bash
   npm run dev
   ```
   The server should connect to MongoDB and start listening on port `9999`.

---

## 2. Sample Test Accounts

Use these accounts to test the system or register your own accounts via the registration API.

| Role | Username | Password | Description |
|---|---|---|---|
| **Admin** | `admin1` | `123` | Can manage stations (Create, Update, Delete) and retrieve all sessions. |
| **Customer** | `user1` | `123` | Can view sessions and create a new reservation using the booking API. Gets a $50.00 welcome bonus on registration. |

---

## 3. API Endpoints

### 3.1. Authentication
- `POST /auth/register` - Registers a new user. If `role` is `customer`, automatically credits $50.00 to the balance.
- `POST /auth/login` - Authenticates user credentials and returns a JWT token containing their role.

### 3.2. Stations (Admin only for modifications)
- `POST /stations` - Creates a new charging station.
- `GET /stations` - Lists all charging stations.
- `PUT /stations/:id` - Updates station details (e.g., setting status to `offline` or `maintenance`).

### 3.3. Sessions (Reservations)
- `GET /sessions` - Retrieves sessions.
  - If Admin: returns all reservations in the system.
  - If Customer: returns only sessions belonging to that customer (extracted from JWT).
- `POST /sessions/book` - Book a station slot (Customer only).
  - Validation: rejects if `startTime >= endTime` or if `startTime` is in the past.
  - Availability Check: rejects with `403 Forbidden` if the station is `maintenance` or `offline`.
  - Overlap Check: rejects if the station is already booked during the requested interval.
  - Dynamic Pricing (Happy Hour): If the start time is between `22:00` (10 PM) and `04:00` (4 AM), applies a `30% discount`.
  - Automated Payment: Calculates: `Cost = (Hours X 15kWh) X pricePerKwh`. Checks balance; if user balance < total cost, returns `402 Payment Required`. Otherwise, deducts total cost from user balance and saves the session as `pending`.

---

## 4. Postman Testing Guide

For a detailed step-by-step Postman testing guide with sample request bodies and expected response payloads, please refer to the following guide:
- [Vietnam Postman Testing Guide (huongdanchaypostman.md)](file:///f:/LEARN%20K%C3%8C%207/SDN302%20Node%20JS/assignment-1-KeyT9999/TranKimThang_EVChargingSystem/huongdanchaypostman.md)

For a step-by-step guide explaining the backend logic and implementation details:
- [Vietnam Practical Exam Guide (huongdanlambai.md)](file:///f:/LEARN%20K%C3%8C%207/SDN302%20Node%20JS/assignment-1-KeyT9999/TranKimThang_EVChargingSystem/huongdanlambai.md)
