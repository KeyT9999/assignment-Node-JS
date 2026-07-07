**Practical Examination**  
**Subject Code: SDN302**  
**Duration: 85 minutes**  
**Exam:  Co-Working Space Booking Management System**  
**Requirements**  
You are tasked with building a co-working space booking management system. The system will store information about rooms/desks, their availability status, member details, and handle booking and payment operations with Login and Role-based Access Control (RBAC) according to the following requirements.   
**1\. Project Initialization (0.5 point)**

* Create a project folder named: \<yourname\>\_coworkingBooking  
* Initialize a Node.js project using npm init

**2\. Authentication & Authorization (2.5 points)**  
**2.1. User Schema & Model (1 point)**  
Create **userModel.js** with the following fields:

* username: String  
* password: String (hashed using bcrypt or similar library)  
* role: String ('admin' or 'customer')  
* createdAt: Date

**2.2. Register & Login API (1.5 point)**

* POST /auth/register: Allows users to register (default role \= 'customer').  
* POST /auth/login: Authenticates user credentials and returns a JWT token.

*The token must include the user’s role.*  
**3\. Management (6.5 points)**  
**3.1. Space Schema & Model (1 point)**  
Create spaceModel**.**js with the following fields:

* spaceCode (String): Unique code of the space (e.g., room code or desk code).  
* type (String): Type of space. Possible values: "desk", "meetingRoom".  
* capacity (Number): Number of people allowed.  
* status (String): Space status. Possible values: "available", "maintenance".  
* pricePerHour (Number): Rental price per hour.  
* amenities (Array): List of amenities (e.g., projector, whiteboard, AC, etc.).

{  
"spaceCode": "MR-201",  
"type": "meetingRoom",  
"capacity": 8,  
"status": "maintenance", “available”,  
"pricePerHour": 150000,  
"amenities": \["projector", "whiteboard", "air-conditioner"\]  
}

### **File: reservationModel.js (1 point)**

* userId (objID): is referenced from user schema.  
* spaceId (objID): s referenced from space schema.  
* startTime (Date): Reservation start time.  
* endTime (Date): Reservation end time.  
* totalAmount (Number): Total payment amount (auto-calculated).  
* note (String) (optional): Additional note.

{  
"userId": "65fd9d9b42e1a12345678901",  
"spaceId": "65fd9dc542e1a12345678902",  
"startTime": "2026-02-03T08:00:00.000Z",  
"endTime": "2026-02-03T10:00:00.000Z",  
"totalAmount": 300000,  
"note": "Need HDMI cable"  
}  
**3.2. Implement the following RESTful API endpoints:**

* **GET /reservations (1.5 point)**  
  **Function:** Retrieve bookings.  
  **Logic:**   
* If the user is an **Admin**, return all reservations in the system.  
* If the user is a **Customer**, return only reservations belonging to that userId (extracted from JWT).  
* **POST /reservations (3 points)**

**Function:** Create a new booking for a specific space.  
**Logic & Constraints:**

* **Input Validation:**  
  Ensure startTime is strictly earlier than endTime ($startTime \< endTime).  
  Ensure startTime is not in the past relative to the current server time.  
* **Space Availability Check:**  
  The system must first verify the status of the requested spaceId.  
  If the space status is **"maintenance"**, the request must be rejected with a **403 Forbidden** or **400 Bad Request** error (e.g., *"This space is currently unavailable due to maintenance"*).  
* **Advanced Overlap Conflict Check:**  
  A reservation is considered conflicting if there is any existing booking for the **same space** where the time intervals intersect.

**Logic Rule:** A new request (S\_{new}, E\_{new}) overlaps with an existing booking (S\_{old}, E\_{old}) if:  
(S\_{new} \< E\_{old}) AND (E\_{new} \> S\_{old})  
If a conflict is found, return a **409 Conflict** status with a clear message: *"The selected space is already reserved for the requested time period."*

* **Automatic Payment Calculation:**		  
  Retrieve the pricePerHour from the Space model.  
  Calculate the duration: Hours \= (endTime \- startTime) / (1000 X 60 X 60).  
  Calculate the totalAmount: $Total \= Hours X PricePerHour.

*Note: Ensure the calculation handles partial hours (e.g., 1.5 hours) correctly.*

* **Data Integrity:**  
  The userId should be extracted from the JWT token (authenticated user), not just from the request body, to ensure security.

**4\. Project Structure (0.5 point)**  
Organize your code using the Model – Controller – Routes (MCR) pattern:  
*/models*  
*/controllers*  
*/routes*  
**5\. Submission Requirements**  
Your submission must include all .js files (models, controllers, routes) package.json  
README.md with:

* Installation and running instructions  
* Postman testing guide  
* Example admin and customer accounts

 Sample Test Accounts

| Role | Username | Password | Description |
| :---- | :---- | :---- | :---- |
| Admin | admin1 | 123456 | Can manage users and reservations |
| Customer | user1 | 123456 | Can create a new booking for a specific space |

