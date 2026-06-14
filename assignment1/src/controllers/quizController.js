// Chức năng: Chứa logic xử lý các yêu cầu (controllers) liên quan đến bộ đề Quiz,
// bao gồm CRUD quiz, lọc các câu hỏi có từ khóa "capital", thêm câu hỏi đơn/loạt vào quiz.

// Import các Model cần thiết để thao tác dữ liệu
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

/**
 * @desc    Lấy danh sách tất cả các bộ Quiz trong hệ thống
 * @route   GET /quizzes
 * @access  Public
 */
exports.getAllQuizzes = async (req, res) => {
  try {
    // Tìm tất cả Quiz và tự động nạp đầy đủ thông tin của mảng `questions` bằng phương thức .populate()
    const quizzes = await Quiz.find().populate("questions");

    // Trả về danh sách trắc nghiệm thành công với mã 200
    res.status(200).json({
      success: true,
      count: quizzes.length, // Số lượng bộ Quiz
      data: quizzes,         // Mảng dữ liệu các bộ Quiz
    });
  } catch (error) {
    // Trả về mã lỗi 500 nếu gặp lỗi hệ thống
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Lấy thông tin chi tiết của một bộ Quiz theo ID
 * @route   GET /quizzes/:quizId
 * @access  Public
 */
exports.getQuizById = async (req, res) => {
  try {
    // Tìm Quiz theo ID và nạp danh sách câu hỏi chi tiết
    const quiz = await Quiz.findById(req.params.quizId).populate("questions");

    // Nếu không tìm thấy bộ Quiz phù hợp với ID, trả về lỗi 404
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Trả về dữ liệu chi tiết của Quiz thành công với mã 200
    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    // Trả về mã lỗi 500
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Tạo mới một bộ Quiz rỗng
 * @route   POST /quizzes
 * @access  Public
 */
exports.createQuiz = async (req, res) => {
  try {
    // Tạo bộ Quiz mới dựa trên dữ liệu gửi lên (req.body)
    const quiz = await Quiz.create(req.body);

    // Trả về đối tượng trắc nghiệm mới được tạo với mã 201
    res.status(201).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    // Trả về lỗi 400 nếu dữ liệu không thỏa mãn validation (ví dụ: thiếu title, description)
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Cập nhật thông tin bộ Quiz theo ID
 * @route   PUT /quizzes/:quizId
 * @access  Public
 */
exports.updateQuiz = async (req, res) => {
  try {
    // Tìm bộ Quiz theo ID và cập nhật các trường được truyền lên
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.quizId, // ID của bộ Quiz cần sửa
      req.body,          // Dữ liệu mới
      {
        new: true,           // Trả về tài liệu sau khi đã chỉnh sửa xong
        runValidators: true, // Chạy lại các ràng buộc Schema Validation
      }
    ).populate("questions"); // Nạp chi tiết các câu hỏi sau khi cập nhật

    // Trả về lỗi 404 nếu không tìm thấy bộ Quiz
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Trả về dữ liệu Quiz đã cập nhật với mã 200
    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    // Trả về lỗi 400 nếu dữ liệu đầu vào không hợp lệ
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Xóa hoàn toàn bộ Quiz theo ID
 * @route   DELETE /quizzes/:quizId
 * @access  Public
 */
exports.deleteQuiz = async (req, res) => {
  try {
    // Tìm và xóa bộ Quiz dựa trên ID
    const quiz = await Quiz.findByIdAndDelete(req.params.quizId);

    // Trả về lỗi 404 nếu không tìm thấy bộ Quiz để xoá
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Trả về thông báo xóa thành công với mã 200
    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    // Trả về lỗi 500 nếu có lỗi xảy ra từ máy chủ/database
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Lấy chi tiết Quiz nhưng lọc các câu hỏi có từ khóa hoặc nội dung chứa từ "capital"
 * @route   GET /quizzes/:quizId/populate
 * @access  Public
 */
exports.getQuizWithCapitalQuestions = async (req, res) => {
  try {
    // Tìm bộ Quiz theo ID và thực hiện populate mảng `questions` có kèm điều kiện lọc (match)
    const quiz = await Quiz.findById(req.params.quizId).populate({
      path: "questions", // Trường cần nạp dữ liệu chi tiết
      match: {
        // Điều kiện lọc: văn bản câu hỏi chứa chữ "capital" HOẶC mảng keywords chứa từ khoá tương ứng
        $or: [
          { text: { $regex: "capital", $options: "i" } },     // Kiểm tra text câu hỏi chứa "capital", không phân biệt chữ hoa/thường (options: "i")
          { keywords: { $regex: "capital", $options: "i" } }, // Kiểm tra các phần tử trong mảng keywords có chứa từ "capital"
        ],
      },
    });

    // Trả về lỗi 404 nếu bộ Quiz không tồn tại
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Trả về thông tin Quiz cùng với danh sách câu hỏi đã được lọc
    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Tạo 1 câu hỏi mới đồng thời thêm liên kết của câu hỏi đó vào bộ Quiz chỉ định
 * @route   POST /quizzes/:quizId/question
 * @access  Public
 */
exports.createQuestionInQuiz = async (req, res) => {
  try {
    // Tìm bộ Quiz cần thêm câu hỏi trước
    const quiz = await Quiz.findById(req.params.quizId);

    // Trả về lỗi 404 nếu bộ Quiz không tồn tại
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Thêm tài liệu Question mới vào bảng câu hỏi độc lập (Question Bank)
    const question = await Question.create(req.body);

    // Đẩy ObjectId của câu hỏi mới tạo vào mảng `questions` của bộ Quiz hiện tại
    quiz.questions.push(question._id);
    
    // Lưu lại thay đổi của bộ Quiz vào database
    await quiz.save();

    // Nạp lại dữ liệu đầy đủ của bộ Quiz (bao gồm danh sách câu hỏi chi tiết sau khi thêm mới) để trả về cho client
    const updatedQuiz = await Quiz.findById(req.params.quizId).populate("questions");

    // Phản hồi thành công với mã 201
    res.status(201).json({
      success: true,
      data: updatedQuiz,
    });
  } catch (error) {
    // Trả về lỗi 400 nếu dữ liệu câu hỏi đầu vào không hợp lệ
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Tạo hàng loạt câu hỏi (Batch) và liên kết toàn bộ chúng vào bộ Quiz chỉ định
 * @route   POST /quizzes/:quizId/questions
 * @access  Public
 */
exports.createManyQuestionsInQuiz = async (req, res) => {
  try {
    // Tìm bộ Quiz chỉ định
    const quiz = await Quiz.findById(req.params.quizId);

    // Trả về lỗi 404 nếu không tìm thấy Quiz
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Kiểm tra dữ liệu gửi lên phải là một mảng (Array) chứa danh sách câu hỏi
    if (!Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be an array of questions",
      });
    }

    // Thực hiện chèn nhiều bản ghi (insertMany) vào database cùng lúc để tối ưu hiệu năng
    const questions = await Question.insertMany(req.body);

    // Lấy ra danh sách các ObjectId của các câu hỏi vừa tạo
    const questionIds = questions.map((question) => question._id);
    
    // Sử dụng toán tử spread (...) để đẩy toàn bộ danh sách ID câu hỏi vào mảng `questions` của Quiz
    quiz.questions.push(...questionIds);
    
    // Lưu thay đổi của bộ Quiz vào cơ sở dữ liệu
    await quiz.save();

    // Lấy lại dữ liệu Quiz đầy đủ kèm chi tiết câu hỏi để trả về
    const updatedQuiz = await Quiz.findById(req.params.quizId).populate("questions");

    // Trả về kết quả thành công với mã 201
    res.status(201).json({
      success: true,
      data: updatedQuiz,
    });
  } catch (error) {
    // Trả về lỗi 400 nếu có bất kỳ câu hỏi nào trong danh sách bị lỗi validate dữ liệu
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
