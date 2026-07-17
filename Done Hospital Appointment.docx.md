  
**OVERVIEW**  
You are tasked with building a Hospital Appointment Management System for FPT Hospital. The system manages doctors, patients, and appointments. Authentication is NOT required — assume all requests come from a verified staff member. A fixed userId can be hardcoded or passed via request body.

**Use database:** hospital.json

| \# | Section | Points | Notes |
| ----- | ----- | :---: | ----- |
| 1 | Project Initialization | 0.5 | Setup, npm init |
| 2 | Doctor Schema & Model | 1.0 | Mongoose model |
| 3 | Appointment Schema & Model | 1.5 | Mongoose model |
| 4 | RESTful APIs (3 endpoints) | 6.0 | GET, POST, PUT |
| 5 | Project Structure (MCR) | 1.0 | Clean folder structure |
| **TOTAL** |  | **10.0** |  |

# **1\. Project Initialization (0.5 point)**

* Create a project folder named: \<yourname\>\_fptHospital  
* Initialize a Node.js project:  
  npm init  
* Install required packages: express, mongoose, dotenv

# **2\. Doctor Schema & Model (1.0 point)**

Create doctorModel.js with the following fields:

* doctorCode — String, unique, required (e.g., DOC001)  
* fullName — String, required  
* specialty — String, required (e.g., "Cardiology", "Dermatology", "Pediatrics")  
* status — String, enum: \["available", "on\_leave", "retired"\], default: "available"  
* consultationFee — Number, required (fee per appointment in VND)

# **3\. Appointment Schema & Model (1.5 points)**

Create appointmentModel.js with the following fields:

* patientId — ObjectId, reference to User (can be hardcoded for this exam)  
* doctorId — ObjectId, reference to Doctor, required  
* patientName — String, required  
* appointmentTime — Date, required  
* completedAt — Date, optional (null by default)  
* totalFee — Number, auto-calculated when appointment is completed  
* note — String, optional (e.g., symptoms description)

# **4\. RESTful APIs (6.0 points)**

## **4.1  GET /appointments  (1.5 points)**

**Function:** Retrieve all appointments.  
**Logic:**

* Return all appointments from the database  
* Populate doctorId to show doctor details (fullName, specialty, consultationFee) alongside each appointment  
* Return 200 with the appointment list

## **4.2  POST /appointments/book  (2.5 points)**

**Function:** Book a new appointment.

**Input Validation:**

* appointmentTime must not be in the past — return 400 if invalid

**Doctor Availability Check:**

* If doctor.status \= "on\_leave" or "retired" → reject with 400/403  
  Message: "This doctor is currently unavailable."

**Duplicate Appointment Check (Advanced Logic):**  
A doctor cannot have more than one appointment at the same time slot.

* Find appointment where: doctorId \= inputDoctorId AND appointmentTime \= inputTime AND completedAt \= null  
* If found → return 409 Conflict  
  Message: "This doctor already has an appointment at the requested time."

**On Successful Booking:**

* Save and return the new appointment with 201 Created  
* patientId must NOT be sent from the request body — hardcode or derive it server-side

## **4.3  PUT /appointments/:id/complete  (2.0 points)**

**Function:** Mark an appointment as completed and calculate fee.

**Logic:**

* Set completedAt \= current time  
* Retrieve consultationFee from the referenced Doctor  
* Set totalFee \= consultationFee (flat fee per consultation)  
* Return the updated appointment with 200 OK

**Validation:**

* If appointment not found → return 404  
* If completedAt already exists → return 400  
  Message: "This appointment has already been completed."

# **5\. Project Structure (1.0 point)**

Organize your project using the Model \- Controller \- Routes (MCR) pattern:

/models  
  doctorModel.js  
  appointmentModel.js  
/controllers  
  appointmentController.js  
/routes  
  appointmentRoutes.js  
app.js / server.js  
package.json

# **6\. Submission Requirements**

* All .js files  
* package.json  
* README.md including:  
  * Installation and running instructions  
  * Postman testing guide with example requests for all 3 endpoints

Lưu ý:  
Tất cả các url chạy được phải screen lại posman (input/output) cho từng câu. Và lưu lại file kết quả là file word. – nộp cùng với project lên edunext\!