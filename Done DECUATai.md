

| WarePro — Smart Warehouse & Inventory Management System (Hệ thống Quản lý Kho & Tồn kho Thông minh) |
| :---: |

You are building the backend API for **WarePro** — a warehouse management platform used by **DaNang Logistics Co.**, operating 3 physical warehouses across Da Nang. The system tracks products, manages supplier import orders, controls inter-warehouse stock transfers, and enforces strict inventory integrity rules.

**Three roles operate in the system:**

* warehouse\_manager  — full control: products, suppliers, reports, user management

* stock\_keeper  — executes stock-in (import) and stock-out (export) transactions

* auditor  — read-only access to all inventory data and transaction history

Use database: **warepro.json**

**1\.  Project Initialization  (0.5 pt)**

* Folder name: 

  \<projectname\>\_warepro

* Run npm init; install: express, mongoose, bcrypt, jsonwebtoken, dotenv

* Entry point: server.js  |  PORT and MONGODB\_URI loaded from .env

**2\.  Authentication & RBAC  (1.5 pts)**

**2.1  User Schema  (0.5 pt)**

* File: models/userModel.js

* username (String, unique, required)

* password (String, required — bcrypt hashed via pre-save hook)

* fullName (String, required)

* role (String, enum: \['warehouse\_manager','stock\_keeper','auditor'\], default: 'stock\_keeper')

* assignedWarehouse (ObjectId, ref: 'Warehouse', default: null) — the warehouse this user is assigned to

* isActive (Boolean, default: true)

* createdAt (Date, default: now)

**2.2  Register & Login  (1 pt)**

**POST /auth/register**

* Only warehouse\_manager may register new users (verified from JWT) → 403 otherwise

* Return 409 if username already exists

* warehouse\_manager accounts cannot be created via this endpoint → 400: "Cannot register another manager via API"

**POST /auth/login**

* Authenticate with bcrypt; return JWT containing: userId, role, fullName, assignedWarehouse

* Return 401 if credentials are wrong

* Return 403 if isActive \= false  ("Account is deactivated. Contact your manager.")

| 📸  Postman Requirement: Screenshot: register success; register 403 (non-manager caller); register 400 (trying to create a manager). Login success; login 403 deactivated account. |
| :---- |

**3\.  Warehouse & Product Management  (2 pts)**

**3.1  Warehouse Schema  (0.5 pt)**

* File: models/warehouseModel.js

* code (String, unique, required) — e.g. 'WH-01', 'WH-02'

* name (String, required)

* location (String, required)

* maxCapacity (Number, required) — maximum total units storable

* currentLoad (Number, default: 0\) — total units currently stored across all products

* status (String, enum: \['active','inactive','full'\], default: 'active')

**3.2  Product Schema  (0.5 pt)**

* File: models/productModel.js

* sku (String, unique, required) — Stock Keeping Unit, e.g. 'SKU-0042'

* name (String, required)

* category (String, required) — e.g. 'electronics', 'furniture', 'food'

* unit (String, required) — e.g. 'pcs', 'kg', 'box'

* unitPrice (Number, required, \> 0\)

* reorderLevel (Number, required) — if total stock across all warehouses drops below this → flag as low stock

* isActive (Boolean, default: true)

**3.3  Product APIs  (1 pt)**

**POST /products  (warehouse\_manager only)**

* Create a new product; return 409 if SKU already exists

* Return 400 if unitPrice ≤ 0

**GET /products  (all roles)**

* Support query param: ?category=electronics

* Support query param: ?lowStock=true  → return only products whose total stock across all warehouses is below reorderLevel

| 💡  Note: For ?lowStock=true, aggregate total stock from the StockLedger model (Section 4.1) grouped by productId. Products not present in the ledger have 0 stock. |
| :---- |
| **📸  Postman Requirement:** Screenshot: POST /products success \+ 409 duplicate SKU. GET /products?lowStock=true showing at least one flagged product. |

**4\.  Inventory & Stock Transactions  (4 pts)**

**4.1  Stock Ledger Schema  (1 pt)**

**File: models/stockLedgerModel.js**

This model tracks per-product, per-warehouse stock levels AND every transaction that changed them.

* productId (ObjectId, ref: 'Product', required)

* warehouseId (ObjectId, ref: 'Warehouse', required)

* quantity (Number, required) — current quantity of this product in this warehouse

* lastUpdated (Date, default: now)

**The combination of (productId \+ warehouseId) must be unique.**

{ unique: true } on compound index: { productId: 1, warehouseId: 1 }

**File: models/stockTransactionModel.js**

* transactionCode (String, unique, auto-generated) — format: TXN-YYYYMMDD-XXX

* type (String, enum: \['import','export','transfer\_out','transfer\_in'\], required)

* productId (ObjectId, ref: 'Product', required)

* warehouseId (ObjectId, ref: 'Warehouse', required) — source warehouse

* destinationWarehouseId (ObjectId, ref: 'Warehouse', default: null) — used for transfers only

* quantity (Number, required, \> 0\)

* unitPrice (Number, required) — price at time of transaction (snapshot)

* totalValue (Number) — auto-computed: quantity × unitPrice

* performedBy (ObjectId, ref: 'User') — from JWT

* note (String, optional)

* createdAt (Date, default: now)

**4.2  Stock Transaction APIs  (3 pts)**

**POST /transactions/import  —  Stock In  (1 pt)**

Accessible by: stock\_keeper, warehouse\_manager

**Validation:**

* quantity must be \> 0 → 400

* unitPrice must be \> 0 → 400

* Product must exist and isActive \= true → 404 / 400

* Warehouse must exist and status \= 'active' → 400: "Warehouse is not active"

**Warehouse Capacity Check (Advanced):**

* If warehouse.currentLoad \+ quantity \> warehouse.maxCapacity → return 409:

  *   "Insufficient warehouse capacity. Available: {maxCapacity − currentLoad} units"

**On success:**

* Upsert StockLedger: if (productId \+ warehouseId) exists → increment quantity; else create with quantity

* Increment warehouse.currentLoad by quantity

* Auto-set warehouse.status \= 'full' if currentLoad reaches maxCapacity after import

* Create StockTransaction with type='import', auto-generate transactionCode, compute totalValue

* performedBy from JWT — never from request body

| 📸  Postman Requirement: Screenshot: import success 201 with transactionCode \+ totalValue; import 409 capacity exceeded. |
| :---- |

**POST /transactions/export  —  Stock Out  (1 pt)**

Accessible by: stock\_keeper, warehouse\_manager

**Validation:**

* quantity \> 0 → 400

* Product and Warehouse must exist and be active

**Stock Availability Check (Advanced):**

* Find StockLedger for (productId \+ warehouseId)

* If not found or ledger.quantity \< requested quantity → return 409:

  *   "Insufficient stock. Available: {ledger.quantity} units, requested: {quantity}"

**On success:**

* Decrement StockLedger.quantity by quantity

* Decrement warehouse.currentLoad by quantity

* If warehouse.status \= 'full' and new currentLoad \< maxCapacity → reset status \= 'active'

* Create StockTransaction with type='export', auto-generate transactionCode, compute totalValue

| 💡  Note: After export, check if the product's total stock across all warehouses falls below product.reorderLevel. If so, attach a lowStockWarning field in the response: { warning: "Low stock alert: {product.name} is below reorder level ({reorderLevel} units)" } |
| :---- |
| **📸  Postman Requirement:** Screenshot: export success with totalValue (+ lowStockWarning if triggered); export 409 insufficient stock. |

**POST /transactions/transfer  —  Inter-Warehouse Transfer  (1 pt)**

Accessible by: warehouse\_manager only

Request body: productId, sourceWarehouseId, destinationWarehouseId, quantity, note

**Validation:**

* sourceWarehouseId must not equal destinationWarehouseId → 400: "Source and destination warehouse cannot be the same"

* Both warehouses must exist and be active

* Product must exist and isActive \= true

**Stock & Capacity Checks (both must pass before any write):**

* Source: StockLedger quantity \>= requested quantity → else 409: "Insufficient stock in source warehouse"

* Destination: currentLoad \+ quantity \<= maxCapacity → else 409: "Destination warehouse has insufficient capacity"

**On success (atomic — all writes or none):**

* Decrement source StockLedger.quantity; decrement source warehouse.currentLoad

* Upsert destination StockLedger; increment destination warehouse.currentLoad

* Update warehouse statuses (full/active) for both warehouses after changes

* Create TWO StockTransaction records: one type='transfer\_out' (source), one type='transfer\_in' (destination)

* Both share the same transactionCode prefix (e.g. TRF-YYYYMMDD-XXX)

| 📸  Postman Requirement: Screenshot: transfer success returning both transaction records; transfer 409 insufficient source stock; transfer 400 same warehouse. |
| :---- |

**5\.  Reports & Audit  (1.5 pts)**

**GET /reports/stock-summary  (0.75 pt)**

Accessible by: warehouse\_manager, auditor

Return a summary of current stock levels grouped by warehouse:

* For each warehouse, list: warehouseCode, warehouseName, currentLoad, maxCapacity, utilizationPercent (currentLoad / maxCapacity × 100, rounded to 1 decimal)

* Under each warehouse, list all products stored there with their current quantity from StockLedger

* Support query param: ?warehouseId=\<id\>  to filter for a single warehouse

| 📸  Postman Requirement: Screenshot: full summary (all warehouses) and filtered ?warehouseId= response. |
| :---- |

**GET /reports/transactions  (0.75 pt)**

Accessible by: warehouse\_manager, auditor

* Return all stock transactions with populated productId (sku, name) and performedBy (username, fullName)

* Support query param: ?type=import  (filter by transaction type)

* Support query param: ?warehouseId=\<id\>  (filter by source warehouse)

* Support query param: ?from=YYYY-MM-DD\&to=YYYY-MM-DD  (filter by date range on createdAt)

* All params may be combined; default \= return all

| 📸  Postman Requirement: Screenshot: full transaction list; filtered by ?type=transfer\_out; filtered by date range. |
| :---- |

**6\.  Project Structure  (0.5 pt)**

* /models          — userModel, warehouseModel, productModel, stockLedgerModel, stockTransactionModel

* /controllers     — authController, productController, transactionController, reportController

* /routes          — one router file per domain

* /middleware      — verifyToken(req,res,next), requireRole(...roles)

* server.js \+ .env at root

**7\.  Submission Requirements**

* All .js source files \+ package.json \+ .env (placeholder values only)

* warepro.json — seed data provided with exam

* README.md: install guide, run steps, sample accounts, full Postman testing sequence

* All Postman screenshots labelled by endpoint and test case

**Sample Test Accounts**

| Role | Username | Password | Permissions |
| :---- | :---- | :---- | :---- |
| warehouse\_manager | manager1 | 123456 | Register users, manage products, transfers, view all reports |
| stock\_keeper | keeper1 | 123456 | Perform import and export transactions |
| auditor | auditor1 | 123456 | Read-only: view all stock and transaction reports |

**Score Summary**

| Section | Points | Postman Screenshots |
| :---- | :---: | :---: |
| 1\. Project Initialization | 0.5 | — |
| 2\. Auth & RBAC | 1.5 | 5 |
| 3\. Warehouse & Product Management | 2.0 | 3 |
| 4\. Inventory & Stock Transactions | 4.0 | 7 |
| 5\. Reports & Audit | 1.5 | 5 |
| 6\. Project Structure | 0.5 | — |
| **TOTAL** | **10.0** | **20** |

