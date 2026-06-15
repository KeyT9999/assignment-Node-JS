// File: src/seed.js
// Chức năng: Điền dữ liệu mẫu (Quizzes & Questions) vào cơ sở dữ liệu MongoDB.

require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("./models/Question");
const Quiz = require("./models/Quiz");

// Bộ câu hỏi mẫu để đưa vào CSDL
const sampleQuestions = [
  // Nhóm câu hỏi Địa lý (Chứa từ khóa "capital" để kiểm thử tính năng lọc)
  {
    text: "What is the capital of Vietnam?",
    options: ["Ho Chi Minh City", "Da Nang", "Hanoi", "Hue"],
    correctAnswerIndex: 2,
    keywords: ["capital", "vietnam", "asia", "geography"]
  },
  {
    text: "What is the capital of France?",
    options: ["Paris", "Marseille", "Lyon", "Nice"],
    correctAnswerIndex: 0,
    keywords: ["capital", "france", "europe", "geography"]
  },
  {
    text: "What is the capital of Japan?",
    options: ["Kyoto", "Tokyo", "Osaka", "Hiroshima"],
    correctAnswerIndex: 1,
    keywords: ["capital", "japan", "asia", "geography"]
  },
  {
    text: "What is the capital of Italy?",
    options: ["Milan", "Venice", "Rome", "Florence"],
    correctAnswerIndex: 2,
    keywords: ["capital", "italy", "europe", "geography"]
  },
  // Nhóm câu hỏi kiến thức lập trình Web và Node.js
  {
    text: "What does CSS stand for?",
    options: [
      "Computer Style Sheets",
      "Cascading Style Sheets",
      "Creative Style Sheets",
      "Colorful Style Sheets"
    ],
    correctAnswerIndex: 1,
    keywords: ["css", "frontend", "styling"]
  },
  {
    text: "Which method is used to start an Express server listening on a port?",
    options: ["app.listen()", "app.start()", "app.run()", "app.connect()"],
    correctAnswerIndex: 0,
    keywords: ["express", "nodejs", "backend"]
  },
  {
    text: "Which command is used to initialize a new Node.js project?",
    options: ["npm start", "npm init", "npm install", "node init"],
    correctAnswerIndex: 1,
    keywords: ["npm", "nodejs", "setup"]
  },
  {
    text: "What engine is used by default in this project to render view pages?",
    options: ["Pug", "EJS", "Handlebars", "Jade"],
    correctAnswerIndex: 2,
    keywords: ["handlebars", "view", "express"]
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/SimpleQuiz";
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully!");

    // 1. Xóa dữ liệu cũ trong Database
    console.log("Clearing existing Quizzes and Questions...");
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    console.log("Database cleared.");

    // 2. Thêm danh sách câu hỏi vào database
    console.log("Inserting sample questions...");
    const createdQuestions = await Question.insertMany(sampleQuestions);
    console.log(`Successfully inserted ${createdQuestions.length} questions.`);

    // 3. Phân chia các câu hỏi cho từng bộ đề (Quiz)
    // - Geography Quiz: Lấy các câu hỏi có chứa keyword 'geography'
    // - Node.js Quiz: Lấy các câu hỏi có chứa keyword 'nodejs' hoặc 'express' hoặc 'npm' hoặc 'handlebars'
    const geoQuestionIds = createdQuestions
      .filter((q) => q.keywords.includes("geography"))
      .map((q) => q._id);

    const devQuestionIds = createdQuestions
      .filter((q) => !q.keywords.includes("geography"))
      .map((q) => q._id);

    const sampleQuizzes = [
      {
        title: "World Geography & Capitals",
        description: "Test your general knowledge of world capitals and geography.",
        questions: geoQuestionIds
      },
      {
        title: "Node.js & Express Basics",
        description: "A quick quiz to test your backend development skills with Node.js and Express.",
        questions: devQuestionIds
      }
    ];

    // 4. Thêm các bộ đề vào database
    console.log("Inserting sample quizzes...");
    const createdQuizzes = await Quiz.insertMany(sampleQuizzes);
    console.log(`Successfully inserted ${createdQuizzes.length} quizzes.`);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding the database:", error);
  } finally {
    // 5. Đóng kết nối
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
};

seedDatabase();
