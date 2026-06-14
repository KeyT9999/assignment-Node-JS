# Hướng Dẫn Nối Controller Sang Route (Tạo Đường Dẫn API)

Sau khi cậu đã viết xong chức năng trong **Controller** (ví dụ: hàm `searchQuizByTitle`), bước tiếp theo là phải "mở cửa" để Postman hoặc Website có thể gọi được hàm đó. Cánh cửa đó chính là **Route**.

Việc viết Route cực kỳ đơn giản, chỉ gồm **3 bước** cơ bản:

---

## Bước 1: Mở file Router tương ứng
Hệ thống của cậu đang chia làm 2 mảng chính:
- Nếu chức năng liên quan đến Quiz -> Mở file `routes/quizRouter.js`
- Nếu chức năng liên quan đến Question -> Mở file `routes/questionRouter.js`

## Bước 2: Chọn phương thức HTTP (GET/POST/PUT/DELETE)
Tuỳ vào chức năng mà cậu vừa viết trong Controller, cậu phải chọn 1 phương thức phù hợp:
- **`GET`**: Khi client muốn lấy dữ liệu về (Ví dụ: Lấy danh sách, tìm kiếm).
- **`POST`**: Khi client muốn gửi dữ liệu lên để tạo mới (Ví dụ: Tạo câu hỏi, thêm mới Quiz).
- **`PUT`**: Khi client muốn sửa/cập nhật toàn bộ dữ liệu cũ.
- **`DELETE`**: Khi client muốn xoá dữ liệu.

## Bước 3: Gắn hàm Controller vào Đường dẫn (Path)
Trong file Router, cậu sẽ thấy 2 cách viết. Cậu dùng cách nào cũng được:

### Cách 1: Viết gộp (Dùng `.route()`) - Đây là cách project cậu đang dùng nhiều
Cách này rất tiện khi cậu có nhiều hành động (GET, POST, DELETE) trên cùng 1 đường dẫn.

```javascript
// Giả sử đường dẫn là '/search'
quizRouter.route('/search')
    .get(quizController.searchQuizByTitle); // Nối hàm GET vào đây

quizRouter.route('/:quizId/questions/clear')
    .delete(quizController.clearAllQuestionsInQuiz); // Nối hàm DELETE vào đây
```

### Cách 2: Viết trực tiếp (Nhanh và dễ nhìn cho 1 đường dẫn)
Cậu chỉ cần gọi thẳng tên phương thức: `router.method('đường_dẫn', hàm_controller)`

```javascript
quizRouter.get('/search', quizController.searchQuizByTitle);

quizRouter.delete('/:quizId/questions/clear', quizController.clearAllQuestionsInQuiz);
```

---

## ⚠️ LƯU Ý QUAN TRỌNG: Quy tắc ghép tên đường dẫn (URL)

Cậu cần nhớ rằng, đường dẫn thực tế trên Postman là **kết quả của phép cộng**:
> **URL Thực tế** = **Đường dẫn ở `server.js`** + **Đường dẫn ở `Router.js`**

**Ví dụ:**
1. Trong file `server.js`, cậu đã khai báo:
   `app.use('/quizzes', quizRouter);` -> Nghĩa là tất cả mọi thứ trong `quizRouter` đều bị dính chữ `/quizzes` ở đầu.
2. Trong file `quizRouter.js`, cậu khai báo:
   `quizRouter.route('/search').get(quizController.searchQuizByTitle);`
   
👉 **Kết quả:** URL để điền vào Postman sẽ là: `http://localhost:3000/quizzes/search`

## Tóm lại Quy trình Thêm Tính Năng Mới
1. Nghĩ xem tính năng làm gì -> Tạo hàm xử lý trong `Controller`.
2. Mở file `Router` -> Gắn hàm Controller đó vào 1 đường dẫn (Path) với method phù hợp (GET/POST/...).
3. Mở Postman -> Gõ đường dẫn hoàn chỉnh (ghép từ `server.js` và `Router`) -> TEST!
