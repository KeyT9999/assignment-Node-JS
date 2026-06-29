const mongoose = require("mongoose");
const User = require("../models/userModel");

const seedDefaultUsers = async () => {
  try {
    const adminExists = await User.findOne({ username: "admin1" });
    if (!adminExists) {
      await User.create({
        username: "admin1",
        password: "123",
        role: "admin",
        balance: 0
      });
      console.log("Seeded default admin account: admin1 / 123");
    }

    const customerExists = await User.findOne({ username: "user1" });
    if (!customerExists) {
      await User.create({
        username: "user1",
        password: "123",
        role: "customer",
        balance: 50
      });
      console.log("Seeded default customer account: user1 / 123");
    }
  } catch (error) {
    console.error("Error seeding default users:", error.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
    await seedDefaultUsers();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;