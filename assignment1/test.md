# Hướng Dẫn Kiểm Thử (Testing Guide) - SimpleQuiz

Tài liệu này hướng dẫn chi tiết cách chạy dự án và tiến hành kiểm thử (test) toàn bộ luồng chạy của dự án **SimpleQuiz** (quản lý câu hỏi trắc nghiệm và bộ đề thi).

---

## 1. Chuẩn Bị Môi Trường Chạy Dự Án

Để tiến hành test, trước tiên bạn cần khởi chạy ứng dụng Node.js:

1. **Cài đặt thư viện:**
   Mở terminal, chuyển hướng vào thư mục `assignment1` và cài đặt các dependencies:
   ```bash
   cd "f:/LEARN KÌ 7/SDN302 Node JS/assignment-1-KeyT9999/assignment1"
   npm install
   ```

2. **Cấu hình môi trường:**
   Kiểm tra nội dung file [.env](file:///f:/LEARN%20K%C3%8C%207/SDN302%20Node%20JS/assignment-1-KeyT9999/assignment1/.env) trong thư mục dự án:
   ```env
   PORT=9999
   MONGO_URI=mongodb://127.0.0.1:27017/SimpleQuiz
   ```
   *Lưu ý: Hãy chắc chắn máy của bạn đã khởi động MongoDB Local trên cổng mặc định `27017`.*

3. **Khởi động Server:**
   Chạy lệnh dưới đây để bắt đầu chế độ phát triển (dự án sử dụng `nodemon` để tự động restart khi thay đổi code):
   ```bash
   npm run dev
   ```
   Khi màn hình log báo `MongoDB connected: 127.0.0.1` và `Server running on port 9999`, server đã sẵn sàng.

---

## 2. Kiểm Thử Giao Diện Người Dùng (Manual UI Testing)

Truy cập địa chỉ: [http://localhost:9999](http://localhost:9999) trên trình duyệt để kiểm tra các luồng nghiệp vụ.

### Luồng 1: Quản Lý Bộ Đề (Quiz Management)
* **Tạo Quiz mới:**
  1. Nhấn nút **Tạo Quiz Mới** ở góc phải trang chủ.
  2. Điền Tiêu đề (ví dụ: `Đề thi Địa lý`) và Mô tả (`Kiểm tra kiến thức địa lý thế giới`).
  3. Nhấn **Lưu**. Giao diện sẽ lập tức tải lại và hiển thị card chứa bộ Quiz vừa tạo với số lượng câu hỏi ban đầu bằng `0`.
* **Tìm kiếm Quiz:**
  1. Nhập từ khóa bất kỳ vào ô tìm kiếm (ví dụ: `Địa lý`).
  2. Grid danh sách Quiz sẽ tự động lọc hiển thị những Quiz thỏa mãn bộ lọc.
* **Xóa Quiz:**
  1. Nhấn nút **Xóa** trên card của bộ Quiz.
  2. Xác nhận thông báo popup của trình duyệt. Bộ Quiz sẽ biến mất khỏi danh sách.

### Luồng 2: Quản Lý Ngân Hàng Câu Hỏi (Question Bank)
* **Truy cập:** Click tab **Ngân Hàng Câu Hỏi** trên thanh điều hướng.
* **Tạo Câu hỏi mới:**
  1. Nhấn nút **Tạo Câu Hỏi Mới**.
  2. Nhập nội dung câu hỏi (Ví dụ: `Thủ đô của nước Pháp là gì?`).
  3. Điền 4 phương án lựa chọn: `London`, `Berlin`, `Paris`, `Rome`.
  4. Tích chọn radio ở phương án thứ 3 (`Paris`) làm đáp án đúng (Index = 2).
  5. Điền từ khóa: `capital, france, europe`. Nhấn **Lưu**.
* **Chỉnh sửa câu hỏi:**
  1. Tìm câu hỏi vừa tạo, nhấn nút **Sửa**.
  2. Thay đổi nội dung hoặc chỉnh sửa phương án, sau đó nhấn **Lưu**.
* **Kiểm thử Validation:**
  1. Thử tạo câu hỏi và xóa bớt nội dung một số phương án (Schema yêu cầu câu hỏi phải có tối thiểu 2 phương án). Hệ thống sẽ trả về lỗi tương ứng.
* **Tìm kiếm câu hỏi:**
  1. Nhập từ khóa (Ví dụ: `france` hoặc `Thủ đô`) vào ô tìm kiếm câu hỏi để kiểm tra tính năng lọc.

### Luồng 3: Quản Lý Chi Tiết Bộ Quiz & Lọc Câu Hỏi "Capital"
1. Tại trang chủ (Quản lý Quiz), nhấn nút **Chi Tiết** trên một bộ Quiz cụ thể.
2. Bạn sẽ được dẫn đến trang chi tiết Quiz có URL tương ứng: `http://localhost:9999/pages/quizzes/<quizId>`.
3. **Thêm câu hỏi đơn lẻ:**
   * Nhấn nút **Thêm Câu Hỏi**.
   * Điền nội dung câu hỏi mới (Ví dụ: `What is the capital of Italy?`), các đáp án và từ khoá `capital, italy`. Nhấn **Lưu**. Câu hỏi này sẽ được tự động liên kết vào Quiz.
4. **Thêm hàng loạt câu hỏi (Batch Array):**
   * Nhấn nút **Thêm Hàng Loạt (Array)**.
   * Giao diện sẽ hiển thị sẵn một đoạn dữ liệu JSON mẫu gồm 2 câu hỏi.
   * Nhấn **Lưu Danh Sách**. Hệ thống sẽ chèn 2 câu hỏi này vào database và liên kết chúng trực tiếp vào bộ Quiz hiện tại.
5. **Kiểm thử bộ lọc từ khóa "Capital" (Yêu cầu cốt lõi):**
   * Nhấp chuột vào nút **Lọc "Capital"** trên thanh toolbar.
   * **Kết quả kỳ vọng:** Nút lọc chuyển sang trạng thái active (màu đen). Danh sách câu hỏi hiển thị bên dưới chỉ giữ lại những câu hỏi có nội dung (`text`) hoặc mảng `keywords` chứa từ khóa `"capital"` (không phân biệt chữ hoa/thường). Các câu hỏi khác sẽ bị ẩn đi.
   * Tắt nút lọc để hiển thị lại đầy đủ câu hỏi.
6. **Gỡ câu hỏi khỏi bộ Quiz:**
   * Nhấn nút **Gỡ khỏi Quiz** dưới chân một câu hỏi trong danh sách chi tiết.
   * **Kết quả kỳ vọng:** Câu hỏi đó biến mất khỏi bộ Quiz hiện tại. 
   * Quay lại tab **Ngân Hàng Câu Hỏi** để xác nhận câu hỏi này vẫn tồn tại trong ngân hàng câu hỏi độc lập (chỉ bị gỡ liên kết khỏi đề thi, không bị xóa khỏi CSDL).

### Luồng 4: Đồng Bộ Xóa Dữ Liệu
1. Tạo một câu hỏi trong **Ngân Hàng Câu Hỏi** hoặc thông qua trang **Chi Tiết Quiz** (để câu hỏi đó được liên kết vào Quiz).
2. Chuyển sang tab **Ngân Hàng Câu Hỏi**.
3. Tiến hành nhấn **Xóa** câu hỏi đó khỏi hệ thống.
4. **Kết quả kỳ vọng:** Câu hỏi bị xoá hoàn toàn khỏi ngân hàng câu hỏi. Đồng thời, ID câu hỏi này tự động bị gỡ bỏ (toán tử `$pull`) khỏi mảng `questions` của tất cả các bộ đề chứa nó. (Bạn có thể quay lại trang Chi tiết Quiz để xác nhận câu hỏi đã tự động biến mất không để lại vết lỗi).

---

## 3. Kiểm Thử API (API/Endpoint Testing)

Bạn có thể sử dụng các công cụ như **Postman**, **Insomnia**, hoặc lệnh **cURL** trong terminal để kiểm thử trực tiếp các API.

### 3.1. Các API dành cho Quiz (`/quizzes`)

#### A. Lấy danh sách tất cả các bộ Quiz
* **Request:** `GET http://localhost:9999/quizzes`
* **Response thành công (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "647f1234567890abcdef0001",
        "title": "Địa lý thế giới",
        "description": "Các câu hỏi địa lý cơ bản",
        "questions": [...],
        "createdAt": "2026-06-10T02:00:00.000Z",
        "updatedAt": "2026-06-10T02:05:00.000Z"
      }
    ]
  }
  ```

#### B. Tạo mới một bộ Quiz rỗng
* **Request:** `POST http://localhost:9999/quizzes`
* **Header:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "title": "Trắc nghiệm Node.js",
    "description": "Kiểm tra kiến thức lập trình Node.js & Express"
  }
  ```

#### C. Lấy chi tiết bộ Quiz theo ID (Đầy đủ câu hỏi)
* **Request:** `GET http://localhost:9999/quizzes/<quizId>`

#### D. Lấy chi tiết bộ Quiz kèm bộ lọc câu hỏi "Capital"
* **Request:** `GET http://localhost:9999/quizzes/<quizId>/populate`
* **Mô tả:** Chỉ nạp (populate) chi tiết những câu hỏi có `text` hoặc `keywords` khớp regex chứa từ `"capital"` (không phân biệt chữ hoa thường).

#### E. Cập nhật bộ Quiz (Ví dụ: Thay đổi danh sách câu hỏi hoặc sửa tiêu đề)
* **Request:** `PUT http://localhost:9999/quizzes/<quizId>`
* **Header:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "title": "Trắc nghiệm Node.js Nâng Cao",
    "questions": ["647f8888888888abcdef0001", "647f9999999999abcdef0002"]
  }
  ```

#### F. Xóa bộ Quiz
* **Request:** `DELETE http://localhost:9999/quizzes/<quizId>`

#### G. Tạo mới 1 câu hỏi và tự động thêm vào Quiz
* **Request:** `POST http://localhost:9999/quizzes/<quizId>/question`
* **Body:**
  ```json
  {
    "text": "What is the capital of Germany?",
    "options": ["Munich", "Frankfurt", "Berlin", "Hamburg"],
    "correctAnswerIndex": 2,
    "keywords": ["capital", "germany", "europe"]
  }
  ```

#### H. Tạo hàng loạt câu hỏi và thêm vào Quiz
* **Request:** `POST http://localhost:9999/quizzes/<quizId>/questions`
* **Body (Array):**
  ```json
  [
    {
      "text": "What is the capital of Spain?",
      "options": ["Madrid", "Barcelona", "Seville", "Valencia"],
      "correctAnswerIndex": 0,
      "keywords": ["capital", "spain"]
    },
    {
      "text": "What is the capital of Canada?",
      "options": ["Toronto", "Vancouver", "Montreal", "Ottawa"],
      "correctAnswerIndex": 3,
      "keywords": ["capital", "canada"]
    }
  ]
  ```

---

### 3.2. Các API dành cho Question Bank độc lập (`/question`)

#### A. Lấy toàn bộ câu hỏi trong ngân hàng câu hỏi
* **Request:** `GET http://localhost:9999/question`

#### B. Tạo mới một câu hỏi độc lập
* **Request:** `POST http://localhost:9999/question`
* **Body:**
  ```json
  {
    "text": "Ai là người phát minh ra điện thoại?",
    "options": ["Alexander Graham Bell", "Thomas Edison", "Nikola Tesla", "Albert Einstein"],
    "correctAnswerIndex": 0,
    "keywords": ["history", "invention"]
  }
  ```

#### C. Lấy chi tiết một câu hỏi theo ID
* **Request:** `GET http://localhost:9999/question/<questionId>`

#### D. Cập nhật câu hỏi
* **Request:** `PUT http://localhost:9999/question/<questionId>`
* **Body:**
  ```json
  {
    "keywords": ["history", "science", "invention"]
  }
  ```

#### E. Xóa câu hỏi (Sẽ kích hoạt xóa liên kết khỏi các Quiz)
* **Request:** `DELETE http://localhost:9999/question/<questionId>`

---

## 4. Hướng Dẫn Kiểm Thử Bằng Postman (Postman Testing Guide)

Để kiểm thử các API bằng **Postman**, bạn làm theo các bước hướng dẫn cụ thể dưới đây:

### Bước 1: Chuẩn bị Collection và Biến trong Postman
1. Mở ứng dụng **Postman** trên máy tính của bạn.
2. Tạo một Collection mới bằng cách nhấp chọn **Create New Collection** (Đặt tên bộ Collection là `SimpleQuiz API`).
3. (Tùy chọn) Để tiện quản lý địa chỉ Server, nhấp vào tab **Variables** của Collection hoặc tạo một Environment mới:
   - Thêm biến có tên: `url`
   - Đặt giá trị khởi tạo (Initial Value) và giá trị hiện tại (Current Value) là: `http://localhost:9999`
   - Nhấn **Save** (Ctrl+S) để lưu lại. Từ giờ, bạn có thể gọi API bằng cú pháp `{{url}}/quizzes` thay vì phải gõ toàn bộ địa chỉ.

### Bước 2: Lưu ý cấu hình Body gửi đi cho các request POST/PUT
Với tất cả các Request sử dụng phương thức **POST** hoặc **PUT** gửi kèm dữ liệu, hãy cấu hình như sau:
1. Nhấp vào tab **Body** bên dưới thanh nhập URL.
2. Chọn tùy chọn **raw**.
3. Chọn định dạng **JSON** ở danh sách thả xuống ở ngoài cùng bên phải (mặc định là Text).

---

### Bước 3: Tạo và gửi các Request cụ thể

#### Request 1: Tạo mới một bộ Quiz (POST)
* **Method:** `POST`
* **URL:** `{{url}}/quizzes`
* **Body** (chọn `raw` -> `JSON`):
  ```json
  {
    "title": "Địa lý Việt Nam",
    "description": "Các câu hỏi kiểm tra kiến thức về các tỉnh thành Việt Nam"
  }
  ```
* **Thực hiện:** Nhấn nút **Send**.
* **Kết quả kỳ vọng (201 Created):**
  * Mã trạng thái là `201 Created`.
  * Trả về JSON chứa thông tin bộ Quiz mới tạo. Hãy sao chép lại giá trị của trường `_id` trong phần `data` (Ví dụ: `6483fb3b1d3d...`), ID này chính là `<quizId>` bạn sẽ điền vào URL của các bước tiếp theo.

#### Request 2: Lấy danh sách toàn bộ các bộ Quiz (GET)
* **Method:** `GET`
* **URL:** `{{url}}/quizzes`
* **Thực hiện:** Nhấn nút **Send**.
* **Kết quả kỳ vọng (200 OK):** Trả về toàn bộ danh sách các bộ Quiz, trong đó trường `questions` đã được populate nạp đầy đủ thông tin chi tiết.

#### Request 3: Tạo một câu hỏi mới trực tiếp vào bộ Quiz chỉ định (POST)
* **Method:** `POST`
* **URL:** `{{url}}/quizzes/<quizId>/question` *(Thay `<quizId>` bằng ID thực tế đã copy từ Request 1)*
* **Body** (chọn `raw` -> `JSON`):
  ```json
  {
    "text": "Thủ đô của tỉnh Lâm Đồng là thành phố nào?",
    "options": ["Đà Lạt", "Bảo Lộc", "Nha Trang", "Phan Thiết"],
    "correctAnswerIndex": 0,
    "keywords": ["capital", "vietnam", "lamdong"]
  }
  ```
* **Thực hiện:** Nhấn nút **Send**.
* **Kết quả kỳ vọng (201 Created):** Câu hỏi được tạo trong CSDL, đồng thời ID của nó được tự động thêm vào mảng `questions` của Quiz. Hãy sao chép trường `_id` của câu hỏi mới tạo này để test API xóa sau này.

#### Request 4: Tạo hàng loạt câu hỏi (Batch) liên kết trực tiếp vào bộ Quiz (POST)
* **Method:** `POST`
* **URL:** `{{url}}/quizzes/<quizId>/questions`
* **Body** (chọn `raw` -> `JSON` - **Lưu ý: Dữ liệu gửi đi bắt buộc phải là một MẢNG chứa các đối tượng câu hỏi**):
  ```json
  [
    {
      "text": "What is the capital of Japan?",
      "options": ["Kyoto", "Tokyo", "Osaka", "Hiroshima"],
      "correctAnswerIndex": 1,
      "keywords": ["capital", "japan", "asia"]
    },
    {
      "text": "What is the capital of England?",
      "options": ["London", "Manchester", "Liverpool", "Birmingham"],
      "correctAnswerIndex": 0,
      "keywords": ["capital", "england", "europe"]
    }
  ]
  ```
* **Thực hiện:** Nhấn nút **Send**.
* **Kết quả kỳ vọng (201 Created):** Cả 2 câu hỏi mới đều được lưu vào database và gắn vào bộ đề.

#### Request 5: Kiểm thử bộ lọc câu hỏi chứa từ khóa "capital" (GET - CORE FEATURE)
* **Method:** `GET`
* **URL:** `{{url}}/quizzes/<quizId>/populate`
* **Thực hiện:** Nhấn nút **Send**.
* **Kết quả kỳ vọng (200 OK):**
  * Trong kết quả JSON trả về, hãy quan sát mảng `questions` của Quiz.
  * **Kỳ vọng:** Mảng này chỉ chứa các câu hỏi có trường `text` hoặc trường mảng `keywords` chứa từ khóa `"capital"` (Ví dụ: Câu hỏi về thủ đô Lâm Đồng, câu hỏi về Japan, England). Các câu hỏi khác không chứa từ khóa này sẽ không xuất hiện trong mảng kết quả.

#### Request 6: Gỡ câu hỏi ra khỏi bộ Quiz (PUT)
* **Method:** `PUT`
* **URL:** `{{url}}/quizzes/<quizId>`
* **Body** (chọn `raw` -> `JSON`):
  ```json
  {
    "questions": []
  }
  ```
  *(Hoặc điền mảng chứa các ID câu hỏi mà bạn muốn giữ lại, loại bỏ ID câu hỏi muốn gỡ)*
* **Thực hiện:** Nhấn nút **Send**.
* **Kết quả kỳ vọng (200 OK):** Trả về bộ đề Quiz đã cập nhật mảng câu hỏi (trong ví dụ trên, trường `questions` của Quiz sẽ rỗng vì chúng ta gửi mảng rỗng).

#### Request 7: Kiểm thử APIs Ngân hàng câu hỏi độc lập (`/question`)
* **Lấy toàn bộ câu hỏi:** `GET {{url}}/question` -> Trả về tất cả câu hỏi độc lập đang có trong CSDL.
* **Tạo câu hỏi độc lập:** `POST {{url}}/question`
  * Body JSON:
    ```json
    {
      "text": "Trái đất quay quanh mặt trời mất bao nhiêu ngày?",
      "options": ["365 ngày", "366 ngày", "365.25 ngày", "364 ngày"],
      "correctAnswerIndex": 2,
      "keywords": ["science", "earth"]
    }
    ```
* **Kiểm thử đồng bộ xóa câu hỏi:**
  * Tạo mới một câu hỏi gắn với Quiz.
  * Gọi API xóa câu hỏi đó: `DELETE {{url}}/question/<questionId>`
  * **Kết quả kỳ vọng:** API trả về thông báo xóa thành công. Khi bạn gọi lại `GET {{url}}/quizzes/<quizId>`, ID của câu hỏi này tự động bị gỡ khỏi mảng `questions` của bộ đề mà không để lại lỗi tham chiếu.

---

## 5. Hướng Dẫn Sử Dụng File Lệnh cURL Nhanh (Ví dụ)

Bạn có thể mở terminal (CMD, PowerShell trên Windows, hoặc Bash trên Linux/macOS) và dán các lệnh cURL sau để kiểm tra nhanh API mà không cần cài đặt Postman:

1. **Lấy danh sách Quiz:**
   ```bash
   curl -X GET http://localhost:9999/quizzes
   ```

2. **Tạo bộ Quiz mới:**
   ```bash
   curl -X POST -H "Content-Type: application/json" -d "{\"title\":\"Quiz Test cURL\",\"description\":\"Day la bo de kiem thu bang lenh curl\"}" http://localhost:9999/quizzes
   ```
   *Lưu ý: Sau khi chạy lệnh này, hãy copy lại giá trị `_id` từ kết quả JSON trả về để điền vào vị trí `<quizId>` trong các lệnh tiếp theo.*

3. **Thêm câu hỏi chứa từ "capital" vào bộ đề vừa tạo:**
   ```bash
   curl -X POST -H "Content-Type: application/json" -d "{\"text\":\"What is the capital of Japan?\",\"options\":[\"Tokyo\",\"Kyoto\",\"Osaka\",\"Hiroshima\"],\"correctAnswerIndex\":0,\"keywords\":[\"capital\",\"asia\"]}" http://localhost:9999/quizzes/<quizId>/question
   ```
