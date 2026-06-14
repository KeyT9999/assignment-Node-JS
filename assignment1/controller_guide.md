# Bí Kíp Lập Trình Controller: Chinh Phục Mọi Tính Năng Mới

Tài liệu này sẽ cung cấp cho cậu "bộ khung xương" chung để xử lý mọi tính năng mà giáo viên có thể yêu cầu, cùng với các ví dụ thực tế. Chỉ cần nhớ công thức này, cậu có thể tự tin code mà không cần tìm code mẫu!

> [!NOTE]
> Mọi hàm trong Controller (Express) đều có nhiệm vụ duy nhất: **Nhận yêu cầu (req) -> Hỏi Database (Mongoose) -> Trả về kết quả (res)**.

---

## Phần 1: CÔNG THỨC CHUNG (Bộ Khung Bắt Buộc)

Dù tính năng có phức tạp đến đâu, cậu luôn bắt đầu bằng việc gõ ra bộ khung này:

```javascript
ten_tinh_nang_moi: async (req, res, next) => {
    try {
        // [BƯỚC 1]: Lấy dữ liệu người dùng gửi lên (từ URL hoặc Body)
        // [BƯỚC 2]: Chọc vào Database (Dùng lệnh Mongoose)
        // [BƯỚC 3]: Trả kết quả về cho người dùng
    } catch (err) {
        // Nếu ở trên có lỗi (ví dụ rớt mạng, sai kiểu dữ liệu), đẩy cho Express báo lỗi
        next(err);
    }
}
```

---

## Phần 2: HƯỚNG DẪN CHI TIẾT 3 BƯỚC

### [BƯỚC 1] Lấy dữ liệu (Thông qua `req`)
Tùy vào việc người dùng gửi dữ liệu kiểu gì, ta sẽ dùng lệnh tương ứng:

| Trường hợp | Code mẫu | Ví dụ thực tế |
| :--- | :--- | :--- |
| Lấy từ tham số trên đường dẫn (VD: `/quizzes/:quizId`) | `req.params.tên_biến` | `const id = req.params.quizId;` |
| Lấy từ Body (Form, JSON gửi qua Postman) | `req.body` | `const data = req.body;` |
| Lấy từ chuỗi tìm kiếm (VD: `?search=hello&page=2`) | `req.query.tên_biến` | `const keyword = req.query.search;` |

### [BƯỚC 2] Ra lệnh cho Database (Thông qua lệnh Mongoose)
Đây là phần cốt lõi nhất. Hãy gọi đúng hàm của Mongoose để lấy dữ liệu.

> [!TIP]
> **Các lệnh Mongoose thường gặp nhất:**
> - Tìm tất cả: `await Model.find({})`
> - Tìm có điều kiện (VD: Tìm câu hỏi khó): `await Model.find({ level: 'Hard' })`
> - Tìm 1 cái theo ID: `await Model.findById(id_can_tim)`
> - Thêm 1 cái mới: `await Model.create(du_lieu_moi)`
> - Cập nhật theo ID: `await Model.findByIdAndUpdate(id, { $set: du_lieu_moi }, { new: true })`
> - Xoá theo ID: `await Model.findByIdAndDelete(id)`

### [BƯỚC 3] Trả kết quả về (Thông qua `res`)
Luôn trả về một HTTP Status Code (Mã trạng thái) đi kèm với dữ liệu JSON.

```javascript
// Nếu tạo mới thành công (Mã 201)
res.status(201).json(du_lieu_vua_tao);

// Nếu truy vấn bình thường thành công (Mã 200)
res.status(200).json(du_lieu_tim_duoc);

// Nếu bị lỗi nghiệp vụ (VD: Không tìm thấy, Mã 404)
res.status(404).json({ message: "Không tìm thấy dữ liệu!" });
```

---

## Phần 3: THỰC HÀNH ÁP DỤNG

### Ví dụ 1: Tính năng tìm kiếm Quiz theo "title"
**Yêu cầu:** Cho phép người dùng tìm các bài Quiz có chứa một từ khoá nhất định trong tiêu đề. (URL dự kiến: `GET /quizzes/search?title=toan`)

```javascript
searchQuizByTitle: async (req, res, next) => {
    try {
        // BƯỚC 1: Lấy từ khoá tìm kiếm từ URL (?title=toan)
        const keyword = req.query.title; 
        
        // BƯỚC 2: Gọi DB tìm kiếm các Quiz có title chứa từ khoá (không phân biệt hoa thường)
        const quizzes = await Quiz.find({ 
            title: new RegExp(keyword, 'i') 
        });
        
        // BƯỚC 3: Trả kết quả về
        res.status(200).json(quizzes);
    } catch (err) {
        next(err);
    }
}
```

### Ví dụ 2: Tính năng xoá tất cả các câu hỏi của 1 Quiz cụ thể
**Yêu cầu:** Người dùng muốn xoá sạch danh sách các câu hỏi trong 1 Quiz nhưng vẫn giữ lại Quiz đó. (URL dự kiến: `DELETE /quizzes/:quizId/questions/clear`)

```javascript
clearAllQuestionsInQuiz: async (req, res, next) => {
    try {
        // BƯỚC 1: Lấy cái ID của Quiz từ URL
        const quizId = req.params.quizId;
        
        // BƯỚC 2: Gọi DB
        // a. Đầu tiên, tìm xem Quiz có tồn tại không
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            // Bước 3 phụ: Nếu không thấy Quiz, chửi ngay (Mã 404)
            return res.status(404).json({ message: "Quiz không tồn tại" });
        }
        
        // b. Xóa trắng mảng câu hỏi và lưu lại
        quiz.questions = [];
        await quiz.save();
        
        // BƯỚC 3: Báo cáo thành công
        res.status(200).json({ message: "Đã xoá sạch câu hỏi trong Quiz này!" });
    } catch (err) {
        next(err);
    }
}
```

> [!IMPORTANT]
> **Tóm lại:** Khi nhận đề bài mới, cậu đừng nghĩ đến code vội. Cậu hãy ghi ra giấy hoặc nhẩm trong đầu: **(1) Mình cần xin người dùng cái gì? (2) Mình gọi hàm Mongoose gì? (3) Mình trả lại họ cái gì?** Thế là xong!
