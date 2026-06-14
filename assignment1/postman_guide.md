# Hướng Dẫn Test API trên Postman

Chào cậu, tớ đã tổng hợp toàn bộ các routes hiện có trong hệ thống và cách gọi chúng trên Postman.

> [!WARNING]
> Tớ để ý thấy cậu vừa sửa route `/:quizId/question` thành `/:quizId/questions` trong file `quizRouter.js`, dẫn đến việc có 2 route bị trùng tên nhau. Tớ đã sửa lại route đầu tiên về thành `/:quizId/question` để hệ thống không bị lỗi rồi nhé!

Dưới đây là danh sách toàn bộ các API. 
* Lưu ý: Thay `<questionId>` và `<quizId>` bằng các mã ID tương ứng thực tế được trả về từ MongoDB (ví dụ: `6a265aa0...`).
* Đối với các API cần gửi dữ liệu, cậu chọn **Body** -> **raw** -> chọn **JSON** rồi chèn đoạn dữ liệu mẫu tớ cung cấp nhé.

---

## 1. Questions API (Quản lý Câu hỏi)

### 1.1. Lấy danh sách toàn bộ câu hỏi
- **Method:** `GET`
- **URL:** `http://localhost:3000/questions`

### 1.2. Tạo một câu hỏi mới
- **Method:** `POST`
- **URL:** `http://localhost:3000/questions`
- **Body (raw - JSON):**
```json
{
  "text": "What is the capital of France?",
  "options": ["Paris", "London", "Berlin", "Madrid"],
  "keywords": ["capital", "geography"],
  "correctAnswerIndex": 0
}
```

### 1.3. Lấy thông tin một câu hỏi theo ID
- **Method:** `GET`
- **URL:** `http://localhost:3000/questions/<questionId>`

### 1.4. Cập nhật một câu hỏi theo ID
- **Method:** `PUT`
- **URL:** `http://localhost:3000/questions/<questionId>`
- **Body (raw - JSON):** (Gửi các trường cần cập nhật)
```json
{
  "text": "What is the capital of Italy?",
  "options": ["Rome", "Milan", "Naples", "Turin"],
  "correctAnswerIndex": 0
}
```

### 1.5. Xoá một câu hỏi theo ID
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/questions/<questionId>`

### 1.6. Xoá TOÀN BỘ câu hỏi
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/questions`

---

## 2. Quizzes API (Quản lý Bài thi/Quiz)

### 2.1. Lấy danh sách toàn bộ Quizzes
- **Method:** `GET`
- **URL:** `http://localhost:3000/quizzes`

### 2.2. Tạo một Quiz mới
- **Method:** `POST`
- **URL:** `http://localhost:3000/quizzes`
- **Body (raw - JSON):**
```json
{
  "title": "Geography Quiz",
  "description": "Test your knowledge of world geography"
}
```

### 2.3. Lấy thông tin một Quiz theo ID (có trả kèm danh sách Questions)
- **Method:** `GET`
- **URL:** `http://localhost:3000/quizzes/<quizId>`

### 2.4. Cập nhật một Quiz theo ID
- **Method:** `PUT`
- **URL:** `http://localhost:3000/quizzes/<quizId>`
- **Body (raw - JSON):**
```json
{
  "title": "Advanced Geography Quiz",
  "description": "Harder questions for experts"
}
```

### 2.5. Xoá một Quiz theo ID
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/quizzes/<quizId>`

### 2.6. Xoá TOÀN BỘ Quizzes
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/quizzes`

### 2.7. Lấy Quiz nhưng chỉ lọc ra những câu hỏi chứa từ "capital"
- **Method:** `GET`
- **URL:** `http://localhost:3000/quizzes/<quizId>/populate`

### 2.8. Tạo MỘT câu hỏi mới và thêm vào Quiz
- **Method:** `POST`
- **URL:** `http://localhost:3000/quizzes/<quizId>/question`
- **Body (raw - JSON):**
```json
{
  "text": "Which planet is known as the Red Planet?",
  "options": ["Earth", "Mars", "Jupiter", "Venus"],
  "keywords": ["planet", "space"],
  "correctAnswerIndex": 1
}
```

### 2.9. Tạo NHIỀU câu hỏi mới cùng lúc và thêm vào Quiz
- **Method:** `POST`
- **URL:** `http://localhost:3000/quizzes/<quizId>/questions`
- **Body (raw - JSON):** (Phải là một mảng Array `[]` chứa các object)
```json
[
  {
    "text": "What is the capital of Japan?",
    "options": ["Tokyo", "Seoul", "Beijing", "Bangkok"],
    "keywords": ["capital", "asia"],
    "correctAnswerIndex": 0
  },
  {
    "text": "What is the largest ocean on Earth?",
    "options": ["Atlantic", "Indian", "Arctic", "Pacific"],
    "keywords": ["ocean", "geography"],
    "correctAnswerIndex": 3
  }
]
```
