# SDN302 Practical Exam Generic Template Backend

This is a complete, highly reusable Practical Exam (PE) template project for the **SDN302 (Node.js & Express.js with MongoDB)** course. 
It is structured according to the **Model-Controller-Route (MCR)** pattern and contains all core requirements commonly found in practical exams:
* **Authentication & Authorization**: Password hashing (bcryptjs), JWT token authentication, and Role-Based Access Control (RBAC).
* **Booking Logic**: Validation of start/end times, check for maintenance/offline status, conflict/overlap booking detection, and automated pricing with discount hours and wallet deduction options.
* **Database Management**: Configured Mongoose models and database connection with connection status logging.
* **Configurable Settings**: Controlled easily via `.env` variables to adapt to different exams.

---

## 1. Installation & Environment Setup

### Prerequisites
* **Node.js** (v14+ recommended)
* **MongoDB** running locally (`mongodb://127.0.0.1:27017/`)

### Setup Steps
1. Navigate to the project directory:
   ```bash
   cd SUOCPE
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   # or for Linux/macOS
   cp .env.example .env
   ```

---

## 2. Configure for Specific Exam Domains

Open `.env` and set the variables according to the exam requirements:

### Domain A: Co-working Space Booking (e.g. `PE.docx.md`)
```env
PORT=9999
MONGO_URI=mongodb://127.0.0.1:27017/sdn302_coworking
JWT_SECRET=sdn302_secret_key
PRICING_MODE=NORMAL
ENABLE_HAPPY_HOUR=false
ENABLE_WALLET=false
```

### Domain B: Smart EV Charging Station Management (e.g. `DePE2.docx.md`)
```env
PORT=9999
MONGO_URI=mongodb://127.0.0.1:27017/sdn302_ev_charging
JWT_SECRET=sdn302_secret_key
PRICING_MODE=EV
ENABLE_HAPPY_HOUR=true
ENABLE_WALLET=true
```

---

## 3. Database Seeding

To clear the database and populate sample admin/customer accounts and resources:
```bash
npm run seed
# or
node utils/seedData.js
```

This generates:
* **Admin account**: `admin1` / `123456`
* **Customer account**: `user1` / `123456` (comes with $50.00 / 1,000,000 balance depending on mode)
* **Sample Space/Station resources** ready for booking.

---

## 4. Run the Project

* **Development mode** (reloads automatically on save using nodemon):
  ```bash
  npm run dev
  ```
* **Production mode**:
  ```bash
  npm start
  ```

---

## 5. API Reference & Postman Guide

For all authenticated endpoints, you must include the token in the headers:
* **Key**: `Authorization`
* **Value**: `Bearer <your_jwt_token>`

### Auth Endpoints

#### Register a user
* **URL**: `POST /auth/register`
* **Body (JSON)**:
  ```json
  {
    "username": "user2",
    "password": "123",
    "role": "customer"
  }
  ```
  *(Note: If role is customer and `PRICING_MODE=EV`, they automatically get a $50 welcome bonus).*

#### Login
* **URL**: `POST /auth/login`
* **Body (JSON)**:
  ```json
  {
    "username": "user1",
    "password": "123"
  }
  ```
* **Response**: Returns a JSON object containing user details and the JWT `token`.

---

### Resource Endpoints

#### Get All Resources
* **URL**: `GET /resources`
* **Access**: Public / Private (All users)

#### Get Single Resource
* **URL**: `GET /resources/:id`

#### Create Resource
* **URL**: `POST /resources`
* **Access**: Private (Admin only)
* **Body (JSON)**:
  ```json
  {
    "resourceCode": "MR-301",
    "name": "Meeting Room 301",
    "type": "meetingRoom",
    "capacity": 10,
    "pricePerUnit": 200000,
    "features": ["projector", "AC"]
  }
  ```

#### Update Resource
* **URL**: `PUT /resources/:id`
* **Access**: Private (Admin only)
* **Body (JSON)**:
  ```json
  {
    "status": "maintenance"
  }
  ```

#### Delete Resource
* **URL**: `DELETE /resources/:id`
* **Access**: Private (Admin only)

---

### Booking Endpoints

#### Get Bookings
* **URL**: `GET /bookings`
* **Access**: Private (RBAC check: Admin gets all bookings, Customer gets only their own bookings)

#### Create Booking
* **URL**: `POST /bookings` (or alias `POST /bookings/book`)
* **Access**: Private (Admin or Customer)
* **Body (JSON)**:
  ```json
  {
    "resourceId": "REPLACE_WITH_MONGO_RESOURCE_ID",
    "startTime": "2026-07-10T10:00:00.000Z",
    "endTime": "2026-07-10T12:00:00.000Z",
    "quantityEstimate": 1,
    "note": "Need markers for the whiteboard"
  }
  ```

---

## 6. How to adapt this template in exam

When in the exam room, use a global find-and-replace tool (like VS Code's search & replace) to rename files and fields to match your specific domain requirements in under 5 minutes.

### For Co-working Space Booking:
1. **Files Renaming**:
   * `resourceModel.js` -> `spaceModel.js`
   * `bookingModel.js` -> `reservationModel.js`
   * `resourceController.js` -> `spaceController.js`
   * `bookingController.js` -> `reservationController.js`
   * `resourceRoutes.js` -> `spaceRoutes.js`
   * `bookingRoutes.js` -> `reservationRoutes.js`
2. **Path & Model Renaming**:
   * Change route mappings in `server.js` from `/resources` to `/spaces`, and `/bookings` to `/reservations`.
   * Rename mongoose models in schemas from `Resource` to `Space`, and `Booking` to `Reservation`.
3. **Database Fields Renaming**:
   * In model schemas, controllers, and routing files, rename:
     * `resourceCode` -> `spaceCode`
     * `pricePerUnit` -> `pricePerHour`
     * `features` -> `amenities`
     * `resourceId` -> `spaceId`
   * Keep calculation rules to normal (`PRICING_MODE=NORMAL`, `ENABLE_WALLET=false`).

### For EV Charging Station Management:
1. **Files Renaming**:
   * `resourceModel.js` -> `stationModel.js`
   * `bookingModel.js` -> `sessionModel.js`
   * `resourceController.js` -> `stationController.js`
   * `bookingController.js` -> `sessionController.js`
   * `resourceRoutes.js` -> `stationRoutes.js`
   * `bookingRoutes.js` -> `sessionRoutes.js`
2. **Path & Model Renaming**:
   * Change route mappings in `server.js` from `/resources` to `/stations`, and `/bookings` to `/sessions`.
   * Map `POST /bookings/book` -> `POST /sessions/book`.
   * Rename mongoose models from `Resource` to `Station`, and `Booking` to `Session`.
3. **Database Fields Renaming**:
   * In model schemas, controllers, and routing files, rename:
     * `resourceCode` -> `stationCode`
     * `pricePerUnit` -> `pricePerKwh`
     * `features` -> `connectors`
     * `resourceId` -> `stationId`
     * `quantityEstimate` -> `energyEstimate`
     * `totalAmount` -> `totalCost`
   * Configure `.env` for EV scharging:
     ```env
     PRICING_MODE=EV
     ENABLE_HAPPY_HOUR=true
     ENABLE_WALLET=true
     ```
