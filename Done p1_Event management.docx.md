### **Practical Examination**

**Subject Code:** SDN302  
**Duration:** 85 minutes  
**Exam:** Event Management System

## **Requirements**

Develop an Event Management System that helps organizers efficiently manage events at FPT University Da Nang while allowing students to search for and register for events. The system must also support authentication, role-based access control, and real-time notifications when a new registration occurs.  
*The database is provided in the file db.json.*

### 1\. Project Initialization **(0.5 points)**

* Create a new project directory named \<name\>\_event and initialize a Node.js project.


### 2\. Authentication & Authorization System **(3 points)**

#### *2.1. Design User Schema & Model **(1 point)***

* Create a file userModel.js to define the schema and model for users.  
  User data includes:  
  * username: Login name (String).  
  * password: Encrypted password (String).  
  * role: User role (Enum: "admin" or "student").  
  * createdAt: Creation date (Date).  
    

#### *2.2. Login API **(1 point)***

* API: POST /auth/login  
* Functionality: Authenticate users and return a JWT Token.


#### *2.3. Role-Based Access Control Using Middleware **(1 point)***

* Requirements:  
  * Students can only register/unregister for events.  
  * Admins can manage event registrations (view/search the list).  
* Implementation:  
  * Develop a middleware to verify the JWT Token and enforce role-based access control.  
    

### 3\. Event Registration Management System **(5.5 points)**

#### *3.1. Design Event Registration Schema & Model **(1 point)***

* Create a file registrationModel.js to define the schema and model for event registrations.  
  Registration data includes:  
  * studentId: Student ID (String).  
  * eventId: Event ID (String).  
  * registrationDate: Registration timestamp (Date).  
    

#### *3.2. Student Event Registration API **(1.5 point)***

* API: POST /registrations  
* Functionality: Allow students to register for an event.  
* Constraint: Registration is only allowed if the event has not reached the maximum capacity.


#### *3.3. Student Event Unregistration API **(1 point)***

* API: DELETE /registrations/:registrationId  
* Functionality: Allow students to cancel their registration using registrationId.


#### *3.4. Admin View Registered Event List API **(1 point)***

* API: GET /listRegistrations  
* Functionality: Admin retrieves the paginated list of event registrations.  
* Constraint: If no student has registered, an appropriate message must be displayed.


#### *3.5. Admin Search Registrations by Date API **(1 point)***

* API: GET /getRegistrationsByDate  
* Functionality: Admin searches for registrations within a date range.  
* Constraint: registrationDate start must be earlier than registrationDate end.


### 4\. Project Organization Following Model-Controller-Routes **(1 point)**

* The source code must follow the Model-Controller-Routes (MCR) architectural pattern.


## **Submission Requirements**

* Include the package.json file and all source code files, including userModel.js, registrationModel.js, and API implementation files.  
* Provide a README.md file with instructions on how to run the project and use the API.