**Car Rental Management System**

**Description**

You are tasked with building a car rental management system. The system will store information about cars, their statuses, customer details, and handle car booking and payment operations. Follow the steps below to complete the assignment.

---

**Step 1: Project Initialization**

1. **Create a New Project Directory:**  
   Create a new directory named \<yourName\>\_carRental (for example, john\_carRental).

2. **Initialize a Node.js Project:**

3. **Install Required Libraries:**  
   Install necessary packages such as Express and Mongoose:

**Step 2: Create Schema and Model for Car**

1. **File:** carModel.js

2. **Car Data Fields:**

   * carNumber (String): The car's license plate number or unique car ID.

   * capacity (Number): The seating capacity or load capacity of the car.

   * status (String): The car's status. Possible values: "available", "rented", "maintenance".

   * pricePerDay (Number): Rental price per day.

   * features (Array): A list of car features/amenities.

   **Example Data:** json

   {

     "carNumber": "51A-12345",

     "capacity": 7,

     "status": "available",

     "pricePerDay": 500000,

     "features": \["automatic", "air-conditioner", "GPS"\]

   }

   **Requirement:**  
     Define a CarSchema and export the Car model for MongoDB.

**Step 3: Create Schema and Model for Booking**

1. **File:** bookingModel.js

2. **Booking Data Fields:**

   * customerName (String): The customer's name.

   * carNumber (String): The car number (or car ID) that is booked.

   * startDate (Date): The start date of the rental period.

   * endDate (Date): The end date of the rental period.

   * totalAmount (Number): The total payment amount.

   **Example Data:** json

   {

     "customerName": "Nguyen Van A",

     "carNumber": "51A-12345",

     "startDate": "2023-10-01T00:00:00.000Z",

     "endDate": "2023-10-03T00:00:00.000Z",

     "totalAmount": 1000000

   }

   **Requirement:**  
     Define a BookingSchema and export the Booking model.

**Step 4: Build APIs for Managing Bookings**

Implement the following RESTful API endpoints:

**4.1 GET /bookings**

* **Function:** Retrieve the list of all car bookings.

**4.2 POST /bookings**

* **Function:** Create a new booking.

* **Logic:**  
  When creating a booking, validate the startDate and endDate. If the booking dates overlap with another booking for the same carNumber, handle the conflict appropriately (reject the booking or apply custom logic).

**4.3 PUT /bookings/:bookingId**

* **Function:** Update an existing booking by its bookingId.

**4.4 DELETE /bookings/:bookingId**

* **Function:** Delete a booking by its bookingId.

**4.5 Payment Calculation**

* **Requirement:**  
  The system must automatically calculate the totalAmount based on the number of days booked and the pricePerDay of the car.  
  The number of rental days can be calculated as: (endDate \- startDate) / (1000 \* 60 \* 60 \* 24\) (Round the result as per the specific requirement.)  
  Retrieve the pricePerDay from the Car model based on the carNumber.

**Step 5: Organize the Project According to the Model-View-Controller-Routes (MVCR) Structure**

1. **Organization:**  
   Separate your project files into folders:

   * **Models:** Contain carModel.js, bookingModel.js, etc.

   * **Views:** Contain EJS files that can call apis

   * **Controllers:** Implement the business logic for handling bookings, payment calculation, etc. (e.g., bookingController.js, carController.js).

   * **Routes:** Define API endpoints that map to the corresponding controller functions (e.g., bookingRoutes.js, carRoutes.js).

**Submission Requirements**

* **Source Files:**  
  Submit the complete package.json file and all source code files, including carModel.js, bookingModel.js, controller files, route files, etc.

