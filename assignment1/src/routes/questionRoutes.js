// File: src/routes/questionRoutes.js
// Chức năng: Định nghĩa các đầu endpoints (routes) cho các API quản lý Question độc lập.

// Import express và khởi tạo Router
const express = require("express");
const router = express.Router();

// Import các controller xử lý logic nghiệp vụ cho Question
const {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/questionController");

// Định nghĩa các route cho tài nguyên "/question" (Bank câu hỏi độc lập)
// Sử dụng router.route() để gom nhóm các method HTTP có cùng đường dẫn

// Route: "/" (tương ứng với "/question" khi import vào server.js)
router.route("/")
  .get(getAllQuestions)    // GET: Lấy danh sách toàn bộ câu hỏi trong ngân hàng câu hỏi
  .post(createQuestion);   // POST: Tạo mới một câu hỏi độc lập vào ngân hàng câu hỏi

// Route: "/:questionId" (tương ứng với "/question/:questionId")
router.route("/:questionId")
  .get(getQuestionById)    // GET: Lấy thông tin chi tiết một câu hỏi theo ID
  .put(updateQuestion)     // PUT: Cập nhật thông tin chi tiết của câu hỏi theo ID
  .delete(deleteQuestion); // DELETE: Xoá câu hỏi theo ID khỏi hệ thống (và xoá tham chiếu trong các Quiz)

// Export router để sử dụng trong file server.js
module.exports = router;
