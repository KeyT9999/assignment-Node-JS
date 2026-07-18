Practical Examination

Subject Code: SDN302
Duration: 85 minutes
Exam:  Laboratory Sample, Testing & Reagent Management System

Requirements

You are tasked with building a laboratory sample, testing, and reagent management system. The system will manage laboratories, test catalogues, patient samples, reagent inventory, test execution, quality controls, and audit reports with Login and Role-based Access Control (RBAC) according to the following requirements.

1. Project Initialization (0.5 point)

- Create a project folder named: <yourname>_labTrack

- Initialize a Node.js project using npm init

- Install the required libraries: express, mongoose, bcrypt, jsonwebtoken, and dotenv

- Use server.js as the entry point; load PORT and MONGODB_URI from .env

2. Authentication & Authorization (1.5 points)

2.1. User Schema & Model (0.5 point)

Create userModel.js with the following fields:

- username: String, unique and required

- password: String, required and hashed using bcrypt

- fullName: String, required

- role: String ('laboratory_manager', 'laboratory_technician', or 'quality_auditor')

- assignedLaboratory: ObjectId, referenced from the Laboratory schema

- isActive: Boolean, default = true

- createdAt: Date, default = current time

2.2. Register & Login API (1 point)

- POST /auth/register: Only laboratory_manager may register new users.

- Return 409 if the username already exists.

- Do not allow another laboratory_manager account to be created through this API.

- A laboratory_technician account must include assignedLaboratory.

- POST /auth/login: Authenticate credentials and return a JWT token.

- Return 401 for incorrect credentials and 403 for a deactivated account.

The token must include userId, role, fullName, and assignedLaboratory.

3. Management (7.5 points)

3.1. Laboratory, Test Catalogue & Reagent Schemas and Models (2 points)

Create laboratoryModel.js with the following fields:

- laboratoryCode (String): Unique code of the laboratory.

- name (String): Laboratory name.

- location (String): Physical location.

- maximumActiveSamples (Number): Maximum number of samples being processed.

- currentActiveSamples (Number): Current number of active samples, default = 0.

- status (String): 'active', 'inactive', or 'full'.

{
"laboratoryCode": "LAB-01",
"name": "CentralCare Main Laboratory",
"location": "Da Nang",
"maximumActiveSamples": 120,
"currentActiveSamples": 35,
"status": "active"
}

File: testCatalogueModel.js (0.5 point)

- testCode (String): Unique code of the medical test.

- name (String): Name of the test.

- category (String): e.g. 'hematology', 'biochemistry', or 'microbiology'.

- sampleType (String): e.g. 'blood', 'urine', or 'swab'.

- standardFee (Number): Standard test fee, greater than 0.

- estimatedMinutes (Number): Estimated processing time.

- requiredReagents (Array): reagentId and quantityRequired for each reagent.

- isActive (Boolean): Default = true.

File: reagentModel.js and reagentLedgerModel.js (1 point)

- reagentCode (String): Unique reagent code.

- name (String): Reagent name.

- unit (String): e.g. 'ml', 'kit', or 'strip'.

- unitCost (Number): Cost per unit, greater than 0.

- reorderLevel (Number): Low-stock threshold.

- isActive (Boolean): Default = true.

- reagentId (ObjectId): Referenced from Reagent.

- laboratoryId (ObjectId): Referenced from Laboratory.

- batchNumber (String): Reagent batch number.

- expiryDate (Date): Expiry date of the batch.

- quantity (Number): Current quantity in the batch.

- lastUpdated (Date): Default = current time.

The combination of reagentId, laboratoryId, and batchNumber must be unique.

{
"reagentId": "65fd9dc542e1a12345678902",
"laboratoryId": "65fd9d9b42e1a12345678901",
"batchNumber": "BATCH-RG-2026-08",
"expiryDate": "2027-08-30T00:00:00.000Z",
"quantity": 500,
"lastUpdated": "2026-07-17T08:00:00.000Z"
}

3.2. Sample, Test Execution & Transaction Models (1.5 points)

File: sampleModel.js (0.5 point)

- sampleCode (String): Unique, auto-generated in format SMP-YYYYMMDD-XXX.

- patientCode (String): Patient identifier.

- patientName (String): Patient name.

- laboratoryId (ObjectId): Referenced from Laboratory.

- testId (ObjectId): Referenced from Test Catalogue.

- sampleType (String): Type of sample.

- collectedAt (Date): Collection time.

- receivedAt (Date): Default = current time.

- startedAt (Date): Null by default.

- completedAt (Date): Null by default.

- status (String): 'received', 'in_progress', 'completed', 'rejected', or 'cancelled'.

- priority (String): 'routine' or 'urgent'.

- registeredBy (ObjectId): Retrieved from JWT.

File: testExecutionModel.js and reagentTransactionModel.js (1 point)

- executionCode (String): Unique test execution code.

- sampleId (ObjectId): Referenced from Sample and unique.

- reagentCost (Number): Total cost of consumed reagents.

- testFee (Number): Fee from the Test Catalogue.

- totalCost (Number): testFee + reagentCost.

- resultSummary (String): Test result summary.

- resultStatus (String): 'pending', 'normal', 'abnormal', or 'inconclusive'.

- transactionCode (String): Unique reagent transaction code.

- type (String): 'restock', 'consume', 'transfer_out', or 'transfer_in'.

- batchNumber (String): Reagent batch used in the transaction.

- quantity (Number): Transaction quantity, greater than 0.

- unitCost (Number): Snapshot of reagent cost.

- totalValue (Number): quantity × unitCost.

- performedBy (ObjectId): Retrieved from JWT.

3.3. Implement the following RESTful API endpoints (4 points)

- POST /reagents/restock (0.5 point)

Function: Add reagent stock to a laboratory.

✓ Input Validation:

Ensure quantity > 0, expiryDate is in the future, and both Reagent and Laboratory are active.

✓ Batch Integrity:

Upsert by reagentId, laboratoryId, and batchNumber. If the batch exists, its expiryDate must match.

✓ Data Integrity:

Create the stock update and restock transaction consistently.

- GET /reagents (0.5 point)

Function: Retrieve reagents and current stock information.

✓ Role Access:

All authenticated roles may access this API.

✓ Query Filters:

Support laboratoryId, expiringSoon=true&days=30, and lowStock=true.

✓ Low-Stock Logic:

Aggregate only non-expired quantities and compare total stock with reorderLevel.

- POST /samples (0.75 point)

Function: Register a new patient sample.

✓ Input Validation:

The test and laboratory must be active; sampleType must match the Test Catalogue.

✓ Collection-Time Validation:

collectedAt cannot be in the future or more than 24 hours before the current server time.

✓ Laboratory Capacity:

Reject the request if currentActiveSamples has reached maximumActiveSamples.

✓ Authorization:

A technician may only register samples at assignedLaboratory.

✓ On Success:

Create the sample, increment currentActiveSamples, and set laboratory status to 'full' when necessary.

- POST /samples/:id/start-test (1.25 points)

Function: Start a test and consume required reagents.

✓ Sample Validation:

The sample must have status 'received' and belong to the technician's assigned laboratory.

✓ FEFO Reagent Check:

Use non-expired reagent batches in expiryDate ascending order: First Expired, First Out.

✓ Stock Availability:

All required reagents must be sufficient before any database write is performed.

✓ Atomic Processing:

Deduct all reagent quantities, create consume transactions, create TestExecution, and set Sample status to 'in_progress' as one consistent operation.

✓ Automatic Cost Calculation:

reagentCost = sum of consumed quantity × unitCost; totalCost = standardFee + reagentCost.

✓ Low-Stock Warning:

Return a warning when the remaining non-expired stock falls below reorderLevel.

- PATCH /samples/:id/complete (1 point)

Function: Complete or reject a laboratory test.

✓ Complete Action:

The sample must be 'in_progress'; resultStatus and resultSummary are required.

✓ Reject Action:

The sample must be 'received' or 'in_progress'; rejectionReason is required.

✓ On Success:

Update the sample and TestExecution, decrement currentActiveSamples, and reset a full laboratory to active when capacity becomes available.

✓ Turnaround Calculation:

For completed samples, return turnaroundMinutes = completedAt - receivedAt.

- GET /reports/sample-turnaround (0.5 point)

Function: Return sample turnaround statistics.

✓ Access:

Only laboratory_manager and quality_auditor may access the report.

✓ Report Logic:

Group completed samples by laboratory and test, and calculate completed count, average turnaround, and urgent sample count.

✓ Filters:

Support laboratoryId, testId, from, and to.

- GET /reports/reagent-usage (0.5 point)

Function: Return reagent consumption and stock statistics.

✓ Access:

Only laboratory_manager and quality_auditor may access the report.

✓ Report Logic:

Group consume transactions by reagent and laboratory, including total quantity, total value, and current non-expired stock.

✓ Filters:

Support reagentId, laboratoryId, from, and to.

4. Project Structure (0.5 point)

Organize your code using the Model – Controller – Routes (MCR) pattern:

/models

/controllers

/routes

/middleware

server.js and .env at the project root

5. Submission Requirements

Your submission must include all .js files, package.json, .env with placeholder values, labtrack.json seed data, and README.md with:

✓ Installation and running instructions

✓ Postman testing guide

✓ Example laboratory_manager, laboratory_technician, and quality_auditor accounts

✓ Labelled Postman screenshots for successful and failed test cases

Sample Test Accounts

Role

Username

Password

Description

Laboratory Manager

labManager1

123456

Manages users, laboratories, catalogues, reagents, and reports

Laboratory Technician

technician1

123456

Registers samples and performs tests at the assigned laboratory

Quality Auditor

labAuditor1

123456

Views sample, reagent usage, and quality audit reports

