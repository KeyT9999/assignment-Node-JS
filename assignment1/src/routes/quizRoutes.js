// File: src/routes/quizRoutes.js
// Chức năng: Định nghĩa các đầu endpoints (routes) cho các API quản lý Quiz.

// Import express và khởi tạo Router
const express = require("express");
const router = express.Router();

// Import các controller xử lý logic nghiệp vụ cho Quiz
const {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizWithCapitalQuestions,
  createQuestionInQuiz,
  createManyQuestionsInQuiz,
} = require("../controllers/quizController");

// Định nghĩa các route cho tài nguyên "/quizzes"
// Sử dụng router.route() để gom nhóm các method HTTP có cùng đường dẫn

// Route: "/" (tương ứng với "/quizzes" khi import vào server.js)
router.route("/")
  .get(getAllQuizzes)    // GET: Lấy danh sách toàn bộ các bộ Quiz (bao gồm populate danh sách câu hỏi chi tiết)
  .post(createQuiz);     // POST: Tạo mới một bộ Quiz (chưa có câu hỏi hoặc rỗng)

// Route: "/:quizId" (tương ứng với "/quizzes/:quizId")
router.route("/:quizId")
  .get(getQuizById)      // GET: Lấy thông tin chi tiết một bộ Quiz theo ID (populate toàn bộ câu hỏi chi tiết)
  .put(updateQuiz)       // PUT: Cập nhật thông tin bộ Quiz theo ID (tiêu đề, mô tả hoặc danh sách câu hỏi)
  .delete(deleteQuiz);   // DELETE: Xoá hoàn toàn bộ Quiz theo ID (chỉ xoá bộ đề, các câu hỏi độc lập vẫn giữ lại ở ngân hàng câu hỏi)

// Route: "/:quizId/populate"
// GET: Lấy thông tin bộ Quiz nhưng chỉ populate những câu hỏi chứa từ khóa "capital" (ở text hoặc keywords)
router.get("/:quizId/populate", getQuizWithCapitalQuestions);

// Route: "/:quizId/question"
// POST: Tạo mới 1 câu hỏi và tự động thêm liên kết (ObjectId) của câu hỏi đó vào bộ Quiz chỉ định
router.post("/:quizId/question", createQuestionInQuiz);

// Route: "/:quizId/questions"
// POST: Tạo mới hàng loạt câu hỏi (nhập vào mảng JSON) và liên kết toàn bộ danh sách đó vào bộ Quiz chỉ định
router.post("/:quizId/questions", createManyQuestionsInQuiz);

// Export router để sử dụng trong file server.js
module.exports = router;
