**Practical Examination**  
**Subject Code: SDN302**  
**Duration: 85 minutes**  
**Exam:  SMART EV CHARGING STATION MANAGEMENT SYSTEM**  
**Requirements**  
You are tasked with building a backend system for a network of Smart EV Charging Stations. The system manages charging slots, user balances, real-time availability and automated billing with dynamic pricing with Login and Role-based Access Control (RBAC) according to the following requirements.   
**1\. Project Initialization (0.5 point)**

* Create a project folder named: \<yourname\>\_ EVChargingSystem  
* Initialize a Node.js project using npm init

**2\. Authentication & Authorization (2.5 points)**  
**2.1. User Management (1 point)**  
Create **userModel.js** with the following fields:

* username: String  
* password: String (hashed using bcrypt or similar library)  
* role: String ('admin' or 'customer')  
* createdAt: Date  
* balance: Number

**2.2. Register & Login API (1.5 point)**

* POST /auth/register: Allows users to register (0.5 point)  
  * If user has role ‘customer’, automatically credited with a $50.00 welcome bonus in their balance (0.5 point)  
* POST /auth/login: Authenticates user credentials and returns a JWT token (0.5 point).

*The token must include the user’s role.*  
**3\. Management (6.5 points)**  
**3.1. Station & Connector Management (1 point)**  
**File: stationModel.js**

* **Fields:**  
  * stationCode (String, Unique): e.g., "ST-Hanoi-01".  
  * type (String): "FastCharge" (DC) or "NormalCharge" (AC).  
  * status (String): "available", "maintenance", "offline".  
  * pricePerKwh (Number): Price for 1 unit of electricity.  
  * connectors (Array): List of supported plugs (e.g., \["Type2", "CCS2", "CHAdeMO"\])


{   
"\_id": "65fd9dc542e1a12345678902",   
"stationCode": "EV-FAST-HANOI-01",   
"type": "FastCharge",   
"status": "available",   
"pricePerKwh": 3850,   
"connectors": \["CCS2", "CHAdeMO"\]  
}

### 

**File: sessionModel.js (1 point)**

* **Fields:**   
  * userId: ObjectId ((Required: A reference to the User model. Identifies who is charging.)  
  * stationId: ObjectId (Required: A reference to the Station model. Identifies which charger is being used.  
  * startTime: Date (Required: The scheduled start time (must be \>= Current Time).  
  * endTime: Date(Required: The scheduled end time (must be \> startTime).  
  * energyEstimate: Number (Required) Estimated electricity to be consumed in kWh (Kilowatt-hours).  
  * totalCost: Number (Required: The final calculated price after applying taxes or Happy Hour discounts.  
  * Status: String (Tracking the state: pending, active, completed, or cancelled.

{   
"\_id": "65fd9dc542e1a12345678abc",   
"userId": "65fd9d9b42e1a12345678901",   
"stationId": "65fd9dc542e1a12345678902",   
"startTime": "2026-03-06T23:00:00.000Z",   
"endTime": "2026-03-07T01:00:00.000Z",   
"energyEstimate": 30.5,   
"totalCost": 150000,   
"status": "Charging for Tesla Model 3"  
}  
**3.2. Implement the following RESTful API endpoints:**

* **GET /sessions (1.5 point)**  
  **Function:** Retrieve all sessions.  
  **Logic:**   
* If the user is an **Admin**, return all reservations in the system.  
* If the user is a **Customer**, return only sessions belonging to that userId (extracted from JWT).  
* **API: POST /sessions/book (3 points):**  
* **Time Validation:** \* startTime \< endTime (0.25 point)  
* **Station Availability:** Reject if station status is "maintenance" or "offline" (403 Forbidden) (0.25 point).  
* **Advanced Overlap Check: \* Ensure the station is not booked by someone else during the** requested interval (0.5 point).  
  * **Rule:** Overlap exists if (Snew \< Eold) and (Enew \> Sold).  
* **Dynamic Pricing (Happy Hour):** \* If the session starts between **22:00 (10 PM) and 04:00 (4 AM)**, apply a **30% discount** (Off-peak incentive) (1 point).  
* **Automated Payment:** (1 point)  
  * Calculate: Cost \= (Hours X 15kWh) X price per Kwh. (Assuming 15kWh per hour).  
  * **Wallet Check:** If UserBalance \< TotalCost, return **402 Payment Required**.  
  * **Transaction:** If sufficient, deduct TotalCost from UserBalance and save the session.  
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
| Admin | admin1 | 123 | Can manage users and sessions |
| Customer | user1 | 123 | Can create a new booking for a specific session |

