// Chức năng: Chứa logic xử lý các yêu cầu (controllers) đối với các câu hỏi độc lập (Question Bank),
// bao gồm CRUD câu hỏi, đồng thời xóa liên kết câu hỏi đó khỏi tất cả Quiz nếu câu hỏi bị xóa.

// Import các model cần thiết để truy vấn dữ liệu
const Question = require("../models/Question");
const Quiz = require("../models/Quiz");

/**
 * @desc    Lấy danh sách tất cả các câu hỏi trong ngân hàng câu hỏi
 * @route   GET /question
 * @access  Public
 */
exports.getAllQuestions = async (req, res) => {
  try {
    // Truy vấn tất cả các tài liệu (documents) trong collection questions
    const questions = await Question.find();

    // Trả về kết quả thành công với mã trạng thái 200 (OK)
    res.status(200).json({
      success: true,
      count: questions.length, // Số lượng câu hỏi lấy được
      data: questions,         // Mảng chứa dữ liệu các câu hỏi
    });
  } catch (error) {
    // Xử lý lỗi hệ thống (ví dụ: lỗi kết nối database) và trả về mã lỗi 500
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Lấy chi tiết một câu hỏi theo ID
 * @route   GET /question/:questionId
 * @access  Public
 */
exports.getQuestionById = async (req, res) => {
  try {
    // Tìm câu hỏi theo ID được truyền qua route parameter (:questionId)
    const question = await Question.findById(req.params.questionId);

    // Nếu không tìm thấy câu hỏi với ID tương ứng, trả về lỗi 404 (Not Found)
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Trả về dữ liệu chi tiết của câu hỏi với mã trạng thái 200
    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    // Xử lý lỗi (ví dụ: định dạng ID không hợp lệ) và trả về mã lỗi 500
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Tạo mới một câu hỏi độc lập (thêm vào ngân hàng câu hỏi)
 * @route   POST /question
 * @access  Public
 */
exports.createQuestion = async (req, res) => {
  try {
    // Tạo mới câu hỏi dựa trên dữ liệu gửi lên từ body của request (req.body)
    const question = await Question.create(req.body);

    // Trả về đối tượng vừa tạo thành công với mã trạng thái 201 (Created)
    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    // Lỗi 400 (Bad Request) xảy ra khi dữ liệu đầu vào không vượt qua kiểm tra validation của Schema
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Cập nhật thông tin một câu hỏi theo ID
 * @route   PUT /question/:questionId
 * @access  Public
 */
exports.updateQuestion = async (req, res) => {
  try {
    // Tìm và cập nhật câu hỏi theo ID
    const question = await Question.findByIdAndUpdate(
      req.params.questionId, // ID của câu hỏi cần cập nhật
      req.body,              // Dữ liệu mới cần cập nhật
      {
        new: true,           // Trả về tài liệu đã được cập nhật thay vì tài liệu gốc trước khi sửa
        runValidators: true, // Chạy lại các hàm validate trong Schema để đảm bảo dữ liệu mới hợp lệ
      }
    );

    // Nếu không tìm thấy câu hỏi tương ứng với ID, trả về lỗi 404
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Trả về dữ liệu câu hỏi sau khi đã được cập nhật thành công với mã 200
    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    // Lỗi 400 xảy ra nếu dữ liệu cập nhật không thoả mãn điều kiện Schema
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Xóa một câu hỏi theo ID ra khỏi hệ thống
 * @route   DELETE /question/:questionId
 * @access  Public
 */
exports.deleteQuestion = async (req, res) => {
  try {
    // Tìm và xoá câu hỏi trong bảng câu hỏi độc lập
    const question = await Question.findByIdAndDelete(req.params.questionId);

    // Nếu không tìm thấy câu hỏi để xoá, trả về mã lỗi 404
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // [RẤT QUAN TRỌNG] Đồng bộ dữ liệu: Xóa liên kết (ID của câu hỏi bị xóa) khỏi mảng `questions` trong tất cả các bộ Quiz đang tham chiếu đến nó
    // Sử dụng toán tử $pull của MongoDB để gỡ bỏ phần tử có giá trị bằng `req.params.questionId` ra khỏi mảng `questions`
    await Quiz.updateMany(
      { questions: req.params.questionId }, // Tìm tất cả Quiz chứa ID câu hỏi này
      { $pull: { questions: req.params.questionId } } // Thực hiện loại bỏ ID đó khỏi mảng
    );

    // Trả về phản hồi xoá thành công với mã 200
    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    // Xử lý các lỗi hệ thống trong quá trình xoá dữ liệu và trả về mã lỗi 500
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
