**Practical Examination**

**Subject Code: SDN302**  
**Duration: 85 minutes**  
**Exam: Equipment Rental Management System**

**Requirements**

FPT Gear Rental is an online equipment rental system that allows customers to register, log in, browse available equipment, and create rental orders.  
Administrators (Admins) can manage users, equipment, and rental transactions, as well as handle the return process and late penalties.

You are assigned to develop a simplified Equipment Rental Management System with Login and Role-based Access Control (RBAC) according to the following requirements.

**1\. Project Initialization (0.5 point)**

* Create a project folder named: \<yourname\>\_rental  
* Initialize a Node.js project using npm init

**2\. Authentication & Authorization (2.5 points)**

**2.1. User Schema & Model (1 point)**

Create **userModel.js** with the following fields:

*username: String*

*password: String (hashed using bcrypt or similar library)*

*role: String ('admin' or 'customer')*

*createdAt: Date*

**2.2. Register & Login API (1 point)**

* POST /auth/register: Allows users to register (default role \= 'customer').  
* POST /auth/login: Authenticates user credentials and returns a JWT token.

*The token must include the user’s role.*

**2.3. Authorization Middleware (0.5 point)**

Implement a middleware that validates the JWT token and checks user roles:

* Admin: can access all APIs.  
* Customer: can only access APIs related to viewing and creating their own rentals.

**3\. User Management (2 points)**

Accessible only to Admins.

**3.1. Get All Users (1 point)**

* GET /users  
  Return the full list of registered users.

**3.2. Delete User (1 point)**

* DELETE /users/:id

If the user has active rental orders, return:

* Cannot delete users with active rentals.  
* Otherwise, delete the user from the system.

**4\. Equipment & Rental Management (4.5 points)**

**4.1. Equipment Schema & Model (1 point)**

Create **equipmentModel.js** with the following fields:

*name: String*

*category: String*

*pricePerDay: Number*

*depositFee: Number*

*stockQuantity: Number*

*createdAt: Date*

**4.2. Create Rental Order (1 point)**

* POST /rentals  
  Input: equipmentId, startDate, endDate, quantity

Use userId from JWT token.

Validate that enough stock is available.

* If valid:

  *Deduct the rented quantity from stockQuantity.*

  *Calculate deposit: depositFee \* quantity.*

  *Save the rental record with status \= 'active' and rentalDate \= new Date().*

* Otherwise, return:

  *Not enough stock available.*

**4.3. Return Equipment (1 point)**

* PATCH /rentals/:id/return

Update rental status to 'returned' and restore the stock quantity.

* If the actual return date is later than endDate, calculate the late penalty:

  *fine \= 10% \* pricePerDay \* number\_of\_late\_days \* quantity*

* Save the penalty amount (fineAmount) if applicable.

**4.4. Get All Rentals (1 point)**

* GET /rentals  
* Admin: view all rentals.  
* Customer: view only their own rentals.

**4.5. Search Rentals by Date Range (1.5 points)**

* GET /rentalsByDate?start=YYYY-MM-DD\&end=YYYY-MM-DD  
  Return all rentals where rentalDate is within the date range.  
* Validate the range   
* if invalid, return: Invalid date range.

**5\. Project Structure (0.5 point)**

Organize your code using the Model – Controller – Routes (MCR) pattern:

*/models*

*/controllers*

*/routes*

**6\. Submission Requirements**

Your submission must include:

All .js files (models, controllers, routes) package.json

README.md with:

Installation and running instructions

Postman testing guide

Example admin and customer accounts

 Sample Test Accounts

| Role | Username | Password | Description |
| :---- | :---- | :---- | :---- |
| Admin | admin1 | 123456 | Can manage users, equipment, and rentals |
| Customer | user1 | 123456 | Can view equipment and create rental orders |

