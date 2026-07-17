Dưới đây là hướng dẫn chi tiết cách đọc log lỗi từ Node.js (Stack Trace) và cách bạn tự sửa thủ công 4 file Router bị lỗi.

---

## 1. Hướng dẫn đọc log crash của Node.js

Hãy nhìn vào log lỗi bạn nhận được:

```text
D:\Assignment_NodeJS\TranKimThang_warepro\routes\authRoutes.js:3
r.post('/login', c.login);
  ^

TypeError: r.post is not a function
    at Object.<anonymous> (D:\Assignment_NodeJS\TranKimThang_warepro\routes\authRoutes.js:3:3)
    ...
    at Object.<anonymous> (D:\Assignment_NodeJS\TranKimThang_warepro\server.js:8:18)
```

**Cách phân tích từng dòng:**
1.  **Dòng 1:** `...\routes\authRoutes.js:3` 
    👉 Chỉ ra chính xác file bị lỗi là [authRoutes.js](file:///d:/Assignment_NodeJS/TranKimThang_warepro/routes/authRoutes.js) ở dòng thứ **3**.
2.  **Dòng 2 & 3:** 
    ```javascript
    r.post('/login', c.login);
      ^
    ```
    👉 Dấu mũ `^` chỉ ra chính xác vị trí ký tự hoặc hàm gây ra lỗi trong dòng đó. Ở đây là hàm `.post` của biến `r`.
3.  **Dòng 4:** `TypeError: r.post is not a function`
    👉 Đây là **loại lỗi** (`TypeError`) và **thông báo lỗi**. Nó nói rằng `r.post` không phải là một hàm. Lỗi này xảy ra khi bạn cố gọi một hàm từ một biến không sở hữu hàm đó (trong trường hợp này, biến `r` là `express` chứ không phải `express.Router()`).
4.  **Dòng 5 trở đi (Call Stack):**
    *   `at Object.<anonymous> (...authRoutes.js:3:3)`: Lỗi xảy ra khi chạy code tại dòng 3 cột 3 trong `authRoutes.js`.
    *   `at Object.<anonymous> (...server.js:8:18)`: Chỉ ra nguồn gọi (file [server.js](file:///d:/Assignment_NodeJS/TranKimThang_warepro/server.js) dòng 8). Tại dòng 8, server gọi `require('./routes/authRoutes')`, lệnh này nạp file `authRoutes.js` vào bộ nhớ và kích hoạt lỗi ở dòng 3.

---

## 2. Hướng dẫn sửa bằng tay 4 file Router

Để sửa triệt để lỗi này, bạn cần mở lần lượt **4 file** dưới đây và sửa lại phần khai báo ở đầu file.

### 🔴 File 1: [routes/authRoutes.js](file:///d:/Assignment_NodeJS/TranKimThang_warepro/routes/authRoutes.js)
*   **Code hiện tại:**
    ```javascript
    const r = require('express');
    const c = require('../controllers/authController');
    r.post('/login', c.login);
    r.post('/register', verifyToken, requireRole('warehouse_manager'), c.register);
    module.exports = r;
    ```
*   **Sửa thành:**
    ```javascript
    const r = require('express').Router(); // Thêm .Router()
    const c = require('../controllers/authController');
    const { verifyToken, requireRole } = require('../middleware/authMiddleware'); // Thêm dòng import middleware này

    r.post('/login', c.login);
    r.post('/register', verifyToken, requireRole('warehouse_manager'), c.register);

    module.exports = r;
    ```

---

### 🟢 File 2: [routes/productRoutes.js](file:///d:/Assignment_NodeJS/TranKimThang_warepro/routes/productRoutes.js)
*   **Code hiện tại:**
    ```javascript
    const r = require('express');
    const c = require('../controllers/productController');
    r.use(verifyToken);
    r.get('/', requireRole('warehouse_manager', 'stock_keeper', 'auditor'), c.list);
    r.post('/', requireRole('warehouse_manager'), c.create);
    module.exports = r;
    ```
*   **Sửa thành:**
    ```javascript
    const r = require('express').Router(); // Thêm .Router()
    const c = require('../controllers/productController');
    const { verifyToken, requireRole } = require('../middleware/authMiddleware'); // Thêm dòng import middleware này

    r.use(verifyToken);
    r.get('/', requireRole('warehouse_manager', 'stock_keeper', 'auditor'), c.list);
    r.post('/', requireRole('warehouse_manager'), c.create);

    module.exports = r;
    ```

---

### 🔵 File 3: [routes/transactionRoutes.js](file:///d:/Assignment_NodeJS/TranKimThang_warepro/routes/transactionRoutes.js)
*   **Code hiện tại:**
    ```javascript
    const r = require('express');
    const c = require('../controllers/transactionController');
    r.use(verifyToken);
    r.post('/import', requireRole('warehouse_manager', 'stock_keeper'), c.importStock);
    r.post('/export', requireRole('warehouse_manager', 'stock_keeper'), c.exportStock);
    r.post('/transfer', requireRole('warehouse_manager'), c.transferStock);
    module.exports = r;
    ```
*   **Sửa thành:**
    ```javascript
    const r = require('express').Router(); // Thêm .Router()
    const c = require('../controllers/transactionController');
    const { verifyToken, requireRole } = require('../middleware/authMiddleware'); // Thêm dòng import middleware này

    r.use(verifyToken);
    r.post('/import', requireRole('warehouse_manager', 'stock_keeper'), c.importStock);
    r.post('/export', requireRole('warehouse_manager', 'stock_keeper'), c.exportStock);
    r.post('/transfer', requireRole('warehouse_manager'), c.transferStock);

    module.exports = r;
    ```

---

### 🟡 File 4: [routes/reportRoutes.js](file:///d:/Assignment_NodeJS/TranKimThang_warepro/routes/reportRoutes.js)
*   **Code hiện tại:**
    ```javascript
    const r = require('express');
    const c = require('../controllers/reportController');
    r.use(verifyToken, requireRole('warehouse_manager', 'auditor'));
    r.get('/stock-summary', c.stockSummary);
    r.get('/transactions', c.transactions);
    module.exports = r;
    ```
*   **Sửa thành:**
    ```javascript
    const r = require('express').Router(); // Thêm .Router()
    const c = require('../controllers/reportController');
    const { verifyToken, requireRole } = require('../middleware/authMiddleware'); // Thêm dòng import middleware này

    r.use(verifyToken, requireRole('warehouse_manager', 'auditor'));
    r.get('/stock-summary', c.stockSummary);
    r.get('/transactions', c.transactions);

    module.exports = r;
    ```

---

Sau khi sửa xong 4 file trên, nodemon sẽ tự động tải lại dự án và thông báo `MongoDB connected` cùng với cổng port mà không còn crash nữa!